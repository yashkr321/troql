import { NextResponse } from 'next/server';
import { sandboxQueue } from '@/lib/sandbox/queue';
import { executePrWorkflow } from '@/lib/github/executePrWorkflow';
import { verifyPreviewToken, computeDiffHash } from '@/lib/auth/token';
import { getRepoInstallationToken } from '@/lib/auth/githubApp';

interface FinalEditRequest {
  jobId: string;
  token: string; // Proof-of-Preview Token (JWT)
  repoUrl: string;
  targetFile: string;
  diff: string;
  summary?: string;
}

// Helper to extract owner/repo for App Auth resolution
function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    let rawInput = url.trim().replace(/\/$/, "").replace(/\.git$/, "");
    let owner: string, repo: string;

    if (!rawInput.startsWith("http") && !rawInput.includes("github.com") && rawInput.split("/").length === 2) {
      [owner, repo] = rawInput.split("/");
    } else {
      if (!rawInput.startsWith("http")) rawInput = `https://${rawInput}`;
      const urlObj = new URL(rawInput);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length < 2) throw new Error("Invalid path");
      owner = segments[0];
      repo = segments[1];
    }
    if (!owner || !repo) throw new Error("Owner/Repo extraction failed");
    return { owner, repo };
  } catch (e) {
    throw new Error("Invalid repository URL format. Expected 'owner/repo' or GitHub URL.");
  }
}

export async function POST(request: Request) {
  try {
    // 1. Parse Body
    const body: FinalEditRequest = await request.json();
    const { jobId, token, repoUrl, targetFile, diff, summary } = body;

    // 2. Strict Input Validation
    if (!jobId || !token || !repoUrl || !targetFile || !diff) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // --- SECURITY GATE START ---

    // A. Verify JWT Signature & Expiration
    let payload;
    try {
        payload = verifyPreviewToken(token);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: "Invalid or expired preview token." }, { status: 401 });
    }

    // B. Context Check (Repo/File/Job Match)
    if (payload.jobId !== jobId || payload.repo !== repoUrl || payload.file !== targetFile) {
        return NextResponse.json({ success: false, error: "Token context mismatch (wrong repo/file)." }, { status: 403 });
    }

    // C. Integrity Check (Diff Tampering)
    const currentDiffHash = computeDiffHash(diff);
    if (payload.diffHash !== currentDiffHash) {
        return NextResponse.json({ 
            success: false, 
            error: "Integrity Violation: Diff has changed since preview." 
        }, { status: 409 });
    }

    // D. Replay Protection (Queue State Check)
    const job = sandboxQueue.getJob(jobId);
    if (!job) {
        return NextResponse.json({ success: false, error: "Job record not found (expired?)." }, { status: 404 });
    }
    
    if (job.consumed) {
        return NextResponse.json({ 
            success: false, 
            error: "Token Replay Detected: This preview has already been used to create a PR." 
        }, { status: 409 });
    }

    // --- SECURITY GATE PASSED ---

    // 3. Authenticate via GitHub App (Server-Side)
    let appToken: string;
    try {
        const { owner, repo } = parseRepoUrl(repoUrl);
        // This fetches a short-lived Installation Access Token cached in memory
        appToken = await getRepoInstallationToken(owner, repo);
    } catch (authError: any) {
        console.error("GitHub App Auth Failed:", authError);
        return NextResponse.json({ success: false, error: authError.message }, { status: 403 });
    }

    // 4. Mark Token as Consumed (Atomic Lock)
    sandboxQueue.consumeJob(jobId);

    // 5. Execute GitHub Logic
    const result = await executePrWorkflow({
      repoUrl,
      targetFile,
      diff,
      summary,
      token: appToken // STRICTLY INJECTED APP TOKEN
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("❌ Apply Edit Final Error:", error.message);
    const status = error.status || 500;
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.details 
    }, { status });
  }
}
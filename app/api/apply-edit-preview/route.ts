import { NextResponse } from 'next/server';
import { sandboxQueue } from '@/lib/sandbox/queue';

interface PreviewEditRequest {
  repoUrl: string;
  diff: string;
  targetFile: string;
}

export async function POST(request: Request) {
  try {
    // 1. Parse & Validate Request
    const body: PreviewEditRequest = await request.json();
    const { repoUrl, diff, targetFile } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json({ success: false, error: "Missing or invalid 'repoUrl'." }, { status: 400 });
    }
    if (!diff || typeof diff !== 'string') {
      return NextResponse.json({ success: false, error: "Missing or invalid 'diff'." }, { status: 400 });
    }
    if (!targetFile || typeof targetFile !== 'string') {
      return NextResponse.json({ success: false, error: "Missing or invalid 'targetFile'." }, { status: 400 });
    }

    // 2. Enqueue Job
    // The queue stores the exact diff string for later integrity verification (Phase B)
    const jobId = sandboxQueue.enqueue({
      repoUrl,
      diff,
      targetFile
    });

    console.log(`[API] Enqueued Sandbox Job: ${jobId} for ${targetFile}`);

    // 3. Return Job Context (NO GitHub Writes)
    return NextResponse.json({
      success: true,
      jobId,
      status: "queued",
      message: "Preview verification started. Poll status for results."
    });

  } catch (error: any) {
    console.error("[API] Preview Edit Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
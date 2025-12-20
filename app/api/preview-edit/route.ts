import { NextResponse } from 'next/server';
import { sandboxQueue } from '@/lib/sandbox/queue';

// --- INTERFACES ---
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

    // Strict validation to prevent invalid jobs from clogging the queue
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
    // The queue handles ID generation and initial status logic
    const jobId = sandboxQueue.enqueue({
      repoUrl,
      diff,
      targetFile
    });

    console.log(`[API] Enqueued Sandbox Job: ${jobId} for ${targetFile}`);

    // 3. Return Job Context
    return NextResponse.json({
      success: true,
      jobId,
      status: "queued",
      message: "Sandbox verification started."
    });

  } catch (error: any) {
    console.error("[API] Preview Edit Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
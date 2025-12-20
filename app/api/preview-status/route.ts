import { NextResponse } from 'next/server';
import { sandboxQueue } from '@/lib/sandbox/queue';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');

  if (!jobId) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const job = sandboxQueue.getJob(jobId);
  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  // Only expose token if success
  const resultData = job.status === 'success' ? {
      token: job.token,
      expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString() : null,
      diffHash: job.diffHash
  } : undefined;

  return NextResponse.json({
    success: true,
    id: job.id,
    status: job.status,
    logs: job.logs,
    result: resultData
  });
}
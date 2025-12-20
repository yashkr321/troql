import { sandboxQueue } from './queue'
import { runSandbox } from './executor'
import { signPreviewToken, computeDiffHash } from '@/lib/auth/token'

const POLL_INTERVAL_MS = 2000
let isWorkerRunning = false

async function processNextJob() {
  // get next unlocked job
  const job = sandboxQueue.dequeue()
  if (!job) return // no pending jobs → return silently

  console.log(`🧵 [Worker] Processing Job ${job.id}`)

  try {
    // execute sandbox
    const result = await runSandbox(job)

    if (result.success) {
      console.log(`🟢 [Worker] Sandbox Verified for job ${job.id}`)

      // compute diff integrity hash
      const diffHash = computeDiffHash(job.diff)

      // create preview token so user can later finalize PR
      const previewToken = signPreviewToken(
        job.id,
        job.repoUrl,
        job.targetFile,
        diffHash
      )

      // mark with expiration timestamp
      const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes TTL

      sandboxQueue.setJobSuccess(job.id, previewToken, diffHash, expiresAt)

      console.log(`🔐 [Worker] Minted preview token for job ${job.id}`)

    } else {
      console.log(`🔴 [Worker] Sandbox FAILED for job ${job.id}`)

      // attach error logs so frontend shows context
      sandboxQueue.setJobStatus(
        job.id,
        "failed",
        result.logs.join("\n")
      )
    }

  } catch (err: any) {
    console.error(`❌ [Worker] Fatal job error ${job.id}:`, err.message)

    sandboxQueue.setJobStatus(
      job.id,
      "failed",
      err.message || "Unknown executor failure"
    )
  }
}

export function startWorker() {
  if (isWorkerRunning) {
    console.log("⚠ Worker already running – skipping start.")
    return
  }

  console.log("🚀 Starting Troql Sandbox Worker...")
  isWorkerRunning = true

  // runs continuously
  setInterval(() => {
    try {
      processNextJob()
    } catch (err) {
      console.error("Worker tick error:", err)
    }
  }, POLL_INTERVAL_MS)
}

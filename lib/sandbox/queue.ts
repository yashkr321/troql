import { randomUUID } from 'crypto';

// --- TYPES ---

export type JobStatus = 'queued' | 'running' | 'success' | 'failed';

export interface SandboxJob {
  id: string;
  repoUrl: string;
  targetFile: string;
  diff: string;
  status: JobStatus;
  logs: string[];
  
  // -- PHASE 7 STEP 3: SECURITY METADATA --
  token: string | null;      // The signed Proof-of-Preview
  diffHash: string | null;   // SHA-256 of the validated diff
  consumed: boolean;         // Replay Protection Flag
  consumedAt: number | null; // Audit timestamp
  expiresAt: number | null;  // Token expiration timestamp
  
  createdAt: number;
  updatedAt: number;
}

export interface EnqueuePayload {
  repoUrl: string;
  diff: string;
  targetFile: string;
}

// --- SINGLETON QUEUE CLASS ---

class SandboxQueue {
  private static instance: SandboxQueue;
  private jobs: Map<string, SandboxJob>;
  private queue: string[]; 

  private constructor() {
    this.jobs = new Map();
    this.queue = [];
  }

  public static getInstance(): SandboxQueue {
    if (!SandboxQueue.instance) {
      SandboxQueue.instance = new SandboxQueue();
    }
    return SandboxQueue.instance;
  }

  public enqueue(payload: EnqueuePayload): string {
    const id = randomUUID();
    const now = Date.now();

    const job: SandboxJob = {
      id,
      repoUrl: payload.repoUrl,
      diff: payload.diff,
      targetFile: payload.targetFile,
      status: 'queued',
      logs: [`[${new Date(now).toISOString()}] Job queued.`],
      
      // Init Security Fields
      token: null,
      diffHash: null,
      consumed: false,
      consumedAt: null,
      expiresAt: null,

      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    return id;
  }

  public dequeue(): SandboxJob | null {
    if (this.queue.length === 0) return null;
    const nextId = this.queue.shift();
    if (!nextId) return null;
    const job = this.jobs.get(nextId);
    if (!job || job.status !== 'queued') return this.dequeue(); 
    
    this.setJobStatus(job.id, 'running', 'Job dequeued, starting execution...');
    return this.jobs.get(job.id) || null;
  }

  public setJobStatus(jobId: string, status: JobStatus, logMessage?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    job.updatedAt = Date.now();
    if (logMessage) {
      const timestamp = new Date().toISOString();
      job.logs.push(`[${timestamp}] [${status.toUpperCase()}] ${logMessage}`);
    }
  }

  // Helper to attach token on success
  public setJobSuccess(jobId: string, token: string, diffHash: string, expiresAt: number) {
      const job = this.jobs.get(jobId);
      if (!job) return;
      job.status = 'success';
      job.token = token;
      job.diffHash = diffHash;
      job.expiresAt = expiresAt;
      job.updatedAt = Date.now();
      job.logs.push(`[${new Date().toISOString()}] [SUCCESS] Proof-of-Preview Token Minted.`);
  }

  // Helper to mark consumed
  public consumeJob(jobId: string) {
      const job = this.jobs.get(jobId);
      if (job) {
          job.consumed = true;
          job.consumedAt = Date.now();
      }
  }

  public getJob(jobId: string): SandboxJob | undefined {
    return this.jobs.get(jobId);
  }
}

export const sandboxQueue = SandboxQueue.getInstance();
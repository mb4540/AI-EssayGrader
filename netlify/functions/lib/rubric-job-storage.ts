/**
 * Shared in-memory job storage for rubric extraction and enhancement
 * 
 * This provides a simple, fast storage mechanism for background jobs.
 * Jobs are automatically cleaned up after 1 hour to prevent memory leaks.
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RubricJob {
  jobId: string;
  type: 'extract' | 'enhance';
  status: JobStatus;
  result?: any;
  error?: string;
  performance?: any;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// In-memory job storage
const jobs = new Map<string, RubricJob>();

// Cleanup interval (runs every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const JOB_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new job
 */
export function createJob(type: 'extract' | 'enhance'): RubricJob {
  const jobId = generateJobId();
  const job: RubricJob = {
    jobId,
    type,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  jobs.set(jobId, job);
  console.log(`[rubric-jobs] Created ${type} job: ${jobId}`);
  
  return job;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): RubricJob | undefined {
  return jobs.get(jobId);
}

/**
 * Update a job's status
 */
export function updateJob(jobId: string, updates: Partial<RubricJob>): RubricJob | undefined {
  const job = jobs.get(jobId);
  if (!job) {
    console.error(`[rubric-jobs] Job not found: ${jobId}`);
    return undefined;
  }
  
  const updatedJob: RubricJob = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  };
  
  if (updates.status === 'completed' || updates.status === 'failed') {
    updatedJob.completedAt = Date.now();
  }
  
  jobs.set(jobId, updatedJob);
  console.log(`[rubric-jobs] Updated job ${jobId}: ${updatedJob.status}`);
  
  return updatedJob;
}

/**
 * Delete a job
 */
export function deleteJob(jobId: string): boolean {
  const deleted = jobs.delete(jobId);
  if (deleted) {
    console.log(`[rubric-jobs] Deleted job: ${jobId}`);
  }
  return deleted;
}

/**
 * Clean up old jobs (older than 1 hour)
 */
export function cleanupOldJobs(): number {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.createdAt;
    if (age > JOB_EXPIRY) {
      jobs.delete(jobId);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[rubric-jobs] Cleaned up ${deletedCount} old jobs`);
  }
  
  return deletedCount;
}

/**
 * Get job statistics
 */
export function getJobStats(): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byType: { extract: number; enhance: number };
} {
  const stats = {
    total: jobs.size,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    byType: { extract: 0, enhance: 0 },
  };
  
  for (const job of jobs.values()) {
    stats[job.status]++;
    stats.byType[job.type]++;
  }
  
  return stats;
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldJobs, CLEANUP_INTERVAL);
  console.log('[rubric-jobs] Started cleanup interval');
}

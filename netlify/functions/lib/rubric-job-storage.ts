/**
 * Persistent job storage for rubric extraction and enhancement using Netlify Blobs
 * 
 * This provides a persistent storage mechanism for background jobs that works
 * across different serverless function instances.
 */

import { getStore } from '@netlify/blobs';

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

// Job expiry time
const JOB_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Get the blob store for jobs
 * Supports both production (auto-configured) and local dev (manual config)
 */
function getJobStore() {
  // For local development, explicitly pass siteID and token from env vars
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  
  if (siteID && token) {
    // Local development with explicit credentials
    return getStore({
      name: 'rubric-jobs',
      siteID,
      token,
    });
  }
  
  // Production - Netlify automatically provides credentials
  return getStore('rubric-jobs');
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new job
 */
export async function createJob(type: 'extract' | 'enhance'): Promise<RubricJob> {
  const jobId = generateJobId();
  const job: RubricJob = {
    jobId,
    type,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  const store = getJobStore();
  await store.set(jobId, JSON.stringify(job));
  console.log(`[rubric-jobs] Created ${type} job: ${jobId}`);
  
  return job;
}

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<RubricJob | null> {
  const store = getJobStore();
  const data = await store.get(jobId);
  
  if (!data) {
    return null;
  }
  
  return JSON.parse(data) as RubricJob;
}

/**
 * Update a job's status
 */
export async function updateJob(jobId: string, updates: Partial<RubricJob>): Promise<RubricJob | null> {
  const job = await getJob(jobId);
  if (!job) {
    console.error(`[rubric-jobs] Job not found: ${jobId}`);
    return null;
  }
  
  const updatedJob: RubricJob = {
    ...job,
    ...updates,
    updatedAt: Date.now(),
  };
  
  if (updates.status === 'completed' || updates.status === 'failed') {
    updatedJob.completedAt = Date.now();
  }
  
  const store = getJobStore();
  await store.set(jobId, JSON.stringify(updatedJob));
  console.log(`[rubric-jobs] Updated job ${jobId}: ${updatedJob.status}`);
  
  return updatedJob;
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  const store = getJobStore();
  await store.delete(jobId);
  console.log(`[rubric-jobs] Deleted job: ${jobId}`);
  return true;
}

/**
 * Clean up old jobs (older than 1 hour)
 * Note: This is a manual cleanup function. Call it periodically if needed.
 */
export async function cleanupOldJobs(): Promise<number> {
  const store = getJobStore();
  const now = Date.now();
  let deletedCount = 0;
  
  // List all jobs
  const { blobs } = await store.list();
  
  for (const blob of blobs) {
    const jobData = await store.get(blob.key);
    if (jobData) {
      const job = JSON.parse(jobData) as RubricJob;
      const age = now - job.createdAt;
      if (age > JOB_EXPIRY) {
        await store.delete(blob.key);
        deletedCount++;
      }
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[rubric-jobs] Cleaned up ${deletedCount} old jobs`);
  }
  
  return deletedCount;
}

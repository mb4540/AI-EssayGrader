/**
 * Frontend API client for rubric background jobs
 * 
 * Handles both extract-rubric and enhance-rubric async operations
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RubricJobResponse {
  success: boolean;
  jobId?: string;
  status?: JobStatus;
  result?: any;
  error?: string;
  performance?: any;
  message?: string;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
}

/**
 * Start a rubric extraction job
 */
export async function startRubricExtraction(params: {
  file: string;
  fileName: string;
  fileType: string;
  totalPoints?: number;
  geminiModel?: string;
  extractionPrompt?: string;
}): Promise<RubricJobResponse> {
  const response = await fetch('/.netlify/functions/extract-rubric-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check rubric extraction job status
 */
export async function checkExtractionStatus(jobId: string): Promise<RubricJobResponse> {
  const response = await fetch(`/.netlify/functions/extract-rubric-status?jobId=${jobId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Start a rubric enhancement job
 */
export async function startRubricEnhancement(params: {
  simple_rules: string;
  rubric_prompt?: string;
  total_points?: number;
  llmProvider?: string;
  llmModel?: string;
}): Promise<RubricJobResponse> {
  const response = await fetch('/.netlify/functions/enhance-rubric-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check rubric enhancement job status
 */
export async function checkEnhancementStatus(jobId: string): Promise<RubricJobResponse> {
  const response = await fetch(`/.netlify/functions/enhance-rubric-status?jobId=${jobId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll for job completion
 * 
 * @param jobId - Job ID to poll
 * @param checkStatus - Function to check status (checkExtractionStatus or checkEnhancementStatus)
 * @param onProgress - Callback for progress updates
 * @param maxAttempts - Maximum polling attempts (default: 150 = 5 minutes at 2s intervals)
 * @param interval - Polling interval in ms (default: 2000 = 2 seconds)
 */
export async function pollJobStatus(
  jobId: string,
  checkStatus: (jobId: string) => Promise<RubricJobResponse>,
  onProgress?: (status: JobStatus) => void,
  maxAttempts: number = 150,
  interval: number = 2000
): Promise<RubricJobResponse> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;

        const response = await checkStatus(jobId);

        if (!response.success) {
          clearInterval(intervalId);
          reject(new Error(response.error || 'Job check failed'));
          return;
        }

        // Call progress callback
        if (onProgress && response.status) {
          onProgress(response.status);
        }

        // Check if job is complete
        if (response.status === 'completed') {
          clearInterval(intervalId);
          resolve(response);
          return;
        }

        if (response.status === 'failed') {
          clearInterval(intervalId);
          reject(new Error(response.error || 'Job failed'));
          return;
        }

        // Check if max attempts reached
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          reject(new Error('Job polling timeout - max attempts reached'));
          return;
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    };

    // Start polling
    const intervalId = setInterval(poll, interval);
    
    // Poll immediately
    poll();
  });
}

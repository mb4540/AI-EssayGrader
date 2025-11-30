/**
 * Extract Rubric Trigger Function
 * 
 * Accepts rubric extraction request, creates a background job, and returns job ID.
 * The actual extraction happens in extract-rubric-background.ts
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { createJob } from './lib/rubric-job-storage';

const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { file, fileName, fileType, totalPoints, geminiModel, extractionPrompt } = JSON.parse(
      event.body || '{}'
    );

    // Validate required fields
    if (!file || !fileName || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: file, fileName, fileType',
        }),
      };
    }

    // Create job
    console.log('[extract-rubric-trigger] Creating job...');
    let job;
    try {
      job = await createJob('extract');
      console.log(`[extract-rubric-trigger] Created job ${job.jobId} for file: ${fileName}`);
    } catch (jobError: any) {
      console.error('[extract-rubric-trigger] Failed to create job:', jobError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to create background job',
          details: jobError.message,
        }),
      };
    }

    // Start background processing immediately (don't wait for it to finish)
    // We return the job ID right away and let the frontend poll for status
    console.log(`[extract-rubric-trigger] Starting background processing for job ${job.jobId}`);
    
    // Import and call the background function directly (fire and forget)
    import('./extract-rubric-background')
      .then(async (module) => {
        console.log(`[extract-rubric-trigger] Invoking background handler for job ${job.jobId}`);
        // Call the handler with the same event structure
        await module.handler({
          httpMethod: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.jobId,
            file,
            fileName,
            fileType,
            totalPoints,
            geminiModel,
            extractionPrompt,
          }),
        } as any, {} as any);
        console.log(`[extract-rubric-trigger] Background processing completed for job ${job.jobId}`);
      })
      .catch((error) => {
        console.error(`[extract-rubric-trigger] Background processing failed for job ${job.jobId}:`, error);
      });

    // Return job ID immediately
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: job.jobId,
        message: 'Extraction job started',
      }),
    };
  } catch (error: any) {
    console.error('[extract-rubric-trigger] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to start extraction job',
      }),
    };
  }
};

export { handler };

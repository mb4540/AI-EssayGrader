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

    // Build background URL (matching bulletproof grading pattern)
    const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
    const backgroundUrl = new URL('/.netlify/functions/extract-rubric-background', base);
    console.log(`[extract-rubric-trigger] Background URL: ${backgroundUrl.toString()}`);

    // Fire-and-forget with short timeout so trigger returns quickly
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 6000);

    try {
      const backgroundResponse = await fetch(backgroundUrl, {
        method: 'POST',
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
        signal: ac.signal
      });

      clearTimeout(timeout);

      if (!backgroundResponse.ok) {
        const errorText = await backgroundResponse.text().catch(() => '<no body>');
        console.error('[extract-rubric-trigger] Background function failed:', backgroundResponse.status, errorText);
      } else {
        console.log(`[extract-rubric-trigger] Background function triggered successfully for job ${job.jobId}`);
      }
    } catch (e) {
      clearTimeout(timeout);
      // Don't fail the trigger - just log the error
      console.error('[extract-rubric-trigger] Background trigger error:', e instanceof Error ? e.message : e);
    }

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

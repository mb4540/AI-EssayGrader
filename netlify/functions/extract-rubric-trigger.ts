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
    const job = await createJob('extract');

    console.log(`[extract-rubric-trigger] Created job ${job.jobId} for file: ${fileName}`);

    // Trigger background function
    const backgroundUrl = `${event.rawUrl.replace('/extract-rubric-trigger', '/extract-rubric-background')}`;
    
    // Fire and forget - don't wait for response
    fetch(backgroundUrl, {
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
    }).catch((error) => {
      console.error(`[extract-rubric-trigger] Failed to trigger background job:`, error);
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

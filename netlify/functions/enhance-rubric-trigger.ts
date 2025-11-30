/**
 * Enhance Rubric Trigger Function
 * 
 * Accepts rubric enhancement request, creates a background job, and returns job ID.
 * The actual enhancement happens in enhance-rubric-background.ts
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
    const { simple_rules, rubric_prompt, total_points, llmProvider, llmModel } = JSON.parse(
      event.body || '{}'
    );

    // Validate required fields
    if (!simple_rules || typeof simple_rules !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'simple_rules is required',
        }),
      };
    }

    // Create job
    const job = createJob('enhance');

    console.log(`[enhance-rubric-trigger] Created job ${job.jobId}`);
    console.log(`[enhance-rubric-trigger] Rules length: ${simple_rules.length} characters`);

    // Trigger background function
    const backgroundUrl = `${event.rawUrl.replace('/enhance-rubric-trigger', '/enhance-rubric-background')}`;
    
    // Fire and forget - don't wait for response
    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.jobId,
        simple_rules,
        rubric_prompt,
        total_points,
        llmProvider,
        llmModel,
      }),
    }).catch((error) => {
      console.error(`[enhance-rubric-trigger] Failed to trigger background job:`, error);
    });

    // Return job ID immediately
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: job.jobId,
        message: 'Enhancement job started',
      }),
    };
  } catch (error: any) {
    console.error('[enhance-rubric-trigger] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to start enhancement job',
      }),
    };
  }
};

export { handler };

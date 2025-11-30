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
    console.log('[enhance-rubric-trigger] Creating job...');
    let job;
    try {
      job = await createJob('enhance');
      console.log(`[enhance-rubric-trigger] Created job ${job.jobId}`);
    } catch (jobError: any) {
      console.error('[enhance-rubric-trigger] Failed to create job:', jobError);
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
    console.log(`[enhance-rubric-trigger] Rules length: ${simple_rules.length} characters`);

    // Build background URL (matching bulletproof grading pattern)
    const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
    const backgroundUrl = new URL('/.netlify/functions/enhance-rubric-background', base);
    console.log(`[enhance-rubric-trigger] Background URL: ${backgroundUrl.toString()}`);

    // Fire-and-forget with short timeout so trigger returns quickly
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 6000);

    try {
      const backgroundResponse = await fetch(backgroundUrl, {
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
        signal: ac.signal
      });

      clearTimeout(timeout);

      if (!backgroundResponse.ok) {
        const errorText = await backgroundResponse.text().catch(() => '<no body>');
        console.error('[enhance-rubric-trigger] Background function failed:', backgroundResponse.status, errorText);
      } else {
        console.log(`[enhance-rubric-trigger] Background function triggered successfully for job ${job.jobId}`);
      }
    } catch (e) {
      clearTimeout(timeout);
      // Don't fail the trigger - just log the error
      console.error('[enhance-rubric-trigger] Background trigger error:', e instanceof Error ? e.message : e);
    }

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

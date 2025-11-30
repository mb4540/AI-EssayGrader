/**
 * Enhance Rubric Status Function
 * 
 * Check the status of a rubric enhancement job.
 * Returns current status and result when completed.
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { getJob } from './lib/rubric-job-storage';

const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const jobId = event.queryStringParameters?.jobId;

    if (!jobId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing jobId parameter',
        }),
      };
    }

    // Get job
    const job = getJob(jobId);

    if (!job) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Job not found',
        }),
      };
    }

    // Return job status
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: job.jobId,
        status: job.status,
        result: job.result,
        error: job.error,
        performance: job.performance,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
      }),
    };
  } catch (error: any) {
    console.error('[enhance-rubric-status] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to get job status',
      }),
    };
  }
};

export { handler };

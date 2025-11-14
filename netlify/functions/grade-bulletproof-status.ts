/**
 * BulletProof Grading Status Function
 * 
 * Checks the status of a background grading job.
 * Returns current status and result data when completed.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const jobId = event.queryStringParameters?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'jobId parameter is required' })
      };
    }

    // Query background_tasks table
    const tasks = await sql`
      SELECT status, error_message, output_data, updated_at, completed_at
      FROM grader.background_tasks
      WHERE task_id = ${jobId}
      LIMIT 1
    `;

    if (tasks.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          ok: false, 
          id: jobId, 
          status: 'not_found', 
          error: 'Job not found' 
        })
      };
    }

    const task = tasks[0];
    const response: any = { 
      ok: true,
      id: jobId, 
      status: task.status, 
      updatedAt: task.updated_at 
    };

    // Add result data if completed
    if (task.status === 'completed' && task.output_data) {
      try {
        const parsed = typeof task.output_data === 'string' 
          ? JSON.parse(task.output_data) 
          : task.output_data;
        response.result = parsed;
        response.completedAt = task.completed_at;
      } catch (parseError) {
        console.error('Failed to parse output_data:', parseError);
      }
    }

    // Add error message if failed
    if (task.status === 'failed') {
      response.error = task.error_message || 'Task failed';
    }

    return { 
      statusCode: 200, 
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response) 
    };

  } catch (error) {
    console.error('Error checking grading status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };

/**
 * Get inline text annotations for a submission
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

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
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id } = auth;

    const { submission_id } = event.queryStringParameters || {};

    if (!submission_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing submission_id parameter' }),
      };
    }

    // Verify submission belongs to tenant
    const submission = await sql`
      SELECT s.submission_id
      FROM grader.submissions s
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (submission.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found or access denied' }),
      };
    }

    // Fetch annotations
    const annotations = await sql`
      SELECT 
        annotation_id,
        submission_id,
        line_number,
        start_offset,
        end_offset,
        quote,
        category,
        suggestion,
        severity,
        status,
        criterion_id,
        created_by,
        created_at,
        updated_at,
        ai_payload
      FROM grader.annotations
      WHERE submission_id = ${submission_id}
      ORDER BY line_number ASC, start_offset ASC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        submission_id,
        annotations,
        count: annotations.length,
      }),
    };
  } catch (error) {
    console.error('Get annotations error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch annotations',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

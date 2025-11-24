/**
 * List Source Texts Function
 * 
 * Returns all source texts for the authenticated teacher with usage counts.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Authenticate request
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id } = auth;

    // Fetch all source texts with usage count
    const sourceTexts = await sql`
      SELECT 
        st.source_text_id,
        st.title,
        st.writing_prompt,
        st.file_type,
        st.file_size_bytes,
        st.created_at,
        st.updated_at,
        COUNT(a.assignment_id)::int as usage_count
      FROM grader.source_texts st
      LEFT JOIN grader.assignments a ON st.source_text_id = a.source_text_id
      WHERE st.tenant_id = ${tenant_id}
      GROUP BY st.source_text_id
      ORDER BY st.created_at DESC
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source_texts: sourceTexts,
        count: sourceTexts.length,
      }),
    };
  } catch (error) {
    console.error('List source texts error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list source texts',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

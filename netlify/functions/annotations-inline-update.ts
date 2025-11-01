/**
 * Update an inline text annotation
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id, user } = auth;
    const user_id = user?.user_id;

    const body = JSON.parse(event.body || '{}');
    const { annotation_id, updates } = body;

    if (!annotation_id || !updates) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing annotation_id or updates' }),
      };
    }

    // Verify annotation belongs to tenant's submission
    const verification = await sql`
      SELECT a.annotation_id
      FROM grader.annotations a
      JOIN grader.submissions s ON a.submission_id = s.submission_id
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE a.annotation_id = ${annotation_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (verification.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Annotation not found or access denied' }),
      };
    }

    // Update annotation with provided fields
    const { status, suggestion, category, severity } = updates;
    
    await sql`
      UPDATE grader.annotations
      SET 
        status = COALESCE(${status || null}, status),
        suggestion = COALESCE(${suggestion || null}, suggestion),
        category = COALESCE(${category || null}, category),
        severity = COALESCE(${severity || null}, severity),
        updated_at = now()
      WHERE annotation_id = ${annotation_id}
    `;

    // Create audit event
    await sql`
      INSERT INTO grader.annotation_events (
        annotation_id,
        event_type,
        payload,
        created_by
      ) VALUES (
        ${annotation_id},
        'teacher_edit',
        ${JSON.stringify({ updates })},
        ${user_id || null}
      )
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Update annotation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update annotation',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

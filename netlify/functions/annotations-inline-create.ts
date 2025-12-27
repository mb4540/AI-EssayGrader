/**
 * Create an inline text annotation (teacher-created)
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

interface CreateAnnotationPayload {
  submission_id: string;
  line_number: number;
  start_offset: number;
  end_offset: number;
  quote: string;
  category: string;
  subcategory?: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  criterion_id?: string;
  affects_grade?: boolean;
}

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

    const body: CreateAnnotationPayload = JSON.parse(event.body || '{}');
    const {
      submission_id,
      line_number,
      start_offset,
      end_offset,
      quote,
      category,
      subcategory,
      suggestion,
      severity,
      criterion_id,
      affects_grade,
    } = body;

    // Validate required fields
    if (!submission_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing submission_id' }),
      };
    }

    if (!line_number || line_number < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid line_number (must be >= 1)' }),
      };
    }

    if (start_offset === undefined || start_offset < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid start_offset (must be >= 0)' }),
      };
    }

    if (end_offset === undefined || end_offset < start_offset) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid end_offset (must be >= start_offset)' }),
      };
    }

    if (!quote || quote.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing quote' }),
      };
    }

    if (!category || category.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing category' }),
      };
    }

    if (!suggestion || suggestion.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing suggestion' }),
      };
    }

    if (!severity || !['info', 'warning', 'error'].includes(severity)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid severity (must be info, warning, or error)' }),
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

    // Insert annotation
    const result = await sql`
      INSERT INTO grader.annotations (
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
        created_by
      ) VALUES (
        ${submission_id},
        ${line_number},
        ${start_offset},
        ${end_offset},
        ${quote},
        ${category},
        ${suggestion},
        ${severity},
        'teacher_created',
        ${criterion_id || null},
        ${user_id || null}
      )
      RETURNING annotation_id, created_at
    `;

    const annotation_id = result[0].annotation_id;
    const created_at = result[0].created_at;

    // Create audit event
    await sql`
      INSERT INTO grader.annotation_events (
        annotation_id,
        event_type,
        payload,
        created_by
      ) VALUES (
        ${annotation_id},
        'teacher_create',
        ${JSON.stringify({
          line_number,
          start_offset,
          end_offset,
          quote,
          category,
          subcategory,
          suggestion,
          severity,
          criterion_id,
          affects_grade,
        })},
        ${user_id || null}
      )
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        annotation: {
          annotation_id,
          submission_id,
          line_number,
          start_offset,
          end_offset,
          quote,
          category,
          subcategory,
          suggestion,
          severity,
          status: 'teacher_created',
          criterion_id,
          affects_grade,
          created_by: user_id,
          created_at,
        },
      }),
    };
  } catch (error) {
    console.error('Create annotation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create annotation',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

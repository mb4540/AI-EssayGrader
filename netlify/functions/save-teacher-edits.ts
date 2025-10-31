import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { SaveEditsRequestSchema } from '../../src/lib/schema';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
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

    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validation = SaveEditsRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.format() 
        }),
      };
    }

    const { submission_id, teacher_grade, teacher_feedback } = validation.data;

    // Check if submission exists and belongs to tenant
    const existing = await sql`
      SELECT s.submission_id, s.ai_grade, s.ai_feedback 
      FROM grader.submissions s
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found or access denied' }),
      };
    }

    // Update submission with teacher edits
    const updated = await sql`
      UPDATE grader.submissions 
      SET 
        teacher_grade = ${teacher_grade},
        teacher_feedback = ${teacher_feedback}
      WHERE submission_id = ${submission_id}
      RETURNING updated_at
    `;

    // Create version snapshot
    await sql`
      INSERT INTO grader.submission_versions (
        submission_id,
        ai_grade,
        ai_feedback,
        teacher_grade,
        teacher_feedback
      )
      VALUES (
        ${submission_id},
        ${existing[0].ai_grade},
        ${existing[0].ai_feedback ? JSON.stringify(existing[0].ai_feedback) : null},
        ${teacher_grade},
        ${teacher_feedback}
      )
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        updated_at: updated[0].updated_at,
      }),
    };
  } catch (error) {
    console.error('Save edits error:', error);
    
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || 
          error.message.includes('Invalid or expired token')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { SaveEditsRequestSchema } from '../../src/lib/schema';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
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

    // Check if submission exists
    const existing = await sql`
      SELECT id, ai_grade, ai_feedback 
      FROM grader.submissions 
      WHERE id = ${submission_id}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Submission not found' }),
      };
    }

    // Update submission with teacher edits
    const updated = await sql`
      UPDATE grader.submissions 
      SET 
        teacher_grade = ${teacher_grade},
        teacher_feedback = ${teacher_feedback}
      WHERE id = ${submission_id}
      RETURNING updated_at
    `;

    // Create version snapshot
    await sql`
      INSERT INTO grader.submission_versions (
        submission_ref,
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        updated_at: updated[0].updated_at,
      }),
    };
  } catch (error) {
    console.error('Save edits error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };

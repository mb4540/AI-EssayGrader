import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const submissionId = params.id;

    if (!submissionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing submission id parameter' }),
      };
    }

    // Fetch submission (FERPA compliant - no PII)
    const result = await sql`
      SELECT 
        s.submission_id,
        s.student_id,
        s.source_type,
        s.draft_mode,
        s.verbatim_text,
        s.rough_draft_text,
        s.final_draft_text,
        s.teacher_criteria,
        s.ai_grade,
        s.ai_feedback,
        s.teacher_grade,
        s.teacher_feedback,
        s.image_url,
        s.original_file_url,
        s.created_at,
        s.updated_at,
        a.title as assignment_title,
        a.assignment_id as assignment_id
      FROM grader.submissions s
      LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
      WHERE s.submission_id = ${submissionId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Submission not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result[0]),
    };
  } catch (error) {
    console.error('Get submission error:', error);
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

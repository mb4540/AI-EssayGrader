import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { submission_id } = JSON.parse(event.body || '{}');

    if (!submission_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'submission_id is required' }),
      };
    }

    // Delete the submission
    await sql`
      DELETE FROM grader.submissions
      WHERE id = ${submission_id}
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Submission deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete submission error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete submission',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

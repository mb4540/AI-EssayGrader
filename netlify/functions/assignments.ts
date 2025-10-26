import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // GET: List all assignments
  if (event.httpMethod === 'GET') {
    try {
      const assignments = await sql`
        SELECT id, title, description, grading_criteria, created_at
        FROM grader.assignments
        ORDER BY created_at DESC
      `;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      };
    } catch (error) {
      console.error('List assignments error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to list assignments',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
      };
    }
  }

  // POST: Create new assignment
  if (event.httpMethod === 'POST') {
    try {
      const { title, description, grading_criteria } = JSON.parse(event.body || '{}');

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Assignment title is required' }),
        };
      }

      const result = await sql`
        INSERT INTO grader.assignments (title, description, grading_criteria)
        VALUES (
          ${title.trim()}, 
          ${description?.trim() || null},
          ${grading_criteria?.trim() || null}
        )
        RETURNING id, title, description, grading_criteria, created_at
      `;

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: result[0] }),
      };
    } catch (error) {
      console.error('Create assignment error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create assignment',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

export { handler };

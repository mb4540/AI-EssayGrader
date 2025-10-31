import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';

// Use the actual tenant UUID from your database
const PUBLIC_TENANT_ID = '00000000-0000-0000-0000-000000000000'; // Default public tenant

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // GET: List all assignments
  if (event.httpMethod === 'GET') {
    try {
      const tenant_id = PUBLIC_TENANT_ID; // TODO: Get from auth context
      
      const assignments = await sql`
        SELECT assignment_id as id, title, description, grading_criteria, total_points, created_at
        FROM grader.assignments
        WHERE tenant_id = ${tenant_id}
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
      const tenant_id = PUBLIC_TENANT_ID; // TODO: Get from auth context
      const { title, description, grading_criteria, document_type, total_points } = JSON.parse(event.body || '{}');

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Assignment title is required' }),
        };
      }

      const result = await sql`
        INSERT INTO grader.assignments (tenant_id, title, description, grading_criteria, document_type, total_points)
        VALUES (
          ${tenant_id},
          ${title.trim()}, 
          ${description?.trim() || null},
          ${grading_criteria?.trim() || null},
          ${document_type || null},
          ${total_points || 100}
        )
        RETURNING assignment_id as id, title, description, grading_criteria, document_type, total_points, created_at
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

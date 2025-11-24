import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { parseTeacherRubric } from '../../src/lib/calculator/rubricParser';
import { isValidRubric } from '../../src/lib/calculator/rubricBuilder';
import { authenticateRequest } from './lib/auth';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET: List all assignments
  if (event.httpMethod === 'GET') {
    try {
      // Authenticate request
      const auth = await authenticateRequest(event.headers.authorization);
      const { tenant_id } = auth;
      
      const assignments = await sql`
        SELECT assignment_id as id, title, description, grading_criteria, total_points, created_at
        FROM grader.assignments
        WHERE tenant_id = ${tenant_id}
        ORDER BY created_at DESC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ assignments }),
      };
    } catch (error) {
      console.error('List assignments error:', error);
      return {
        statusCode: error instanceof Error && error.message.includes('Authentication') ? 401 : 500,
        headers,
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
      // Authenticate request
      const auth = await authenticateRequest(event.headers.authorization);
      const { tenant_id } = auth;
      const { title, description, grading_criteria, document_type, total_points } = JSON.parse(event.body || '{}');

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Assignment title is required' }),
        };
      }

      // Parse rubric if grading_criteria provided
      let rubricJson = null;
      let parseWarning = null;
      if (grading_criteria && grading_criteria.trim().length > 0) {
        try {
          const parsedRubric = parseTeacherRubric(
            grading_criteria.trim(),
            'temp-id', // Will be replaced after insert
            total_points || 100
          );
          
          if (isValidRubric(parsedRubric)) {
            rubricJson = parsedRubric;
            console.log(`✅ Parsed rubric with ${parsedRubric.criteria.length} criteria`);
          }
        } catch (parseError) {
          console.warn('Failed to parse rubric during assignment creation:', parseError);
          parseWarning = parseError instanceof Error ? parseError.message : 'Failed to parse rubric format';
          // Continue without rubric_json - can be populated later
        }
      }

      const result = await sql`
        INSERT INTO grader.assignments (tenant_id, title, description, grading_criteria, document_type, total_points, rubric_json)
        VALUES (
          ${tenant_id},
          ${title.trim()}, 
          ${description?.trim() || null},
          ${grading_criteria?.trim() || null},
          ${document_type || null},
          ${total_points || 100},
          ${rubricJson ? JSON.stringify(rubricJson) : null}
        )
        RETURNING assignment_id as id, title, description, grading_criteria, document_type, total_points, rubric_json, created_at
      `;

      // Update rubric_id with actual assignment_id
      if (rubricJson && result[0].id) {
        rubricJson.rubric_id = `parsed-${result[0].id}`;
        await sql`
          UPDATE grader.assignments
          SET rubric_json = ${JSON.stringify(rubricJson)}
          WHERE assignment_id = ${result[0].id}
        `;
        result[0].rubric_json = rubricJson;
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          assignment: result[0],
          parseWarning: parseWarning || null
        }),
      };
    } catch (error) {
      console.error('Create assignment error:', error);
      return {
        statusCode: error instanceof Error && error.message.includes('Authentication') ? 401 : 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create assignment',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
      };
    }
  }

  // PUT: Update existing assignment
  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    try {
      // Authenticate request
      const auth = await authenticateRequest(event.headers.authorization);
      const { tenant_id } = auth;
      const { assignment_id, title, description, grading_criteria, document_type, total_points } = JSON.parse(event.body || '{}');

      if (!assignment_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'assignment_id is required' }),
        };
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Assignment title is required' }),
        };
      }

      // Parse rubric if grading_criteria provided
      let rubricJson = null;
      let parseWarning = null;
      if (grading_criteria && grading_criteria.trim().length > 0) {
        try {
          const parsedRubric = parseTeacherRubric(
            grading_criteria.trim(),
            assignment_id,
            total_points || 100
          );
          
          if (isValidRubric(parsedRubric)) {
            rubricJson = parsedRubric;
            console.log(`✅ Parsed rubric with ${parsedRubric.criteria.length} criteria`);
          }
        } catch (parseError) {
          console.warn('Failed to parse rubric during assignment update:', parseError);
          parseWarning = parseError instanceof Error ? parseError.message : 'Failed to parse rubric format';
        }
      }

      const result = await sql`
        UPDATE grader.assignments
        SET 
          title = ${title.trim()},
          description = ${description?.trim() || null},
          grading_criteria = ${grading_criteria?.trim() || null},
          document_type = ${document_type || null},
          total_points = ${total_points || 100},
          rubric_json = ${rubricJson ? JSON.stringify(rubricJson) : null}
        WHERE assignment_id = ${assignment_id}
        AND tenant_id = ${tenant_id}
        RETURNING assignment_id as id, title, description, grading_criteria, document_type, total_points, rubric_json, created_at
      `;

      if (result.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Assignment not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          assignment: result[0],
          parseWarning: parseWarning || null
        }),
      };
    } catch (error) {
      console.error('Update assignment error:', error);
      return {
        statusCode: error instanceof Error && error.message.includes('Authentication') ? 401 : 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to update assignment',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

export { handler };

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { IngestRequestSchema } from '../../src/lib/schema';
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

  // Only allow POST requests
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
    
    // Validate request body
    const validation = IngestRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.format() 
        }),
      };
    }

    const { 
      student_name, 
      student_id, 
      assignment_id, 
      assignment_title,
      teacher_criteria, 
      verbatim_text,
      rough_draft_text,
      final_draft_text,
      draft_mode,
      source_type 
    } = validation.data;

    // Start transaction
    // 1. Find or create student (filtered by tenant)
    let studentResult = await sql`
      SELECT id FROM grader.students 
      WHERE tenant_id = ${tenant_id}
      AND student_name = ${student_name} 
      AND (student_id = ${student_id || null} OR student_id IS NULL)
      LIMIT 1
    `;

    let studentUuid: string;
    if (studentResult.length === 0) {
      const newStudent = await sql`
        INSERT INTO grader.students (tenant_id, student_name, student_id)
        VALUES (${tenant_id}, ${student_name}, ${student_id || null})
        RETURNING id
      `;
      studentUuid = newStudent[0].id;
    } else {
      studentUuid = studentResult[0].id;
    }

    // 2. Handle assignment (find existing or create new, filtered by tenant)
    let assignmentUuid: string | null = null;
    if (assignment_id) {
      // Verify assignment belongs to this tenant
      const assignmentCheck = await sql`
        SELECT id FROM grader.assignments
        WHERE id = ${assignment_id} AND tenant_id = ${tenant_id}
      `;
      if (assignmentCheck.length > 0) {
        assignmentUuid = assignment_id;
      }
    } else if (assignment_title) {
      // Try to find existing assignment by title (within tenant)
      const existingAssignment = await sql`
        SELECT id FROM grader.assignments 
        WHERE tenant_id = ${tenant_id}
        AND title = ${assignment_title}
        LIMIT 1
      `;
      
      if (existingAssignment.length > 0) {
        assignmentUuid = existingAssignment[0].id;
      } else {
        // Create new assignment (with tenant_id)
        const newAssignment = await sql`
          INSERT INTO grader.assignments (tenant_id, title)
          VALUES (${tenant_id}, ${assignment_title})
          RETURNING id
        `;
        assignmentUuid = newAssignment[0].id;
      }
    }

    // 3. Create submission
    const submission = await sql`
      INSERT INTO grader.submissions (
        student_ref,
        assignment_ref,
        source_type,
        draft_mode,
        verbatim_text,
        rough_draft_text,
        final_draft_text,
        teacher_criteria
      )
      VALUES (
        ${studentUuid},
        ${assignmentUuid},
        ${source_type},
        ${draft_mode},
        ${verbatim_text || null},
        ${rough_draft_text || null},
        ${final_draft_text || null},
        ${teacher_criteria}
      )
      RETURNING id, created_at
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submission_id: submission[0].id,
        created_at: submission[0].created_at,
      }),
    };
  } catch (error) {
    console.error('Ingest error:', error);
    
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

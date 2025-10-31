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
      student_id,  // UUID from bridge (FERPA compliant)
      assignment_id, 
      assignment_title,
      teacher_criteria, 
      verbatim_text,
      rough_draft_text,
      final_draft_text,
      draft_mode,
      source_type 
    } = validation.data;

    // FERPA COMPLIANT: Only UUID, no PII
    // 1. Verify student exists or create (UUID only, no name)
    let studentResult = await sql`
      SELECT student_id FROM grader.students 
      WHERE tenant_id = ${tenant_id}
      AND student_id = ${student_id}
      LIMIT 1
    `;

    // Create student record if doesn't exist (UUID only)
    if (studentResult.length === 0) {
      await sql`
        INSERT INTO grader.students (student_id, tenant_id, created_at)
        VALUES (${student_id}, ${tenant_id}, NOW())
      `;
    }

    // 2. Handle assignment (find existing or create new, filtered by tenant)
    let assignmentUuid: string | null = null;
    if (assignment_id) {
      // Use the provided assignment_id directly
      assignmentUuid = assignment_id;
    } else if (assignment_title) {
      // Try to find existing assignment by title (within tenant)
      const existingAssignment = await sql`
        SELECT assignment_id FROM grader.assignments 
        WHERE tenant_id = ${tenant_id}
        AND title = ${assignment_title}
        LIMIT 1
      `;
      
      if (existingAssignment.length > 0) {
        assignmentUuid = existingAssignment[0].assignment_id;
      } else {
        // Create new assignment (with tenant_id)
        const newAssignment = await sql`
          INSERT INTO grader.assignments (tenant_id, title)
          VALUES (${tenant_id}, ${assignment_title})
          RETURNING assignment_id
        `;
        assignmentUuid = newAssignment[0].assignment_id;
      }
    }

    // 3. Create submission (with UUID reference)
    const submission = await sql`
      INSERT INTO grader.submissions (
        student_id,
        assignment_id,
        tenant_id,
        source_type,
        draft_mode,
        verbatim_text,
        rough_draft_text,
        final_draft_text,
        teacher_criteria
      )
      VALUES (
        ${student_id},
        ${assignmentUuid},
        ${tenant_id},
        ${source_type},
        ${draft_mode},
        ${verbatim_text || null},
        ${rough_draft_text || null},
        ${final_draft_text || null},
        ${teacher_criteria}
      )
      RETURNING submission_id, created_at
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submission_id: submission[0].submission_id,
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

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { IngestRequestSchema } from '../../src/lib/schema';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
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
    // 1. Find or create student
    let studentResult = await sql`
      SELECT id FROM grader.students 
      WHERE student_name = ${student_name} 
      AND (student_id = ${student_id || null} OR student_id IS NULL)
      LIMIT 1
    `;

    let studentUuid: string;
    if (studentResult.length === 0) {
      const newStudent = await sql`
        INSERT INTO grader.students (student_name, student_id)
        VALUES (${student_name}, ${student_id || null})
        RETURNING id
      `;
      studentUuid = newStudent[0].id;
    } else {
      studentUuid = studentResult[0].id;
    }

    // 2. Handle assignment (find existing or create new)
    let assignmentUuid: string | null = null;
    if (assignment_id) {
      assignmentUuid = assignment_id;
    } else if (assignment_title) {
      // Try to find existing assignment by title
      const existingAssignment = await sql`
        SELECT id FROM grader.assignments 
        WHERE title = ${assignment_title}
        LIMIT 1
      `;
      
      if (existingAssignment.length > 0) {
        assignmentUuid = existingAssignment[0].id;
      } else {
        // Create new assignment
        const newAssignment = await sql`
          INSERT INTO grader.assignments (title)
          VALUES (${assignment_title})
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submission_id: submission[0].id,
        created_at: submission[0].created_at,
      }),
    };
  } catch (error) {
    console.error('Ingest error:', error);
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

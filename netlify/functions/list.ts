import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { ListRequestSchema } from '../../src/lib/schema';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    
    const validation = ListRequestSchema.safeParse({
      assignment_id: params.assignment_id,
      student_id: params.student_id,
      search: params.search,
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
    });

    if (!validation.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.format() 
        }),
      };
    }

    const { assignment_id, student_id, search, page = 1, limit = 20 } = validation.data;
    const offset = (page - 1) * limit;

    // Build query with filters
    let countResult;
    let submissions;

    if (!assignment_id && !student_id && !search) {
      // No filters - simple query
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM grader.submissions s
      `;

      submissions = await sql`
        SELECT 
          s.id,
          s.source_type,
          s.verbatim_text,
          s.teacher_criteria,
          s.ai_grade,
          s.teacher_grade,
          s.teacher_feedback,
          s.created_at,
          s.updated_at,
          st.student_name,
          st.student_id,
          a.title as assignment_title,
          a.id as assignment_id
        FROM grader.submissions s
        JOIN grader.students st ON s.student_ref = st.id
        LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Build filtered query dynamically
      const searchPattern = search ? `%${search}%` : null;
      
      if (assignment_id && student_id && search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE s.assignment_ref = ${assignment_id}
            AND st.student_id = ${student_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE s.assignment_ref = ${assignment_id}
            AND st.student_id = ${student_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id && student_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE s.assignment_ref = ${assignment_id} AND st.student_id = ${student_id}
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE s.assignment_ref = ${assignment_id} AND st.student_id = ${student_id}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id && search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE s.assignment_ref = ${assignment_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE s.assignment_ref = ${assignment_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (student_id && search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE st.student_id = ${student_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE st.student_id = ${student_id}
            AND (st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern})
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          WHERE s.assignment_ref = ${assignment_id}
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE s.assignment_ref = ${assignment_id}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (student_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE st.student_id = ${student_id}
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE st.student_id = ${student_id}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          WHERE st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern}
        `;
        submissions = await sql`
          SELECT 
            s.id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            st.student_name, st.student_id,
            a.title as assignment_title, a.id as assignment_id
          FROM grader.submissions s
          JOIN grader.students st ON s.student_ref = st.id
          LEFT JOIN grader.assignments a ON s.assignment_ref = a.id
          WHERE st.student_name ILIKE ${searchPattern} OR s.verbatim_text ILIKE ${searchPattern}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
    }

    const total = parseInt(countResult[0].total);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
    };
  } catch (error) {
    console.error('List error:', error);
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

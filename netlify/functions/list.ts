import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { ListRequestSchema } from '../../src/lib/schema';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
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

    // Parse query parameters
    const params = event.queryStringParameters || {};
    
    const validation = ListRequestSchema.safeParse({
      assignment_id: params.assignment_id,
      student_id: params.student_id,
      search: params.search,
      class_period: params.class_period,
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

    const { assignment_id, student_id, search, class_period, page = 1, limit = 20 } = validation.data;
    const offset = (page - 1) * limit;

    // Build query with filters
    let countResult;
    let submissions;

    if (!assignment_id && !student_id && !search && !class_period) {
      // No filters - simple query (filtered by tenant)
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM grader.submissions s
        JOIN grader.students st ON s.student_id = st.student_id
        WHERE st.tenant_id = ${tenant_id}
      `;

      submissions = await sql`
        SELECT 
          s.submission_id as id,
          s.student_id,
          s.source_type,
          s.verbatim_text,
          s.teacher_criteria,
          s.ai_grade,
          s.teacher_grade,
          s.teacher_feedback,
          s.created_at,
          s.updated_at,
          a.title as assignment_title,
          a.assignment_id as assignment_id,
          st.class_period
        FROM grader.submissions s
        LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
        JOIN grader.students st ON s.student_id = st.student_id
        WHERE st.tenant_id = ${tenant_id}
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
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            AND st.student_id = ${student_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE s.assignment_id = ${assignment_id}
            AND st.student_id = ${student_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id && student_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            AND st.student_id = ${student_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            AND st.student_id = ${student_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id && search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (student_id && search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.student_id = ${student_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.student_id = ${student_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (assignment_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.assignment_id = ${assignment_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (student_id) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.student_id = ${student_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.student_id = ${student_id}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (search) {
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND s.verbatim_text ILIKE ${searchPattern}
            ${class_period ? sql`AND st.class_period = ${class_period}` : sql``}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (class_period) {
        // Class period only filter
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.class_period = ${class_period}
        `;
        submissions = await sql`
          SELECT 
            s.submission_id as id, s.source_type, s.verbatim_text, s.teacher_criteria,
            s.ai_grade, s.teacher_grade, s.teacher_feedback,
            s.created_at, s.updated_at,
            s.student_id,
            a.title as assignment_title, a.assignment_id as assignment_id,
            st.class_period
          FROM grader.submissions s
          JOIN grader.students st ON s.student_id = st.student_id
          LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
          WHERE st.tenant_id = ${tenant_id}
            AND st.class_period = ${class_period}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
    }

    const total = parseInt(countResult[0].total);

    return {
      statusCode: 200,
      headers: {
        ...headers,
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

// Update Student - API endpoint for updating non-PII student fields
// Allows updating class_period field while maintaining FERPA compliance

import type { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { verifyToken } from './lib/auth';

const sql = neon(process.env.DATABASE_URL!);

// Validation schema
const UpdateStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  class_period: z.string().nullable().optional(),
});

export const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = UpdateStudentSchema.safeParse(body);

    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request',
          details: validation.error.format(),
        }),
      };
    }

    const { student_id, class_period } = validation.data;

    // Verify student exists and belongs to user's tenant
    const student = await sql`
      SELECT student_id, tenant_id
      FROM grader.students
      WHERE student_id = ${student_id}
    `;

    if (student.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Student not found' }),
      };
    }

    // Verify tenant access
    if (student[0].tenant_id !== decoded.tenant_id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Update student
    const updated = await sql`
      UPDATE grader.students
      SET class_period = ${class_period || null}
      WHERE student_id = ${student_id}
      RETURNING student_id, class_period, created_at
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        student: updated[0],
      }),
    };
  } catch (error) {
    console.error('Update student error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Bulk Update Students - API endpoint for updating class_period for multiple students
 * Supports upsert: creates student row if it doesn't exist
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';
import { verifyToken } from './lib/auth';

const sql = neon(process.env.DATABASE_URL!);

// Validation schema
const BulkUpdateSchema = z.object({
  student_ids: z.array(z.string().uuid('Invalid student ID format')).min(1, 'At least one student ID required'),
  class_period: z.string().nullable(),
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
    const validation = BulkUpdateSchema.safeParse(body);

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

    const { student_ids, class_period } = validation.data;
    const tenant_id = decoded.tenant_id;

    let updated = 0;
    let inserted = 0;
    let failed = 0;

    // Process each student (upsert)
    for (const student_id of student_ids) {
      try {
        // Check if student exists
        const existing = await sql`
          SELECT student_id, tenant_id
          FROM grader.students
          WHERE student_id = ${student_id}
        `;

        if (existing.length === 0) {
          // Insert new student with tenant_id and class_period
          await sql`
            INSERT INTO grader.students (student_id, tenant_id, class_period, created_at)
            VALUES (${student_id}, ${tenant_id}, ${class_period}, NOW())
          `;
          inserted++;
        } else if (existing[0].tenant_id === tenant_id) {
          // Update existing student
          await sql`
            UPDATE grader.students
            SET class_period = ${class_period}
            WHERE student_id = ${student_id}
          `;
          updated++;
        } else {
          // Tenant mismatch - skip
          failed++;
        }
      } catch (err) {
        console.error(`Failed to update student ${student_id}:`, err);
        failed++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total: student_ids.length,
        updated,
        inserted,
        failed,
      }),
    };
  } catch (error) {
    console.error('Bulk update students error:', error);
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

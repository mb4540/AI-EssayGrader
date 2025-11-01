/**
 * Save annotations for a submission
 * 
 * Stores normalized annotations and creates audit events
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';
import type { Annotation, AnnotationEvent } from '../../src/lib/annotations/types';

interface SaveAnnotationsRequest {
  submission_id: string;
  annotations: Annotation[];
  unresolved?: Array<{ quote: string; reason: string; suggestion: string }>;
}

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id, user } = auth;
    const user_id = user?.user_id;

    const body: SaveAnnotationsRequest = JSON.parse(event.body || '{}');
    const { submission_id, annotations, unresolved } = body;

    if (!submission_id || !annotations) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Verify submission belongs to tenant
    const submission = await sql`
      SELECT s.submission_id
      FROM grader.submissions s
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (submission.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found or access denied' }),
      };
    }

    // Insert annotations
    const insertedAnnotations = [];
    for (const annotation of annotations) {
      const result = await sql`
        INSERT INTO grader.annotations (
          submission_id,
          line_number,
          start_offset,
          end_offset,
          quote,
          category,
          suggestion,
          severity,
          status,
          created_by,
          ai_payload
        ) VALUES (
          ${submission_id},
          ${annotation.line_number},
          ${annotation.start_offset},
          ${annotation.end_offset},
          ${annotation.quote},
          ${annotation.category},
          ${annotation.suggestion},
          ${annotation.severity || null},
          ${annotation.status},
          ${user_id || null},
          ${JSON.stringify(annotation.ai_payload || null)}
        )
        RETURNING annotation_id, created_at
      `;

      const annotationId = result[0].annotation_id;
      const createdAt = result[0].created_at;

      // Create audit event
      await sql`
        INSERT INTO grader.annotation_events (
          annotation_id,
          event_type,
          payload,
          created_by
        ) VALUES (
          ${annotationId},
          'ai_created',
          ${JSON.stringify({ annotation })},
          ${user_id || null}
        )
      `;

      insertedAnnotations.push({
        ...annotation,
        annotation_id: annotationId,
        created_at: createdAt,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        annotations: insertedAnnotations,
        unresolved: unresolved || [],
        stats: {
          saved: insertedAnnotations.length,
          unresolved: unresolved?.length || 0,
        },
      }),
    };
  } catch (error) {
    console.error('Save annotations error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to save annotations',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

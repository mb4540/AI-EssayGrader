import type { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { submission_id, page_number } = event.queryStringParameters || {};

    if (!submission_id || !page_number) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters: submission_id, page_number' 
        }),
      };
    }

    // First, get or create the page record
    let pageResult = await sql`
      SELECT id, width_px, height_px
      FROM grader.annotation_pages
      WHERE submission_id = ${submission_id}
        AND page_number = ${parseInt(page_number)}
    `;

    let pageId: string;
    
    if (pageResult.length === 0) {
      // Page doesn't exist yet - return empty annotations
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: null,
          page_number: parseInt(page_number),
          width_px: null,
          height_px: null,
          annotations: [],
        }),
      };
    } else {
      pageId = pageResult[0].id;
    }

    // Fetch all annotations for this page
    const annotations = await sql`
      SELECT 
        id,
        type,
        rect,
        path,
        color_rgba,
        stroke_width,
        text,
        z_index,
        created_at,
        updated_at
      FROM grader.annotations
      WHERE page_id = ${pageId}
      ORDER BY z_index ASC, created_at ASC
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: pageId,
        submission_id: submission_id,
        page_number: parseInt(page_number),
        width_px: pageResult[0].width_px,
        height_px: pageResult[0].height_px,
        annotations: annotations,
      }),
    };
  } catch (error) {
    console.error('Get annotations error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch annotations',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

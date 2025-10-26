import type { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface UpsertOperation {
  action: 'create' | 'update' | 'delete';
  annotation?: {
    id?: string;
    type: 'highlight' | 'comment' | 'pen' | 'underline';
    rect?: { x: number; y: number; w: number; h: number };
    path?: Array<{ x: number; y: number }>;
    color_rgba?: string;
    stroke_width?: number;
    text?: string;
    z_index?: number;
  };
  annotation_id?: string; // for delete operations
}

interface UpsertPayload {
  submission_id: string;
  page_number: number;
  width_px?: number;
  height_px?: number;
  ops: UpsertOperation[];
  snapshot?: any[]; // Optional full page snapshot for versioning
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload: UpsertPayload = JSON.parse(event.body || '{}');
    const { submission_id, page_number, width_px, height_px, ops, snapshot } = payload;

    if (!submission_id || page_number === undefined || !ops || !Array.isArray(ops)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: submission_id, page_number, ops' 
        }),
      };
    }

    // Step 1: Get or create the annotation_pages record
    let pageResult = await sql`
      SELECT id FROM grader.annotation_pages
      WHERE submission_id = ${submission_id}
        AND page_number = ${page_number}
    `;

    let pageId: string;

    if (pageResult.length === 0) {
      // Create new page record
      const newPage = await sql`
        INSERT INTO grader.annotation_pages (submission_id, page_number, width_px, height_px)
        VALUES (${submission_id}, ${page_number}, ${width_px || null}, ${height_px || null})
        RETURNING id
      `;
      pageId = newPage[0].id;
    } else {
      pageId = pageResult[0].id;
      
      // Update dimensions if provided
      if (width_px !== undefined || height_px !== undefined) {
        await sql`
          UPDATE grader.annotation_pages
          SET width_px = COALESCE(${width_px || null}, width_px),
              height_px = COALESCE(${height_px || null}, height_px)
          WHERE id = ${pageId}
        `;
      }
    }

    // Step 2: Process operations (create, update, or delete)
    for (const operation of ops) {
      if (operation.action === 'delete' && operation.annotation_id) {
        // Delete annotation
        await sql`
          DELETE FROM grader.annotations
          WHERE id = ${operation.annotation_id}
            AND page_id = ${pageId}
        `;
      } else if ((operation.action === 'create' || operation.action === 'update') && operation.annotation) {
        const annot = operation.annotation;
        
        // Only update if ID is a valid UUID (not a temp ID)
        if (annot.id && !annot.id.startsWith('temp-')) {
          // Update existing annotation
          await sql`
            UPDATE grader.annotations
            SET 
              type = ${annot.type},
              rect = ${annot.rect ? JSON.stringify(annot.rect) : null},
              path = ${annot.path ? JSON.stringify(annot.path) : null},
              color_rgba = ${annot.color_rgba || 'rgba(255,235,59,0.45)'},
              stroke_width = ${annot.stroke_width || 2},
              text = ${annot.text || null},
              z_index = ${annot.z_index || 0}
            WHERE id = ${annot.id}
              AND page_id = ${pageId}
          `;
        } else {
          // Insert new annotation
          await sql`
            INSERT INTO grader.annotations (
              page_id,
              type,
              rect,
              path,
              color_rgba,
              stroke_width,
              text,
              z_index
            )
            VALUES (
              ${pageId},
              ${annot.type},
              ${annot.rect ? JSON.stringify(annot.rect) : null},
              ${annot.path ? JSON.stringify(annot.path) : null},
              ${annot.color_rgba || 'rgba(255,235,59,0.45)'},
              ${annot.stroke_width || 2},
              ${annot.text || null},
              ${annot.z_index || 0}
            )
          `;
        }
      }
    }

    // Step 3: Create version snapshot if provided
    let versionNumber = null;
    if (snapshot && Array.isArray(snapshot)) {
      // Get next version number
      const versionResult = await sql`
        SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
        FROM grader.annotation_versions
        WHERE page_id = ${pageId}
      `;
      
      versionNumber = versionResult[0].next_version;

      await sql`
        INSERT INTO grader.annotation_versions (page_id, version_number, annotations_snapshot)
        VALUES (${pageId}, ${versionNumber}, ${JSON.stringify(snapshot)})
      `;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ok: true,
        page_id: pageId,
        version_number: versionNumber,
        operations_processed: ops.length,
      }),
    };
  } catch (error) {
    console.error('Upsert annotations error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to save annotations',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

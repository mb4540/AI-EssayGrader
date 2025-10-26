import type { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const sql = neon(process.env.DATABASE_URL!);

interface ExportPayload {
  submission_id: string;
  pages?: number[]; // Optional: specific pages to export (default: all)
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload: ExportPayload = JSON.parse(event.body || '{}');
    const { submission_id, pages } = payload;

    if (!submission_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: submission_id' }),
      };
    }

    // Step 1: Get submission details including original file URL
    const submissionResult = await sql`
      SELECT original_file_url, source_type
      FROM grader.submissions
      WHERE id = ${submission_id}
    `;

    if (submissionResult.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Submission not found' }),
      };
    }

    const { original_file_url, source_type } = submissionResult[0];

    if (!original_file_url || source_type !== 'pdf') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Can only export annotated PDFs. Original file must be PDF format.',
          source_type 
        }),
      };
    }

    // Step 2: Load original PDF from Netlify Blobs
    const store = getStore({
      name: 'essay-files',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Extract blob key from URL
    // Handle both formats: /.netlify/blobs/essay-files/key.pdf and /.netlify/functions/get-blob-file?key=key.pdf
    let blobKey: string;
    if (original_file_url.includes('?key=')) {
      // New format: /.netlify/functions/get-blob-file?key=<id>.pdf
      const urlParams = new URLSearchParams(original_file_url.split('?')[1]);
      blobKey = urlParams.get('key') || `${submission_id}.pdf`;
    } else {
      // Old format: /.netlify/blobs/essay-files/<id>.pdf
      blobKey = original_file_url.split('/').pop() || `${submission_id}.pdf`;
    }
    
    const originalPdfBlob = await store.get(blobKey, { type: 'arrayBuffer' });

    if (!originalPdfBlob) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Original PDF file not found in storage' }),
      };
    }

    // Convert to buffer
    const originalPdfBytes = Buffer.from(originalPdfBlob as ArrayBuffer);

    // Step 3: Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pdfDoc.getPageCount();

    // Determine which pages to annotate
    const pagesToAnnotate = pages && pages.length > 0 
      ? pages.filter(p => p >= 1 && p <= totalPages)
      : Array.from({ length: totalPages }, (_, i) => i + 1);

    // Step 4: Fetch annotations for requested pages
    for (const pageNum of pagesToAnnotate) {
      // Get page record
      const pageResult = await sql`
        SELECT id, width_px, height_px
        FROM grader.annotation_pages
        WHERE submission_id = ${submission_id}
          AND page_number = ${pageNum}
      `;

      if (pageResult.length === 0) continue; // No annotations on this page

      const pageId = pageResult[0].id;
      const originalWidth = pageResult[0].width_px;
      const originalHeight = pageResult[0].height_px;

      // Get annotations for this page
      const annotations = await sql`
        SELECT type, rect, path, color_rgba, stroke_width, text, z_index
        FROM grader.annotations
        WHERE page_id = ${pageId}
        ORDER BY z_index ASC
      `;

      if (annotations.length === 0) continue;

      // Get PDF page
      const pdfPage = pdfDoc.getPage(pageNum - 1);
      const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize();

      // Calculate scale factors
      const scaleX = originalWidth ? pdfWidth / originalWidth : 1;
      const scaleY = originalHeight ? pdfHeight / originalHeight : 1;

      // Step 5: Draw annotations onto PDF page
      for (const annot of annotations) {
        const { type, rect, path, color_rgba, text } = annot;

        // Parse color (default to yellow highlight)
        const color = parseRgbaColor(color_rgba || 'rgba(255,235,59,0.45)');

        if (type === 'highlight' && rect) {
          // Draw highlight rectangle
          const x = rect.x * scaleX;
          const y = pdfHeight - (rect.y * scaleY) - (rect.h * scaleY); // PDF coords are bottom-up
          const width = rect.w * scaleX;
          const height = rect.h * scaleY;

          pdfPage.drawRectangle({
            x,
            y,
            width,
            height,
            color: rgb(color.r, color.g, color.b),
            opacity: color.a,
          });
        } else if (type === 'comment' && rect && text) {
          // Draw comment box with text
          const x = rect.x * scaleX;
          const y = pdfHeight - (rect.y * scaleY) - (rect.h * scaleY);
          const width = rect.w * scaleX;
          const height = rect.h * scaleY;

          // Red background for comment
          pdfPage.drawRectangle({
            x,
            y,
            width,
            height,
            color: rgb(0.96, 0.26, 0.21),
            opacity: 0.9,
          });

          // Draw text (simplified - just first few lines)
          const fontSize = 8;
          const textLines = text.split('\n').slice(0, 5); // Max 5 lines
          let textY = y + height - fontSize - 2;

          for (const line of textLines) {
            pdfPage.drawText(line.substring(0, 50), { // Max 50 chars per line
              x: x + 4,
              y: textY,
              size: fontSize,
              font,
              color: rgb(1, 1, 1), // White text
            });
            textY -= fontSize + 2;
          }
        } else if (type === 'pen' && path && Array.isArray(path)) {
          // Draw pen stroke as series of small rectangles (simplified)
          // For production, consider using SVG path conversion
          for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            
            const x = p1.x * scaleX;
            const y = pdfHeight - (p1.y * scaleY);
            
            pdfPage.drawCircle({
              x,
              y,
              size: 2,
              color: rgb(color.r, color.g, color.b),
              opacity: color.a,
            });
          }
        }
      }
    }

    // Step 6: Save annotated PDF
    const annotatedPdfBytes = await pdfDoc.save();

    // Step 7: Upload to Netlify Blobs
    const exportKey = `${submission_id}-annotated-${Date.now()}.pdf`;
    await store.set(exportKey, annotatedPdfBytes, {
      metadata: {
        type: 'annotated-export',
        submission_id,
        exported_at: new Date().toISOString(),
      },
    });

    const downloadUrl = `/.netlify/functions/get-blob-file?key=${exportKey}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        download_url: downloadUrl,
        file_size: annotatedPdfBytes.length,
        pages_annotated: pagesToAnnotate.length,
      }),
    };
  } catch (error) {
    console.error('Export PDF error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to export annotated PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Helper: Parse rgba() color string to {r, g, b, a}
function parseRgbaColor(colorString: string): { r: number; g: number; b: number; a: number } {
  const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return { r: 1, g: 0.92, b: 0.23, a: 0.45 }; // Default yellow
  }
  return {
    r: parseInt(match[1]) / 255,
    g: parseInt(match[2]) / 255,
    b: parseInt(match[3]) / 255,
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

export { handler };

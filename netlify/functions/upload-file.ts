import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { sql } from './db';

const ALLOW_STORAGE = process.env.ALLOW_BLOB_STORAGE === 'true';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!ALLOW_STORAGE) {
    // Localhost fallback: Save mock URL for development
    try {
      const { submission_id, file_extension } = JSON.parse(event.body || '{}');
      if (submission_id && file_extension) {
        const mockUrl = `/mock-files/${submission_id}.${file_extension}`;
        
        await sql`
          UPDATE grader.submissions
          SET original_file_url = ${mockUrl}
          WHERE id = ${submission_id}
        `;
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            file_url: mockUrl,
            file_size: 0,
            message: 'Mock file URL saved (blob storage disabled in localhost)'
          }),
        };
      }
    } catch (err) {
      console.error('Mock file URL save failed:', err);
    }
    
    return {
      statusCode: 403,
      body: JSON.stringify({ 
        error: 'File storage disabled',
        message: 'Set ALLOW_BLOB_STORAGE=true to enable file storage'
      }),
    };
  }

  try {
    const { file_data, submission_id, file_extension } = JSON.parse(event.body || '{}');

    if (!file_data || !submission_id || !file_extension) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: file_data, submission_id, file_extension' 
        }),
      };
    }

    // Get Netlify Blobs store with explicit credentials
    const store = getStore({
      name: 'essay-files',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Extract base64 data (remove data:...;base64, prefix if present)
    const base64Data = file_data.includes('base64,') 
      ? file_data.split('base64,')[1] 
      : file_data;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Store with submission_id as key
    const key = `${submission_id}.${file_extension}`;
    await store.set(key, buffer, {
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileSize: buffer.length,
      },
    });

    // Return the blob URL - use serverless function for production compatibility
    const fileUrl = `/.netlify/functions/get-blob-file?key=${key}`;

    // Update submission with original_file_url
    await sql`
      UPDATE grader.submissions
      SET original_file_url = ${fileUrl}
      WHERE id = ${submission_id}
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file_url: fileUrl,
        file_size: buffer.length 
      }),
    };
  } catch (error) {
    console.error('Upload file error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

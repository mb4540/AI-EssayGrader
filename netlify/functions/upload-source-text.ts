/**
 * Upload Source Text Function
 * 
 * Accepts file upload (PDF, DOCX, TXT) for source-based writing assignments.
 * Stores file in Netlify Blobs and metadata in database.
 * 
 * Uses JSON body with base64-encoded file data (simpler than multipart).
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['pdf', 'docx', 'txt'];
const ALLOW_STORAGE = process.env.ALLOW_BLOB_STORAGE === 'true';

interface UploadRequest {
  title: string;
  writing_prompt?: string;
  file_data: string; // base64 encoded
  file_name: string;
  file_type: string; // pdf, docx, or txt
}

/**
 * Validate file type
 */
function validateFileType(fileType: string): boolean {
  return ALLOWED_TYPES.includes(fileType.toLowerCase());
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check if blob storage is enabled
    if (!ALLOW_STORAGE) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'File storage disabled',
          message: 'The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: siteID, token'
        }),
      };
    }

    // Authenticate request
    const auth = await authenticateRequest(event.headers.authorization);
    const { user, tenant_id } = auth;

    // Parse request body
    const body: UploadRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.title || !body.file_data || !body.file_type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          message: 'title, file_data, and file_type are required' 
        }),
      };
    }

    // Validate file type
    if (!validateFileType(body.file_type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid file type',
          message: `Allowed types: ${ALLOWED_TYPES.join(', ')}` 
        }),
      };
    }

    // Decode base64 file data
    const fileBuffer = Buffer.from(body.file_data, 'base64');

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        }),
      };
    }

    // Generate unique blob key
    const sourceTextId = crypto.randomUUID();
    const fileExtension = body.file_type.toLowerCase();
    const blobKey = `${tenant_id}/${sourceTextId}.${fileExtension}`;

    // Store file in Netlify Blobs
    const store = getStore({
      name: 'source-texts',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Store file in blob storage
    // Type assertion: Buffer is compatible with BlobInput at runtime
    await store.set(blobKey, fileBuffer as any, {
      metadata: {
        uploadedAt: new Date().toISOString(),
        fileSize: fileBuffer.length,
        originalFilename: body.file_name,
      },
    });

    // Insert metadata into database
    const result = await sql`
      INSERT INTO grader.source_texts (
        source_text_id,
        tenant_id,
        teacher_id,
        title,
        blob_key,
        writing_prompt,
        file_type,
        file_size_bytes
      ) VALUES (
        ${sourceTextId},
        ${tenant_id},
        ${user.user_id},
        ${body.title},
        ${blobKey},
        ${body.writing_prompt || null},
        ${fileExtension},
        ${fileBuffer.length}
      )
      RETURNING source_text_id, title, created_at
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source_text_id: result[0].source_text_id,
        title: result[0].title,
        file_type: fileExtension,
        file_size: fileBuffer.length,
        created_at: result[0].created_at,
      }),
    };
  } catch (error) {
    console.error('Upload source text error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to upload source text',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

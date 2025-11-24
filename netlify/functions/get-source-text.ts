/**
 * Get Source Text Function
 * 
 * Retrieves source text metadata and content from database and blob storage.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { sql } from './db';
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
    return { statusCode: 200, headers, body: '' };
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

    // Get source_text_id from query params
    const sourceTextId = event.queryStringParameters?.source_text_id;

    if (!sourceTextId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'source_text_id is required' }),
      };
    }

    // Fetch metadata from database
    const result = await sql`
      SELECT 
        source_text_id,
        title,
        blob_key,
        writing_prompt,
        file_type,
        file_size_bytes,
        created_at,
        updated_at
      FROM grader.source_texts
      WHERE source_text_id = ${sourceTextId}
        AND tenant_id = ${tenant_id}
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Source text not found' }),
      };
    }

    const sourceText = result[0];

    // Optionally fetch blob content if requested
    const includeContent = event.queryStringParameters?.include_content === 'true';
    
    let extractedText = null;
    if (includeContent) {
      try {
        const store = getStore({
          name: 'source-texts',
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        });

        const blob = await store.get(sourceText.blob_key, { type: 'arrayBuffer' });
        
        if (blob) {
          // For now, return raw text for TXT files
          // TODO: Add text extraction for PDF/DOCX in future
          if (sourceText.file_type === 'txt') {
            extractedText = Buffer.from(blob as ArrayBuffer).toString('utf-8');
          } else {
            extractedText = '[Text extraction for PDF/DOCX not yet implemented]';
          }
        }
      } catch (error) {
        console.error('Failed to fetch blob:', error);
        // Continue without content
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...sourceText,
        extracted_text: extractedText,
      }),
    };
  } catch (error) {
    console.error('Get source text error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to retrieve source text',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

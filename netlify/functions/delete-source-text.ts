/**
 * Delete Source Text Function
 * 
 * Deletes source text from database and blob storage.
 * Assignments using this source text will have source_text_id set to NULL (ON DELETE SET NULL).
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
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
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

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { source_text_id } = body;

    if (!source_text_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'source_text_id is required' }),
      };
    }

    // Fetch source text to get blob_key
    const result = await sql`
      SELECT blob_key 
      FROM grader.source_texts
      WHERE source_text_id = ${source_text_id}
        AND tenant_id = ${tenant_id}
    `;

    if (result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Source text not found' }),
      };
    }

    const blobKey = result[0].blob_key;

    // Delete blob from storage (don't fail if blob is missing)
    try {
      const store = getStore({
        name: 'source-texts',
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
      });

      await store.delete(blobKey);
    } catch (error) {
      console.warn('Failed to delete blob (may not exist):', error);
      // Continue with database deletion
    }

    // Delete database record
    // ON DELETE SET NULL will handle assignments automatically
    await sql`
      DELETE FROM grader.source_texts
      WHERE source_text_id = ${source_text_id}
        AND tenant_id = ${tenant_id}
    `;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Source text deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Delete source text error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete source text',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

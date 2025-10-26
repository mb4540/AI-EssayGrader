import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const key = event.queryStringParameters?.key;

    if (!key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: key' }),
      };
    }

    // Get Netlify Blobs store
    const store = getStore({
      name: 'essay-files',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Retrieve the blob
    const blob = await store.get(key, { type: 'arrayBuffer' });

    if (!blob) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // Return the PDF file
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${key}"`,
        'Cache-Control': 'public, max-age=3600',
      },
      body: Buffer.from(blob as ArrayBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Get blob file error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve file',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

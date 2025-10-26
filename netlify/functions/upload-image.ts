import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { image_data, submission_id } = JSON.parse(event.body || '{}');

    if (!image_data || !submission_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'image_data and submission_id are required' }),
      };
    }

    // Get Netlify Blobs store with explicit credentials
    const store = getStore({
      name: 'essay-images',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    });

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = image_data.includes('base64,') 
      ? image_data.split('base64,')[1] 
      : image_data;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Store with submission_id as key
    const key = `${submission_id}.jpg`;
    await store.set(key, buffer, {
      metadata: {
        contentType: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      },
    });

    // Return the blob URL
    const imageUrl = `/.netlify/blobs/essay-images/${key}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    };
  } catch (error) {
    console.error('Upload image error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

/**
 * BulletProof Grading Trigger Function
 * 
 * Quickly validates request and starts background grading job.
 * Returns immediately with task_id for status polling.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import { GradeRequestSchema } from '../../src/lib/schema';
import { authenticateRequest } from './lib/auth';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('🚀 Grading trigger started');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
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

    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validation = GradeRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.issues 
        }),
      };
    }

    const { submission_id } = validation.data;

    // Generate job ID
    const jobId = uuidv4();
    console.log(`📝 Starting grading job: ${jobId} for submission: ${submission_id}`);

    // Build background URL
    const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
    const backgroundUrl = new URL('/.netlify/functions/grade-bulletproof-background', base);

    // Fire-and-forget with short timeout so trigger returns quickly
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 6000);
    
    try {
      const backgroundResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          tenant_id,
          submission_id,
          grading_prompt: body.grading_prompt,
        }),
        signal: ac.signal
      });
      
      clearTimeout(timeout);
      
      if (!backgroundResponse.ok) {
        const errorText = await backgroundResponse.text().catch(() => '<no body>');
        console.error('Background grading trigger failed:', backgroundResponse.status, errorText);
      }
    } catch (e) {
      clearTimeout(timeout);
      console.error('Grading trigger error:', e instanceof Error ? e.message : e);
    }

    console.log('✅ Background job started successfully');

    return {
      statusCode: 202,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        ok: true, 
        task_id: jobId,
        status: 'processing',
        message: 'Grading started in background'
      }),
    };

  } catch (error) {
    console.error('❌ Grading trigger failed:', error);
    
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || 
          error.message.includes('Invalid or expired token')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };

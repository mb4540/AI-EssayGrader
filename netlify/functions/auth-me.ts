// Get Current User Endpoint
// GET /api/auth/me

import { Handler, HandlerEvent } from '@netlify/functions';
import { verifyToken, extractTokenFromHeader, getCurrentUser } from './lib/auth';

const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(event.headers.authorization);

    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No authorization token provided' }),
      };
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    // Get current user
    const user = await getCurrentUser(payload.user_id);

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (!user.is_active) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Account is inactive' }),
      };
    }

    // Return user info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Get current user error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user information' }),
    };
  }
};

export { handler };

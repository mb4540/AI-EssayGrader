// User Login Endpoint
// POST /api/auth/login

import { Handler, HandlerEvent } from '@netlify/functions';
import { loginUser, LoginInput } from './lib/auth';
import { z } from 'zod';

// Request validation schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  tenant_id: z.string().uuid().optional(),
});

const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.error.format(),
        }),
      };
    }

    const input: LoginInput = validation.data;

    // Login user
    const result = await loginUser(input);

    // Return user and token
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: result.user,
        token: result.token,
        message: 'Login successful',
      }),
    };
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid email or password' }),
        };
      }

      if (error.message.includes('Multiple accounts')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: error.message,
            hint: 'Please provide tenant_id to specify which account to login to',
          }),
        };
      }

      if (error.message.includes('inactive')) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    // Generic error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed. Please try again.' }),
    };
  }
};

export { handler };

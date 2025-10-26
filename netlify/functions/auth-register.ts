// User Registration Endpoint
// POST /api/auth/register

import { Handler, HandlerEvent } from '@netlify/functions';
import { registerUser, RegisterInput } from './lib/auth';
import { z } from 'zod';

// Request validation schema
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  tenant_name: z.string().min(1).optional(),
  tenant_id: z.string().uuid().optional(),
}).refine(
  (data) => data.tenant_name || data.tenant_id,
  {
    message: 'Either tenant_name or tenant_id must be provided',
  }
);

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
    const validation = RegisterSchema.safeParse(body);

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

    const input: RegisterInput = validation.data;

    // Register user
    const result = await registerUser(input);

    // Return user and token (verification_token is for email, not returned to client in production)
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        user: result.user,
        token: result.token,
        message: 'Registration successful. Please check your email to verify your account.',
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    // Generic error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Registration failed. Please try again.' }),
    };
  }
};

export { handler };

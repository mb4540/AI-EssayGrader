// Password Reset Completion Endpoint
// POST /api/auth/complete-reset
// Validates token and updates user password

import { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';
import { z } from 'zod';
import { hashPassword } from './lib/auth';

const sql = neon(process.env.DATABASE_URL!);

// Request validation schema
const CompleteResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hash token using SHA-256 for database lookup
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Log audit event
 */
async function logAuditEvent(
  userId: string | null,
  email: string,
  action: string,
  ipAddress?: string,
  errorMessage?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO grader.password_reset_audit (
        user_id,
        action,
        email,
        ip_address,
        error_message
      ) VALUES (
        ${userId},
        ${action},
        ${email},
        ${ipAddress || null},
        ${errorMessage || null}
      )
    `;
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ============================================================================
// Handler
// ============================================================================

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
    const validation = CompleteResetSchema.safeParse(body);

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

    const { token, password } = validation.data;
    const ipAddress = event.headers['x-forwarded-for'] || event.headers['x-real-ip'];
    const tokenHash = hashToken(token);

    // Find valid token with user info
    const tokens = await sql`
      SELECT 
        prt.reset_token_id,
        prt.user_id,
        prt.expires_at,
        prt.used_at,
        u.email,
        u.full_name
      FROM grader.password_reset_tokens prt
      JOIN grader.users u ON u.user_id = prt.user_id
      WHERE prt.token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (tokens.length === 0) {
      // Token not found
      await logAuditEvent(
        null,
        'unknown',
        'reset_failed',
        ipAddress,
        'Invalid token'
      );

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid or expired reset token',
          message: 'This password reset link is invalid or has expired. Please request a new one.',
        }),
      };
    }

    const tokenRecord = tokens[0];

    // Check if token already used
    if (tokenRecord.used_at) {
      await logAuditEvent(
        tokenRecord.user_id,
        tokenRecord.email,
        'reset_failed',
        ipAddress,
        'Token already used'
      );

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Token already used',
          message: 'This password reset link has already been used. Please request a new one.',
        }),
      };
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    if (now > expiresAt) {
      await logAuditEvent(
        tokenRecord.user_id,
        tokenRecord.email,
        'token_expired',
        ipAddress,
        'Token expired'
      );

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Token expired',
          message: 'This password reset link has expired. Please request a new one.',
        }),
      };
    }

    // Hash new password using existing bcrypt utility
    const passwordHash = await hashPassword(password);

    // Update user password
    await sql`
      UPDATE grader.users
      SET password_hash = ${passwordHash}
      WHERE user_id = ${tokenRecord.user_id}
    `;

    // Mark token as used
    await sql`
      UPDATE grader.password_reset_tokens
      SET used_at = NOW()
      WHERE reset_token_id = ${tokenRecord.reset_token_id}
    `;

    // Log successful reset
    await logAuditEvent(
      tokenRecord.user_id,
      tokenRecord.email,
      'reset_completed',
      ipAddress
    );

    console.log(`Password reset successful for user: ${tokenRecord.email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      }),
    };
  } catch (error) {
    console.error('Password reset completion error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Password reset failed',
        message: 'An error occurred while resetting your password. Please try again.',
      }),
    };
  }
};

export { handler };

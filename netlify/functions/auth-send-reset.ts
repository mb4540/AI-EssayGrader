// Password Reset Request Endpoint
// POST /api/auth/send-reset
// Generates secure token and sends password reset email

import { Handler, HandlerEvent } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { z } from 'zod';
import { hashToken, generateToken, TOKEN_EXPIRY_MINUTES } from './lib/password-reset-utils';

const sql = neon(process.env.DATABASE_URL!);

// Request validation schema
const SendResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// ============================================================================
// Helper Functions
// ============================================================================

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

/**
 * Send password reset email via Mailgun
 */
async function sendResetEmail(
  email: string,
  resetUrl: string,
  firstName?: string
): Promise<boolean> {
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN || 'giftoftime.ai';
  const fromEmail = process.env.FROM_EMAIL || 'mb4540@gmail.com';

  if (!mailgunApiKey || !fromEmail) {
    console.warn('Missing MAILGUN_API_KEY or FROM_EMAIL - email not sent');
    return false;
  }

  try {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: mailgunApiKey,
    });

    // Simple HTML email (we'll create a React Email template next)
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello${firstName ? ` ${firstName}` : ''},</p>
        <p>You requested a password reset for your FastAI Grader account (${email}).</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p><strong>This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          FastAI Grader - Professional Essay Grading<br>
          Support: ${fromEmail}
        </p>
      </div>
    `;

    await mg.messages.create(mailgunDomain, {
      from: fromEmail,
      to: email,
      subject: 'Reset your password - FastAI Grader',
      html,
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send reset email:', error);
    return false;
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
    const validation = SendResetSchema.safeParse(body);

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

    const { email } = validation.data;
    const ipAddress = event.headers['x-forwarded-for'] || event.headers['x-real-ip'];

    // Generic response to prevent user enumeration
    const genericResponse = {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      }),
    };

    // Find user by email
    const users = await sql`
      SELECT user_id, email, full_name
      FROM grader.users
      WHERE LOWER(email) = ${email.toLowerCase()}
      AND is_active = true
      LIMIT 1
    `;

    if (users.length === 0) {
      // User not found - log and return generic response
      await logAuditEvent(null, email, 'reset_requested', ipAddress);
      return genericResponse;
    }

    const user = users[0];
    const firstName = user.full_name.split(' ')[0];

    // Generate secure random token
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Store token in database
    await sql`
      INSERT INTO grader.password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      ) VALUES (
        ${user.user_id},
        ${tokenHash},
        ${expiresAt.toISOString()}
      )
    `;

    // Build reset URL
    const appBaseUrl =
      process.env.APP_BASE_URL ||
      process.env.PUBLIC_BASE_URL ||
      'https://ai-essaygrader.netlify.app';
    const resetUrl = `${appBaseUrl}/reset-password?token=${token}`;

    // Send email
    const emailSent = await sendResetEmail(email, resetUrl, firstName);

    // Log audit event
    await logAuditEvent(
      user.user_id,
      email,
      emailSent ? 'reset_requested' : 'reset_failed',
      ipAddress,
      emailSent ? undefined : 'Email delivery failed'
    );

    // Development: log reset URL
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Reset URL for ${email}: ${resetUrl}`);
    }

    // Always return generic response
    return genericResponse;
  } catch (error) {
    console.error('Password reset request error:', error);

    // Generic error response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      }),
    };
  }
};

export { handler };

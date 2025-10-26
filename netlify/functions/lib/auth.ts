// Authentication utilities for multi-tenant system
// Handles user registration, login, token generation/verification

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days
const BCRYPT_ROUNDS = 12;

// ============================================================================
// Types
// ============================================================================

export interface User {
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher';
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface JWTPayload {
  user_id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  tenant_name?: string; // If creating new tenant
  tenant_id?: string; // If joining existing tenant
}

export interface LoginInput {
  email: string;
  password: string;
  tenant_id?: string; // Optional: specify tenant if email exists in multiple
}

// ============================================================================
// Password Hashing
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT Token Management
// ============================================================================

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// ============================================================================
// Verification Tokens
// ============================================================================

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// ============================================================================
// User Registration
// ============================================================================

export async function registerUser(input: RegisterInput): Promise<{
  user: User;
  token: string;
  verification_token: string;
}> {
  // Validate input
  if (!input.email || !input.password || !input.full_name) {
    throw new Error('Email, password, and full name are required');
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error('Invalid email format');
  }

  let tenant_id = input.tenant_id;

  // Create new tenant if needed
  if (!tenant_id && input.tenant_name) {
    const tenantResult = await sql`
      INSERT INTO grader.tenants (tenant_name, tenant_type)
      VALUES (${input.tenant_name}, 'individual')
      RETURNING tenant_id
    `;
    tenant_id = tenantResult[0].tenant_id;
  }

  if (!tenant_id) {
    throw new Error('Either tenant_id or tenant_name must be provided');
  }

  // Check if user already exists
  const existingUser = await sql`
    SELECT user_id FROM grader.users
    WHERE tenant_id = ${tenant_id} AND email = ${input.email}
  `;

  if (existingUser.length > 0) {
    throw new Error('User with this email already exists in this tenant');
  }

  // Hash password
  const password_hash = await hashPassword(input.password);

  // Generate verification token
  const verification_token = generateVerificationToken();
  const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const userResult = await sql`
    INSERT INTO grader.users (
      tenant_id,
      email,
      password_hash,
      full_name,
      verification_token,
      verification_token_expires
    )
    VALUES (
      ${tenant_id},
      ${input.email},
      ${password_hash},
      ${input.full_name},
      ${verification_token},
      ${verification_token_expires}
    )
    RETURNING 
      user_id,
      tenant_id,
      email,
      full_name,
      role,
      is_active,
      email_verified,
      last_login_at,
      created_at
  `;

  const user = userResult[0] as User;

  // Generate JWT
  const token = generateToken({
    user_id: user.user_id,
    tenant_id: user.tenant_id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
    verification_token,
  };
}

// ============================================================================
// User Login
// ============================================================================

export async function loginUser(input: LoginInput): Promise<{
  user: User;
  token: string;
}> {
  // Validate input
  if (!input.email || !input.password) {
    throw new Error('Email and password are required');
  }

  // Find user
  let users;
  if (input.tenant_id) {
    users = await sql`
      SELECT 
        user_id,
        tenant_id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        last_login_at,
        created_at
      FROM grader.users
      WHERE tenant_id = ${input.tenant_id} AND email = ${input.email}
    `;
  } else {
    users = await sql`
      SELECT 
        user_id,
        tenant_id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        last_login_at,
        created_at
      FROM grader.users
      WHERE email = ${input.email}
    `;
  }

  if (users.length === 0) {
    throw new Error('Invalid email or password');
  }

  if (users.length > 1 && !input.tenant_id) {
    throw new Error('Multiple accounts found. Please specify tenant_id');
  }

  const user = users[0];

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account is inactive. Please contact support');
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await sql`
    UPDATE grader.users
    SET last_login_at = now()
    WHERE user_id = ${user.user_id}
  `;

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;

  // Generate JWT
  const token = generateToken({
    user_id: userWithoutPassword.user_id,
    tenant_id: userWithoutPassword.tenant_id,
    email: userWithoutPassword.email,
    role: userWithoutPassword.role,
  });

  return {
    user: userWithoutPassword as User,
    token,
  };
}

// ============================================================================
// Email Verification
// ============================================================================

export async function verifyEmail(verification_token: string): Promise<User> {
  const users = await sql`
    SELECT 
      user_id,
      tenant_id,
      email,
      full_name,
      role,
      is_active,
      email_verified,
      last_login_at,
      created_at,
      verification_token_expires
    FROM grader.users
    WHERE verification_token = ${verification_token}
  `;

  if (users.length === 0) {
    throw new Error('Invalid verification token');
  }

  const user = users[0];

  // Check if token expired
  if (new Date() > new Date(user.verification_token_expires)) {
    throw new Error('Verification token has expired');
  }

  // Mark email as verified
  await sql`
    UPDATE grader.users
    SET 
      email_verified = true,
      verification_token = NULL,
      verification_token_expires = NULL
    WHERE user_id = ${user.user_id}
  `;

  return {
    ...user,
    email_verified: true,
  } as User;
}

// ============================================================================
// Password Reset
// ============================================================================

export async function requestPasswordReset(email: string, tenant_id?: string): Promise<string> {
  let users;
  if (tenant_id) {
    users = await sql`
      SELECT user_id FROM grader.users
      WHERE tenant_id = ${tenant_id} AND email = ${email}
    `;
  } else {
    users = await sql`
      SELECT user_id FROM grader.users
      WHERE email = ${email}
    `;
  }

  if (users.length === 0) {
    // Don't reveal if email exists
    return 'If an account exists, a reset email will be sent';
  }

  if (users.length > 1 && !tenant_id) {
    throw new Error('Multiple accounts found. Please specify tenant_id');
  }

  const user = users[0];
  const reset_token = generateResetToken();
  const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await sql`
    UPDATE grader.users
    SET 
      reset_token = ${reset_token},
      reset_token_expires = ${reset_token_expires}
    WHERE user_id = ${user.user_id}
  `;

  return reset_token;
}

export async function resetPassword(reset_token: string, new_password: string): Promise<void> {
  if (new_password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const users = await sql`
    SELECT user_id, reset_token_expires
    FROM grader.users
    WHERE reset_token = ${reset_token}
  `;

  if (users.length === 0) {
    throw new Error('Invalid reset token');
  }

  const user = users[0];

  // Check if token expired
  if (new Date() > new Date(user.reset_token_expires)) {
    throw new Error('Reset token has expired');
  }

  // Hash new password
  const password_hash = await hashPassword(new_password);

  // Update password and clear reset token
  await sql`
    UPDATE grader.users
    SET 
      password_hash = ${password_hash},
      reset_token = NULL,
      reset_token_expires = NULL
    WHERE user_id = ${user.user_id}
  `;
}

// ============================================================================
// Get Current User
// ============================================================================

export async function getCurrentUser(user_id: string): Promise<User | null> {
  const users = await sql`
    SELECT 
      user_id,
      tenant_id,
      email,
      full_name,
      role,
      is_active,
      email_verified,
      last_login_at,
      created_at
    FROM grader.users
    WHERE user_id = ${user_id}
  `;

  if (users.length === 0) {
    return null;
  }

  return users[0] as User;
}

// ============================================================================
// Authentication Middleware
// ============================================================================

export interface AuthenticatedRequest {
  user: User;
  tenant_id: string;
}

/**
 * Authenticate request and extract user information
 * Returns user data if authenticated, throws error if not
 */
export async function authenticateRequest(
  authHeader: string | undefined
): Promise<AuthenticatedRequest> {
  // Extract token
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    throw new Error('Authentication required');
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  // Get current user
  const user = await getCurrentUser(payload.user_id);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account is inactive');
  }

  return {
    user,
    tenant_id: user.tenant_id,
  };
}

/**
 * Optional authentication - returns user if authenticated, null if not
 * Does not throw errors for missing/invalid tokens
 */
export async function optionalAuthentication(
  authHeader: string | undefined
): Promise<AuthenticatedRequest | null> {
  try {
    return await authenticateRequest(authHeader);
  } catch {
    return null;
  }
}

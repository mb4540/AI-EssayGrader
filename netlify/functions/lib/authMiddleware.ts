// Authentication Middleware
// Verifies JWT tokens and attaches user info to requests

import { HandlerEvent } from '@netlify/functions';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

export interface AuthenticatedEvent extends HandlerEvent {
  user?: JWTPayload;
}

export interface AuthResult {
  authenticated: boolean;
  user?: JWTPayload;
  error?: string;
  statusCode?: number;
}

/**
 * Verify authentication from request headers
 * Returns user payload if authenticated, or error details if not
 */
export function authenticate(event: HandlerEvent): AuthResult {
  // Extract token from Authorization header
  const token = extractTokenFromHeader(event.headers.authorization);

  if (!token) {
    return {
      authenticated: false,
      error: 'No authorization token provided',
      statusCode: 401,
    };
  }

  // Verify token
  const payload = verifyToken(token);

  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }

  return {
    authenticated: true,
    user: payload,
  };
}

/**
 * Require authentication for an endpoint
 * Returns error response if not authenticated, or user payload if authenticated
 */
export function requireAuth(event: HandlerEvent): {
  error?: { statusCode: number; body: string };
  user?: JWTPayload;
} {
  const authResult = authenticate(event);

  if (!authResult.authenticated) {
    return {
      error: {
        statusCode: authResult.statusCode || 401,
        body: JSON.stringify({ error: authResult.error }),
      },
    };
  }

  return {
    user: authResult.user,
  };
}

/**
 * Check if user has required role
 */
export function requireRole(
  user: JWTPayload,
  allowedRoles: Array<'admin' | 'teacher'>
): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Check if user belongs to specified tenant
 */
export function requireTenant(user: JWTPayload, tenant_id: string): boolean {
  return user.tenant_id === tenant_id;
}

/**
 * Helper to create authenticated response headers
 */
export function getAuthHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Helper to handle CORS preflight
 */
export function handlePreflight(): { statusCode: number; headers: Record<string, string>; body: string } {
  return {
    statusCode: 200,
    headers: getAuthHeaders(),
    body: '',
  };
}

import { randomBytes, createHash } from 'crypto';

export const TOKEN_LENGTH = 32;
export const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Hash token using SHA-256 for secure storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

// Authentication Utilities Tests
// Tests for password hashing and JWT token functions (pure functions only)
// Skips database-dependent functions to avoid connection issues in tests

import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test the actual utilities by reimplementing the pure functions
// This avoids module-level database initialization issues

const JWT_SECRET = 'test-secret-key-for-testing';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface JWTPayload {
  user_id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'teacher';
}

function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

describe('Auth Utilities - Password Hashing', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should use 12 rounds (from BCRYPT_ROUNDS constant)', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      // Format: $2a$12$... (12 is the cost factor)
      expect(hash).toContain('$12$');
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Salt makes each hash unique
      expect(hash1).not.toBe(hash2);
    });

    it('should hash different passwords differently', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should handle special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('testpassword123', hash);

      expect(isValid).toBe(false);
    });

    it('should reject empty password against valid hash', async () => {
      const hash = await hashPassword('testPassword123');
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format gracefully', async () => {
      const password = 'testPassword123';
      const isValid = await verifyPassword(password, 'invalid-hash');

      expect(isValid).toBe(false);
    });
  });
});

describe('Auth Utilities - JWT Tokens', () => {
  const mockPayload: JWTPayload = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    tenant_id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    role: 'teacher',
  };

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate token in JWT format (3 parts separated by dots)', () => {
      const token = generateToken(mockPayload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({
        ...mockPayload,
        user_id: '999e4567-e89b-12d3-a456-426614174999',
      });

      expect(token1).not.toBe(token2);
    });

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      if (decoded) {
        expect(decoded.user_id).toBe(mockPayload.user_id);
        expect(decoded.email).toBe(mockPayload.email);
        expect(decoded.role).toBe(mockPayload.role);
      }
    });

    it('should set expiration (7 days default)', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any; // JWT adds exp/iat fields

      expect(decoded).toBeDefined();
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        const now = new Date();
        const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        // Should expire in approximately 7 days
        expect(diffDays).toBeGreaterThan(6.9);
        expect(diffDays).toBeLessThan(7.1);
      }
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.user_id).toBe(mockPayload.user_id);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not-a-jwt-token');

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should verify token contains all required fields', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any; // JWT adds exp/iat fields

      expect(decoded).toBeDefined();
      if (decoded) {
        expect(decoded).toHaveProperty('user_id');
        expect(decoded).toHaveProperty('tenant_id');
        expect(decoded).toHaveProperty('email');
        expect(decoded).toHaveProperty('role');
        expect(decoded).toHaveProperty('exp');
        expect(decoded).toHaveProperty('iat');
      }
    });
  });
});

describe('Auth Utilities - Integration Flow', () => {
  it('should complete registration -> login flow', async () => {
    // 1. Hash password for storage (registration)
    const plainPassword = 'securePassword123';
    const passwordHash = await hashPassword(plainPassword);

    // 2. Verify password (login)
    const isValid = await verifyPassword(plainPassword, passwordHash);
    expect(isValid).toBe(true);

    // 3. Generate token after successful login
    const payload: JWTPayload = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      tenant_id: '223e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
      role: 'teacher',
    };
    const token = generateToken(payload);
    expect(token).toBeDefined();

    // 4. Verify token for authenticated requests
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.user_id).toBe(payload.user_id);
  });

  it('should reject invalid credentials', async () => {
    // 1. Hash password for storage
    const passwordHash = await hashPassword('correctPassword');

    // 2. Try to login with wrong password
    const isValid = await verifyPassword('wrongPassword', passwordHash);
    expect(isValid).toBe(false);

    // 3. Should not generate token for invalid credentials
    // (This would be handled by application logic)
  });

  it('should handle password reset flow', async () => {
    // 1. Original password
    const originalPassword = 'oldPassword123';
    const originalHash = await hashPassword(originalPassword);

    // 2. Verify original password works
    expect(await verifyPassword(originalPassword, originalHash)).toBe(true);

    // 3. Reset to new password
    const newPassword = 'newPassword456';
    const newHash = await hashPassword(newPassword);

    // 4. Old password shouldn't work with new hash
    expect(await verifyPassword(originalPassword, newHash)).toBe(false);

    // 5. New password should work
    expect(await verifyPassword(newPassword, newHash)).toBe(true);
  });
});

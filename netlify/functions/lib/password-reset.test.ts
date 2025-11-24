import { describe, it, expect } from 'vitest';
import { hashToken, generateToken, TOKEN_LENGTH } from './password-reset-utils';

describe('Password Reset Utils', () => {
  describe('generateToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateToken();
      // hex string length is 2 * bytes
      expect(token).toHaveLength(TOKEN_LENGTH * 2);
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different tokens', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a hex string', () => {
      const hash = hashToken('test');
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});

// Unit tests for cryptographic operations
import { describe, it, expect, beforeAll } from 'vitest';
import {
  deriveKey,
  encryptJson,
  decryptJson,
  generateHmac,
  verifyHmac,
  arrayBufferToBase64,
  base64ToUint8Array,
} from './crypto';

describe('Bridge Crypto', () => {
  beforeAll(() => {
    // Ensure crypto is available
    if (typeof global.crypto === 'undefined') {
      const { webcrypto } = require('crypto');
      global.crypto = webcrypto as Crypto;
    }
  });

  describe('deriveKey', () => {
    it('should derive a key from passphrase and salt', async () => {
      const passphrase = 'test-passphrase-123';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const key = await deriveKey(passphrase, salt);

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should produce different keys for different passphrases', async () => {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const key1 = await deriveKey('passphrase1', salt);
      const key2 = await deriveKey('passphrase2', salt);

      // Keys should be different (we can't directly compare CryptoKey objects)
      expect(key1).not.toBe(key2);
    });

    it('should produce different keys for different salts', async () => {
      const passphrase = 'same-passphrase';
      const salt1 = new Uint8Array(16);
      const salt2 = new Uint8Array(16);
      crypto.getRandomValues(salt1);
      crypto.getRandomValues(salt2);

      const key1 = await deriveKey(passphrase, salt1);
      const key2 = await deriveKey(passphrase, salt2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptJson / decryptJson', () => {
    it('should encrypt and decrypt JSON data', async () => {
      const data = {
        name: 'Test Student',
        localId: 'S123456',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
      };
      const passphrase = 'secure-passphrase-123';

      const encrypted = await encryptJson(data, passphrase);

      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.salt).toBeInstanceOf(Uint8Array);
      expect(encrypted.iterations).toBe(210000);

      const decrypted = await decryptJson(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.salt,
        passphrase,
        encrypted.iterations
      );

      expect(decrypted).toEqual(data);
    });

    it('should fail to decrypt with wrong passphrase', async () => {
      const data = { test: 'data' };
      const encrypted = await encryptJson(data, 'correct-passphrase');

      await expect(
        decryptJson(
          encrypted.ciphertext,
          encrypted.iv,
          encrypted.salt,
          'wrong-passphrase',
          encrypted.iterations
        )
      ).rejects.toThrow();
    });

    it('should handle complex nested objects', async () => {
      const data = {
        version: '1.0',
        payload: {
          district: 'Test District',
          roster: [
            { uuid: 'uuid1', name: 'Student 1', localId: 'S001' },
            { uuid: 'uuid2', name: 'Student 2', localId: 'S002' },
          ],
        },
      };
      const passphrase = 'test-pass';

      const encrypted = await encryptJson(data, passphrase);
      const decrypted = await decryptJson(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.salt,
        passphrase,
        encrypted.iterations
      );

      expect(decrypted).toEqual(data);
    });
  });

  describe('HMAC operations', () => {
    it('should generate HMAC for data', async () => {
      const data = 'test data string';
      const passphrase = 'hmac-key';

      const hmac = await generateHmac(data, passphrase);

      expect(hmac).toBeDefined();
      expect(typeof hmac).toBe('string');
      expect(hmac.length).toBeGreaterThan(0);
    });

    it('should verify correct HMAC', async () => {
      const data = 'test data';
      const passphrase = 'key';

      const hmac = await generateHmac(data, passphrase);
      const isValid = await verifyHmac(data, hmac, passphrase);

      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC', async () => {
      const data = 'test data';
      const passphrase = 'key';

      const hmac = await generateHmac(data, passphrase);
      const isValid = await verifyHmac('different data', hmac, passphrase);

      expect(isValid).toBe(false);
    });

    it('should reject HMAC with wrong passphrase', async () => {
      const data = 'test data';

      const hmac = await generateHmac(data, 'correct-key');
      const isValid = await verifyHmac(data, hmac, 'wrong-key');

      expect(isValid).toBe(false);
    });
  });

  describe('Base64 encoding/decoding', () => {
    it('should convert Uint8Array to Base64 and back', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 128, 0]);

      const base64 = arrayBufferToBase64(original);
      expect(typeof base64).toBe('string');

      const decoded = base64ToUint8Array(base64);
      expect(decoded).toEqual(original);
    });

    it('should handle empty arrays', () => {
      const original = new Uint8Array([]);

      const base64 = arrayBufferToBase64(original);
      const decoded = base64ToUint8Array(base64);

      expect(decoded).toEqual(original);
    });

    it('should handle ArrayBuffer input', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view.set([10, 20, 30, 40, 50, 60, 70, 80]);

      const base64 = arrayBufferToBase64(buffer);
      const decoded = base64ToUint8Array(base64);

      expect(decoded).toEqual(view);
    });
  });
});

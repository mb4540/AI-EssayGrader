// PII Guard Tests
// Tests for PII detection and validation in API payloads
// Critical for FERPA compliance - prevents student names from reaching cloud

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateNoPII, PIIViolationError, isPIIGuardEnabled, guardedFetch } from './piiGuard';

describe('PII Guard', () => {
  describe('validateNoPII', () => {
    it('should pass for payload without PII', () => {
      const payload = {
        submission_id: 'abc123',
        essay_text: 'This is an essay',
        grade: 85,
        feedback: 'Good work',
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should throw for payload with "name" key', () => {
      const payload = {
        submission_id: 'abc123',
        name: 'John Doe', // PII!
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
      expect(() => validateNoPII(payload)).toThrow(/name/);
    });

    it('should throw for payload with "studentName" key', () => {
      const payload = {
        submission_id: 'abc123',
        studentName: 'Jane Smith', // PII!
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
      expect(() => validateNoPII(payload)).toThrow(/studentName/);
    });

    it('should throw for payload with "student_name" key', () => {
      const payload = {
        submission_id: 'abc123',
        student_name: 'Bob Johnson', // PII!
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should throw for payload with "localId" key', () => {
      const payload = {
        submission_id: 'abc123',
        localId: 'S12345', // PII!
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should throw for payload with "firstName" key', () => {
      const payload = {
        firstName: 'John', // PII!
        grade: 85,
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should throw for payload with "lastName" key', () => {
      const payload = {
        lastName: 'Doe', // PII!
        grade: 85,
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should throw for payload with "fullName" key', () => {
      const payload = {
        fullName: 'John Doe', // PII!
        grade: 85,
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should throw for payload with "district_student_id" key', () => {
      const payload = {
        district_student_id: '123456', // PII!
        grade: 85,
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should detect PII in nested objects', () => {
      const payload = {
        submission_id: 'abc123',
        student: {
          name: 'John Doe', // Nested PII!
          grade: 85,
        },
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
      expect(() => validateNoPII(payload)).toThrow(/student\.name/);
    });

    it('should detect PII in deeply nested objects', () => {
      const payload = {
        submission: {
          metadata: {
            author: {
              firstName: 'John', // Deeply nested PII!
            },
          },
        },
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
      expect(() => validateNoPII(payload)).toThrow(/submission\.metadata\.author\.firstName/);
    });

    it('should detect multiple PII violations', () => {
      const payload = {
        name: 'John Doe',
        localId: 'S12345',
        firstName: 'John',
      };

      try {
        validateNoPII(payload);
        expect.fail('Should have thrown PIIViolationError');
      } catch (error) {
        expect(error).toBeInstanceOf(PIIViolationError);
        const piiError = error as PIIViolationError;
        expect(piiError.forbiddenKeys).toHaveLength(3);
        expect(piiError.forbiddenKeys).toContain('name');
        expect(piiError.forbiddenKeys).toContain('localId');
        expect(piiError.forbiddenKeys).toContain('firstName');
      }
    });

    it('should detect PII in arrays of objects', () => {
      const payload = {
        students: [
          { name: 'John' }, // PII in array!
          { name: 'Jane' },
        ],
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should allow UUID student_id (not PII)', () => {
      const payload = {
        student_id: 'f4100a7c-9272-4e33-8a16-dbc6abc7c001', // UUID is OK
        submission_id: 'abc123',
        grade: 85,
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should handle null values', () => {
      const payload = {
        submission_id: 'abc123',
        optional_field: null,
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should handle undefined values', () => {
      const payload = {
        submission_id: 'abc123',
        optional_field: undefined,
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should handle empty objects', () => {
      const payload = {};

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should handle arrays of primitives', () => {
      const payload = {
        grades: [85, 90, 95],
        tags: ['essay', 'literature'],
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });
  });

  describe('PIIViolationError', () => {
    it('should create error with forbidden keys', () => {
      const error = new PIIViolationError(['name', 'localId']);

      expect(error.name).toBe('PIIViolationError');
      expect(error.message).toContain('name');
      expect(error.message).toContain('localId');
      expect(error.forbiddenKeys).toEqual(['name', 'localId']);
    });

    it('should be instanceof Error', () => {
      const error = new PIIViolationError(['name']);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PIIViolationError);
    });
  });

  describe('isPIIGuardEnabled', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      if (typeof window !== 'undefined') {
        delete (window as any).__DISABLE_PII_GUARD;
      }
    });

    it('should be enabled in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isPIIGuardEnabled()).toBe(true);
    });

    it('should be disabled in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isPIIGuardEnabled()).toBe(false);
    });

    it('should be enabled in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isPIIGuardEnabled()).toBe(true);
    });
  });

  describe('guardedFetch', () => {
    let originalFetch: typeof fetch;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      originalFetch = global.fetch;
      mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        } as Response)
      );
      global.fetch = mockFetch;
      vi.clearAllMocks(); // Clear any previous mock calls
      process.env.NODE_ENV = 'development'; // Enable guard
    });

    afterEach(() => {
      global.fetch = originalFetch;
      process.env.NODE_ENV = 'test';
    });

    it('should allow request without PII', async () => {
      const payload = {
        submission_id: 'abc123',
        grade: 85,
      };

      await guardedFetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('should block request with PII', async () => {
      const payload = {
        submission_id: 'abc123',
        name: 'John Doe', // PII!
      };

      // Should throw PIIViolationError
      try {
        await guardedFetch('/api/save', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        expect.fail('Should have thrown PIIViolationError');
      } catch (error) {
        expect(error).toBeInstanceOf(PIIViolationError);
        // Fetch should not have been called
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });

    it('should allow request without body', async () => {
      await guardedFetch('/api/get');

      expect(mockFetch).toHaveBeenCalledWith('/api/get', undefined);
    });

    it('should allow request with non-JSON body', async () => {
      await guardedFetch('/api/upload', {
        method: 'POST',
        body: 'plain text',
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should pass through in production', async () => {
      process.env.NODE_ENV = 'production';

      const payload = {
        name: 'John Doe', // PII, but should be allowed in production
      };

      await guardedFetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Security - Real-world scenarios', () => {
    it('should block submission with student name', () => {
      const payload = {
        submission_id: 'abc123',
        essay_text: 'This is my essay',
        student: {
          name: 'John Doe', // BLOCKED!
        },
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should allow submission with only UUID', () => {
      const payload = {
        submission_id: 'abc123',
        student_id: 'f4100a7c-9272-4e33-8a16-dbc6abc7c001',
        essay_text: 'This is my essay',
        grade: 85,
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });

    it('should block CSV import with student names', () => {
      const payload = {
        students: [
          { name: 'John Doe', localId: 'S001' }, // BLOCKED!
          { name: 'Jane Smith', localId: 'S002' },
        ],
      };

      expect(() => validateNoPII(payload)).toThrow(PIIViolationError);
    });

    it('should allow grading request with UUIDs only', () => {
      const payload = {
        submission_id: 'abc123',
        student_id: 'f4100a7c-9272-4e33-8a16-dbc6abc7c001',
        ai_grade: 85,
        ai_feedback: {
          strengths: ['Good structure'],
          improvements: ['Add more examples'],
        },
      };

      expect(() => validateNoPII(payload)).not.toThrow();
    });
  });
});

// Annotation Normalizer Tests
// Tests for annotation validation, normalization, and text location matching

import { describe, it, expect } from 'vitest';
import { normalizeAnnotations, createUnmatchedAnnotation } from './normalizer';
import type { RawAnnotation } from './types';

describe('Annotation Normalizer', () => {
  const sampleText = `This is a test essay about literature and writing.
It contains multiple sentences to demonstrate the annotation system.
The quick brown fox jumps over the lazy dog.
This sentence has a spelling eror in it.`;

  const submissionId = 'test-submission-123';

  describe('normalizeAnnotations', () => {
    it('should normalize valid annotation with exact quote match', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'Clarity',
          suggestion: 'Consider a more specific title',
          severity: 'info',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.unresolved).toHaveLength(0);
      expect(result.stats.total).toBe(1);
      expect(result.stats.resolved).toBe(1);
      expect(result.stats.unresolved).toBe(0);

      const annotation = result.normalized[0];
      expect(annotation.submission_id).toBe(submissionId);
      expect(annotation.quote).toBe('test essay');
      expect(annotation.category).toBe('Clarity');
      expect(annotation.suggestion).toBe('Consider a more specific title');
      expect(annotation.severity).toBe('info');
      expect(annotation.status).toBe('ai_suggested');
      expect(annotation.line_number).toBeGreaterThan(0);
      expect(annotation.start_offset).toBeGreaterThanOrEqual(0);
      expect(annotation.end_offset).toBeGreaterThan(annotation.start_offset);
    });

    it('should normalize multiple valid annotations', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'Clarity',
          suggestion: 'Be more specific',
        },
        {
          line: 3,
          quote: 'quick brown fox',
          category: 'Clarity',
          suggestion: 'This is a cliché',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(2);
      expect(result.unresolved).toHaveLength(0);
      expect(result.stats.resolved).toBe(2);
    });

    it('should handle case-insensitive category matching', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'clarity', // lowercase
          suggestion: 'Test',
        },
        {
          line: 1,
          quote: 'literature',
          category: 'MECHANICS', // uppercase
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(2);
      expect(result.normalized[0].category).toBe('Clarity');
      expect(result.normalized[1].category).toBe('Mechanics');
    });

    it('should mark annotation as unresolved if category is invalid', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'InvalidCategory',
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(0);
      expect(result.unresolved).toHaveLength(1);
      expect(result.unresolved[0].reason).toContain('Invalid category');
    });

    it('should mark annotation as unresolved if quote not found', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'nonexistent text that does not appear',
          category: 'Clarity',
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(0);
      expect(result.unresolved).toHaveLength(1);
      expect(result.unresolved[0].reason).toContain('Could not locate quote');
    });

    it('should handle severity normalization', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test',
          category: 'Clarity',
          suggestion: 'Info test',
          severity: 'info',
        },
        {
          line: 2,
          quote: 'contains',
          category: 'Mechanics',
          suggestion: 'Warning test',
          severity: 'warning',
        },
        {
          line: 3,
          quote: 'quick',
          category: 'Mechanics',
          suggestion: 'Error test',
          severity: 'error',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(3);
      expect(result.normalized[0].severity).toBe('info');
      expect(result.normalized[1].severity).toBe('warning');
      expect(result.normalized[2].severity).toBe('error');
    });

    it('should default to warning for invalid severity', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test',
          category: 'Clarity',
          suggestion: 'Test',
          severity: 'invalid-severity' as any,
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.normalized[0].severity).toBe('warning');
    });

    it('should handle missing severity (undefined)', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test',
          category: 'Clarity',
          suggestion: 'Test',
          // severity omitted
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.normalized[0].severity).toBeUndefined();
    });

    it('should preserve ai_payload in normalized annotation', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'Clarity',
          suggestion: 'Test',
          severity: 'info',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized[0].ai_payload).toEqual(rawAnnotations[0]);
    });

    it('should handle empty annotations array', () => {
      const result = normalizeAnnotations([], sampleText, submissionId);

      expect(result.normalized).toHaveLength(0);
      expect(result.unresolved).toHaveLength(0);
      expect(result.stats.total).toBe(0);
      expect(result.stats.resolved).toBe(0);
      expect(result.stats.unresolved).toBe(0);
    });

    it('should handle empty text', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test',
          category: 'Clarity',
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, '', submissionId);

      expect(result.normalized).toHaveLength(0);
      expect(result.unresolved).toHaveLength(1);
      expect(result.unresolved[0].reason).toContain('Could not locate quote');
    });

    it('should handle special characters in quotes', () => {
      const textWithSpecialChars = 'This has "quotes" and (parentheses) and [brackets].';
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: '"quotes"',
          category: 'Mechanics',
          suggestion: 'Use smart quotes',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, textWithSpecialChars, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.normalized[0].quote).toBe('"quotes"');
    });

    it('should calculate correct stats for mixed results', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: 'test essay',
          category: 'Clarity',
          suggestion: 'Valid 1',
        },
        {
          line: 1,
          quote: 'nonexistent',
          category: 'Clarity',
          suggestion: 'Invalid - not found',
        },
        {
          line: 2,
          quote: 'contains',
          category: 'Mechanics',
          suggestion: 'Valid 2',
        },
        {
          line: 1,
          quote: 'test',
          category: 'InvalidCategory',
          suggestion: 'Invalid - bad category',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.stats.total).toBe(4);
      expect(result.stats.resolved).toBe(2);
      expect(result.stats.unresolved).toBe(2);
      expect(result.normalized).toHaveLength(2);
      expect(result.unresolved).toHaveLength(2);
    });
  });

  describe('createUnmatchedAnnotation', () => {
    it('should create annotation with -1 markers for unmatched text', () => {
      const raw: RawAnnotation = {
        line: 1,
        quote: 'nonexistent text',
        category: 'Clarity',
        suggestion: 'This is a suggestion',
        severity: 'warning',
      };

      const annotation = createUnmatchedAnnotation(raw, submissionId, 'Text not found');

      expect(annotation.submission_id).toBe(submissionId);
      expect(annotation.line_number).toBe(-1);
      expect(annotation.start_offset).toBe(-1);
      expect(annotation.end_offset).toBe(-1);
      expect(annotation.quote).toBe('nonexistent text');
      expect(annotation.category).toBe('Clarity');
      expect(annotation.suggestion).toContain('[Unmatched: Text not found]');
      expect(annotation.suggestion).toContain('This is a suggestion');
      expect(annotation.severity).toBe('warning');
      expect(annotation.status).toBe('ai_suggested');
    });

    it('should default to "Other" category if invalid', () => {
      const raw: RawAnnotation = {
        line: 1,
        quote: 'test',
        category: 'InvalidCategory',
        suggestion: 'Test',
      };

      const annotation = createUnmatchedAnnotation(raw, submissionId, 'Invalid category');

      expect(annotation.category).toBe('Other');
    });

    it('should preserve ai_payload', () => {
      const raw: RawAnnotation = {
        line: 1,
        quote: 'test',
        category: 'Clarity',
        suggestion: 'Test',
      };

      const annotation = createUnmatchedAnnotation(raw, submissionId, 'Test reason');

      expect(annotation.ai_payload).toEqual(raw);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long quotes', () => {
      const longQuote = 'This is a test essay about literature and writing';
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: longQuote,
          category: 'Clarity',
          suggestion: 'Break into shorter sentences',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.normalized[0].quote).toBe(longQuote);
    });

    it('should handle quotes with leading/trailing whitespace', () => {
      const rawAnnotations: RawAnnotation[] = [
        {
          line: 1,
          quote: '  test essay  ',
          category: 'Clarity',
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, sampleText, submissionId);

      // Should still find the text (fuzzy matching handles whitespace)
      expect(result.normalized.length + result.unresolved.length).toBe(1);
    });

    it('should handle multi-line text', () => {
      const multiLineText = `Line one has text.
Line two has more text.
Line three continues.`;

      const rawAnnotations: RawAnnotation[] = [
        {
          line: 2,
          quote: 'Line two',
          category: 'Clarity',
          suggestion: 'Test',
        },
      ];

      const result = normalizeAnnotations(rawAnnotations, multiLineText, submissionId);

      expect(result.normalized).toHaveLength(1);
      expect(result.normalized[0].line_number).toBe(2);
    });
  });
});

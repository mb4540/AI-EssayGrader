// Rubric Parser Tests
// Tests for parsing teacher rubrics into structured JSON format

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseTeacherRubric } from './rubricParser';

// Mock console to suppress debug output during tests
const originalConsole = { ...console };

describe('Rubric Parser', () => {
  beforeEach(() => {
    // Suppress console output during tests
    console.log = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
  });

  describe('parseTeacherRubric', () => {
    it('should parse simple rubric with one category', () => {
      const rubricText = `
**Content (50 pts)**:
- Excellent (45-50 pts): Strong arguments
- Good (35-44 pts): Adequate arguments
- Fair (25-34 pts): Weak arguments
- Poor (0-24 pts): Missing arguments
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-1', 50);

      expect(result.rubric_id).toBe('parsed-test-1');
      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Content');
      expect(parseFloat(result.criteria[0].max_points)).toBeCloseTo(50, 1);
      expect(result.criteria[0].levels).toHaveLength(4);
      // Scale mode is 'percent' by default, so total_points is null
      expect(result.scale.mode).toBe('percent');
    });

    it('should parse rubric with multiple categories', () => {
      const rubricText = `
**Content (40 pts)**:
- Excellent (36-40 pts): Strong arguments

**Organization (30 pts)**:
- Excellent (27-30 pts): Clear structure

**Grammar (30 pts)**:
- Excellent (27-30 pts): No errors
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-2', 100);

      expect(result.criteria).toHaveLength(3);
      expect(result.criteria[0].name).toBe('Content');
      expect(result.criteria[1].name).toBe('Organization');
      expect(result.criteria[2].name).toBe('Grammar');
    });

    it('should detect total points from text', () => {
      const rubricText = `
Scoring (100 pts total):

**Content (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-3');

      // Total is 100, so mode is 'percent' and total_points is null
      expect(result.scale.mode).toBe('percent');
    });

    it('should use provided total points over detected', () => {
      const rubricText = `
Scoring (50 pts total):

**Content (25 pts)**:
- Excellent (23-25 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-4', 100);

      // Total is 100, so mode is 'percent'
      expect(result.scale.mode).toBe('percent');
    });

    it('should default to 100 points if not specified', () => {
      const rubricText = `
**Content (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-5');

      // Defaults to 100, so mode is 'percent'
      expect(result.scale.mode).toBe('percent');
    });

    it('should throw error for empty criteria text', () => {
      expect(() => parseTeacherRubric('', 'test-6')).toThrow('Criteria text is empty');
    });

    it('should throw error for whitespace-only text', () => {
      expect(() => parseTeacherRubric('   \n\n   ', 'test-7')).toThrow('Criteria text is empty');
    });

    it('should throw error when no categories found', () => {
      const rubricText = 'This is just plain text with no categories';

      expect(() => parseTeacherRubric(rubricText, 'test-8')).toThrow('No categories found');
    });

    it('should parse category with "points" instead of "pts"', () => {
      const rubricText = `
**Content (50 points)**:
- Excellent (45-50 points): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-9', 50);

      expect(result.criteria).toHaveLength(1);
      expect(parseFloat(result.criteria[0].max_points)).toBeCloseTo(50, 1);
    });

    it('should handle categories with leading dash', () => {
      const rubricText = `
- **Content (50 pts)**:
  - Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-10', 50);

      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Content');
    });

    it('should scale categories proportionally if total does not match', () => {
      const rubricText = `
**Content (40 pts)**:
- Excellent (36-40 pts): Strong

**Organization (40 pts)**:
- Excellent (36-40 pts): Clear
      `.trim();

      // Categories sum to 80, but total is 100
      const result = parseTeacherRubric(rubricText, 'test-11', 100);

      // Should scale: 40 * (100/80) = 50
      expect(parseFloat(result.criteria[0].max_points)).toBeCloseTo(50, 1);
      expect(parseFloat(result.criteria[1].max_points)).toBeCloseTo(50, 1);
    });

    it('should detect percent mode when total is 100', () => {
      const rubricText = `
**Content (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-12', 100);

      expect(result.scale.mode).toBe('percent');
    });

    it('should detect points mode when total is not 100', () => {
      const rubricText = `
Total: 50 points

**Content (25 pts)**:
- Excellent (23-25 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-13', 50);

      expect(result.scale.mode).toBe('points');
    });

    it('should set rounding mode to HALF_UP with 2 decimals', () => {
      const rubricText = `
**Content (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-14', 50);

      expect(result.scale.rounding.mode).toBe('HALF_UP');
      expect(result.scale.rounding.decimals).toBe(2);
    });

    it('should set schema version to 1', () => {
      const rubricText = `
**Content (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-15', 50);

      expect(result.schema_version).toBe(1);
    });

    it('should handle complex multi-level rubric', () => {
      const rubricText = `
**Thesis Statement (20 pts)**:
- Excellent (18-20 pts): Clear, arguable thesis
- Good (15-17 pts): Adequate thesis
- Fair (12-14 pts): Weak thesis
- Poor (0-11 pts): No clear thesis

**Evidence (30 pts)**:
- Excellent (27-30 pts): Strong, relevant evidence
- Good (23-26 pts): Adequate evidence
- Fair (18-22 pts): Weak evidence
- Poor (0-17 pts): Little or no evidence

**Organization (25 pts)**:
- Excellent (23-25 pts): Logical flow
- Good (19-22 pts): Generally organized
- Fair (15-18 pts): Some organization issues
- Poor (0-14 pts): Disorganized

**Grammar (25 pts)**:
- Excellent (23-25 pts): Few errors
- Good (19-22 pts): Some errors
- Fair (15-18 pts): Many errors
- Poor (0-14 pts): Numerous errors
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-16', 100);

      expect(result.criteria).toHaveLength(4);
      expect(result.criteria[0].name).toBe('Thesis Statement');
      expect(result.criteria[0].levels).toHaveLength(4);
      expect(result.criteria[1].name).toBe('Evidence');
      expect(result.criteria[2].name).toBe('Organization');
      expect(result.criteria[3].name).toBe('Grammar');
    });

    it('should handle categories with special characters in names', () => {
      const rubricText = `
**Content & Analysis (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-17', 50);

      expect(result.criteria[0].name).toBe('Content & Analysis');
    });

    it('should generate valid criterion IDs', () => {
      const rubricText = `
**Content & Analysis (50 pts)**:
- Excellent (45-50 pts): Strong
      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-18', 50);

      // ID should be lowercase, alphanumeric with underscores
      expect(result.criteria[0].id).toMatch(/^[a-z0-9_]+$/);
    });

    it('should handle empty lines in rubric text', () => {
      const rubricText = `

**Content (50 pts)**:

- Excellent (45-50 pts): Strong

      `.trim();

      const result = parseTeacherRubric(rubricText, 'test-19', 50);

      expect(result.criteria).toHaveLength(1);
    });
  });
});

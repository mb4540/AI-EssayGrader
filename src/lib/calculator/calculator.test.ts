/**
 * Unit tests for BulletProof Grading Calculator (TypeScript)
 * 
 * These tests verify the TypeScript port matches the Python implementation exactly.
 * All test cases are identical to test_calculator.py
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { computeScores, validateRubric } from './calculator';
import type { Rubric, ExtractedScores } from './types';

// Test Fixtures

function createSimpleRubric(
  mode: 'percent' | 'points' = 'percent',
  totalPoints: number | null = null,
  roundingMode: 'HALF_UP' | 'HALF_EVEN' | 'HALF_DOWN' = 'HALF_UP',
  decimals: number = 2
): Rubric {
  return {
    rubric_id: 'test-rubric-1',
    title: 'Test Rubric',
    scale: {
      mode,
      total_points: totalPoints ? new Decimal(totalPoints) : null,
      rounding: { mode: roundingMode, decimals },
    },
    criteria: [
      {
        id: 'org',
        name: 'Organization',
        max_points: new Decimal('4.0'),
        weight: new Decimal('1.0'),
        levels: [
          { label: 'Exemplary', points: new Decimal('4.0'), descriptor: 'Excellent' },
          { label: 'Proficient', points: new Decimal('3.0'), descriptor: 'Good' },
          { label: 'Developing', points: new Decimal('2.0'), descriptor: 'Fair' },
          { label: 'Beginning', points: new Decimal('1.0'), descriptor: 'Poor' },
        ],
      },
      {
        id: 'evidence',
        name: 'Evidence',
        max_points: new Decimal('4.0'),
        weight: new Decimal('1.0'),
        levels: [
          { label: 'Exemplary', points: new Decimal('4.0'), descriptor: 'Excellent' },
          { label: 'Proficient', points: new Decimal('3.0'), descriptor: 'Good' },
        ],
      },
      {
        id: 'grammar',
        name: 'Grammar',
        max_points: new Decimal('4.0'),
        weight: new Decimal('1.0'),
        levels: [
          { label: 'Exemplary', points: new Decimal('4.0'), descriptor: 'Excellent' },
          { label: 'Proficient', points: new Decimal('3.0'), descriptor: 'Good' },
        ],
      },
      {
        id: 'style',
        name: 'Style',
        max_points: new Decimal('4.0'),
        weight: new Decimal('1.0'),
        levels: [
          { label: 'Exemplary', points: new Decimal('4.0'), descriptor: 'Excellent' },
          { label: 'Proficient', points: new Decimal('3.0'), descriptor: 'Good' },
        ],
      },
    ],
    schema_version: 1,
  };
}

function createExtractedScores(
  scoresDict: Record<string, [string, number, string]>
): ExtractedScores {
  return {
    submission_id: 'test-submission-1',
    scores: Object.entries(scoresDict).map(([criterionId, [level, points, rationale]]) => ({
      criterion_id: criterionId,
      level,
      points_awarded: new Decimal(points),
      rationale,
    })),
  };
}

// Tests: Percent Mode

describe('Percent Mode', () => {
  it('should handle full points (100%)', () => {
    const rubric = createSimpleRubric('percent');
    const extracted = createExtractedScores({
      org: ['Exemplary', 4.0, 'Perfect organization'],
      evidence: ['Exemplary', 4.0, 'Strong evidence'],
      grammar: ['Exemplary', 4.0, 'No errors'],
      style: ['Exemplary', 4.0, 'Excellent style'],
    });

    const result = computeScores(rubric, extracted);

    expect(result.raw_points).toBe('16.00');
    expect(result.max_points).toBe('16.00');
    expect(result.percent).toBe('100.00');
    expect(result.final_points).toBeNull();
  });

  it('should handle zero points (0%)', () => {
    const rubric = createSimpleRubric('percent');
    const extracted = createExtractedScores({
      org: ['Beginning', 0.0, 'No organization'],
      evidence: ['Beginning', 0.0, 'No evidence'],
      grammar: ['Beginning', 0.0, 'Many errors'],
      style: ['Beginning', 0.0, 'Poor style'],
    });

    const result = computeScores(rubric, extracted);

    expect(result.raw_points).toBe('0.00');
    expect(result.max_points).toBe('16.00');
    expect(result.percent).toBe('0.00');
    expect(result.final_points).toBeNull();
  });

  it('should handle mixed scores (75%)', () => {
    const rubric = createSimpleRubric('percent');
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good organization'],
      evidence: ['Exemplary', 4.0, 'Strong evidence'],
      grammar: ['Proficient', 3.0, 'Few errors'],
      style: ['Developing', 2.0, 'Needs work'],
    });

    const result = computeScores(rubric, extracted);

    expect(result.raw_points).toBe('12.00');
    expect(result.max_points).toBe('16.00');
    expect(result.percent).toBe('75.00');
    expect(result.final_points).toBeNull();
  });
});

// Tests: Points Mode

describe('Points Mode', () => {
  it('should handle simple scaling (50 total points)', () => {
    const rubric = createSimpleRubric('points', 50);
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good organization'],
      evidence: ['Exemplary', 4.0, 'Strong evidence'],
      grammar: ['Proficient', 3.0, 'Few errors'],
      style: ['Developing', 2.0, 'Needs work'],
    });

    const result = computeScores(rubric, extracted);

    expect(result.raw_points).toBe('12.00');
    expect(result.max_points).toBe('16.00');
    expect(result.percent).toBe('75.00');
    expect(result.final_points).toBe('37.50'); // 12/16 * 50 = 37.5
  });

  it('should handle large total (500 points)', () => {
    const rubric = createSimpleRubric('points', 500);
    const extracted = createExtractedScores({
      org: ['Exemplary', 4.0, 'Perfect'],
      evidence: ['Exemplary', 4.0, 'Perfect'],
      grammar: ['Exemplary', 4.0, 'Perfect'],
      style: ['Exemplary', 4.0, 'Perfect'],
    });

    const result = computeScores(rubric, extracted);

    expect(result.final_points).toBe('500.00');
  });

  it('should handle small total (5 points)', () => {
    const rubric = createSimpleRubric('points', 5);
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Proficient', 3.0, 'Good'],
    });

    const result = computeScores(rubric, extracted);

    // 12/16 * 5 = 3.75
    expect(result.final_points).toBe('3.75');
  });
});

// Tests: Rounding Modes

describe('Rounding Modes', () => {
  it('should round HALF_UP correctly', () => {
    const rubric = createSimpleRubric('points', 50, 'HALF_UP', 1);
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Developing', 2.5, 'Fair'],
      style: ['Developing', 2.5, 'Fair'],
    });

    const result = computeScores(rubric, extracted);

    // 11/16 * 50 = 34.375 → rounds to 34.4 (HALF_UP, 1 decimal)
    expect(result.final_points).toBe('34.4');
  });

  it('should round HALF_EVEN correctly (bankers rounding)', () => {
    const rubric = createSimpleRubric('points', 100, 'HALF_EVEN', 0);
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Developing', 2.0, 'Fair'],
    });

    const result = computeScores(rubric, extracted);

    // 11/16 * 100 = 68.75 → rounds to 69 (HALF_EVEN, 0 decimals)
    expect(result.final_points).toBe('69');
  });
});

// Tests: Weighted Criteria

describe('Weighted Criteria', () => {
  it('should handle weighted criteria correctly', () => {
    const rubric: Rubric = {
      rubric_id: 'weighted-rubric',
      title: 'Weighted Rubric',
      scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
      criteria: [
        {
          id: 'content',
          name: 'Content',
          max_points: new Decimal('10.0'),
          weight: new Decimal('2.0'), // Double weight
          levels: [{ label: 'Good', points: new Decimal('10.0'), descriptor: 'Good' }],
        },
        {
          id: 'grammar',
          name: 'Grammar',
          max_points: new Decimal('10.0'),
          weight: new Decimal('1.0'), // Normal weight
          levels: [{ label: 'Good', points: new Decimal('10.0'), descriptor: 'Good' }],
        },
      ],
      schema_version: 1,
    };

    const extracted = createExtractedScores({
      content: ['Good', 10.0, 'Excellent content'],
      grammar: ['Good', 5.0, 'Some errors'],
    });

    const result = computeScores(rubric, extracted);

    // Max: (10*2) + (10*1) = 30
    // Raw: (10*2) + (5*1) = 25
    // Percent: 25/30 = 83.33%
    expect(result.max_points).toBe('30.00');
    expect(result.raw_points).toBe('25.00');
    expect(result.percent).toBe('83.33');
  });
});

// Tests: Validation

describe('Validation', () => {
  it('should throw error when criterion is missing', () => {
    const rubric = createSimpleRubric();
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      // Missing "style"
    });

    expect(() => computeScores(rubric, extracted)).toThrow('Missing criteria');
  });

  it('should throw error when extra criterion present', () => {
    const rubric = createSimpleRubric();
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Proficient', 3.0, 'Good'],
      extra: ['Proficient', 3.0, 'Extra'], // Not in rubric
    });

    expect(() => computeScores(rubric, extracted)).toThrow('Extra criteria');
  });

  it('should throw error when points exceed max', () => {
    const rubric = createSimpleRubric();
    const extracted = createExtractedScores({
      org: ['Proficient', 5.0, 'Good'], // Max is 4.0
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Proficient', 3.0, 'Good'],
    });

    expect(() => computeScores(rubric, extracted)).toThrow('not in range');
  });

  it('should throw error when points are negative', () => {
    const rubric = createSimpleRubric();
    const extracted = createExtractedScores({
      org: ['Proficient', -1.0, 'Negative'], // Invalid
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Proficient', 3.0, 'Good'],
    });

    expect(() => computeScores(rubric, extracted)).toThrow('not in range');
  });

  it('should throw error when points mode lacks total_points', () => {
    const rubric = createSimpleRubric('points', null); // Missing total_points
    const extracted = createExtractedScores({
      org: ['Proficient', 3.0, 'Good'],
      evidence: ['Proficient', 3.0, 'Good'],
      grammar: ['Proficient', 3.0, 'Good'],
      style: ['Proficient', 3.0, 'Good'],
    });

    expect(() => computeScores(rubric, extracted)).toThrow('total_points required');
  });
});

// Tests: Rubric Validation

describe('Rubric Validation', () => {
  it('should validate valid rubric without error', () => {
    const rubric = createSimpleRubric();
    expect(() => validateRubric(rubric)).not.toThrow();
  });

  it('should throw error when rubric has no criteria', () => {
    const rubric: Rubric = {
      rubric_id: 'empty',
      title: 'Empty',
      scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
      criteria: [],
      schema_version: 1,
    };

    expect(() => validateRubric(rubric)).toThrow('at least one criterion');
  });

  it('should throw error when level points exceed criterion max', () => {
    const rubric: Rubric = {
      rubric_id: 'invalid',
      title: 'Invalid',
      scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
      criteria: [
        {
          id: 'test',
          name: 'Test',
          max_points: new Decimal('4.0'),
          weight: new Decimal('1.0'),
          levels: [{ label: 'Too High', points: new Decimal('5.0'), descriptor: 'Invalid' }],
        },
      ],
      schema_version: 1,
    };

    expect(() => validateRubric(rubric)).toThrow('exceeding max');
  });
});

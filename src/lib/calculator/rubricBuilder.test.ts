// Rubric Builder Tests
// Tests for creating default rubrics and validating rubric structure

import { describe, it, expect } from 'vitest';
import { createDefaultRubric, isValidRubric } from './rubricBuilder';
import type { RubricJSON } from './types';

describe('Rubric Builder', () => {
  describe('createDefaultRubric', () => {
    it('should create default rubric with detected organization category', () => {
      const criteria = 'Essay should have clear organization and structure';
      const result = createDefaultRubric('test-1', criteria);

      expect(result.rubric_id).toBe('default-test-1');
      expect(result.title).toBe('Default Rubric');
      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Organization');
      expect(result.criteria[0].id).toBe('organization');
    });

    it('should create default rubric with detected evidence category', () => {
      const criteria = 'Must include strong evidence and examples to support claims';
      const result = createDefaultRubric('test-2', criteria);

      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Evidence & Support');
      expect(result.criteria[0].id).toBe('evidence');
    });

    it('should create default rubric with detected grammar category', () => {
      const criteria = 'Check grammar and mechanics carefully';
      const result = createDefaultRubric('test-3', criteria);

      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Grammar & Mechanics');
      expect(result.criteria[0].id).toBe('grammar');
    });

    it('should create default rubric with detected style category', () => {
      const criteria = 'Use appropriate style and voice for academic writing';
      const result = createDefaultRubric('test-4', criteria);

      expect(result.criteria).toHaveLength(1);
      expect(result.criteria[0].name).toBe('Style & Voice');
      expect(result.criteria[0].id).toBe('style');
    });

    it('should detect multiple categories', () => {
      const criteria = 'Essay must have good organization, strong evidence, proper grammar, and appropriate style';
      const result = createDefaultRubric('test-5', criteria);

      expect(result.criteria).toHaveLength(4);
      expect(result.criteria.map(c => c.id)).toEqual(['organization', 'evidence', 'grammar', 'style']);
    });

    it('should use default categories when none detected', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-6', criteria);

      expect(result.criteria).toHaveLength(4);
      expect(result.criteria.map(c => c.id)).toEqual(['content', 'organization', 'evidence', 'conventions']);
    });

    it('should create 5 levels for each criterion', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-7', criteria);

      result.criteria.forEach(criterion => {
        expect(criterion.levels).toHaveLength(5);
      });
    });

    it('should have correct level labels', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-8', criteria);

      const levels = result.criteria[0].levels;
      expect(levels[0].label).toBe('Exemplary');
      expect(levels[1].label).toBe('Proficient');
      expect(levels[2].label).toBe('Developing');
      expect(levels[3].label).toBe('Beginning');
      expect(levels[4].label).toBe('No Evidence');
    });

    it('should have correct point values for levels', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-9', criteria);

      const levels = result.criteria[0].levels;
      expect(levels[0].points).toBe('25.0');
      expect(levels[1].points).toBe('20.0');
      expect(levels[2].points).toBe('15.0');
      expect(levels[3].points).toBe('10.0');
      expect(levels[4].points).toBe('0.0');
    });

    it('should set max_points to 25 for each criterion', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-10', criteria);

      result.criteria.forEach(criterion => {
        expect(criterion.max_points).toBe('25.0');
      });
    });

    it('should set weight to 1.0 for each criterion', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-11', criteria);

      result.criteria.forEach(criterion => {
        expect(criterion.weight).toBe('1.0');
      });
    });

    it('should set scale mode to percent', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-12', criteria);

      expect(result.scale.mode).toBe('percent');
      expect(result.scale.total_points).toBeNull();
    });

    it('should set rounding to HALF_UP with 2 decimals', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-13', criteria);

      expect(result.scale.rounding.mode).toBe('HALF_UP');
      expect(result.scale.rounding.decimals).toBe(2);
    });

    it('should set schema_version to 1', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-14', criteria);

      expect(result.schema_version).toBe(1);
    });

    it('should handle empty criteria text', () => {
      const result = createDefaultRubric('test-15', '');

      // Should use default categories
      expect(result.criteria).toHaveLength(4);
    });

    it('should be case-insensitive for keyword detection', () => {
      const criteria = 'ORGANIZATION and EVIDENCE and GRAMMAR and STYLE';
      const result = createDefaultRubric('test-16', criteria);

      expect(result.criteria).toHaveLength(4);
    });

    it('should detect "structure" as organization', () => {
      const criteria = 'Essay needs good structure';
      const result = createDefaultRubric('test-17', criteria);

      expect(result.criteria[0].name).toBe('Organization');
    });

    it('should detect "support" as evidence', () => {
      const criteria = 'Provide support for your arguments';
      const result = createDefaultRubric('test-18', criteria);

      expect(result.criteria[0].name).toBe('Evidence & Support');
    });

    it('should detect "mechanics" as grammar', () => {
      const criteria = 'Check your mechanics';
      const result = createDefaultRubric('test-19', criteria);

      expect(result.criteria[0].name).toBe('Grammar & Mechanics');
    });

    it('should detect "voice" as style', () => {
      const criteria = 'Use appropriate voice';
      const result = createDefaultRubric('test-20', criteria);

      expect(result.criteria[0].name).toBe('Style & Voice');
    });

    it('should have descriptors for each level', () => {
      const criteria = 'Write a good essay';
      const result = createDefaultRubric('test-21', criteria);

      result.criteria[0].levels.forEach(level => {
        expect(level.descriptor).toBeDefined();
        expect(level.descriptor.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isValidRubric', () => {
    it('should validate a complete valid rubric', () => {
      const rubric: RubricJSON = {
        rubric_id: 'test-1',
        title: 'Test Rubric',
        criteria: [
          {
            id: 'content',
            name: 'Content',
            max_points: '25.0',
            weight: '1.0',
            levels: [
              { label: 'Excellent', points: '25.0', descriptor: 'Great' },
            ],
          },
        ],
        scale: {
          mode: 'percent',
          total_points: null,
          rounding: { mode: 'HALF_UP', decimals: 2 },
        },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidRubric(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidRubric(undefined)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(isValidRubric('not an object')).toBe(false);
      expect(isValidRubric(123)).toBe(false);
      expect(isValidRubric(true)).toBe(false);
    });

    it('should reject rubric without rubric_id', () => {
      const rubric = {
        title: 'Test',
        criteria: [{ id: 'test', name: 'Test', max_points: '25', weight: '1', levels: [] }],
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric without title', () => {
      const rubric = {
        rubric_id: 'test-1',
        criteria: [{ id: 'test', name: 'Test', max_points: '25', weight: '1', levels: [] }],
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric without criteria', () => {
      const rubric = {
        rubric_id: 'test-1',
        title: 'Test',
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric with non-array criteria', () => {
      const rubric = {
        rubric_id: 'test-1',
        title: 'Test',
        criteria: 'not an array',
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric with empty criteria array', () => {
      const rubric = {
        rubric_id: 'test-1',
        title: 'Test',
        criteria: [],
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric without scale', () => {
      const rubric = {
        rubric_id: 'test-1',
        title: 'Test',
        criteria: [{ id: 'test', name: 'Test', max_points: '25', weight: '1', levels: [] }],
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should reject rubric without schema_version', () => {
      const rubric = {
        rubric_id: 'test-1',
        title: 'Test',
        criteria: [{ id: 'test', name: 'Test', max_points: '25', weight: '1', levels: [] }],
        scale: { mode: 'percent', total_points: null, rounding: { mode: 'HALF_UP', decimals: 2 } },
      };

      expect(isValidRubric(rubric)).toBe(false);
    });

    it('should accept rubric with multiple criteria', () => {
      const rubric: RubricJSON = {
        rubric_id: 'test-1',
        title: 'Test Rubric',
        criteria: [
          {
            id: 'content',
            name: 'Content',
            max_points: '25.0',
            weight: '1.0',
            levels: [{ label: 'Good', points: '25.0', descriptor: 'Great' }],
          },
          {
            id: 'organization',
            name: 'Organization',
            max_points: '25.0',
            weight: '1.0',
            levels: [{ label: 'Good', points: '25.0', descriptor: 'Great' }],
          },
        ],
        scale: {
          mode: 'percent',
          total_points: null,
          rounding: { mode: 'HALF_UP', decimals: 2 },
        },
        schema_version: 1,
      };

      expect(isValidRubric(rubric)).toBe(true);
    });
  });

  describe('Integration - createDefaultRubric produces valid rubrics', () => {
    it('should create valid rubric that passes validation', () => {
      const criteria = 'Write a good essay with organization and evidence';
      const rubric = createDefaultRubric('test-integration', criteria);

      expect(isValidRubric(rubric)).toBe(true);
    });

    it('should create valid rubric even with empty criteria', () => {
      const rubric = createDefaultRubric('test-empty', '');

      expect(isValidRubric(rubric)).toBe(true);
    });

    it('should create valid rubric with all categories detected', () => {
      const criteria = 'Essay needs organization, evidence, grammar, and style';
      const rubric = createDefaultRubric('test-all', criteria);

      expect(isValidRubric(rubric)).toBe(true);
      expect(rubric.criteria).toHaveLength(4);
    });
  });
});

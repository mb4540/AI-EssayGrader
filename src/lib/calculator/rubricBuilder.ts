/**
 * Rubric Builder - Create default rubrics from teacher criteria
 * 
 * Provides backward compatibility for assignments without structured rubrics.
 * Creates a simple 4-level rubric based on teacher's text criteria.
 */

import type { RubricJSON } from './types';

/**
 * Create a default 4-level rubric from teacher criteria text
 * 
 * This is used for backward compatibility when assignments don't have
 * a structured rubric yet. It creates a simple rubric with common categories.
 */
export function createDefaultRubric(
  assignmentId: string,
  teacherCriteria: string
): RubricJSON {
  // Parse teacher criteria to identify categories
  // Look for common keywords to determine categories
  const criteriaLower = teacherCriteria.toLowerCase();
  
  const categories: Array<{
    id: string;
    name: string;
    weight: string;
  }> = [];

  // Common categories to look for
  if (criteriaLower.includes('organization') || criteriaLower.includes('structure')) {
    categories.push({ id: 'organization', name: 'Organization', weight: '1.0' });
  }
  
  if (criteriaLower.includes('evidence') || criteriaLower.includes('support') || criteriaLower.includes('example')) {
    categories.push({ id: 'evidence', name: 'Evidence & Support', weight: '1.0' });
  }
  
  if (criteriaLower.includes('grammar') || criteriaLower.includes('mechanics') || criteriaLower.includes('convention')) {
    categories.push({ id: 'grammar', name: 'Grammar & Mechanics', weight: '1.0' });
  }
  
  if (criteriaLower.includes('style') || criteriaLower.includes('voice') || criteriaLower.includes('word choice')) {
    categories.push({ id: 'style', name: 'Style & Voice', weight: '1.0' });
  }

  // If no categories detected, use default set
  if (categories.length === 0) {
    categories.push(
      { id: 'content', name: 'Content & Ideas', weight: '1.0' },
      { id: 'organization', name: 'Organization', weight: '1.0' },
      { id: 'evidence', name: 'Evidence & Support', weight: '1.0' },
      { id: 'conventions', name: 'Conventions', weight: '1.0' }
    );
  }

  // Create 4-level rubric for each category
  const criteria = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    max_points: '25.0', // 25 points per category (100 total for 4 categories)
    weight: cat.weight,
    levels: [
      {
        label: 'Exemplary',
        points: '25.0',
        descriptor: 'Exceeds expectations with exceptional quality',
      },
      {
        label: 'Proficient',
        points: '20.0',
        descriptor: 'Meets expectations with good quality',
      },
      {
        label: 'Developing',
        points: '15.0',
        descriptor: 'Approaching expectations, needs improvement',
      },
      {
        label: 'Beginning',
        points: '10.0',
        descriptor: 'Below expectations, significant improvement needed',
      },
      {
        label: 'No Evidence',
        points: '0.0',
        descriptor: 'Not present or not attempted',
      },
    ],
  }));

  return {
    rubric_id: `default-${assignmentId}`,
    title: 'Default Rubric',
    criteria,
    scale: {
      mode: 'percent',
      total_points: null,
      rounding: {
        mode: 'HALF_UP',
        decimals: 2,
      },
    },
    schema_version: 1,
  };
}

/**
 * Validate that a rubric has all required fields
 */
export function isValidRubric(rubric: unknown): rubric is RubricJSON {
  if (!rubric || typeof rubric !== 'object') return false;
  
  const r = rubric as Partial<RubricJSON>;
  
  return !!(
    r.rubric_id &&
    r.title &&
    r.criteria &&
    Array.isArray(r.criteria) &&
    r.criteria.length > 0 &&
    r.scale &&
    r.schema_version
  );
}

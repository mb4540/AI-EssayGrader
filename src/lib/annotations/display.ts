/**
 * Annotation display utilities
 * 
 * Helper functions for displaying annotations with proper criterion names
 */

import type { Annotation } from './types';
import type { RubricJSON } from '../calculator/types';

/**
 * Get display label for an annotation
 * 
 * Phase 0: Annotations now use rubric criterion IDs as categories.
 * This function looks up the display name from the rubric.
 * 
 * @param annotation - The annotation to get the label for
 * @param rubric - The rubric to look up criterion names from
 * @returns The display name (e.g., "AUTHOR'S CRAFT") or the category ID as fallback
 */
export function getAnnotationDisplayLabel(
  annotation: Annotation,
  rubric?: RubricJSON | null
): string {
  if (!rubric) {
    return annotation.category;
  }

  // Try to find the criterion by criterion_id first, then by category
  const criterionId = annotation.criterion_id || annotation.category;
  const criterion = rubric.criteria?.find((c) => c.id === criterionId);

  // Return the criterion display name, or fall back to the category
  return criterion?.name || annotation.category;
}

/**
 * Get display label for a category string
 * 
 * @param category - The category/criterion ID
 * @param rubric - The rubric to look up criterion names from
 * @returns The display name or the category as fallback
 */
export function getCategoryDisplayLabel(
  category: string,
  rubric?: RubricJSON | null
): string {
  if (!rubric) {
    return category;
  }

  const criterion = rubric.criteria?.find((c) => c.id === category);
  return criterion?.name || category;
}

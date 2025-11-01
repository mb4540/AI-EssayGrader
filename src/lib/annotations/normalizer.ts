/**
 * Annotation normalization service
 * 
 * Validates and normalizes LLM-generated annotations:
 * - Finds text locations and calculates offsets
 * - Validates line numbers and quotes
 * - Handles fuzzy matching for near-misses
 * - Flags unresolved annotations for manual placement
 */

import { findTextLocation, validateAnnotationLocation } from './lineNumbers';
import type { RawAnnotation, Annotation, AnnotationCategory, AnnotationSeverity } from './types';

export interface NormalizationResult {
  normalized: Annotation[];
  unresolved: Array<RawAnnotation & { reason: string }>;
  stats: {
    total: number;
    resolved: number;
    unresolved: number;
  };
}

/**
 * Normalize raw annotations from LLM
 */
export function normalizeAnnotations(
  rawAnnotations: RawAnnotation[],
  originalText: string,
  submissionId: string
): NormalizationResult {
  const normalized: Annotation[] = [];
  const unresolved: Array<RawAnnotation & { reason: string }> = [];

  for (const raw of rawAnnotations) {
    try {
      // Validate category
      const category = validateCategory(raw.category);
      if (!category) {
        unresolved.push({
          ...raw,
          reason: `Invalid category: ${raw.category}`,
        });
        continue;
      }

      // Validate severity
      const severity = validateSeverity(raw.severity);

      // Find text location
      const location = findTextLocation(originalText, raw.quote, raw.line);

      if (!location.found) {
        unresolved.push({
          ...raw,
          reason: `Could not locate quote "${raw.quote}" near line ${raw.line}`,
        });
        continue;
      }

      // Validate location
      const validation = validateAnnotationLocation(
        originalText,
        location.line!,
        location.startOffset!,
        location.endOffset!
      );

      if (!validation.valid) {
        unresolved.push({
          ...raw,
          reason: validation.error || 'Invalid location',
        });
        continue;
      }

      // Create normalized annotation
      normalized.push({
        submission_id: submissionId,
        line_number: location.line!,
        start_offset: location.startOffset!,
        end_offset: location.endOffset!,
        quote: raw.quote,
        category,
        suggestion: raw.suggestion,
        severity,
        status: 'ai_suggested',
        ai_payload: raw,
      });
    } catch (error) {
      unresolved.push({
        ...raw,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    normalized,
    unresolved,
    stats: {
      total: rawAnnotations.length,
      resolved: normalized.length,
      unresolved: unresolved.length,
    },
  };
}

/**
 * Validate and normalize category
 */
function validateCategory(category: string): AnnotationCategory | null {
  const validCategories: AnnotationCategory[] = [
    'Spelling',
    'Grammar',
    'Punctuation',
    'Organization',
    'Clarity',
    'Evidence',
    'Style',
    'Other',
  ];

  // Try exact match
  if (validCategories.includes(category as AnnotationCategory)) {
    return category as AnnotationCategory;
  }

  // Try case-insensitive match
  const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (validCategories.includes(normalized as AnnotationCategory)) {
    return normalized as AnnotationCategory;
  }

  return null;
}

/**
 * Validate and normalize severity
 */
function validateSeverity(severity?: string): AnnotationSeverity | undefined {
  if (!severity) return undefined;

  const validSeverities: AnnotationSeverity[] = ['info', 'warning', 'error'];
  const lower = severity.toLowerCase();

  if (validSeverities.includes(lower as AnnotationSeverity)) {
    return lower as AnnotationSeverity;
  }

  // Default to warning if invalid
  return 'warning';
}

/**
 * Create unmatched annotation for bottom placement
 * Used when LLM provides feedback but we can't locate the text
 */
export function createUnmatchedAnnotation(
  raw: RawAnnotation,
  submissionId: string,
  reason: string
): Annotation {
  return {
    submission_id: submissionId,
    line_number: -1, // Special marker for unmatched
    start_offset: -1,
    end_offset: -1,
    quote: raw.quote,
    category: validateCategory(raw.category) || 'Other',
    suggestion: `[Unmatched: ${reason}] ${raw.suggestion}`,
    severity: raw.severity as AnnotationSeverity,
    status: 'ai_suggested',
    ai_payload: raw,
  };
}

/**
 * Converters between JSON-serializable and Decimal types
 * 
 * These functions handle conversion between string representations (for JSON/database)
 * and Decimal objects (for calculations).
 */

import Decimal from 'decimal.js';
import type { Rubric, ExtractedScores, RubricJSON, ExtractedScoresJSON } from './types';

/**
 * Convert RubricJSON (strings) to Rubric (Decimals)
 */
export function rubricFromJSON(json: RubricJSON): Rubric {
  return {
    rubric_id: json.rubric_id,
    title: json.title,
    schema_version: json.schema_version,
    scale: {
      mode: json.scale.mode,
      total_points: json.scale.total_points ? new Decimal(json.scale.total_points) : null,
      rounding: json.scale.rounding,
    },
    criteria: json.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      max_points: new Decimal(c.max_points),
      weight: new Decimal(c.weight),
      levels: c.levels.map((l) => ({
        label: l.label,
        points: new Decimal(l.points),
        descriptor: l.descriptor,
      })),
    })),
  };
}

/**
 * Convert Rubric (Decimals) to RubricJSON (strings)
 */
export function rubricToJSON(rubric: Rubric): RubricJSON {
  return {
    rubric_id: rubric.rubric_id,
    title: rubric.title,
    schema_version: rubric.schema_version,
    scale: {
      mode: rubric.scale.mode,
      total_points: rubric.scale.total_points ? rubric.scale.total_points.toString() : null,
      rounding: rubric.scale.rounding,
    },
    criteria: rubric.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      max_points: c.max_points.toString(),
      weight: c.weight.toString(),
      levels: c.levels.map((l) => ({
        label: l.label,
        points: l.points.toString(),
        descriptor: l.descriptor,
      })),
    })),
  };
}

/**
 * Convert ExtractedScoresJSON (strings) to ExtractedScores (Decimals)
 */
export function extractedScoresFromJSON(json: ExtractedScoresJSON): ExtractedScores {
  return {
    submission_id: json.submission_id,
    notes: json.notes,
    scores: json.scores.map((s) => ({
      criterion_id: s.criterion_id,
      level: s.level,
      points_awarded: new Decimal(s.points_awarded),
      rationale: s.rationale,
    })),
  };
}

/**
 * Convert ExtractedScores (Decimals) to ExtractedScoresJSON (strings)
 */
export function extractedScoresToJSON(extracted: ExtractedScores): ExtractedScoresJSON {
  return {
    submission_id: extracted.submission_id,
    notes: extracted.notes,
    scores: extracted.scores.map((s) => ({
      criterion_id: s.criterion_id,
      level: s.level,
      points_awarded: s.points_awarded.toString(),
      rationale: s.rationale,
    })),
  };
}

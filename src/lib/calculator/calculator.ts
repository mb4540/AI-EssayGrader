/**
 * BulletProof Grading Calculator (TypeScript Port)
 * 
 * Deterministic, Decimal-based score calculator that eliminates float arithmetic errors.
 * LLM provides per-criterion scores; this calculator handles ALL math.
 * 
 * Core Philosophy: "LLM for language, tools for math."
 * 
 * Ported from Python version with identical logic and test coverage.
 */

import Decimal from 'decimal.js';
import type { Rubric, ExtractedScores, ComputedScores, Rounding } from './types';

// Configure Decimal.js for precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Rounding mode mappings
const ROUNDING_MODES = {
  HALF_UP: Decimal.ROUND_HALF_UP,
  HALF_EVEN: Decimal.ROUND_HALF_EVEN,
  HALF_DOWN: Decimal.ROUND_HALF_DOWN,
} as const;

/**
 * Calculate maximum possible weighted points from rubric
 */
function sumMaxPoints(rubric: Rubric): Decimal {
  let total = new Decimal(0);
  for (const criterion of rubric.criteria) {
    total = total.plus(criterion.max_points.times(criterion.weight));
  }
  return total;
}

/**
 * Calculate total weighted points awarded
 * 
 * Validates that:
 * - All criteria are present
 * - Points are within valid range [0, max_points]
 * - No duplicate criteria
 */
function sumAwardedPoints(rubric: Rubric, extracted: ExtractedScores): Decimal {
  // Create lookup of awarded points by criterion_id
  const pointsById = new Map<string, Decimal>();
  for (const score of extracted.scores) {
    pointsById.set(score.criterion_id, score.points_awarded);
  }

  // Validate all criteria present
  const rubricCriterionIds = new Set(rubric.criteria.map((c) => c.id));
  const awardedCriterionIds = new Set(pointsById.keys());

  const missing = [...rubricCriterionIds].filter((id) => !awardedCriterionIds.has(id));
  const extra = [...awardedCriterionIds].filter((id) => !rubricCriterionIds.has(id));

  if (missing.length > 0 || extra.length > 0) {
    const errorParts: string[] = [];
    if (missing.length > 0) {
      errorParts.push(`Missing criteria: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      errorParts.push(`Extra criteria: ${extra.join(', ')}`);
    }
    throw new Error(`Criterion mismatch. ${errorParts.join(', ')}`);
  }

  // Calculate weighted total with range validation
  let total = new Decimal(0);
  for (const criterion of rubric.criteria) {
    const awarded = pointsById.get(criterion.id)!;

    // Validate range
    if (awarded.lessThan(0) || awarded.greaterThan(criterion.max_points)) {
      throw new Error(
        `Invalid points for '${criterion.id}': ${awarded.toString()} ` +
          `not in range [0, ${criterion.max_points.toString()}]`
      );
    }

    total = total.plus(awarded.times(criterion.weight));
  }

  return total;
}

/**
 * Round Decimal value using specified rounding mode and precision
 */
function roundDecimal(value: Decimal, rounding: Rounding): Decimal {
  const mode = ROUNDING_MODES[rounding.mode];
  return value.toDecimalPlaces(rounding.decimals, mode);
}

/**
 * Compute final scores deterministically using Decimal math
 * 
 * @param rubric - Grading rubric with criteria and scale configuration
 * @param extracted - LLM-extracted per-criterion scores
 * @returns Computed scores as strings for JSON serialization
 * @throws Error if validation fails or points are out of range
 */
export function computeScores(rubric: Rubric, extracted: ExtractedScores): ComputedScores {
  // Calculate raw weighted totals
  const maxWeighted = sumMaxPoints(rubric);
  const rawWeighted = sumAwardedPoints(rubric, extracted);

  // Calculate percentage
  if (maxWeighted.equals(0)) {
    throw new Error('Maximum points cannot be zero');
  }

  const percent = rawWeighted.dividedBy(maxWeighted).times(100);

  // Round values
  const rounding = rubric.scale.rounding;
  const rawRounded = roundDecimal(rawWeighted, rounding);
  const maxRounded = roundDecimal(maxWeighted, rounding);
  const percentRounded = roundDecimal(percent, rounding);

  // Return based on scale mode
  if (rubric.scale.mode === 'percent') {
    return {
      raw_points: rawRounded.toString(),
      max_points: maxRounded.toString(),
      percent: percentRounded.toString(),
      final_points: null,
    };
  }

  // Points mode - scale to total_points
  if (!rubric.scale.total_points) {
    throw new Error("scale.total_points required when mode='points'");
  }

  // Scale: final = (raw / max) * total_points
  const scaled = rawWeighted.dividedBy(maxWeighted).times(rubric.scale.total_points);
  const finalRounded = roundDecimal(scaled, rounding);

  return {
    raw_points: rawRounded.toString(),
    max_points: maxRounded.toString(),
    percent: percentRounded.toString(),
    final_points: finalRounded.toString(),
  };
}

/**
 * Validate rubric structure and values
 * 
 * @throws Error if rubric is invalid
 */
export function validateRubric(rubric: Rubric): void {
  // Validate at least one criterion
  if (rubric.criteria.length === 0) {
    throw new Error('Rubric must have at least one criterion');
  }

  // Validate each criterion has at least one level
  for (const criterion of rubric.criteria) {
    if (criterion.levels.length === 0) {
      throw new Error(`Criterion '${criterion.id}' must have at least one level`);
    }

    // Validate level points don't exceed max_points
    for (const level of criterion.levels) {
      if (level.points.greaterThan(criterion.max_points)) {
        throw new Error(
          `Level '${level.label}' in criterion '${criterion.id}' ` +
            `has points (${level.points.toString()}) exceeding max (${criterion.max_points.toString()})`
        );
      }
    }
  }

  // Validate points mode has total_points
  if (rubric.scale.mode === 'points' && !rubric.scale.total_points) {
    throw new Error('Points mode requires scale.total_points to be set');
  }

  // Validate total_points is positive if set
  if (rubric.scale.total_points && rubric.scale.total_points.lessThanOrEqualTo(0)) {
    throw new Error('scale.total_points must be greater than zero');
  }
}

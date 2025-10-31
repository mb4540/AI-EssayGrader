/**
 * TypeScript types for BulletProof Grading Calculator
 * 
 * Port of Python Pydantic models to TypeScript
 * All point values use Decimal to eliminate float arithmetic errors
 */

import Decimal from 'decimal.js';

export type RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'HALF_DOWN';
export type ScaleMode = 'percent' | 'points';

export interface Rounding {
  mode: RoundingMode;
  decimals: number; // 0-4
}

export interface Scale {
  mode: ScaleMode;
  total_points?: Decimal | null;
  rounding: Rounding;
}

export interface Level {
  label: string;
  points: Decimal;
  descriptor: string;
}

export interface Criterion {
  id: string;
  name: string;
  max_points: Decimal;
  weight: Decimal;
  levels: Level[];
}

export interface Rubric {
  rubric_id: string;
  title: string;
  criteria: Criterion[];
  scale: Scale;
  schema_version: number;
}

export interface Award {
  criterion_id: string;
  level: string;
  points_awarded: Decimal;
  rationale: string;
}

export interface ExtractedScores {
  submission_id: string;
  scores: Award[];
  notes?: string | null;
}

export interface ComputedScores {
  raw_points: string;
  max_points: string;
  percent: string;
  final_points: string | null;
}

// JSON-serializable versions (for API/database)
export interface RubricJSON {
  rubric_id: string;
  title: string;
  criteria: {
    id: string;
    name: string;
    max_points: string; // Decimal as string
    weight: string;
    levels: {
      label: string;
      points: string;
      descriptor: string;
    }[];
  }[];
  scale: {
    mode: ScaleMode;
    total_points?: string | null;
    rounding: Rounding;
  };
  schema_version: number;
}

export interface ExtractedScoresJSON {
  submission_id: string;
  scores: {
    criterion_id: string;
    level: string;
    points_awarded: string;
    rationale: string;
  }[];
  notes?: string | null;
}

-- Migration: Add BulletProof Grading Schema
-- Created: October 31, 2025
-- Purpose: Add columns for deterministic Decimal-based grading calculator
--
-- This migration adds support for:
-- - Rubric JSON storage (structured grading criteria)
-- - Scale mode (percent vs points)
-- - Total points for points mode
-- - Rounding configuration
-- - Computed scores storage
-- - Calculator version tracking for audit trail
--
-- Related: BulletProofing.md, MasterToDo.md Item #2

BEGIN;

-- Add rubric and scale configuration to assignments table
ALTER TABLE grader.assignments
ADD COLUMN rubric_json jsonb,
ADD COLUMN scale_mode text CHECK (scale_mode IN ('percent', 'points')) DEFAULT 'percent',
ADD COLUMN total_points numeric(10,4),
ADD COLUMN rounding_mode text DEFAULT 'HALF_UP',
ADD COLUMN rounding_decimals integer DEFAULT 2;

-- Add comments for documentation
COMMENT ON COLUMN grader.assignments.rubric_json IS 'Structured rubric with criteria, levels, and weights (JSON)';
COMMENT ON COLUMN grader.assignments.scale_mode IS 'Grading scale mode: percent (0-100) or points (custom total)';
COMMENT ON COLUMN grader.assignments.total_points IS 'Total points for assignment (used when scale_mode=points)';
COMMENT ON COLUMN grader.assignments.rounding_mode IS 'Rounding mode for calculator: HALF_UP, HALF_EVEN, or HALF_DOWN';
COMMENT ON COLUMN grader.assignments.rounding_decimals IS 'Number of decimal places for rounding (0-4)';

-- Add computed scores and audit trail to submissions table
ALTER TABLE grader.submissions
ADD COLUMN extracted_scores jsonb,
ADD COLUMN computed_scores jsonb,
ADD COLUMN calculator_version text;

-- Add comments for documentation
COMMENT ON COLUMN grader.submissions.extracted_scores IS 'LLM-extracted per-criterion scores and rationales (JSON)';
COMMENT ON COLUMN grader.submissions.computed_scores IS 'Deterministically computed final scores from Python calculator (JSON)';
COMMENT ON COLUMN grader.submissions.calculator_version IS 'Version/hash of calculator used for audit trail';

-- Add indexes for common queries
CREATE INDEX idx_assignments_scale_mode ON grader.assignments(scale_mode);
CREATE INDEX idx_submissions_calculator_version ON grader.submissions(calculator_version);

-- Add constraint to ensure total_points is set when scale_mode is 'points'
ALTER TABLE grader.assignments
ADD CONSTRAINT chk_total_points_required 
CHECK (
  (scale_mode = 'percent') OR 
  (scale_mode = 'points' AND total_points IS NOT NULL AND total_points > 0)
);

-- Add constraint to ensure rounding_decimals is in valid range
ALTER TABLE grader.assignments
ADD CONSTRAINT chk_rounding_decimals_range
CHECK (rounding_decimals >= 0 AND rounding_decimals <= 4);

-- Add constraint to ensure rounding_mode is valid
ALTER TABLE grader.assignments
ADD CONSTRAINT chk_rounding_mode_valid
CHECK (rounding_mode IN ('HALF_UP', 'HALF_EVEN', 'HALF_DOWN'));

COMMIT;

-- Verification queries (run after migration)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'grader' AND table_name = 'assignments'
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'grader' AND table_name = 'submissions'
-- ORDER BY ordinal_position;

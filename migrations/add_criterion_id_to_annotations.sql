-- Migration: Add criterion_id to annotations table
-- Date: 2025-11-16
-- Purpose: Link annotations to specific rubric criteria for better organization

-- Add criterion_id column to annotations table
ALTER TABLE grader.annotations
ADD COLUMN criterion_id TEXT;

-- Add index for faster queries by criterion
CREATE INDEX idx_annotations_criterion
ON grader.annotations(criterion_id)
WHERE criterion_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN grader.annotations.criterion_id IS 'Links annotation to a specific rubric criterion (e.g., ideas_development, focus_organization)';

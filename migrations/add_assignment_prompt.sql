-- Migration: Add assignment_prompt to assignments and submissions
-- Created: November 30, 2025
-- Purpose: Store student-facing assignment instructions for better grading context
-- Phase: Phase 1 - Assignment Prompt (Database & Backend)

-- Add to assignments table
ALTER TABLE grader.assignments 
ADD COLUMN IF NOT EXISTS assignment_prompt text;

COMMENT ON COLUMN grader.assignments.assignment_prompt 
IS 'Student-facing instructions and requirements for the assignment (e.g., "Write a 5-paragraph essay arguing for or against school uniforms")';

-- Add to submissions table (for ad-hoc grading)
ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS assignment_prompt text;

COMMENT ON COLUMN grader.submissions.assignment_prompt 
IS 'Assignment instructions used for this submission (from assignment or entered during grading)';

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'assignments'
  AND column_name = 'assignment_prompt';

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
  AND column_name = 'assignment_prompt';

-- Migration: Add draft comparison support
-- Run this after the initial schema.sql

-- Add columns to submissions table for draft comparison
ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS draft_mode text DEFAULT 'single' CHECK (draft_mode IN ('single', 'comparison'));

ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS rough_draft_text text;

ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS final_draft_text text;

-- Make verbatim_text nullable to support comparison mode
ALTER TABLE grader.submissions 
ALTER COLUMN verbatim_text DROP NOT NULL;

-- For comparison mode:
-- - verbatim_text will be NULL
-- - rough_draft_text and final_draft_text will contain the two versions
-- For single mode:
-- - verbatim_text will contain the essay text
-- - rough_draft_text and final_draft_text will be NULL

-- Add index for draft mode queries
CREATE INDEX IF NOT EXISTS idx_submissions_draft_mode ON grader.submissions(draft_mode);

-- Update submission_versions to track draft comparison data
ALTER TABLE grader.submission_versions
ADD COLUMN IF NOT EXISTS draft_mode text;

ALTER TABLE grader.submission_versions
ADD COLUMN IF NOT EXISTS rough_draft_text text;

ALTER TABLE grader.submission_versions
ADD COLUMN IF NOT EXISTS final_draft_text text;

COMMENT ON COLUMN grader.submissions.draft_mode IS 'single: one essay to grade, comparison: compare rough vs final draft';
COMMENT ON COLUMN grader.submissions.rough_draft_text IS 'Used in comparison mode - the rough/first draft';
COMMENT ON COLUMN grader.submissions.final_draft_text IS 'Used in comparison mode - the final/revised draft';

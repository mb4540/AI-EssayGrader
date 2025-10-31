-- Add missing columns to submission_versions table
ALTER TABLE grader.submission_versions
  ADD COLUMN IF NOT EXISTS draft_mode text;

ALTER TABLE grader.submission_versions
  ADD COLUMN IF NOT EXISTS rough_draft_text text;

ALTER TABLE grader.submission_versions
  ADD COLUMN IF NOT EXISTS final_draft_text text;

-- Verify columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submission_versions'
ORDER BY ordinal_position;

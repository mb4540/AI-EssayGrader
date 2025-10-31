-- ============================================================================
-- Add Missing Columns to Submissions Table
-- ============================================================================
-- Add draft_mode, rough_draft_text, final_draft_text, image_url, original_file_url
-- ============================================================================

BEGIN;

-- Add draft_mode column (single or comparison)
ALTER TABLE grader.submissions 
  ADD COLUMN IF NOT EXISTS draft_mode text DEFAULT 'single';

-- Add rough_draft_text column
ALTER TABLE grader.submissions 
  ADD COLUMN IF NOT EXISTS rough_draft_text text;

-- Add final_draft_text column
ALTER TABLE grader.submissions 
  ADD COLUMN IF NOT EXISTS final_draft_text text;

-- Add image_url column (for image submissions)
ALTER TABLE grader.submissions 
  ADD COLUMN IF NOT EXISTS image_url text;

-- Add original_file_url column (for file submissions)
ALTER TABLE grader.submissions 
  ADD COLUMN IF NOT EXISTS original_file_url text;

COMMIT;

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;

-- Migration: Update source_type CHECK constraint to include PDF and DOC formats
-- Date: 2025-10-12
-- Run this after adding PDF/DOCX document upload support

-- Drop the old constraint that only allowed ('text','docx','image')
ALTER TABLE grader.submissions 
DROP CONSTRAINT IF EXISTS submissions_source_type_check;

-- Add the new constraint with all supported types including PDF and DOC
ALTER TABLE grader.submissions 
ADD CONSTRAINT submissions_source_type_check 
CHECK (source_type IN ('text', 'docx', 'pdf', 'doc', 'image'));

-- Verification query (optional - run to confirm)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'grader.submissions'::regclass 
--   AND conname = 'submissions_source_type_check';

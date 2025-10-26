-- Migration: Add original file URL column for storing uploaded PDF/DOCX files
-- Date: 2025-10-12
-- This stores the Netlify Blobs URL for original uploaded files

ALTER TABLE grader.submissions 
ADD COLUMN IF NOT EXISTS original_file_url TEXT;

COMMENT ON COLUMN grader.submissions.original_file_url 
IS 'Netlify Blobs URL: /.netlify/blobs/essay-files/{submission_id}.{ext}';

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_submissions_original_file_url 
ON grader.submissions(original_file_url) 
WHERE original_file_url IS NOT NULL;

-- Add to submission_versions for audit trail
ALTER TABLE grader.submission_versions
ADD COLUMN IF NOT EXISTS original_file_url TEXT;

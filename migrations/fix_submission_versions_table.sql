-- ============================================================================
-- Fix submission_versions Table Schema
-- ============================================================================
-- Update column names to match new schema (submission_id instead of submission_ref)
-- ============================================================================

-- Step 1: Check if table exists and current schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submission_versions'
ORDER BY ordinal_position;

-- Step 2: If table exists, update column names
-- If submission_ref exists, rename it to submission_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'grader' 
      AND table_name = 'submission_versions' 
      AND column_name = 'submission_ref'
  ) THEN
    ALTER TABLE grader.submission_versions 
      RENAME COLUMN submission_ref TO submission_id;
    RAISE NOTICE 'Renamed submission_ref to submission_id';
  ELSE
    RAISE NOTICE 'Column submission_ref does not exist or already renamed';
  END IF;
END $$;

-- Step 3: If table doesn't exist, create it with correct schema
CREATE TABLE IF NOT EXISTS grader.submission_versions (
  version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  ai_grade numeric(5,2),
  ai_feedback jsonb,
  teacher_grade numeric(5,2),
  teacher_feedback text,
  draft_mode text,
  rough_draft_text text,
  final_draft_text text,
  changed_by uuid,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'grader'
      AND table_name = 'submission_versions'
      AND constraint_name = 'submission_versions_submission_id_fkey'
  ) THEN
    ALTER TABLE grader.submission_versions
      ADD CONSTRAINT submission_versions_submission_id_fkey
      FOREIGN KEY (submission_id)
      REFERENCES grader.submissions(submission_id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_submission_versions_submission_id 
  ON grader.submission_versions(submission_id, snapshot_at DESC);

-- Step 6: Verify final schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submission_versions'
ORDER BY ordinal_position;

-- Expected columns:
-- version_id, submission_id, ai_grade, ai_feedback, teacher_grade, 
-- teacher_feedback, draft_mode, rough_draft_text, final_draft_text, 
-- changed_by, snapshot_at

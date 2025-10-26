-- Migration: Remove Student PII from Cloud Database
-- Date: 2025-10-26
-- Purpose: Remove student_name and district_student_id columns to comply with privacy-first architecture
-- 
-- IMPORTANT: Run the bridge generation script BEFORE running this migration!
-- The bridge generation script will export all student data to an encrypted local file.

-- ============================================================================
-- STEP 1: Backup existing student data
-- ============================================================================
-- This creates a backup table with all student information
-- You can use this to generate the initial bridge file

CREATE TABLE IF NOT EXISTS grader.students_backup_20251026 AS
SELECT 
  student_id,
  student_name,
  district_student_id,
  created_at
FROM grader.students;

-- Verify backup
DO $$
DECLARE
  backup_count INTEGER;
  original_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM grader.students_backup_20251026;
  SELECT COUNT(*) INTO original_count FROM grader.students;
  
  IF backup_count != original_count THEN
    RAISE EXCEPTION 'Backup verification failed: backup has % rows but original has % rows', 
      backup_count, original_count;
  END IF;
  
  RAISE NOTICE 'Backup verified: % students backed up successfully', backup_count;
END $$;

-- ============================================================================
-- STEP 2: Remove PII columns from students table
-- ============================================================================

-- Drop the unique constraint that includes student_name
ALTER TABLE grader.students 
DROP CONSTRAINT IF EXISTS students_district_student_id_student_name_key;

-- Remove PII columns
ALTER TABLE grader.students 
DROP COLUMN IF EXISTS student_name;

ALTER TABLE grader.students 
DROP COLUMN IF EXISTS district_student_id;

-- Verify PII removal
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if student_name still exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'grader' 
    AND table_name = 'students' 
    AND column_name = 'student_name'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'PII removal failed: student_name column still exists';
  END IF;
  
  -- Check if district_student_id still exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'grader' 
    AND table_name = 'students' 
    AND column_name = 'district_student_id'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'PII removal failed: district_student_id column still exists';
  END IF;
  
  RAISE NOTICE 'PII successfully removed from grader.students table';
END $$;

-- ============================================================================
-- STEP 3: Verify final schema
-- ============================================================================

-- Show remaining columns in students table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader'
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected columns:
-- - student_id (uuid, NOT NULL, PRIMARY KEY)
-- - created_at (timestamptz, NOT NULL)

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To rollback this migration, run:
/*
ALTER TABLE grader.students 
ADD COLUMN student_name TEXT;

ALTER TABLE grader.students 
ADD COLUMN district_student_id TEXT;

UPDATE grader.students s
SET 
  student_name = b.student_name,
  district_student_id = b.district_student_id
FROM grader.students_backup_20251026 b
WHERE s.student_id = b.student_id;

ALTER TABLE grader.students 
ALTER COLUMN student_name SET NOT NULL;

-- Recreate unique constraint if needed
ALTER TABLE grader.students 
ADD CONSTRAINT students_district_student_id_student_name_key 
UNIQUE (district_student_id, student_name);
*/

-- ============================================================================
-- CLEANUP (Optional - only after bridge file is safely backed up)
-- ============================================================================

-- After you've verified the bridge file is working and backed up:
-- DROP TABLE grader.students_backup_20251026;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Created backup table (students_backup_20251026)
-- ✅ Removed student_name column
-- ✅ Removed district_student_id column
-- ✅ Verified PII removal
-- ✅ Students table now contains ONLY: student_id, created_at

RAISE NOTICE 'Migration 001_remove_student_pii completed successfully';
RAISE NOTICE 'IMPORTANT: Generate bridge file from backup table before dropping backup';

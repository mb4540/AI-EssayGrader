-- ============================================================================
-- FERPA Compliance Migration: Remove PII from Database
-- ============================================================================
-- This migration removes student names and district IDs from the database
-- to achieve FERPA compliance using the Student Identity Bridge
--
-- IMPORTANT: Run this AFTER creating encrypted bridge files for all tenants
-- ============================================================================

-- Step 1: Create backup table with PII (for bridge file generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grader.students_backup AS 
SELECT 
  student_id,
  student_name,
  district_student_id,
  tenant_id,
  created_at
FROM grader.students;

-- Verify backup was created
DO $$
DECLARE
  backup_count INTEGER;
  original_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM grader.students_backup;
  SELECT COUNT(*) INTO original_count FROM grader.students;
  
  IF backup_count != original_count THEN
    RAISE EXCEPTION 'Backup verification failed: % rows in backup vs % rows in original', 
      backup_count, original_count;
  END IF;
  
  RAISE NOTICE 'Backup created successfully: % students backed up', backup_count;
END $$;

-- Step 2: Export data for bridge file generation
-- ============================================================================
-- Run this query and save results to create bridge files for each tenant
-- DO NOT PROCEED until bridge files are created and verified!

COMMENT ON TABLE grader.students_backup IS 
  'Backup of student PII for bridge file generation. Export this data to create encrypted bridge files before proceeding with migration.';

-- Query to export for bridge files (run separately and save results):
/*
SELECT 
  student_id as uuid,
  district_student_id as localId,
  student_name as name,
  created_at as createdAt,
  tenant_id
FROM grader.students_backup
ORDER BY tenant_id, student_name;
*/

-- Step 3: Remove PII columns from students table
-- ============================================================================
-- STOP! Before running this, ensure:
-- 1. Bridge files created for ALL tenants
-- 2. Bridge files tested and verified
-- 3. Teachers can unlock and see their rosters
-- 4. Frontend code updated to use bridge

-- Uncomment the following lines ONLY when ready to remove PII:

/*
-- Remove student_name column
ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS student_name CASCADE;

-- Remove district_student_id column  
ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS district_student_id CASCADE;

-- Verify PII removed
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected columns after migration:
-- student_id (uuid, NOT NULL)
-- tenant_id (uuid, NOT NULL)
-- created_at (timestamptz, NOT NULL)
*/

-- Step 4: Verify FERPA compliance
-- ============================================================================
-- After migration, run these checks:

/*
-- Check 1: Students table should have NO PII
SELECT * FROM grader.students LIMIT 5;
-- Should only show: student_id, tenant_id, created_at

-- Check 2: No PII column names in any table
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'grader'
  AND (
    column_name ILIKE '%name%' 
    OR column_name ILIKE '%district%'
  )
  AND table_name NOT LIKE '%backup%';
-- Should return no results (except assignment_title, etc.)

-- Check 3: Verify submissions table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;
-- Should NOT have student_name or any PII fields
*/

-- Step 5: Rollback procedure (if needed)
-- ============================================================================
-- If migration fails, restore from backup:

/*
-- Restore students table from backup
BEGIN;

-- Drop current students table
DROP TABLE grader.students CASCADE;

-- Recreate from backup
CREATE TABLE grader.students AS 
SELECT * FROM grader.students_backup;

-- Restore constraints
ALTER TABLE grader.students 
  ADD PRIMARY KEY (student_id);

ALTER TABLE grader.students 
  ALTER COLUMN student_name SET NOT NULL;

ALTER TABLE grader.students 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE grader.students 
  ALTER COLUMN created_at SET NOT NULL;

-- Recreate foreign key constraints
ALTER TABLE grader.submissions
  ADD CONSTRAINT submissions_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES grader.students(student_id) 
  ON DELETE RESTRICT;

COMMIT;
*/

-- Step 6: Cleanup (after successful migration and verification)
-- ============================================================================
-- After 30 days of successful operation, drop backup table:

/*
-- ONLY run this after verifying everything works for at least 30 days
DROP TABLE IF EXISTS grader.students_backup;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- After completing this migration:
-- 1. Database contains NO student PII
-- 2. Only UUIDs stored in cloud
-- 3. Names/IDs stored locally in encrypted bridge files
-- 4. Application is FERPA compliant
-- ============================================================================

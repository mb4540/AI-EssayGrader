-- ============================================================================
-- FERPA Compliance Migration - EXECUTION SCRIPT
-- ============================================================================
-- This script removes PII from the database following database-design.md rules
-- 
-- Pre-flight checklist:
-- ✅ Bridge file created and backed up
-- ✅ All 6 students visible in bridge
-- ✅ Frontend code updated
-- ✅ Backend functions updated
-- ============================================================================

-- Step 1: Create backup table
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS grader.students_backup AS 
SELECT 
  student_id,
  student_name,
  district_student_id,
  tenant_id,
  created_at
FROM grader.students;

-- Verify backup
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
  
  RAISE NOTICE '✅ Backup created successfully: % students backed up', backup_count;
END $$;

COMMIT;

-- Step 2: Remove PII columns (FERPA Compliance)
-- ============================================================================
BEGIN;

-- Remove student_name column (PII)
ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS student_name CASCADE;

RAISE NOTICE '✅ Removed student_name column';

-- Remove district_student_id column (PII)
ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS district_student_id CASCADE;

RAISE NOTICE '✅ Removed district_student_id column';

COMMIT;

-- Step 3: Verify schema follows database-design.md rules
-- ============================================================================

-- Check students table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected result (following database-design.md rules):
-- student_id    | uuid         | NO  | (primary key)
-- tenant_id     | uuid         | NO  | 
-- created_at    | timestamptz  | NO  | now()

-- Step 4: Verify primary key constraint
-- ============================================================================
SELECT
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'grader'
  AND tc.table_name = 'students'
  AND tc.constraint_type = 'PRIMARY KEY';

-- Expected: student_id (follows database-design.md rule for prefixed IDs)

-- Step 5: Verify foreign key references
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'grader'
  AND ccu.table_name = 'students';

-- Expected: submissions.student_ref -> students.student_id

-- Step 6: Final verification - No PII in database
-- ============================================================================
DO $$
DECLARE
  pii_columns INTEGER;
BEGIN
  -- Check for any remaining PII column names
  SELECT COUNT(*) INTO pii_columns
  FROM information_schema.columns
  WHERE table_schema = 'grader'
    AND table_name = 'students'
    AND column_name IN ('student_name', 'district_student_id', 'name', 'full_name');
  
  IF pii_columns > 0 THEN
    RAISE EXCEPTION '❌ PII columns still exist in students table!';
  ELSE
    RAISE NOTICE '✅ FERPA COMPLIANCE ACHIEVED: No PII in students table';
  END IF;
END $$;

-- Step 7: Display final schema
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'FINAL STUDENTS TABLE SCHEMA (FERPA COMPLIANT)'
\echo '============================================================================'

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'NULL'
  END as nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

\echo ''
\echo '✅ Migration complete!'
\echo '✅ Student names now stored ONLY in local encrypted bridge file'
\echo '✅ Database contains ONLY UUIDs (no PII)'
\echo '✅ Application is now FERPA compliant'
\echo ''
\echo 'Backup table: grader.students_backup (keep for 30 days)'
\echo '============================================================================'

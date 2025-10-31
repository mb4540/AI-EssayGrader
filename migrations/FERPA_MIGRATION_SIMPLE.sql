-- ============================================================================
-- FERPA Compliance Migration - SIMPLE VERSION
-- ============================================================================
-- This version removes the problematic display commands
-- Each step is in its own transaction for safety
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

COMMIT;

-- Verify backup count
SELECT COUNT(*) as backup_count FROM grader.students_backup;
-- Expected: 6

-- Step 2: Remove student_name column (PII)
-- ============================================================================
BEGIN;

ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS student_name CASCADE;

COMMIT;

-- Step 3: Remove district_student_id column (PII)
-- ============================================================================
BEGIN;

ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS district_student_id CASCADE;

COMMIT;

-- Step 4: Verify migration success
-- ============================================================================

-- Check final schema (should only have: student_id, tenant_id, created_at)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Verify no PII columns remain
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: No PII columns found'
    ELSE 'ERROR: PII columns still exist'
  END as ferpa_status
FROM information_schema.columns
WHERE table_schema = 'grader'
  AND table_name = 'students'
  AND column_name IN ('student_name', 'district_student_id');

-- Count records
SELECT 
  (SELECT COUNT(*) FROM grader.students) as current_count,
  (SELECT COUNT(*) FROM grader.students_backup) as backup_count;
-- Both should be 6

-- ============================================================================
-- Verify FERPA Migration Success
-- ============================================================================

-- Check 1: Verify students table structure (should have NO PII)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected result:
-- student_id   | uuid        | NO
-- tenant_id    | uuid        | NO
-- created_at   | timestamptz | NO

-- Check 2: Verify backup table exists and has PII
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students_backup'
ORDER BY ordinal_position;

-- Expected result should include:
-- student_id, student_name, district_student_id, tenant_id, created_at

-- Check 3: Count records
SELECT 
  (SELECT COUNT(*) FROM grader.students) as current_students,
  (SELECT COUNT(*) FROM grader.students_backup) as backup_students;

-- Expected: Both should be 6

-- Check 4: Verify no PII columns exist
SELECT COUNT(*) as pii_columns_remaining
FROM information_schema.columns
WHERE table_schema = 'grader'
  AND table_name = 'students'
  AND column_name IN ('student_name', 'district_student_id', 'name', 'full_name');

-- Expected: 0 (no PII columns)

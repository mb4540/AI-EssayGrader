-- ============================================================================
-- Fix Submissions Table Foreign Key After FERPA Migration
-- ============================================================================
-- The submissions.student_ref column needs to reference students.student_id
-- After removing PII, students table only has student_id (no 'id' column)
-- ============================================================================

-- Step 1: Check current foreign key constraint
SELECT
  tc.constraint_name,
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
  AND tc.table_name = 'submissions'
  AND kcu.column_name = 'student_ref';

-- Step 2: Drop old foreign key constraint (if exists)
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Find the constraint name
  SELECT tc.constraint_name INTO constraint_name_var
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'grader'
    AND tc.table_name = 'submissions'
    AND kcu.column_name = 'student_ref'
  LIMIT 1;

  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE grader.submissions DROP CONSTRAINT %I', constraint_name_var);
    RAISE NOTICE 'Dropped old foreign key constraint: %', constraint_name_var;
  ELSE
    RAISE NOTICE 'No existing foreign key constraint found';
  END IF;
END $$;

-- Step 3: Add correct foreign key constraint
-- student_ref should reference students.student_id (the UUID primary key)
ALTER TABLE grader.submissions
  ADD CONSTRAINT submissions_student_ref_fkey 
  FOREIGN KEY (student_ref) 
  REFERENCES grader.students(student_id)
  ON DELETE RESTRICT;

-- Step 4: Verify the fix
SELECT
  tc.constraint_name,
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
  AND tc.table_name = 'submissions'
  AND kcu.column_name = 'student_ref';

-- Expected result:
-- submissions_student_ref_fkey | student_ref | students | student_id

-- Verification script for source_texts migration
-- Run this after applying add_source_texts.sql

-- Check if source_texts table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'grader' 
  AND table_name = 'source_texts';

-- Check columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'source_texts'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'grader' 
  AND tablename = 'source_texts';

-- Check foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'grader'
  AND tc.table_name = 'source_texts';

-- Check assignments table has source_text_id column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'assignments'
  AND column_name = 'source_text_id';

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'grader'
  AND event_object_table = 'source_texts';

-- Test insert (will rollback)
BEGIN;
  INSERT INTO grader.source_texts (
    tenant_id,
    teacher_id,
    title,
    blob_key,
    writing_prompt,
    file_type,
    file_size_bytes
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    (SELECT user_id FROM grader.users LIMIT 1),
    'Test Source Text',
    'test/test-key.pdf',
    'Test writing prompt',
    'pdf',
    1024
  )
  RETURNING source_text_id, title, created_at, updated_at;
ROLLBACK;

SELECT 'All verification checks complete' AS status;

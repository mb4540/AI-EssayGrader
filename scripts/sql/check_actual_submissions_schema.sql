-- Check what columns actually exist in submissions table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;

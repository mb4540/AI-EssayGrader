-- Check submission_versions table schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submission_versions'
ORDER BY ordinal_position;

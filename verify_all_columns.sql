-- Verify ALL columns in students table (to see if 'id' exists)
SELECT column_name, ordinal_position, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;

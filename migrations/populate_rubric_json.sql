-- Migration: Populate rubric_json for existing assignments
-- Created: November 14, 2025
-- Purpose: Parse grading_criteria text and save structured rubric with max_points
--          This ensures max points are always available in the database

-- Note: This migration requires the rubric parser logic to be run via a script
-- The SQL below is a template - actual population should be done via Node.js script

-- Step 1: Identify assignments that need rubric_json populated
-- (assignments with grading_criteria but no rubric_json)

SELECT 
  assignment_id,
  title,
  total_points,
  LENGTH(grading_criteria) as criteria_length,
  rubric_json IS NULL as needs_parsing
FROM grader.assignments
WHERE grading_criteria IS NOT NULL 
  AND grading_criteria != ''
  AND rubric_json IS NULL
ORDER BY created_at DESC;

-- Step 2: The actual population will be done via Node.js script
-- See: scripts/populate-rubric-json.ts

-- This ensures:
-- 1. Proper parsing using rubricParser.ts
-- 2. Validation of parsed rubric
-- 3. Error handling for malformed criteria
-- 4. Logging of results

-- After running the script, verify:
SELECT 
  assignment_id,
  title,
  rubric_json IS NOT NULL as has_rubric,
  jsonb_array_length(rubric_json->'criteria') as criteria_count,
  (rubric_json->'scale'->>'total_points')::numeric as total_points
FROM grader.assignments
WHERE grading_criteria IS NOT NULL
ORDER BY created_at DESC;

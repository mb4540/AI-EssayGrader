-- Fix submissions that are missing assignment_id

-- First, verify which submissions are missing assignments
SELECT 
  submission_id,
  student_id,
  assignment_id,
  created_at
FROM grader.submissions
WHERE assignment_id IS NULL
ORDER BY created_at DESC;

-- Update all submissions without an assignment to use "Personal Narrative"
UPDATE grader.submissions
SET assignment_id = (
  SELECT assignment_id 
  FROM grader.assignments 
  WHERE title = 'Personal Narrative' 
  LIMIT 1
)
WHERE assignment_id IS NULL;

-- Verify the fix
SELECT 
  s.submission_id,
  s.student_id,
  s.assignment_id,
  a.title as assignment_title,
  s.created_at
FROM grader.submissions s
LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
ORDER BY s.created_at DESC
LIMIT 10;

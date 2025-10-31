-- Link existing submissions to Personal Narrative assignment

-- First, get the assignment_id
SELECT assignment_id, title FROM grader.assignments WHERE title = 'Personal Narrative';

-- Update submissions to link to this assignment
-- (Replace the UUID below with the actual assignment_id from the query above)
UPDATE grader.submissions
SET assignment_id = (
  SELECT assignment_id 
  FROM grader.assignments 
  WHERE title = 'Personal Narrative' 
  LIMIT 1
)
WHERE assignment_id IS NULL;

-- Verify the update
SELECT 
  s.submission_id,
  s.assignment_id,
  a.title as assignment_title
FROM grader.submissions s
LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
LIMIT 10;

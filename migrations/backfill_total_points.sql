-- Backfill total_points for existing assignments
-- This extracts the point value from the grading_criteria text
-- Date: October 31, 2025

-- Update assignments where grading_criteria contains "Scoring (XX pts total)"
-- Extract the number from the text

-- For "Personal Narrative E" (80 pts)
UPDATE grader.assignments
SET total_points = 80
WHERE title = 'Personal Narrative E'
AND total_points IS NULL;

-- You can add more specific updates here for other assignments
-- Or manually update via Neon console

-- To see which assignments need updating:
-- SELECT assignment_id, title, 
--        SUBSTRING(grading_criteria FROM 'Scoring \((\d+) pts total\)') as extracted_points,
--        total_points
-- FROM grader.assignments
-- WHERE total_points IS NULL;

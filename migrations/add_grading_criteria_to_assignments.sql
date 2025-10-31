-- Add grading_criteria column to assignments table
ALTER TABLE grader.assignments
  ADD COLUMN IF NOT EXISTS grading_criteria text;

-- Update the existing Personal Narrative assignment with criteria
UPDATE grader.assignments
SET grading_criteria = '=Scoring (100 pts total):=

- =Organization (20): clear intro, body, conclusion
- =Content & Personal Narrative (40 pts):=
  - Engaging introduction that captures interest (10 pts)
  - Clear and coherent storytelling with relevant details (15 pts)
  - Strong conclusion that reflects on the narrative (10 pts)
  - Originality and personal voice (5 pts)

- =Grammar & Mechanics (25):= capitalization, punctuation, subject-verb, sentence boundaries
- =Spelling (15)
- =Clarity & Style (20):= precise words, transitions

=Penalties:=
- =Formatting: -10='
WHERE title = 'Personal Narrative';

-- Verify
SELECT assignment_id, title, grading_criteria
FROM grader.assignments;

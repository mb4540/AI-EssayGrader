-- Migration: Add grading_criteria column to assignments table
-- This allows assignments to have default grading criteria that auto-populate for submissions

ALTER TABLE grader.assignments 
ADD COLUMN IF NOT EXISTS grading_criteria TEXT;

-- Note: This is optional, so no NOT NULL constraint
-- When a teacher selects an assignment, the criteria will auto-populate in the submission form

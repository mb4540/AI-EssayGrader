-- Migration: Add class_period column to grader.students table
-- Date: November 24, 2025
-- Purpose: Enable class period organization for student roster management

-- Add class_period column (nullable to support existing records)
ALTER TABLE grader.students
ADD COLUMN class_period TEXT;

-- Add index for filtering performance
CREATE INDEX idx_students_class_period ON grader.students(class_period);

-- Add comment for documentation
COMMENT ON COLUMN grader.students.class_period IS 'Class period or section (e.g., "Period 1", "Block A") - non-PII field for organizing students';

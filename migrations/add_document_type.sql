-- Migration: Add document_type column to assignments table
-- Date: October 31, 2025
-- Purpose: Support ELA document type selection for better AI feedback

-- Add document_type column
ALTER TABLE grader.assignments
ADD COLUMN document_type text;

-- Add comment
COMMENT ON COLUMN grader.assignments.document_type IS 'Type of document (e.g., personal_narrative, argumentative, literary_analysis) - helps AI provide relevant feedback';

-- Create index for filtering by document type
CREATE INDEX idx_assignments_document_type ON grader.assignments(document_type);

-- Migration: Rename primary key constraints to have unique prefixed names
-- This improves clarity and prevents naming conflicts

-- Rename students table primary key
ALTER TABLE grader.students 
RENAME CONSTRAINT students_pkey TO students_id_pkey;

-- Rename assignments table primary key
ALTER TABLE grader.assignments 
RENAME CONSTRAINT assignments_pkey TO assignments_id_pkey;

-- Rename submissions table primary key
ALTER TABLE grader.submissions 
RENAME CONSTRAINT submissions_pkey TO submissions_id_pkey;

-- Rename submission_versions table primary key
ALTER TABLE grader.submission_versions 
RENAME CONSTRAINT submission_versions_pkey TO submission_versions_id_pkey;

-- Note: The underlying indexes are automatically renamed when constraints are renamed

-- ============================================================================
-- Database Cleanup Script
-- ============================================================================
-- Created: October 31, 2025
-- Purpose: Remove duplicate index and unused backup table
-- 
-- SAFE TO RUN: These items are not used by any application code
-- ============================================================================

-- Step 1: Drop duplicate index
-- ============================================================================
-- We have two identical indexes on submission_versions:
--   1. idx_submission_versions_submission (to be removed)
--   2. idx_submission_versions_submission_id (keeping this one)
-- Both are: (submission_id, snapshot_at DESC)

BEGIN;

DROP INDEX IF EXISTS grader.idx_submission_versions_submission;

-- Verify the remaining index still exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'grader'
  AND tablename = 'submission_versions'
  AND indexname = 'idx_submission_versions_submission_id';

COMMIT;

-- Expected result: Should show idx_submission_versions_submission_id still exists

-- ============================================================================
-- Step 2: Drop students_backup table
-- ============================================================================
-- This table was created during FERPA migration as a safety backup
-- It contains PII (student names and district IDs)
-- Not used by any application code
-- Safe to delete now that migration is successful

BEGIN;

-- Optional: Export data first if you want to keep a local copy
-- (Run this in a separate query if needed)
-- COPY grader.students_backup TO '/tmp/students_backup_export.csv' WITH CSV HEADER;

DROP TABLE IF EXISTS grader.students_backup;

-- Verify table is gone
SELECT COUNT(*) as backup_table_exists
FROM information_schema.tables
WHERE table_schema = 'grader'
  AND table_name = 'students_backup';

COMMIT;

-- Expected result: backup_table_exists should be 0

-- ============================================================================
-- Step 3: Verify cleanup
-- ============================================================================

-- Check all indexes on submission_versions
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'grader'
  AND tablename = 'submission_versions'
ORDER BY indexname;

-- Expected: Should see 3 indexes (not 4)
-- - submission_versions_pkey
-- - idx_submission_versions_submission_id
-- - (no idx_submission_versions_submission)

-- Check all tables in grader schema
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'grader' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'grader'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: Should see 6 tables (not 7)
-- - assignments
-- - students
-- - submission_versions
-- - submissions
-- - tenants
-- - users
-- (no students_backup)

-- ============================================================================
-- Cleanup Complete!
-- ============================================================================
-- Summary:
-- ✅ Removed duplicate index (idx_submission_versions_submission)
-- ✅ Removed unused backup table (students_backup)
-- ✅ Database is now cleaner and more efficient
-- 
-- Next step: Update /db_ref.md with new schema information
-- ============================================================================

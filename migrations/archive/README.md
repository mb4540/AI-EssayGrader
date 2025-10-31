# Archived Migration Files

This directory contains migration files that have been successfully executed and are kept for reference only.

## Files

### Successful Migrations (Applied)
- `FERPA_MIGRATION_SIMPLE.sql` - Main FERPA migration (moved to parent)
- `fix_submission_versions_table.sql` - Fixed version table schema (moved to parent)
- `add_missing_submission_columns.sql` - Added draft mode columns
- `add_missing_version_columns.sql` - Added version snapshot columns
- `add_tenant_to_assignments.sql` - Added tenant_id to assignments
- `link_submissions_to_assignment.sql` - Linked existing submissions to assignment

### Failed/Superseded Migrations
- `EXECUTE_FERPA_MIGRATION.sql` - Had errors with RAISE NOTICE, superseded by SIMPLE version
- `fix_submissions_foreign_key.sql` - Temporary fix, no longer needed

### Verification Scripts
- `verify_migration.sql` - Post-migration verification queries

## Note

These files are archived for historical reference. Do not run them again as they have already been applied to the database.

**Date Archived:** October 31, 2025

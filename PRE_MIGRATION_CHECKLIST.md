# Pre-Migration Checklist - FERPA Compliance

## ✅ COMPLETED ITEMS

### Phase 1.1: Data Export & Bridge Files
- [x] Exported student data from database
- [x] Created encrypted bridge file
- [x] Bridge file contains 6 students
- [x] Bridge file backed up to safe location

### Phase 1.2: Frontend Code Updates
- [x] Updated `src/lib/schema.ts` - student_id required, student_name removed
- [x] Updated `src/pages/Submission.tsx` - resolves UUID from bridge
- [x] Updated `src/pages/Dashboard.tsx` - displays names from bridge
- [x] Updated CSV export - resolves names locally

### Phase 1.3: Backend Functions Updates
- [x] Updated `ingest.ts` - accepts only UUID
- [x] Updated `list.ts` - returns only UUID
- [x] Updated `get-submission.ts` - returns only UUID
- [x] Updated `save-teacher-edits.ts` - fixed joins
- [x] Updated `grade.ts` - fixed joins
- [x] Verified `delete-submission.ts` - no changes needed

## 🎯 READY FOR MIGRATION

### Database Design Rules Compliance
Following `.windsurf/rules/database-design.md`:

**✅ Primary Keys:**
- Current: `student_id` (uuid) - ✅ Follows prefixed ID rule
- NOT using generic `id` - ✅ Correct

**✅ Foreign Keys:**
- submissions.student_ref references students.student_id - ✅ Explicit

**✅ Naming Conventions:**
- Table: `students` (plural) - ✅ Correct
- Columns: `student_id`, `tenant_id`, `created_at` - ✅ Lowercase with underscores

**✅ Data Types:**
- `student_id`: uuid - ✅ Correct
- `tenant_id`: uuid - ✅ Correct  
- `created_at`: timestamptz - ✅ Correct with timezone

## 📋 MIGRATION EXECUTION PLAN

### Step 1: Create Backup
```sql
CREATE TABLE grader.students_backup AS 
SELECT * FROM grader.students;
```
**Expected:** 6 rows backed up

### Step 2: Remove PII Columns
```sql
ALTER TABLE grader.students DROP COLUMN student_name CASCADE;
ALTER TABLE grader.students DROP COLUMN district_student_id CASCADE;
```
**Result:** Only student_id, tenant_id, created_at remain

### Step 3: Verify Schema
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'grader' AND table_name = 'students';
```
**Expected:** student_id, tenant_id, created_at

## ⚠️ CRITICAL WARNINGS

1. **Point of No Return**: Once PII columns are dropped, student names exist ONLY in bridge file
2. **Bridge File is Critical**: Without it, you cannot map UUIDs to student names
3. **Backup Retention**: Keep `students_backup` table for 30 days minimum
4. **Test Bridge First**: Ensure you can unlock bridge and see all 6 students

## 🚀 EXECUTION COMMAND

To execute the migration, run:

```bash
psql $DATABASE_URL -f migrations/EXECUTE_FERPA_MIGRATION.sql
```

Or in Neon SQL Editor:
1. Open Neon Console
2. Go to SQL Editor
3. Paste contents of `EXECUTE_FERPA_MIGRATION.sql`
4. Execute

## ✅ POST-MIGRATION VERIFICATION

After migration, verify:

1. **Bridge Works:**
   - [ ] Can unlock bridge with passphrase
   - [ ] All 6 students visible in roster
   - [ ] Can search by name/ID

2. **Application Works:**
   - [ ] Dashboard displays student names (from bridge)
   - [ ] Can create new submission (resolves UUID from bridge)
   - [ ] Can view existing submissions (names resolved from bridge)
   - [ ] CSV export includes names (from bridge)

3. **Database Clean:**
   - [ ] No `student_name` column in students table
   - [ ] No `district_student_id` column in students table
   - [ ] Only UUIDs stored in database

4. **FERPA Compliance:**
   - [ ] No PII in database
   - [ ] No PII in API requests (check DevTools Network tab)
   - [ ] Student names only in local encrypted bridge file

## 🔄 ROLLBACK PROCEDURE

If something goes wrong:

```sql
BEGIN;

-- Drop current students table
DROP TABLE grader.students CASCADE;

-- Restore from backup
CREATE TABLE grader.students AS 
SELECT * FROM grader.students_backup;

-- Restore constraints
ALTER TABLE grader.students 
  ADD PRIMARY KEY (student_id);

ALTER TABLE grader.students 
  ALTER COLUMN student_name SET NOT NULL;

ALTER TABLE grader.students 
  ALTER COLUMN tenant_id SET NOT NULL;

-- Recreate foreign keys
ALTER TABLE grader.submissions
  ADD CONSTRAINT submissions_student_ref_fkey 
  FOREIGN KEY (student_ref) 
  REFERENCES grader.students(student_id) 
  ON DELETE RESTRICT;

COMMIT;
```

## 📞 READY TO PROCEED?

All items checked? Bridge backed up? Then execute:

```bash
psql $DATABASE_URL -f migrations/EXECUTE_FERPA_MIGRATION.sql
```

**This will make your application FERPA compliant! 🎉**

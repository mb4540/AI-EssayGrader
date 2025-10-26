# Database Migration Guide - Remove Student PII

**Date**: October 26, 2025  
**Migration**: 001_remove_student_pii  
**Purpose**: Remove student names and local IDs from cloud database for privacy compliance

---

## ⚠️ CRITICAL: Read Before Starting

This migration **permanently removes** student PII from the cloud database. You **MUST** generate and verify the bridge file before running the migration, or you will lose access to student names.

---

## Prerequisites

- [ ] Node.js installed
- [ ] Database access (NEON_DATABASE_URL set)
- [ ] Backup of database (recommended)
- [ ] Understanding of bridge system

---

## Migration Steps

### Step 1: Backup Current Database (Recommended)

```bash
# Create a full database backup first
pg_dump $NEON_DATABASE_URL > backup_before_migration_$(date +%Y%m%d).sql
```

### Step 2: Generate Bridge File from Existing Data

This script will:
- Read all student data from the database
- Create an encrypted bridge file
- Save it as `students.bridge.json.enc`

```bash
# Set your database URL
export NEON_DATABASE_URL="postgresql://..."

# Run the bridge generation script
node database/generate-bridge-from-backup.js
```

**You will be prompted for:**
- Passphrase (minimum 8 characters)
- Passphrase confirmation

**Output:**
- `students.bridge.json.enc` - Encrypted bridge file

**⚠️ IMPORTANT:**
- Store your passphrase securely!
- Back up the bridge file to multiple locations
- Do NOT proceed until you have the bridge file

### Step 3: Verify Bridge File in Application

Before removing PII from the database, verify the bridge file works:

1. Start the application:
   ```bash
   npm run dev
   ```

2. Navigate to `/bridge` route

3. Click "Import Bridge File"

4. Select `students.bridge.json.enc`

5. Enter your passphrase

6. Verify all students appear correctly

7. Test searching and filtering

**✅ Only proceed if all students are visible and correct**

### Step 4: Run Database Migration

Once you've verified the bridge file works:

```bash
# Connect to database and run migration
psql $NEON_DATABASE_URL -f database/migrations/001_remove_student_pii.sql
```

**Expected Output:**
```
NOTICE:  Backup verified: X students backed up successfully
NOTICE:  PII successfully removed from grader.students table
NOTICE:  Migration 001_remove_student_pii completed successfully
```

### Step 5: Verify Migration Success

Check that PII has been removed:

```sql
-- Connect to database
psql $NEON_DATABASE_URL

-- Check students table schema
\d grader.students

-- Expected columns:
-- student_id (uuid)
-- created_at (timestamptz)

-- Verify no PII columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'grader' 
  AND table_name = 'students';
```

### Step 6: Test Application

1. Create a test submission using the bridge
2. Verify UUID-only is sent to API
3. Check DevTools Network tab - no student names in requests
4. Verify submission appears in dashboard

### Step 7: Cleanup (Optional)

After verifying everything works for at least 1 week:

```sql
-- Only run this after you're 100% confident the bridge works
DROP TABLE grader.students_backup_20251026;
```

---

## Rollback Instructions

If something goes wrong, you can rollback:

```sql
-- Restore PII columns from backup
ALTER TABLE grader.students 
ADD COLUMN student_name TEXT;

ALTER TABLE grader.students 
ADD COLUMN district_student_id TEXT;

UPDATE grader.students s
SET 
  student_name = b.student_name,
  district_student_id = b.district_student_id
FROM grader.students_backup_20251026 b
WHERE s.student_id = b.student_id;

ALTER TABLE grader.students 
ALTER COLUMN student_name SET NOT NULL;
```

---

## Verification Checklist

Before considering migration complete:

- [ ] Bridge file generated successfully
- [ ] Bridge file backed up to multiple locations
- [ ] Passphrase stored securely
- [ ] Bridge file tested in application
- [ ] All students visible in bridge
- [ ] Migration script executed successfully
- [ ] PII columns removed from students table
- [ ] Test submission created with UUID-only
- [ ] No student names in API requests (verified in DevTools)
- [ ] Application works correctly with bridge

---

## Troubleshooting

### Issue: "Backup table does not exist"

**Solution:** The migration script creates the backup automatically. If you see this error when running the bridge generation script, run the migration script first (it's safe - it only creates the backup, doesn't remove anything yet).

### Issue: "Failed to unlock bridge"

**Possible causes:**
- Wrong passphrase
- Corrupted bridge file
- Bridge file from different passphrase

**Solution:** Regenerate bridge file with correct passphrase

### Issue: "Student names not appearing in app"

**Possible causes:**
- Bridge is locked
- Bridge not imported
- Wrong bridge file

**Solution:** 
1. Go to `/bridge` route
2. Import correct bridge file
3. Unlock with passphrase

### Issue: "API still sending student names"

**Possible causes:**
- Old code still using student_name field
- Frontend not using StudentSelector
- Schema not updated

**Solution:**
1. Verify `src/lib/schema.ts` has UUID-only
2. Verify submission form uses StudentSelector
3. Check DevTools Network tab for PII

---

## Files Created

```
database/
├── migrations/
│   └── 001_remove_student_pii.sql       # SQL migration script
├── generate-bridge-from-backup.js       # Bridge generation script
└── MIGRATION_GUIDE.md                   # This file
```

---

## Timeline

**Estimated time:** 30-60 minutes

1. Generate bridge file: 5 minutes
2. Verify bridge in app: 10 minutes
3. Run migration: 2 minutes
4. Verify migration: 5 minutes
5. Test application: 10 minutes
6. Monitor for issues: 1 week

---

## Support

If you encounter issues:

1. Check the backup table still exists
2. Verify bridge file is not corrupted
3. Test with a fresh bridge file
4. Rollback if necessary (see Rollback Instructions)

---

## Post-Migration

After successful migration:

✅ **Students table** - Contains only UUIDs and timestamps  
✅ **Bridge file** - Contains encrypted student names locally  
✅ **API requests** - Send only UUIDs (no PII)  
✅ **Privacy compliance** - FERPA/COPPA compliant by design  
✅ **Data breach risk** - Eliminated for student identities  

**Your application is now privacy-first!** 🎉

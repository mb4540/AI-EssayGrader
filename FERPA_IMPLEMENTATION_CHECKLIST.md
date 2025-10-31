# FERPA Compliance Implementation Checklist

## 🎯 Goal
Make AI-EssayGrader FERPA compliant by removing all student PII from the cloud database and storing it only in local encrypted bridge files.

## 📋 Pre-Migration Checklist

### 1. Verify Bridge is Functional
- [x] Bridge UI exists and works (confirmed from screenshots)
- [x] Bridge can store students (S12345, John Smith, UUID)
- [x] Bridge file is encrypted locally
- [ ] Bridge can be unlocked with passphrase
- [ ] Bridge can export/import encrypted files

### 2. Export Current Student Data
```sql
-- Run this query and save results as CSV
SELECT 
  student_id as uuid,
  district_student_id as localId,
  student_name as name,
  created_at as createdAt,
  tenant_id
FROM grader.students
ORDER BY tenant_id, student_name;
```

**Action:** Save this data to create bridge files for each tenant.

### 3. Create Bridge Files for Each Tenant
- [ ] Export student data per tenant
- [ ] Create encrypted bridge file for each tenant
- [ ] Verify bridge files can be unlocked
- [ ] Verify all students appear in roster
- [ ] Test UUID lookup works

## 🔧 Code Updates Required

### Frontend Changes

#### 1. Update Schema (src/lib/schema.ts)
```typescript
// BEFORE (current)
export const IngestRequestSchema = z.object({
  student_name: z.string().min(1).optional(),  // ❌ Remove
  student_id: z.string().uuid().optional(),    // ❌ Make required
  ...
});

// AFTER (FERPA compliant)
export const IngestRequestSchema = z.object({
  student_id: z.string().uuid(),  // ✅ Required UUID from bridge
  // student_name removed
  ...
});
```

#### 2. Update Submission Form (src/pages/Submission.tsx)
```typescript
// BEFORE
const result = await ingestMutation.mutateAsync({
  student_name: studentName,  // ❌ Remove
  student_id: studentId,
  ...
});

// AFTER
import { useBridge } from '@/hooks/useBridge';

const { findByLocalId, findByName } = useBridge();

// Resolve UUID from bridge
const student = findByLocalId(studentSearch) || findByName(studentSearch);
if (!student) {
  alert('Student not found. Please add to roster first.');
  return;
}

const result = await ingestMutation.mutateAsync({
  student_id: student.uuid,  // ✅ Only UUID sent
  ...
});
```

#### 3. Update Dashboard (src/pages/Dashboard.tsx)
```typescript
// BEFORE
<td>{submission.student_name}</td>  // ❌ Won't exist after migration

// AFTER
import { useBridge } from '@/hooks/useBridge';

const { findByUuid } = useBridge();

// Resolve name from bridge
const student = findByUuid(submission.student_id);
<td>{student?.name || 'Unknown'}</td>  // ✅ From bridge
```

#### 4. Update CSV Export (src/lib/csv.ts)
```typescript
// BEFORE
export interface SubmissionExport {
  student_name: string;  // ❌ Remove
  ...
}

// AFTER
export interface SubmissionExport {
  student_id: string;  // ✅ Only UUID
  ...
}

// In Dashboard.tsx export function:
const { findByUuid } = useBridge();

exportToCSV(
  data.submissions.map(s => {
    const student = findByUuid(s.student_id);
    return {
      student_id: s.student_id,
      student_name: student?.name || 'Unknown',  // ✅ Resolved locally
      ...
    };
  })
);
```

### Backend Changes

#### 1. Update ingest.ts
```typescript
// BEFORE
const { student_name, student_id, ... } = validation.data;

let studentResult = await sql`
  SELECT student_id FROM grader.students 
  WHERE student_name = ${student_name}
  ...
`;

// AFTER
const { student_id, ... } = validation.data;  // No student_name

// Verify student exists (UUID only)
let studentResult = await sql`
  SELECT student_id FROM grader.students 
  WHERE student_id = ${student_id}
  AND tenant_id = ${tenant_id}
`;

if (studentResult.length === 0) {
  // Create student record (UUID only, no PII)
  await sql`
    INSERT INTO grader.students (student_id, tenant_id, created_at)
    VALUES (${student_id}, ${tenant_id}, NOW())
  `;
}
```

#### 2. Update list.ts
```typescript
// BEFORE
SELECT 
  s.submission_id,
  st.student_name,  // ❌ Remove
  st.district_student_id,  // ❌ Remove
  ...
FROM grader.submissions s
JOIN grader.students st ON s.student_id = st.student_id

// AFTER
SELECT 
  s.submission_id,
  s.student_id,  // ✅ Only UUID
  ...
FROM grader.submissions s
WHERE s.tenant_id = ${tenant_id}
-- No join to students table needed (no PII to fetch)
```

#### 3. Update get-submission.ts
```typescript
// BEFORE
SELECT 
  s.submission_id,
  st.student_name,  // ❌ Remove
  ...
FROM grader.submissions s
JOIN grader.students st ON s.student_id = st.student_id

// AFTER
SELECT 
  s.submission_id,
  s.student_id,  // ✅ Only UUID
  ...
FROM grader.submissions s
WHERE s.submission_id = ${submissionId}
-- No join needed
```

#### 4. Update save-teacher-edits.ts, grade.ts, delete-submission.ts
- Remove any references to `student_name`
- Remove joins to students table (unless checking tenant_id)
- Only work with UUIDs

## 🗄️ Database Migration

### Step 1: Backup
```bash
# Run the migration script
psql $DATABASE_URL -f migrations/schema_migration_ferpa_compliance.sql
```

This creates `grader.students_backup` table.

### Step 2: Verify Backup
```sql
SELECT COUNT(*) FROM grader.students_backup;
-- Should match count from grader.students
```

### Step 3: Remove PII (ONLY after code is updated)
```sql
-- Uncomment in migration script:
ALTER TABLE grader.students DROP COLUMN student_name CASCADE;
ALTER TABLE grader.students DROP COLUMN district_student_id CASCADE;
```

### Step 4: Verify FERPA Compliance
```sql
-- Should only show: student_id, tenant_id, created_at
SELECT * FROM grader.students LIMIT 5;

-- Should return no PII columns
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students';
```

## 🧪 Testing Checklist

### Before Migration
- [ ] Bridge file exists and works
- [ ] Can unlock bridge with passphrase
- [ ] All students visible in roster
- [ ] Can add new students to bridge
- [ ] Can search students by name/ID

### After Code Updates (Before DB Migration)
- [ ] Submission form resolves UUID from bridge
- [ ] Dashboard displays names from bridge
- [ ] CSV export includes names from bridge
- [ ] Search works with bridge lookup
- [ ] No `student_name` sent in API requests (check DevTools)

### After Database Migration
- [ ] Submissions still work
- [ ] Dashboard still displays correctly
- [ ] Existing submissions show correct names
- [ ] New submissions can be created
- [ ] Search/filter still works
- [ ] Export to CSV works
- [ ] No errors in console
- [ ] No PII in database (verify with SQL)

## 🚨 Rollback Plan

If anything goes wrong:

1. **Before DB migration**: Just revert code changes
2. **After DB migration**: Run rollback SQL (in migration script)

```sql
-- Restore from backup
DROP TABLE grader.students CASCADE;
CREATE TABLE grader.students AS SELECT * FROM grader.students_backup;
-- Restore constraints (see migration script)
```

## 📝 Implementation Order

1. ✅ **Phase 1: Preparation** (Current)
   - [x] Verify bridge works
   - [ ] Export student data
   - [ ] Create bridge files for all tenants

2. **Phase 2: Code Updates** (Next)
   - [ ] Update frontend schema
   - [ ] Update Submission form
   - [ ] Update Dashboard
   - [ ] Update all backend functions
   - [ ] Test with current database (should still work)

3. **Phase 3: Database Migration**
   - [ ] Run backup script
   - [ ] Verify backup
   - [ ] Remove PII columns
   - [ ] Verify FERPA compliance

4. **Phase 4: Verification**
   - [ ] Test all features
   - [ ] Verify no PII in cloud
   - [ ] Monitor for 30 days

5. **Phase 5: Cleanup**
   - [ ] Drop backup table (after 30 days)

## 🎓 FERPA Compliance Verification

After migration, you can certify:

✅ **No PII in Cloud Database**
- Student names: ❌ Not in database
- District IDs: ❌ Not in database
- Only UUIDs: ✅ In database

✅ **PII Stored Locally Only**
- Bridge file: ✅ Encrypted on teacher's device
- Never transmitted: ✅ Names stay local
- Teacher controlled: ✅ Can lock/unlock

✅ **Audit Trail**
- API requests: ✅ Only contain UUIDs
- Database logs: ✅ Only contain UUIDs
- Error logs: ✅ No PII exposed

## 📞 Support

If you encounter issues:
1. Check `FERPA_MIGRATION_PLAN.md` for detailed steps
2. Review `identity.md` for bridge architecture
3. Test rollback procedure before migration
4. Keep backup table for 30 days minimum

## ⏱️ Estimated Timeline

- **Phase 1 (Prep)**: 1-2 hours
- **Phase 2 (Code)**: 3-4 hours
- **Phase 3 (DB)**: 30 minutes
- **Phase 4 (Test)**: 1-2 hours
- **Total**: 6-9 hours

**Recommendation**: Do this over 2-3 days to allow thorough testing between phases.

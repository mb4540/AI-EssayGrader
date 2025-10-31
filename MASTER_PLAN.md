# Master Implementation Plan
## AI-EssayGrader - Consolidated Execution Plan

**Created:** October 31, 2025  
**Priority:** Student Bridge (FERPA Compliance) → Database Fixes → Dashboard Redesign

---

## 📊 Plan Files Status Review

### ✅ COMPLETED
1. **Dashboard Redesign** - ✅ DONE
   - File: `DASHBOARD_REDESIGN_PLAN.md`
   - Status: Dashboard.tsx fully implemented with List View and By Assignment view
   - Action: **ARCHIVE** - No further action needed

### ✅ COMPLETED (October 31, 2025)

2. **Student Bridge (FERPA Compliance)** - ✅ COMPLETE
   - Files: 
     - `FERPA_MIGRATION_PLAN.md`
     - `FERPA_IMPLEMENTATION_CHECKLIST.md`
     - `migrations/FERPA_MIGRATION_SIMPLE.sql`
   - Status: **PRODUCTION READY** - Zero PII in database
   - Completed:
     - ✅ Bridge UI fully functional
     - ✅ Database migration successful (PII removed)
     - ✅ All backend functions updated
     - ✅ All frontend components using bridge
     - ✅ FERPA compliance verified

3. **Database Column Name Fixes** - ✅ COMPLETE
   - Files: Archived in `ReusePlans/archive/`
   - Status: All functions updated to use `tablename_id` pattern
   - Completed:
     - ✅ All 7 backend functions fixed
     - ✅ Consistent naming across codebase
     - ✅ Follows `database-design.md` rules

### ❌ OBSOLETE / SUPERSEDED

4. **MIGRATION_DECISION.md** - ❌ OBSOLETE
   - Reason: Decision made - implementing full bridge (Path A)
   - Action: **DELETE** - Superseded by FERPA plans

5. **Schema v2 Proper Naming** - ❌ PARTIALLY OBSOLETE
   - File: `schema_v2_proper_naming.sql`
   - Reason: Actual database schema confirmed, bridge migration takes priority
   - Action: **ARCHIVE** - Reference only

---

## 🎯 MASTER EXECUTION PLAN

### PHASE 1: Student Bridge Implementation (FERPA Compliance)
**Priority:** 🔴 CRITICAL  
**Timeline:** 6-9 hours over 2-3 days  
**Goal:** Remove all PII from database, achieve FERPA compliance

#### Step 1.1: Data Export & Bridge File Creation (1-2 hours)
```sql
-- Export current student data
SELECT 
  student_id as uuid,
  district_student_id as localId,
  student_name as name,
  created_at as createdAt,
  tenant_id
FROM grader.students
ORDER BY tenant_id, student_name;
```

**Actions:**
- [ ] Run export query
- [ ] Save results as CSV
- [ ] Create encrypted bridge file for each tenant
- [ ] Test bridge unlock/roster display
- [ ] Verify all students appear correctly

#### Step 1.2: Frontend Code Updates (3-4 hours)

**A. Update Schema** (`src/lib/schema.ts`)
```typescript
// CHANGE FROM:
student_name: z.string().min(1).optional(),
student_id: z.string().uuid().optional(),

// CHANGE TO:
student_id: z.string().uuid(),  // Required UUID from bridge
// Remove student_name entirely
```

**B. Update Submission Form** (`src/pages/Submission.tsx`)
```typescript
import { useBridge } from '@/hooks/useBridge';

const { findByLocalId, findByName } = useBridge();

// Resolve UUID from bridge before API call
const student = findByLocalId(studentSearch) || findByName(studentSearch);
if (!student) {
  alert('Student not found in roster');
  return;
}

await ingestMutation.mutateAsync({
  student_id: student.uuid,  // Only UUID
  // NO student_name
});
```

**C. Update Dashboard** (`src/pages/Dashboard.tsx`)
```typescript
import { useBridge } from '@/hooks/useBridge';

const { findByUuid } = useBridge();

// In table rendering:
const student = findByUuid(submission.student_id);
<td>{student?.name || 'Unknown'}</td>
<td>{student?.localId}</td>
```

**D. Update CSV Export** (`src/lib/csv.ts` + Dashboard)
```typescript
const { findByUuid } = useBridge();

exportToCSV(
  data.submissions.map(s => {
    const student = findByUuid(s.student_id);
    return {
      student_id: s.student_id,
      student_name: student?.name || 'Unknown',  // From bridge
      ...
    };
  })
);
```

#### Step 1.3: Backend Function Updates (2-3 hours)

**Files to Update:**
1. ✅ `ingest.ts` - Already partially fixed
2. ❌ `list.ts` - Remove student_name from SELECT
3. ❌ `get-submission.ts` - Remove student_name from SELECT
4. ❌ `save-teacher-edits.ts` - Remove student_name references
5. ❌ `grade.ts` - Remove student_name references
6. ❌ `delete-submission.ts` - Verify no student_name usage
7. ❌ `assignments.ts` - Verify no student_name usage

**Pattern for all functions:**
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
-- No join to students needed (no PII to fetch)
```

#### Step 1.4: Database Migration (30 minutes)

**Run migration script:**
```bash
psql $DATABASE_URL -f migrations/schema_migration_ferpa_compliance.sql
```

**Steps:**
1. Create backup table
2. Verify backup
3. Remove PII columns:
   ```sql
   ALTER TABLE grader.students DROP COLUMN student_name CASCADE;
   ALTER TABLE grader.students DROP COLUMN district_student_id CASCADE;
   ```
4. Verify schema

#### Step 1.5: Testing & Verification (1-2 hours)

**Test Checklist:**
- [ ] Bridge unlocks correctly
- [ ] Submission form resolves UUID from bridge
- [ ] Dashboard displays names from bridge
- [ ] Search works with bridge
- [ ] CSV export includes names from bridge
- [ ] No student_name in API requests (check DevTools)
- [ ] No PII in database (verify with SQL)
- [ ] All existing submissions still work
- [ ] New submissions can be created

---

### PHASE 2: Database Column Name Consistency
**Priority:** 🟡 MEDIUM (Do AFTER Bridge)  
**Timeline:** 2-3 hours  
**Goal:** Fix remaining column name inconsistencies

**Current Status:**
- Database has: `student_id` (PK), not `id`
- Some functions use: `st.id` (wrong)
- Need to fix: `list.ts`, `get-submission.ts`, etc.

**Action:** This is MERGED into Phase 1 Step 1.3 above.

---

### PHASE 3: Dashboard Polish (Optional)
**Priority:** 🟢 LOW (Already functional)  
**Timeline:** 1-2 hours  
**Goal:** Minor UI improvements if needed

**Status:** Dashboard is complete and functional. Only do this if specific issues arise.

---

## 📁 File Cleanup Recommendations

### Files to DELETE (Obsolete):
```bash
rm MIGRATION_DECISION.md
rm COLUMN_NAME_FIX_SUMMARY.md
rm ACTUAL_SCHEMA_ANALYSIS.md
rm FINAL_FIX_SUMMARY.md
```

### Files to ARCHIVE (Reference only):
```bash
mkdir -p archive
mv schema_v2_proper_naming.sql archive/
mv DASHBOARD_REDESIGN_PLAN.md archive/
```

### Files to KEEP (Active):
- `FERPA_MIGRATION_PLAN.md`
- `FERPA_IMPLEMENTATION_CHECKLIST.md`
- `STUDENT_BRIDGE_DATABASE_ANALYSIS.md`
- `migrations/schema_migration_ferpa_compliance.sql`
- `MASTER_PLAN.md` (this file)

---

## 🚀 Quick Start Guide

### To Begin Implementation NOW:

1. **Export Student Data:**
   ```sql
   SELECT student_id as uuid, district_student_id as localId, 
          student_name as name, tenant_id
   FROM grader.students;
   ```

2. **Create Bridge Files** for each tenant

3. **Update Frontend Code** (see Phase 1 Step 1.2)

4. **Update Backend Functions** (see Phase 1 Step 1.3)

5. **Run Database Migration** (see Phase 1 Step 1.4)

6. **Test Everything** (see Phase 1 Step 1.5)

---

## ⚠️ Critical Notes

1. **DO NOT** run database migration until code is updated and tested
2. **KEEP BACKUPS** for at least 30 days
3. **TEST BRIDGE** thoroughly before removing PII from database
4. **VERIFY** no PII in API requests (use DevTools Network tab)

---

## 📊 Progress Tracking

### Phase 1: Student Bridge (FERPA)
- [ ] Step 1.1: Data Export & Bridge Files
- [ ] Step 1.2: Frontend Updates
- [ ] Step 1.3: Backend Updates
- [ ] Step 1.4: Database Migration
- [ ] Step 1.5: Testing & Verification

### Phase 2: Column Name Fixes
- [ ] Merged into Phase 1 Step 1.3

### Phase 3: Dashboard Polish
- [x] Dashboard Complete (no action needed)

---

## 🎯 Success Criteria

### FERPA Compliance Achieved When:
✅ No student names in database  
✅ No district IDs in database  
✅ Only UUIDs stored in cloud  
✅ Bridge required for all operations  
✅ PII stays on teacher's device  
✅ All features still work  

---

## 📞 Next Steps

**Immediate Action:** Start with Phase 1, Step 1.1 (Data Export)

**Questions?** Refer to:
- `FERPA_IMPLEMENTATION_CHECKLIST.md` for detailed steps
- `FERPA_MIGRATION_PLAN.md` for architecture details
- `migrations/schema_migration_ferpa_compliance.sql` for SQL scripts

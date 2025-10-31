# Student Identity Bridge - Database Analysis & Migration Plan

## Current Situation

### Student Bridge is Functional (Screenshots 2-5)
The Student Identity Bridge is working and stores data **locally only**:
- File: `students.bridge.json.enc.json` (666 bytes)
- Contains: Local ID (S12345), Student Name (John Smith), UUID (f4100a7c...)
- Stored locally on teacher's machine
- **Never sent to cloud/database**

### Database Schema Question
Based on the `identity.md` plan, the Student Identity Bridge architecture requires:

**BEFORE Bridge (Current - with PII in cloud):**
```sql
create table grader.students (
  id uuid primary key,
  student_name text not null,        -- ❌ PII in cloud
  student_id text,                   -- ❌ PII (district ID) in cloud
  tenant_id uuid,
  created_at timestamptz
);
```

**AFTER Bridge (Privacy-first - NO PII in cloud):**
```sql
create table grader.students (
  id uuid primary key,               -- ✅ Only UUID in cloud
  -- REMOVED: student_name
  -- REMOVED: student_id (district ID)
  tenant_id uuid,
  created_at timestamptz
);
```

## Key Questions to Answer

### 1. Is the Student Bridge Migration Complete?
Run the `show_database_schema.sql` script and check if `grader.students` table has:
- ✅ **Bridge Active**: Only `id`, `tenant_id`, `created_at` columns (NO student_name, NO student_id)
- ❌ **Bridge NOT Active**: Still has `student_name` and `student_id` columns

### 2. Current Database State (From Screenshot 1)
I can see these tables exist:
- `assignments`
- `students`
- `submission_versions`
- `submissions`
- `tenants`
- `users`

But I need to see the **column names** to determine if the bridge migration is complete.

## Migration Scenarios

### Scenario A: Bridge Migration NOT Done Yet (Most Likely)
**Current State:**
- Database still has `student_name` and `student_id` columns
- Functions expect these columns
- Bridge is functional but database hasn't been migrated

**Action Required:**
1. ✅ Keep current function code (uses `student_name`)
2. ⚠️ Plan migration for later
3. Document that bridge is "frontend-only" for now

### Scenario B: Bridge Migration IS Complete
**Current State:**
- Database already removed `student_name` and `student_id` columns
- Functions are broken because they reference removed columns
- Bridge is functional and database is migrated

**Action Required:**
1. ❌ Remove all references to `student_name` from functions
2. ✅ Functions only work with UUIDs
3. Frontend must resolve UUID from bridge before API calls

## Recommended Approach

### Step 1: Run Schema Query
Execute `show_database_schema.sql` in Neon SQL Editor and provide output.

### Step 2: Determine Migration Status
Based on the output, we'll know if:
- **Option A**: Keep current code (student_name still in DB)
- **Option B**: Update all functions to UUID-only (student_name removed from DB)

### Step 3: Update Functions Accordingly

#### If Bridge NOT Migrated (Option A - Recommended for Now)
```typescript
// Functions can still accept student_name
const { student_name, student_id } = validation.data;

// Find or create student with name
let studentResult = await sql`
  SELECT id FROM grader.students 
  WHERE tenant_id = ${tenant_id}
  AND student_name = ${student_name}
  LIMIT 1
`;
```

#### If Bridge IS Migrated (Option B)
```typescript
// Functions ONLY accept UUID (no student_name)
const { student_uuid } = validation.data;  // Changed from student_name

// Verify student exists (UUID only)
let studentResult = await sql`
  SELECT id FROM grader.students 
  WHERE tenant_id = ${tenant_id}
  AND id = ${student_uuid}  // Only UUID lookup
  LIMIT 1
`;

// If not found, create with UUID only (no name)
if (studentResult.length === 0) {
  await sql`
    INSERT INTO grader.students (id, tenant_id, created_at)
    VALUES (${student_uuid}, ${tenant_id}, NOW())
  `;
}
```

## Bridge Architecture Reminder

### How Bridge Works (From identity.md)
1. **Teacher's Browser**: Bridge file stores `{localId: "S12345", name: "John Smith", uuid: "f4100a7c..."}`
2. **Frontend**: Resolves UUID locally before API call
3. **API Call**: Only sends UUID: `{student_uuid: "f4100a7c...", essay_text: "..."}`
4. **Database**: Only stores UUID (no PII)

### Current vs Target State

**Current (Hybrid - Bridge exists but DB not migrated):**
- ✅ Bridge file functional (local only)
- ❌ Database still has PII (student_name, student_id)
- ❌ Functions still send student_name to cloud
- ⚠️ Privacy benefit: Partial (bridge exists but not enforced)

**Target (Full Privacy - Bridge + DB migrated):**
- ✅ Bridge file functional (local only)
- ✅ Database has NO PII (only UUIDs)
- ✅ Functions only accept UUIDs
- ✅ Privacy benefit: Complete (PII never leaves device)

## Next Steps

1. **Run `show_database_schema.sql`** in Neon SQL Editor
2. **Copy the output** and provide it
3. **I'll analyze** and determine exact migration status
4. **Update functions** accordingly (either keep student_name or remove it)
5. **Test** the ingest flow end-to-end

## Files to Check After Schema Analysis

### If Bridge NOT Migrated:
- ✅ Keep current `ingest.ts` (uses student_name)
- ✅ Keep current `list.ts` (returns student_name)
- ✅ Keep current `get-submission.ts` (returns student_name)
- ⚠️ Plan future migration

### If Bridge IS Migrated:
- ❌ Update `ingest.ts` - remove student_name parameter
- ❌ Update `list.ts` - don't return student_name
- ❌ Update `get-submission.ts` - don't return student_name
- ✅ Update frontend to resolve names from bridge
- ✅ Update API client to reject PII keys

## Critical Question

**Does the frontend currently send `student_name` to the API, or does it resolve UUID from bridge first?**

Looking at the bridge screenshots, it appears:
- Bridge is functional (can unlock, shows roster)
- But unclear if API integration is complete

We need to check:
1. Does `IngestRequestSchema` still have `student_name` field?
2. Does frontend submission form send name or UUID?
3. Are there PII guards in the API client?

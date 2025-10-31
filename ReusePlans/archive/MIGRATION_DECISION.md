# Migration Decision: Student Identity Bridge

## Current State Analysis

### Schema (schema.ts) - Lines 26-29
```typescript
// TRANSITION: Both student_name and student_id supported during migration
student_name: z.string().min(1).optional(), // Deprecated - will be removed
student_id: z.string().uuid().optional(), // Will become required after migration
```

### Frontend (Submission.tsx) - Line 202
```typescript
const result = await ingestMutation.mutateAsync({
  student_name: studentName,  // ❌ Still sending PII to cloud
  student_id: studentId || undefined,
  ...
});
```

### Bridge Status
- ✅ Bridge UI functional (screenshots show it working)
- ✅ Bridge stores: `{localId: "S12345", name: "John Smith", uuid: "f4100a7c..."}`
- ❌ Frontend NOT using bridge to resolve UUID before API call
- ❌ Still sending student_name directly to API

## Two Paths Forward

### Path A: Complete the Bridge Migration (Recommended for Privacy)
**Steps:**
1. Run `show_database_schema.sql` to see current DB state
2. If `student_name` column exists, run migration to remove it
3. Update all functions to UUID-only
4. Update frontend to resolve UUID from bridge before API calls
5. Remove `student_name` from IngestRequestSchema

**Benefits:**
- ✅ Full privacy: No PII in cloud
- ✅ Aligns with identity.md plan
- ✅ Bridge is already built

**Risks:**
- ⚠️ Breaking change
- ⚠️ Requires coordinated frontend + backend update
- ⚠️ Need to test bridge integration thoroughly

### Path B: Keep Current Hybrid State (Easier Short-Term)
**Steps:**
1. Run `show_database_schema.sql` to see current DB state
2. Fix `ingest.ts` to match current DB columns (already done)
3. Keep `student_name` in database
4. Keep bridge as optional feature

**Benefits:**
- ✅ No breaking changes
- ✅ Bridge available for teachers who want it
- ✅ Simpler to maintain

**Risks:**
- ❌ PII still in cloud
- ❌ Bridge not enforced
- ❌ Partial privacy benefit

## Recommendation

**Run the schema query first**, then decide:

### If Database HAS `student_name` column:
→ **Choose Path B** (keep hybrid state for now)
- Fix immediate bugs
- Plan full migration for later
- Document that bridge is "opt-in"

### If Database DOES NOT have `student_name` column:
→ **Must complete Path A** (bridge migration)
- Database already migrated
- Functions must be updated to match
- Frontend must use bridge

## Next Action

**Please run this in Neon SQL Editor:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;
```

**Expected Output (Path A - Bridge Active):**
```
column_name  | data_type | is_nullable
-------------|-----------|------------
id           | uuid      | NO
tenant_id    | uuid      | NO
created_at   | timestamp | NO
```

**Expected Output (Path B - Hybrid State):**
```
column_name  | data_type | is_nullable
-------------|-----------|------------
id           | uuid      | NO
student_name | text      | NO
student_id   | text      | YES
tenant_id    | uuid      | NO
created_at   | timestamp | NO
```

Once you provide this output, I'll know exactly which path to take and can update all functions accordingly.

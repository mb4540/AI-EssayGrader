# Final Fix Summary - Database Column Names

## What We Know For Sure

### Students Table (from your query):
```
student_id           uuid    NOT NULL  (PRIMARY KEY)
district_student_id  text    NULL
student_name         text    NOT NULL
created_at           timestamptz NOT NULL
tenant_id            uuid    NOT NULL
```

**NO `id` column exists** - only `student_id`

### Problem in Functions

Functions like `list.ts` use:
```sql
JOIN grader.students st ON s.student_ref = st.id  -- ❌ st.id doesn't exist!
```

Should be:
```sql
JOIN grader.students st ON s.student_ref = st.student_id  -- ✅ Correct
```

## Immediate Fix for ingest.ts

The `ingest.ts` function is now fixed to use:
- `SELECT student_id` (not `id`)
- `RETURNING student_id` (not `id`)
- `district_student_id` column (not `student_id` which is the PK)

## Next Steps

**Please run this query to confirm submissions table structure:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;
```

Once we have that, I'll fix:
1. ✅ `ingest.ts` - DONE (uses correct student_id)
2. ❌ `list.ts` - Needs fixing (uses st.id instead of st.student_id)
3. ❌ `get-submission.ts` - Needs fixing
4. ❌ `save-teacher-edits.ts` - Needs fixing
5. ❌ `grade.ts` - Needs fixing
6. ❌ `delete-submission.ts` - Needs checking
7. ❌ `assignments.ts` - Needs checking

## Test Now

Try clicking "Run Grade" again. The `ingest.ts` should now work correctly with:
- `student_id` as the primary key
- `district_student_id` for the external ID
- `student_name` for the name

If it works, we'll then fix the other functions!

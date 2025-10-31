# Actual Database Schema Analysis

## Students Table (CONFIRMED from query)
```sql
student_id              uuid    NOT NULL  -- PRIMARY KEY
district_student_id     text    NULL      -- External student ID from school
student_name            text    NOT NULL  -- Student's name (PII)
created_at              timestamptz NOT NULL
tenant_id               uuid    NOT NULL
```

## Critical Discovery from list.ts

The `list.ts` function uses:
```sql
JOIN grader.students st ON s.student_ref = st.id
```

But the students table has `student_id` as the primary key, not `id`.

## Two Possible Scenarios

### Scenario A: Students table has BOTH columns
```sql
id          uuid    -- Old primary key (deprecated)
student_id  uuid    -- New primary key (current)
```

### Scenario B: The joins are WRONG
The joins should be:
```sql
JOIN grader.students st ON s.student_ref = st.student_id
```

## What We Need to Know

Run this query to check if there's an `id` column:
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
  AND column_name IN ('id', 'student_id');
```

**If returns both 'id' and 'student_id':**
- Students table is in transition
- Has both old (`id`) and new (`student_id`) primary keys
- Joins currently use `st.id`
- We should update to use `st.student_id` eventually

**If returns only 'student_id':**
- All the joins in `list.ts`, `get-submission.ts`, etc. are BROKEN
- They're trying to join on `st.id` which doesn't exist
- This would cause errors when listing submissions

## Most Likely Reality

Given that `list.ts` works (presumably), the students table likely has:
```sql
id          uuid PRIMARY KEY          -- Current PK (old naming)
student_id  uuid UNIQUE               -- Transition column (will become PK)
district_student_id text               -- External ID
student_name text NOT NULL             -- Name
tenant_id   uuid NOT NULL
created_at  timestamptz NOT NULL
```

## Action Plan

1. **Confirm** if `id` column exists in students table
2. **If YES**: Use `st.id` in joins (current state)
3. **If NO**: Fix all joins to use `st.student_id`

The query you provided shows `student_id` as the FIRST column, which suggests it's the primary key. But the joins use `st.id`, which suggests there's ALSO an `id` column.

**Please run:**
```sql
SELECT column_name, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'students'
ORDER BY ordinal_position;
```

This will show ALL columns in order, so we can see if `id` exists.

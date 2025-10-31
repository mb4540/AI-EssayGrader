# Column Name Fix Summary

## Problem
The database schema and Netlify functions have inconsistent column naming:

### Schema v2 (schema_v2_proper_naming.sql) - CORRECT
```sql
-- Students table
create table grader.students (
  student_id uuid primary key,
  district_student_id text,
  student_name text not null,
  ...
);

-- Assignments table  
create table grader.assignments (
  assignment_id uuid primary key,
  title text not null,
  ...
);

-- Submissions table
create table grader.submissions (
  submission_id uuid primary key,
  student_id uuid not null references grader.students(student_id),
  assignment_id uuid references grader.assignments(assignment_id),
  ...
);
```

### Current Functions - INCORRECT
Functions are using:
- `st.id` instead of `st.student_id`
- `a.id` instead of `a.assignment_id`
- `s.id` instead of `s.submission_id`
- `s.student_ref` instead of `s.student_id` (foreign key)
- `s.assignment_ref` instead of `s.assignment_id` (foreign key)

## Solution
Two options:

### Option 1: Update Database to Match Schema v2 (RECOMMENDED)
Run the schema_v2_proper_naming.sql migration to rename all columns properly.

### Option 2: Update Functions to Match Current Database
If the database still uses old column names, update all functions to use consistent naming.

## Files That Need Updates

### ✅ Fixed
- `ingest.ts` - Partially fixed (uses student_id, assignment_id for primary keys)

### ❌ Need Fixing
- `list.ts` - Uses `st.id`, `a.id`, `s.id`, `student_ref`, `assignment_ref`
- `get-submission.ts` - Uses `st.id`, `a.id`, `s.id`, `student_ref`, `assignment_ref`
- `save-teacher-edits.ts` - Uses `s.id`, `student_ref`
- `grade.ts` - Uses `s.id`, `student_ref`
- `delete-submission.ts` - Likely uses `s.id`
- `assignments.ts` - Likely uses `a.id`

## Next Steps
1. Verify which column names are actually in the production database
2. Either run migration or update all functions to match
3. Test all endpoints after changes

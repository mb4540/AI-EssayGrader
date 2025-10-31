---
trigger: always_on
---

# Database Design Rules

## 📋 Database Reference File

**ALWAYS consult [/db_ref.md](cci:7://file:///Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader/db_ref.md:0:0-0:0) before making database changes!**

This file contains the complete, up-to-date schema including:
- All tables and columns
- All foreign keys and relationships
- All indexes and constraints
- Current row counts and sizes
- FERPA compliance status

### Workflow:
1. **BEFORE changes**: Read [/db_ref.md](cci:7://file:///Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader/db_ref.md:0:0-0:0) to understand current schema
2. **AFTER changes**: Update [/db_ref.md](cci:7://file:///Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader/db_ref.md:0:0-0:0) with new schema
   - Run [/get_complete_schema.sql](cci:7://file:///Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader/get_complete_schema.sql:0:0-0:0) in Neon
   - Update timestamp and migration history
   - Commit both migration SQL and updated db_ref.md

## Overview
Standards and best practices for database schema design in the FastAI Grader project.

## Table of Contents
- [Naming Conventions](#naming-conventions)
- [Primary Keys](#primary-keys)
- [Foreign Keys](#foreign-keys)
- [Indexes](#indexes)
- [Data Types](#data-types)
- [Constraints](#constraints)
- [Schema Organization](#schema-organization)

## Core Principles

1. **Clarity over brevity** - Use descriptive names
2. **Consistency** - Follow the same patterns throughout
3. **Explicit relationships** - Make foreign keys obvious
4. **Future-proof** - Design for scalability and changes

## Naming Conventions

### Tables
**DO:**
- ✅ Use plural nouns: `students`, `assignments`, `submissions`
- ✅ Use lowercase with underscores: `submission_versions`
- ✅ Be descriptive: `assignment_criteria` not `criteria`

**DON'T:**
- ❌ Use singular: `student`, `assignment`
- ❌ Use camelCase: `submissionVersions`
- ❌ Use abbreviations: `sub_vers`

### Columns
**DO:**
- ✅ Use lowercase with underscores: `student_name`, `created_at`
- ✅ Be explicit: `teacher_grade` not `grade`
- ✅ Use standard suffixes: `_at` for timestamps, `_id` for IDs

**DON'T:**
- ❌ Use camelCase: `studentName`
- ❌ Use ambiguous names: `data`, `value`, `info`

## Primary Keys

### ❌ AVOID: Generic "id" Column

**Problem:**
```sql
-- BAD: Ambiguous when joining tables
create table students (
  id uuid primary key,  -- Which table's ID is this?
  student_name text
);

create table submissions (
  id uuid primary key,  -- Confusion in joins
  student_id uuid references students(id)
);
```

### ✅ PREFERRED: Table-Prefixed ID

**Solution:**
```sql
-- GOOD: Clear and explicit
create table students (
  student_id uuid primary key default gen_random_uuid(),
  student_name text not null,
  created_at timestamptz not null default now()
);

create table submissions (
  submission_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(student_id),
  created_at timestamptz not null default now()
);
```

**Benefits:**
- ✅ Clear in SELECT statements: `SELECT student_id, submission_id FROM ...`
- ✅ No ambiguity in joins: `JOIN students USING (student_id)`
- ✅ Self-documenting code
- ✅ Easier debugging and logging

### Exception: Composite Primary Keys

For junction tables, use both referenced IDs:

```sql
create table student_assignments (
  student_id uuid not null references students(student_id),
  assignment_id uuid not null references assignments(assignment_id),
  assigned_at timestamptz not null default now(),
  primary key (student_id, assignment_id)
);
```

## Foreign Keys

### Naming Convention

**Pattern:** `{referenced_table_singular}_id`

**Examples:**
```sql
create table submissions (
  submission_id uuid primary key,
  student_id uuid not null references students(student_id),
  assignment_id uuid references assignments(assignment_id),
  grader_id uuid references users(user_id)
);
```

### Reference Actions

**DO:**
- ✅ Be explicit about cascade behavior
- ✅ Use `ON DELETE RESTRICT` for critical relationships
- ✅ Use `ON DELETE CASCADE` for dependent data
- ✅ Use `ON DELETE SET NULL` for optional relationships

**Example:**
```sql
create table submissions (
  submission_id uuid primary key,
  -- Critical: Don't allow deleting students with submissions
  student_id uuid not null references students(student_id) 
    ON DELETE RESTRICT,
  -- Optional: Assignment can be deleted
  assignment_id uuid references assignments(assignment_id) 
    ON DELETE SET NULL,
  created_at timestamptz not null default now()
);

create table submission_versions (
  version_id uuid primary key,
  -- Dependent: Delete versions when submission is deleted
  submission_id uuid not null references submissions(submission_id) 
    ON DELETE CASCADE,
  snapshot_at timestamptz not null default now()
);
```

## Indexes

### Naming Convention

**Pattern:** `idx_{table}_{column(s)}`

**Examples:**
```sql
-- Single column index
create index idx_students_email on students(email);

-- Multi-column index
create index idx_submissions_student_assignment 
  on submissions(student_id, assignment_id);

-- Partial index
create index idx_submissions_pending 
  on submissions(created_at) 
  where teacher_grade is null;
```

### When to Add Indexes

**DO:**
- ✅ Foreign key columns (for join performance)
- ✅ Columns used in WHERE clauses frequently
- ✅ Columns used in ORDER BY
- ✅ Columns used for uniqueness constraints

**Example:**
```sql
create table students (
  student_id uuid primary key,
  email text unique,  -- Automatic index
  student_name text not null,
  district_id text,
  created_at timestamptz not null default now()
);

-- Add index for common queries
create index idx_students_district on students(district_id);
create index idx_students_created on students(created_at);
```

## Data Types

### Standard Types

**Use these consistently:**

| Purpose | Type | Example |
|---------|------|---------|
| Primary/Foreign Keys | `uuid` | `student_id uuid` |
| Short text | `text` or `varchar(n)` | `student_name text` |
| Long text | `text` | `essay_content text` |
| Numbers (exact) | `numeric(p,s)` | `grade numeric(5,2)` |
| Numbers (approx) | `integer`, `bigint` | `attempt_count integer` |
| Timestamps | `timestamptz` | `created_at timestamptz` |
| Booleans | `boolean` | `is_active boolean` |
| JSON data | `jsonb` | `ai_feedback jsonb` |

### UUID vs Serial

**Prefer UUID for:**
- ✅ Distributed systems
- ✅ Public-facing IDs
- ✅ Merging data from multiple sources
- ✅ Security (non-sequential)

**Use Serial for:**
- ✅ Internal ordering
- ✅ Simple auto-increment needs
- ✅ Performance-critical sequences

**Example:**
```sql
create table students (
  student_id uuid primary key default gen_random_uuid(),
  sequence_number serial,  -- For internal ordering
  student_name text not null
);
```

## Constraints

### NOT NULL

**DO:**
- ✅ Use `NOT NULL` for required fields
- ✅ Be explicit about optional fields

```sql
create table students (
  student_id uuid primary key,
  student_name text not null,           -- Required
  email text,                            -- Optional
  district_id text,                      -- Optional
  created_at timestamptz not null default now()
);
```

### CHECK Constraints

**DO:**
- ✅ Validate data at database level
- ✅ Use for enums and ranges

```sql
create table submissions (
  submission_id uuid primary key,
  source_type text not null 
    check (source_type in ('text', 'docx', 'image', 'pdf')),
  ai_grade numeric(5,2) 
    check (ai_grade >= 0 and ai_grade <= 100),
  teacher_grade numeric(5,2) 
    check (teacher_grade >= 0 and teacher_grade <= 100)
);
```

### UNIQUE Constraints

**DO:**
- ✅ Prevent duplicate data
- ✅ Use composite unique constraints when needed

```sql
create table students (
  student_id uuid primary key,
  email text unique,  -- One email per student
  district_id text,
  student_name text not null,
  -- Composite unique: same student can't be added twice
  unique(district_id, student_name)
);
```

## Schema Organization

### Use Schemas for Namespacing

**DO:**
- ✅ Group related tables in schemas
- ✅ Use `grader` schema for application tables
- ✅ Keep `public` schema for extensions

```sql
-- Create application schema
create schema if not exists grader;

-- Create tables in schema
create table grader.students (
  student_id uuid primary key,
  student_name text not null
);

create table grader.submissions (
  submission_id uuid primary key,
  student_id uuid not null references grader.students(student_id)
);
```

## Timestamps

### Standard Timestamp Columns

**DO:**
- ✅ Always include `created_at`
- ✅ Include `updated_at` for mutable records
- ✅ Use `timestamptz` (with timezone)
- ✅ Default to `now()`

```sql
create table submissions (
  submission_id uuid primary key,
  student_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update trigger
create or replace function grader.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_submissions_updated
before update on grader.submissions
for each row execute function grader.update_timestamp();
```

## Migration Strategy

### Schema Changes

**DO:**
- ✅ Use migration files: `schema_migration_*.sql`
- ✅ Make changes backwards compatible when possible
- ✅ Test on development branch first
- ✅ Document breaking changes

**Example migration:**
```sql
-- schema_migration_add_email_to_students.sql
-- Adds email column to students table

alter table grader.students 
add column email text;

create unique index idx_students_email 
on grader.students(email);

-- Backfill existing records if needed
update grader.students 
set email = student_id || '@temp.example.com'
where email is null;
```

## Common Patterns

### Audit Trail

```sql
create table grader.submission_versions (
  version_id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references grader.submissions(submission_id) 
    on delete cascade,
  ai_grade numeric(5,2),
  teacher_grade numeric(5,2),
  changed_by uuid references grader.users(user_id),
  snapshot_at timestamptz not null default now()
);

create index idx_submission_versions_submission 
on grader.submission_versions(submission_id, snapshot_at desc);
```

### Soft Deletes

```sql
create table grader.students (
  student_id uuid primary key,
  student_name text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Query only active records
create view grader.active_students as
select * from grader.students
where deleted_at is null;
```

## Checklist

Before creating/modifying tables:

- [ ] Primary key uses `{table}_id` naming
- [ ] Foreign keys use `{referenced_table}_id` naming
- [ ] All foreign keys have explicit `ON DELETE` behavior
- [ ] Required fields have `NOT NULL` constraint
- [ ] Enums use `CHECK` constraints
- [ ] Indexes created for foreign keys
- [ ] Timestamps use `timestamptz` with `default now()`
- [ ] Tables are in `grader` schema
- [ ] Migration file created if modifying existing schema

## Resources

- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Foreign Key Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- Related: `.windsurf/rules/neon-database.md`
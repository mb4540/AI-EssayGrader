-- FastAIGrader Database Schema
-- Run this in your Neon Postgres console to set up the database

create schema if not exists grader;

-- Students table
create table if not exists grader.students (
  id uuid constraint students_id_pkey primary key default gen_random_uuid(),
  student_id text,         -- district/student system id (optional but indexed)
  student_name text not null,
  created_at timestamptz not null default now(),
  unique(student_id, student_name)
);
create index if not exists idx_students_student_id on grader.students(student_id);

-- Assignments table
create table if not exists grader.assignments (
  id uuid constraint assignments_id_pkey primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Submissions table
create table if not exists grader.submissions (
  id uuid constraint submissions_id_pkey primary key default gen_random_uuid(),
  student_ref uuid not null references grader.students(id) on delete restrict,
  assignment_ref uuid references grader.assignments(id) on delete set null,
  source_type text not null check (source_type in ('text','docx','image')),
  verbatim_text text not null,                  -- OCR/DOCX/plain
  teacher_criteria text not null,
  ai_grade numeric(5,2),                        -- AI's suggestion
  ai_feedback jsonb,                            -- structured feedback (see schema)
  teacher_grade numeric(5,2),                   -- teacher editable
  teacher_feedback text,                        -- teacher editable
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Submission versions table (audit trail)
create table if not exists grader.submission_versions (
  id uuid constraint submission_versions_id_pkey primary key default gen_random_uuid(),
  submission_ref uuid not null references grader.submissions(id) on delete cascade,
  ai_grade numeric(5,2),
  ai_feedback jsonb,
  teacher_grade numeric(5,2),
  teacher_feedback text,
  snapshot_at timestamptz not null default now()
);

-- Trigger function to update updated_at timestamp
create or replace function grader.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

-- Trigger to automatically update updated_at on submissions
drop trigger if exists trg_touch_updated_at on grader.submissions;
create trigger trg_touch_updated_at
before update on grader.submissions
for each row execute function grader.touch_updated_at();

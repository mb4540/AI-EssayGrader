-- FastAIGrader Database Schema v2
-- Updated with proper naming conventions: tablename_id for primary keys
-- Run this in your Neon Postgres console to set up the database

create schema if not exists grader;

-- Students table
create table if not exists grader.students (
  student_id uuid constraint students_pkey primary key default gen_random_uuid(),
  district_student_id text,    -- district/student system id (optional but indexed)
  student_name text not null,
  created_at timestamptz not null default now(),
  unique(district_student_id, student_name)
);
create index if not exists idx_students_district on grader.students(district_student_id);

-- Assignments table
create table if not exists grader.assignments (
  assignment_id uuid constraint assignments_pkey primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Submissions table
create table if not exists grader.submissions (
  submission_id uuid constraint submissions_pkey primary key default gen_random_uuid(),
  student_id uuid not null references grader.students(student_id) on delete restrict,
  assignment_id uuid references grader.assignments(assignment_id) on delete set null,
  source_type text not null check (source_type in ('text','docx','image','pdf')),
  verbatim_text text not null,                  -- OCR/DOCX/plain
  teacher_criteria text not null,
  ai_grade numeric(5,2) check (ai_grade >= 0 and ai_grade <= 100),
  ai_feedback jsonb,                            -- structured feedback
  teacher_grade numeric(5,2) check (teacher_grade >= 0 and teacher_grade <= 100),
  teacher_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for foreign keys
create index if not exists idx_submissions_student on grader.submissions(student_id);
create index if not exists idx_submissions_assignment on grader.submissions(assignment_id);

-- Submission versions table (audit trail)
create table if not exists grader.submission_versions (
  version_id uuid constraint submission_versions_pkey primary key default gen_random_uuid(),
  submission_id uuid not null references grader.submissions(submission_id) on delete cascade,
  ai_grade numeric(5,2) check (ai_grade >= 0 and ai_grade <= 100),
  ai_feedback jsonb,
  teacher_grade numeric(5,2) check (teacher_grade >= 0 and teacher_grade <= 100),
  teacher_feedback text,
  snapshot_at timestamptz not null default now()
);

-- Index for version history queries
create index if not exists idx_submission_versions_submission 
  on grader.submission_versions(submission_id, snapshot_at desc);

-- Trigger function to update updated_at timestamp
create or replace function grader.update_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

-- Trigger to automatically update updated_at on submissions
drop trigger if exists trg_submissions_updated on grader.submissions;
create trigger trg_submissions_updated
before update on grader.submissions
for each row execute function grader.update_timestamp();

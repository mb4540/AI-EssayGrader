-- Migration: Add background_tasks table for async job tracking
-- Created: November 14, 2025
-- Purpose: Track long-running background jobs (grading, etc.) to avoid 30-second function timeouts

CREATE TABLE IF NOT EXISTS grader.background_tasks (
  task_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES grader.tenants(tenant_id) ON DELETE CASCADE,
  task_type text NOT NULL, -- 'grading', 'assessment_generation', etc.
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  input_data jsonb NOT NULL, -- Original request data
  output_data jsonb, -- Result data when completed
  error_message text, -- Error details if failed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for efficient queries
CREATE INDEX idx_background_tasks_tenant ON grader.background_tasks(tenant_id);
CREATE INDEX idx_background_tasks_status ON grader.background_tasks(status);
CREATE INDEX idx_background_tasks_type ON grader.background_tasks(task_type);
CREATE INDEX idx_background_tasks_created ON grader.background_tasks(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX idx_background_tasks_tenant_status ON grader.background_tasks(tenant_id, status);

-- Add constraint for valid status values
ALTER TABLE grader.background_tasks 
ADD CONSTRAINT chk_background_tasks_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add constraint for valid task types
ALTER TABLE grader.background_tasks 
ADD CONSTRAINT chk_background_tasks_type 
CHECK (task_type IN ('grading', 'assessment_generation', 'lesson_plan_generation', 'text_extraction'));

COMMENT ON TABLE grader.background_tasks IS 'Tracks long-running background jobs to avoid function timeouts';
COMMENT ON COLUMN grader.background_tasks.task_id IS 'Unique identifier for the background task (UUID)';
COMMENT ON COLUMN grader.background_tasks.task_type IS 'Type of background task being performed';
COMMENT ON COLUMN grader.background_tasks.status IS 'Current status: pending, processing, completed, or failed';
COMMENT ON COLUMN grader.background_tasks.input_data IS 'Original request parameters as JSON';
COMMENT ON COLUMN grader.background_tasks.output_data IS 'Result data when task completes successfully';
COMMENT ON COLUMN grader.background_tasks.error_message IS 'Error details if task fails';

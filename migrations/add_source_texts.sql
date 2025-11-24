-- Migration: Add source_texts table for book reports and source-based writing
-- Created: November 24, 2025
-- Purpose: Enable teachers to upload source texts (books, articles, passages) 
--          that students write about, for context-aware AI grading

-- Create source_texts table
CREATE TABLE IF NOT EXISTS grader.source_texts (
  source_text_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES grader.users(user_id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  blob_key TEXT NOT NULL,  -- Netlify Blobs storage key
  writing_prompt TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt')),
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_source_texts_tenant ON grader.source_texts(tenant_id);
CREATE INDEX idx_source_texts_teacher ON grader.source_texts(teacher_id);
CREATE INDEX idx_source_texts_created ON grader.source_texts(created_at DESC);

-- Add source_text_id to assignments table
ALTER TABLE grader.assignments 
ADD COLUMN source_text_id UUID REFERENCES grader.source_texts(source_text_id) ON DELETE SET NULL;

-- Index for assignments with source texts
CREATE INDEX idx_assignments_source_text ON grader.assignments(source_text_id) 
WHERE source_text_id IS NOT NULL;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION grader.update_source_texts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_texts_updated
BEFORE UPDATE ON grader.source_texts
FOR EACH ROW EXECUTE FUNCTION grader.update_source_texts_timestamp();

-- Verify migration
SELECT 'source_texts table created successfully' AS status;

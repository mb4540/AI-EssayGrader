-- Migration: Add inline annotations feature
-- Date: November 1, 2025
-- Purpose: Support AI-suggested and teacher-created inline annotations with audit trail

-- ============================================================================
-- Table: grader.annotations
-- Purpose: Store inline annotations (AI-suggested and teacher-created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS grader.annotations (
  annotation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES grader.submissions(submission_id) ON DELETE CASCADE,
  
  -- Text location
  line_number integer NOT NULL CHECK (line_number > 0),
  start_offset integer NOT NULL CHECK (start_offset >= 0),
  end_offset integer NOT NULL CHECK (end_offset >= start_offset),
  quote text NOT NULL, -- The actual text being annotated
  
  -- Annotation content
  category text NOT NULL, -- e.g., "Spelling", "Grammar", "Organization"
  suggestion text NOT NULL, -- The feedback/suggestion text
  severity text CHECK (severity IN ('info', 'warning', 'error')),
  
  -- Workflow state
  status text NOT NULL DEFAULT 'ai_suggested' 
    CHECK (status IN ('ai_suggested', 'teacher_edited', 'teacher_rejected', 'teacher_approved', 'teacher_created')),
  
  -- Metadata
  created_by uuid REFERENCES grader.users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Audit: store original AI payload for reference
  ai_payload jsonb
);

-- Indexes for performance
CREATE INDEX idx_annotations_submission ON grader.annotations(submission_id);
CREATE INDEX idx_annotations_status ON grader.annotations(status);
CREATE INDEX idx_annotations_line ON grader.annotations(submission_id, line_number);
CREATE INDEX idx_annotations_created_by ON grader.annotations(created_by) WHERE created_by IS NOT NULL;

-- ============================================================================
-- Table: grader.annotation_events
-- Purpose: Audit trail for all annotation lifecycle events
-- ============================================================================

CREATE TABLE IF NOT EXISTS grader.annotation_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id uuid NOT NULL REFERENCES grader.annotations(annotation_id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL 
    CHECK (event_type IN ('ai_created', 'teacher_edit', 'teacher_reject', 'teacher_approve', 'teacher_create', 'teacher_delete')),
  
  -- Event payload (stores before/after state for edits)
  payload jsonb NOT NULL,
  
  -- Who performed the action
  created_by uuid REFERENCES grader.users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX idx_annotation_events_annotation ON grader.annotation_events(annotation_id, created_at DESC);
CREATE INDEX idx_annotation_events_type ON grader.annotation_events(event_type);
CREATE INDEX idx_annotation_events_created_by ON grader.annotation_events(created_by) WHERE created_by IS NOT NULL;

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION grader.update_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_annotations_updated
BEFORE UPDATE ON grader.annotations
FOR EACH ROW EXECUTE FUNCTION grader.update_annotation_timestamp();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE grader.annotations IS 'Inline annotations on student submissions with AI suggestions and teacher edits';
COMMENT ON TABLE grader.annotation_events IS 'Audit trail for annotation lifecycle events';

COMMENT ON COLUMN grader.annotations.line_number IS 'Line number in the original text (1-indexed)';
COMMENT ON COLUMN grader.annotations.start_offset IS 'Character offset from start of text';
COMMENT ON COLUMN grader.annotations.end_offset IS 'Character offset to end of annotated span';
COMMENT ON COLUMN grader.annotations.quote IS 'The actual text being annotated (for validation)';
COMMENT ON COLUMN grader.annotations.status IS 'Workflow state: ai_suggested, teacher_edited, teacher_rejected, teacher_approved, teacher_created';
COMMENT ON COLUMN grader.annotations.ai_payload IS 'Original AI response for audit trail';

COMMENT ON COLUMN grader.annotation_events.event_type IS 'Type of event: ai_created, teacher_edit, teacher_reject, teacher_approve, teacher_create, teacher_delete';
COMMENT ON COLUMN grader.annotation_events.payload IS 'Event data including before/after state for edits';

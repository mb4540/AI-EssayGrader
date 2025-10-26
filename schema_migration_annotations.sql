-- Migration: Add annotation support for PDF/DOCX submissions
-- Date: 2025-10-12
-- Purpose: Enable teacher markup with highlights, comments, and pen strokes

-- ============================================================================
-- ANNOTATION PAGES TABLE
-- ============================================================================
-- Stores page metadata for each submission page that has annotations
-- Links to existing grader.submissions table via submission_id

CREATE TABLE IF NOT EXISTS grader.annotation_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES grader.submissions(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  width_px INT,   -- Canvas dimensions for coordinate mapping
  height_px INT,  -- Used to scale annotations properly
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, page_number)
);

-- Index for fast page lookups
CREATE INDEX IF NOT EXISTS idx_annotation_pages_submission 
ON grader.annotation_pages(submission_id);

COMMENT ON TABLE grader.annotation_pages 
IS 'Page metadata for submissions with annotations';

COMMENT ON COLUMN grader.annotation_pages.width_px 
IS 'Original canvas width in pixels for coordinate mapping';

COMMENT ON COLUMN grader.annotation_pages.height_px 
IS 'Original canvas height in pixels for coordinate mapping';

-- ============================================================================
-- ANNOTATIONS TABLE
-- ============================================================================
-- Individual annotations (highlights, comments, pen strokes, underlines)
-- NO teacher_id - single teacher per deployment

CREATE TABLE IF NOT EXISTS grader.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES grader.annotation_pages(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('highlight','comment','pen','underline')) NOT NULL,
  
  -- Coordinates stored as JSONB for flexibility
  rect JSONB,              -- {x, y, w, h} for highlight/comment rectangles
  path JSONB,              -- [{x, y}, {x, y}, ...] for pen strokes
  
  -- Styling
  color_rgba TEXT DEFAULT 'rgba(255,235,59,0.45)',  -- Yellow highlight default
  stroke_width INT DEFAULT 2,
  
  -- Content
  text TEXT,               -- Comment text content
  
  -- Layering
  z_index INT DEFAULT 0,   -- For overlapping annotations
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast page-level queries
CREATE INDEX IF NOT EXISTS idx_annotations_page_id 
ON grader.annotations(page_id);

-- Index for querying by type
CREATE INDEX IF NOT EXISTS idx_annotations_type 
ON grader.annotations(type);

COMMENT ON TABLE grader.annotations 
IS 'Teacher annotations: highlights, comments, pen strokes, underlines';

COMMENT ON COLUMN grader.annotations.rect 
IS 'JSON: {x, y, w, h} for rectangular annotations (highlight, comment)';

COMMENT ON COLUMN grader.annotations.path 
IS 'JSON: [{x, y}, ...] array of points for pen strokes';

COMMENT ON COLUMN grader.annotations.color_rgba 
IS 'CSS rgba() color string, e.g., rgba(255,235,59,0.45)';

-- ============================================================================
-- ANNOTATION VERSIONS TABLE
-- ============================================================================
-- Version snapshots for undo/redo functionality and audit trail
-- Stores complete page state at each meaningful change

CREATE TABLE IF NOT EXISTS grader.annotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES grader.annotation_pages(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  annotations_snapshot JSONB NOT NULL,  -- Full array of annotations for the page
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, version_number)
);

-- Index for version lookups
CREATE INDEX IF NOT EXISTS idx_annotation_versions_page 
ON grader.annotation_versions(page_id, version_number DESC);

COMMENT ON TABLE grader.annotation_versions 
IS 'Version history for undo/redo and audit trail';

COMMENT ON COLUMN grader.annotation_versions.annotations_snapshot 
IS 'JSONB array of complete page state at this version';

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp on annotation changes

CREATE OR REPLACE FUNCTION grader.touch_annotation_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_annotations_updated_at ON grader.annotations;

CREATE TRIGGER trg_annotations_updated_at
BEFORE UPDATE ON grader.annotations
FOR EACH ROW 
EXECUTE FUNCTION grader.touch_annotation_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm setup)
-- ============================================================================
-- Uncomment and run to verify tables created successfully:

-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'grader' 
--   AND table_name IN ('annotation_pages', 'annotations', 'annotation_versions')
-- ORDER BY table_name, ordinal_position;

-- SELECT * FROM pg_indexes 
-- WHERE schemaname = 'grader' 
--   AND tablename LIKE 'annotation%';

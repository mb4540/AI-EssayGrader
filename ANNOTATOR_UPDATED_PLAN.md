# PDF/DOCX Annotation Feature - Updated Plan for FastAIGrader

## Executive Summary

Add teacher annotation capabilities to existing FastAIGrader submission workflow:
- Highlight text, add comments, draw freehand annotations
- Works with existing PDF/DOCX uploads (already stored in Netlify Blobs)
- Integrates with current `grader.submissions` table (no separate documents table)
- Autosave to Neon Postgres
- Export annotated PDFs

---

## Current Codebase Analysis

### ✅ What We Already Have
1. **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
2. **Backend**: Netlify Functions + Neon Postgres
3. **File Storage**: Netlify Blobs (working with NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN)
4. **PDF/DOCX Handling**: 
   - `pdf.js` already configured in `VerbatimViewer.tsx`
   - Worker bundled locally at `public/assets/pdf.worker.min.mjs`
   - DOCX extraction via `mammoth` library
5. **Database Tables**:
   - `grader.students` - Student records
   - `grader.submissions` - Essay submissions (has `original_file_url` for blobs)
   - `grader.submission_versions` - Version history
   - `grader.assignments` - Assignment templates
6. **Components**:
   - `VerbatimViewer.tsx` - Shows extracted text (readonly display)
   - `Submission.tsx` - Main submission page
   - `GradePanel.tsx` - Shows AI feedback

### ⚠️ What We Need to Add
1. **Database**: Annotation tables (pages, annotations, versions)
2. **Components**: Annotation viewer with overlay + toolbar
3. **API**: CRUD endpoints for annotations
4. **Export**: Server-side PDF flattening

---

## Phase 1: Database Schema (New Tables)

### Migration SQL: `schema_migration_annotations.sql`

```sql
-- Annotation layers (one per submission page)
-- Links to existing grader.submissions table
CREATE TABLE IF NOT EXISTS grader.annotation_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES grader.submissions(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  width_px INT,  -- Canvas dimensions for coordinate mapping
  height_px INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, page_number)
);

-- Individual annotations (NO AUTH - single teacher per site for now)
CREATE TABLE IF NOT EXISTS grader.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES grader.annotation_pages(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('highlight','comment','pen','underline')) NOT NULL,
  -- Coordinates (JSON)
  rect JSONB,              -- {x, y, w, h} for highlight/comment
  path JSONB,              -- [{x, y}, ...] for pen strokes
  -- Styling
  color_rgba TEXT DEFAULT 'rgba(255,235,59,0.45)',
  stroke_width INT DEFAULT 2,
  -- Content
  text TEXT,               -- Comment text
  z_index INT DEFAULT 0,   -- Layering
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast page-level queries
CREATE INDEX IF NOT EXISTS idx_annotations_page_id ON grader.annotations(page_id);

-- Version snapshots (for undo/redo history)
CREATE TABLE IF NOT EXISTS grader.annotation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES grader.annotation_pages(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  annotations_snapshot JSONB NOT NULL,  -- Full page state
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, version_number)
);

-- Auto-update updated_at trigger for annotations
CREATE OR REPLACE FUNCTION grader.touch_annotation_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_annotations_updated_at
BEFORE UPDATE ON grader.annotations
FOR EACH ROW EXECUTE FUNCTION grader.touch_annotation_updated_at();
```

---

## Phase 2: API Endpoints (Netlify Functions)

### New Functions to Create

#### 1. `netlify/functions/annotations-get.ts`
```typescript
// GET annotations for a submission page
// Query params: submission_id, page_number
// Returns: { page_id, annotations: [...] }
```

#### 2. `netlify/functions/annotations-upsert.ts`
```typescript
// POST batch create/update/delete annotations
// Body: {
//   submission_id, page_number,
//   ops: [
//     { op: 'upsert', annotation: {...} },
//     { op: 'delete', id: 'uuid' }
//   ]
// }
// Auto-creates annotation_pages row if first annotation on page
```

#### 3. `netlify/functions/annotations-export-pdf.ts`
```typescript
// POST generate annotated PDF
// Body: { submission_id, pages: [1,2,3] }
// Uses pdf-lib to flatten annotations onto original PDF
// Uploads to Netlify Blobs, returns download URL
```

#### 4. `netlify/functions/convert-docx-to-pdf.ts`
```typescript
// POST convert DOCX to PDF
// Body: { file_data: base64, submission_id }
// Uses LibreOffice headless or CloudConvert API
// Stores PDF in Netlify Blobs
// Returns: { pdf_url }
```

---

## Phase 3: Frontend Components

### New Components to Create

#### 1. `src/components/AnnotationViewer.tsx`
**Purpose**: Main annotation canvas with overlay

**Features**:
- Renders PDF pages using existing pdf.js setup
- Transparent overlay `<canvas>` for annotations
- Mouse/touch event handlers for drawing
- Integrates with `useAnnotations` hook for state

**Props**:
```typescript
interface AnnotationViewerProps {
  submissionId: string;
  originalFileUrl: string;  // From grader.submissions.original_file_url
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}
```

#### 2. `src/components/AnnotationToolbar.tsx`
**Purpose**: Tool selection and settings

**Tools**:
- Highlight (H key)
- Comment (C key) 
- Pen (P key)
- Eraser/Delete (Del key)
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- Color picker
- **Export PNG** button (downloads current page as PNG)
- **Export PDF** button (downloads full annotated PDF)

#### 3. `src/components/AnnotationOverlay.tsx`
**Purpose**: SVG/Canvas layer that renders annotations

**Renders**:
- Highlights as `<rect>` with semi-transparent fill
- Comments as draggable cards with text
- Pen strokes as `<path>` elements
- Selection handles when annotation is focused

#### 4. `src/components/CommentCard.tsx`
**Purpose**: Floating comment box (like Google Docs comments)

**Features**:
- Red title bar (to look like "red pen")
- Textarea for feedback text
- Draggable/resizable
- Auto-resize to fit content

### Modified Components

#### Update `src/pages/Submission.tsx`
Add new "Annotate" tab alongside existing view:

```typescript
<Tabs value={viewMode} onValueChange={setViewMode}>
  <TabsList>
    <TabsTrigger value="grade">AI Grade</TabsTrigger>
    <TabsTrigger value="annotate">Annotate PDF</TabsTrigger>
  </TabsList>
  
  <TabsContent value="grade">
    {/* Existing VerbatimViewer + GradePanel */}
  </TabsContent>
  
  <TabsContent value="annotate">
    <AnnotationViewer 
      submissionId={submissionId}
      originalFileUrl={originalFileUrl}
    />
  </TabsContent>
</Tabs>
```

---

## Phase 4: Custom Hooks

### `src/hooks/useAnnotations.ts`
```typescript
// Manages annotation state + autosave
// - Fetches annotations on mount
// - Debounced autosave (800ms)
// - Undo/redo stack
// - Batch upsert to API

export function useAnnotations(submissionId: string, pageNumber: number) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  
  // Load from API on mount
  useEffect(() => { /* fetch */ }, []);
  
  // Autosave with debounce
  useAutosave(annotations, async (annots) => {
    await upsertAnnotations({ submission_id: submissionId, page_number: pageNumber, ops: [...] });
  }, 800);
  
  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    selectedId,
    selectAnnotation
  };
}
```

### `src/hooks/usePdfPages.ts`
```typescript
// Wraps existing pdf.js logic from VerbatimViewer
// Loads PDF, renders pages to canvas
// Returns: { pages, currentPage, setCurrentPage, pageCount }
```

---

## Phase 5: API Client (`src/lib/api.ts` additions)

```typescript
// Fetch annotations for page
export async function getAnnotations(submissionId: string, pageNumber: number) {
  const res = await fetch(
    `${API_BASE}/annotations-get?submission_id=${submissionId}&page_number=${pageNumber}`
  );
  if (!res.ok) throw new Error('Failed to fetch annotations');
  return res.json();
}

// Batch upsert annotations
export async function upsertAnnotations(payload: {
  submission_id: string;
  page_number: number;
  ops: Array<{ op: 'upsert' | 'delete'; annotation?: Annotation; id?: string }>;
}) {
  const res = await fetch(`${API_BASE}/annotations-upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save annotations');
  return res.json();
}

// Export annotated PDF (server-side)
export async function exportAnnotatedPdf(submissionId: string, pages?: number[]) {
  const res = await fetch(`${API_BASE}/annotations-export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId, pages }),
  });
  if (!res.ok) throw new Error('Failed to export PDF');
  return res.json();
}

// Export current page as PNG (client-side)
export function exportPageAsPng(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

// Convert DOCX to PDF
export async function convertDocxToPdf(submissionId: string, fileData: string) {
  const res = await fetch(`${API_BASE}/convert-docx-to-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId, file_data: fileData }),
  });
  if (!res.ok) throw new Error('Failed to convert DOCX to PDF');
  return res.json();
}
```

---

## Phase 6: Export to PDF (Server-Side)

### Implementation: `netlify/functions/annotations-export-pdf.ts`

Uses `pdf-lib` to flatten annotations onto original PDF:

```typescript
import { PDFDocument, rgb } from 'pdf-lib';
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  const { submission_id, pages } = JSON.parse(event.body);
  
  // 1. Fetch original PDF from Netlify Blobs
  const store = getStore({ name: 'essay-files', ... });
  const pdfBytes = await store.get(`${submission_id}.pdf`);
  
  // 2. Load with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // 3. Fetch annotations from database
  const annotations = await fetchAnnotations(submission_id);
  
  // 4. Draw annotations on each page
  for (const pageNum of pages) {
    const page = pdfDoc.getPage(pageNum - 1);
    const annots = annotations.filter(a => a.page_number === pageNum);
    
    for (const annot of annots) {
      if (annot.type === 'highlight') {
        page.drawRectangle({
          x: annot.rect.x,
          y: page.getHeight() - annot.rect.y - annot.rect.h,
          width: annot.rect.w,
          height: annot.rect.h,
          color: parseRgba(annot.color_rgba),
          opacity: 0.45,
        });
      } else if (annot.type === 'comment') {
        page.drawText(annot.text, {
          x: annot.rect.x,
          y: page.getHeight() - annot.rect.y - 20,
          size: 10,
          color: rgb(0.9, 0.1, 0.1),
        });
      }
      // ... pen strokes as SVG paths converted to PDF paths
    }
  }
  
  // 5. Save and upload to blobs
  const annotatedBytes = await pdfDoc.save();
  const exportKey = `${submission_id}-annotated-${Date.now()}.pdf`;
  await store.set(exportKey, annotatedBytes);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      download_url: `/.netlify/blobs/essay-files/${exportKey}`
    })
  };
};
```

### Frontend (React Components)
- Create `AnnotationViewer.tsx` (main canvas)
- Create `AnnotationToolbar.tsx` (tool buttons)
- Create `AnnotationOverlay.tsx` (SVG/Canvas layer)
- Create `CommentCard.tsx` (draggable comments)
- Create `useAnnotations.ts` hook
- Create `usePdfPages.ts` hook
- Update `api.ts` with new functions
- Add "Annotate" tab to `Submission.tsx`

### Backend (Netlify Functions)
- Create `annotations-get.ts`
- Create `annotations-upsert.ts` 
- Create `annotations-export-pdf.ts`
- Create `convert-docx-to-pdf.ts`
- Install `pdf-lib` package: `npm i pdf-lib`
- Choose DOCX→PDF conversion method (LibreOffice or CloudConvert API)
- Test API endpoints with Postman/curl

### Testing
- Unit tests for geometry/hit-test utils
- Component tests for AnnotationViewer
- E2E test: Upload PDF → Annotate → Save → Reload → Verify
- E2E test: Export annotated PDF
- [ ] E2E test: Export annotated PDF

---

## Key Decisions ✅ CONFIRMED

### 1. DOCX Annotation ✅
**Decision**: Convert DOCX to PDF server-side before annotating
**Implementation**: New function `netlify/functions/convert-docx-to-pdf.ts` using LibreOffice/cloud API
- User uploads DOCX
- Backend converts to PDF
- Stores in Netlify Blobs
- Frontend annotates the PDF

---

### 2. Export Format ✅
**Decision**: Support BOTH formats
- **PNG Export**: Client-side, per-page download (quick preview/sharing)
- **PDF Export**: Server-side flattened annotations (official graded copy)
**UI**: Two export buttons in toolbar

---

### 3. Autosave Frequency
**Confirmed**: 800ms debounce after last change with "Saving..." indicator in UI

---

## Success Criteria

### MVP Complete When:
1. ✅ Teacher can open a graded submission
2. ✅ Teacher can switch to "Annotate" mode
3. ✅ Teacher can highlight text (drag to create rect)
4. ✅ Teacher can add comments (click to create card)
5. ✅ Teacher can draw pen strokes
6. ✅ Annotations auto-save to database
7. ✅ Annotations persist on page reload
8. ✅ Teacher can export annotated PDF
9. ✅ PDF downloads with flattened annotations

---

## Timeline Estimate

### Phase 1: Database (1 hour)
- Write migration SQL
- Run on Neon
- Verify with SQL queries

### Phase 2: API (4-6 hours)
- Create 4 Netlify Functions
- Test with curl/Postman
- Handle edge cases (empty pages, etc.)

### Phase 3: Frontend Hooks (3-4 hours)
- `useAnnotations` hook with autosave
- `usePdfPages` hook (refactor from VerbatimViewer)
- API client functions

### Phase 4: UI Components (8-10 hours)
- `AnnotationViewer` (main component)
- `AnnotationToolbar` (tool buttons)
- `AnnotationOverlay` (canvas rendering)
- `CommentCard` (draggable comments)
- Integration with `Submission.tsx`

### Phase 5: Export (4-6 hours)
- Client-side PNG export (per page)
- Server-side PDF flattening with pdf-lib
- Blob storage for PDF exports
- Download UI with two buttons

### Phase 6: DOCX Conversion (3-4 hours)
- Server-side DOCX→PDF conversion
- LibreOffice headless OR CloudConvert API
- Store converted PDF in Netlify Blobs
- Update upload flow to handle DOCX

### Phase 7: Testing (4-6 hours)
- Unit tests
- Component tests
- E2E tests (including DOCX conversion and dual export)
- Bug fixes

**Total: ~28-36 hours of development**

---

## Dependencies (npm packages)

### Already Installed ✅
- `pdfjs-dist` - PDF rendering
- `mammoth` - DOCX parsing
- `@netlify/blobs` - File storage
- `@netlify/functions` - Serverless

### Need to Install
```bash
npm install pdf-lib         # PDF manipulation
```

---

## Notes

- **Reuse Existing**: We're building on top of your working PDF extraction and blob storage
- **Non-Breaking**: All changes are additive - won't affect existing grading workflow
- **Progressive**: Can ship annotation feature incrementally (highlights first, then comments, then pen)
- **Scalable**: Database design supports multiple submissions, versioning, and undo/redo

---

## Implementation Ready! 🚀

All key decisions confirmed:
- ✅ DOCX files will be converted to PDF server-side
- ✅ Export supports BOTH PNG (per page) and PDF (full document)
- ✅ No authentication required
- ✅ Autosave every 800ms

**Ready to begin Phase 1 (Database Migration)?**

Annotator: PDF/DOCX Highlighter & Red-Pen Comments

Teacher-friendly markup for student submissions: highlight like a yellow marker, add “red-pen” comments, freehand scribbles, and export/share—with autosave to Neon and local pdf.js worker.

✅ This README is tailored for: React 18 + Vite, Netlify (static hosting + Functions), Neon Postgres (serverless).
✅ Includes: worker bundling, DOCX handling options, annotation data model, SQL schema, API contracts, and test plan.

Table of Contents

Goals & UX

High-Level Architecture

Core Features

Data Model (Neon/Postgres)

API (Netlify Functions)

Frontend Implementation (React + Vite)

Project Structure

pdf.js Worker (Local)

DOCX Support

Annotation Overlay

Freehand Pen

Export (PNG, Annotated PDF)

Autosave & Versioning

Environment Variables

Database Migrations

Build & Run

Testing Plan

Performance & Edge Cases

Security & Compliance

Future Enhancements

Open Questions (please confirm)

Goals & UX

Input: Student submission as PDF (preferred), DOCX, or image (PNG/JPG).

Markup tools: Highlight, Comment (red header), Freehand pen, Underline, Strike-through (optional).

Ease-of-use: Click-to-comment, drag-to-highlight, resize/move annotations, keyboard shortcuts.

Persistence: Autosave annotations to Neon with per-teacher, per-student, per-document scoping.

Exports:

Flattened PNG (per page) for quick sharing.

Annotated PDF (server-side flatten with pdf-lib/ghostscript approach).

Compare drafts: Side-by-side or overlay diff (later phase).

Offline-friendly: No CDN requirements; bundle worker locally.

High-Level Architecture
+-----------------------+          +----------------------+
|  React + Vite (SPA)   |  HTTPS   |  Netlify Functions   |
|  /src                 +--------->+  /netlify/functions  |
|  pdf.js (local worker)|          |  Node + pg           |
+-----------+-----------+          +----------+-----------+
            ^                                  |
            |                                  |  TLS
            |                          +-------v--------+
            |                          | Neon Postgres  |
            |                          +----------------+
   Local render & overlay
   JSON autosave via REST

Core Features

Upload & Render

PDF: pdf.js + local worker; per-page canvas rendering.

DOCX: Client-side Mammoth (for quick HTML) or server-side conversion (recommended for fidelity).

Images: Render to canvas.

Annotate

Highlight (rectangles with configurable color/opacity).

Comment (red title bar + text area; draggable/resizable).

Freehand pen (vector strokes).

Hit-testing + selection + z-index ordering.

Undo/redo stack (in memory + persisted snapshots).

Persist

Autosave annotation delta to Neon (via Netlify Functions).

Versioning per page (for undo history + audit).

Export/Share

Flatten to PNG (client) per page.

Flatten to PDF (server function using pdf-lib to draw annotations; optionally Ghostscript for raster).

Access Control

teacher_id, student_id scoping. Future: JWT/Clerk/Auth0.

Data Model (Neon/Postgres)
-- 1) users (teachers or staff)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  role          TEXT CHECK (role IN ('teacher','admin')) DEFAULT 'teacher',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) students
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_key   TEXT NOT NULL,                  -- SIS ID or external key
  full_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) documents (one upload => many pages)
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id    UUID REFERENCES students(id) ON DELETE SET NULL,
  title         TEXT,
  file_type     TEXT CHECK (file_type IN ('pdf','docx','image')) NOT NULL,
  storage_key   TEXT NOT NULL,                  -- path to object storage (Netlify Blobs/S3/GDrive link)
  page_count    INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) pages (derived metadata per page)
CREATE TABLE IF NOT EXISTS document_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number   INT NOT NULL,
  width_px      INT,
  height_px     INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, page_number)
);

-- 5) annotations (normalized by page)
-- Freehand paths stored as JSON (array of points).
CREATE TABLE IF NOT EXISTS annotations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_id       UUID NOT NULL REFERENCES document_pages(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT CHECK (type IN ('highlight','comment','pen','underline','strike')) NOT NULL,
  rect          JSONB,     -- {x,y,w,h}
  color_rgba    TEXT,
  text          TEXT,      -- for comments
  path          JSONB,     -- for pen: [{x,y}, ...]
  z_index       INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) versions (optional snapshot for undo/redo and audit)
CREATE TABLE IF NOT EXISTS page_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       UUID NOT NULL REFERENCES document_pages(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_idx   INT NOT NULL,
  annotations   JSONB NOT NULL,  -- entire page state (array of annots)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, version_idx)
);


Annotation JSON examples

// highlight
{
  "type": "highlight",
  "rect": {"x": 120, "y": 340, "w": 260, "h": 28},
  "color_rgba": "rgba(255,235,59,0.45)"
}

// comment
{
  "type": "comment",
  "rect": {"x": 420, "y": 180, "w": 220, "h": 64},
  "text": "Great hook! Consider tightening the last clause.",
  "color_rgba": "rgba(244,67,54,0.9)"
}

// pen stroke
{
  "type": "pen",
  "path": [{"x": 120, "y": 160}, {"x": 122, "y": 162}, ...],
  "color_rgba": "rgba(220,38,38,0.95)"
}

API (Netlify Functions)

Base URL: /.netlify/functions/*

POST /documents

Create document record after upload (you manage upload to storage separately).

Body

{
  "owner_user_id": "<uuid>",
  "student_id": "<uuid>",
  "title": "Essay - Zach",
  "file_type": "pdf",
  "storage_key": "blobs://submissions/abc123.pdf",
  "page_count": 3
}


Response

{ "document_id": "<uuid>" }

POST /pages/init

Initialize page rows for a document (width/height optional).

{
  "document_id": "<uuid>",
  "pages": [
    {"page_number": 1, "width_px": 1275, "height_px": 1650},
    {"page_number": 2, "width_px": 1275, "height_px": 1650}
  ]
}


Response: { "ok": true }

GET /annotations?document_id=…&page_number=…

Fetch annotations for a page.

Response

{
  "page_id": "<uuid>",
  "annotations": [ /* array of annotations */ ]
}

POST /annotations/batch-upsert

Create/update/delete annotations.

Body

{
  "document_id": "<uuid>",
  "page_number": 1,
  "author_id": "<uuid>",
  "ops": [
    {"op": "upsert", "annotation": {/* full annot */}},
    {"op": "delete", "id": "<uuid>"}
  ],
  "snapshot": [/* full page state for versioning (optional) */]
}


Response: { "ok": true, "version_idx": 12 }

POST /export/pdf

Server-side flattening to PDF.

Body

{
  "document_id": "<uuid>",
  "pages": [1,2,3],                // optional subset
  "dpi": 144,                      // rasterize overlays at dpi
  "include_comments": true
}


Response

{
  "download_url": "blobs://exports/abc123-annotated.pdf"
}


Implementation: Use pdf-lib to load the base PDF and draw shapes/text onto each page canvas; if you need pixel-perfect rasterization (including pen alpha blending), render overlays to PNG buffers then embed in the PDF.

Frontend Implementation (React + Vite)
Project Structure
/src
  /components
    Annotator.tsx
    Toolbar.tsx
    PageCanvas.tsx
    OverlayLayer.tsx
    CommentCard.tsx
  /hooks
    usePdfDocument.ts
    useAnnotations.ts
    useAutosave.ts
  /lib
    pdf.ts
    api.ts
    geometry.ts
    hitTest.ts
    throttle.ts
  /workers
    (pdf.js worker is resolved from node_modules, see below)

pdf.js Worker (Local)

Install

npm i pdfjs-dist


Use local worker (Vite)

Import from the ESM build and point GlobalWorkerOptions.workerSrc to a local file URL generated by Vite:

// src/lib/pdf.ts
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // Vite will copy/bundle this

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl; // valid string URL

export { pdfjsLib };


Load document

const loadingTask = pdfjsLib.getDocument({
  data: arrayBuffer,
  cMapUrl: new URL("pdfjs-dist/cmaps/", import.meta.url).toString(),
  cMapPacked: true
});
const pdf = await loadingTask.promise;


This avoids any CDN fetch in production and fixes the sandbox error you saw.

DOCX Support

Option A (Client): mammoth (good for simple docs).

npm i mammoth

import { convertToHtml } from "mammoth";

const { value: html } = await convertToHtml({ arrayBuffer }, { includeDefaultStyleMap: true });


Render HTML in a container, add the same OverlayLayer for comments/highlights (use text range wrap for highlights).

Option B (Server): High fidelity via Netlify Function:

Upload DOCX to storage → function uses LibreOffice (headless) or cloud conversion API to produce PDF → return PDF URL →

Frontend proceeds as PDF.
This is more robust and consistent with the PDF annotator code path.

Annotation Overlay

OverlayLayer sits absolutely over PageCanvas.

Handles:

Highlight: drag-to-create rect (x,y,w,h).

Comment: click-to-drop a card (rect with fixed width, text content).

Pen: on mousedown/move, record points; throttle to ~60Hz; store as [ {x,y}, … ].

Selection: click hit-test (rect contains or distance to path < epsilon). Show resize handles, allow drag (arrow keys +1px nudge).

Z-Order: simple integer z_index, bump on focus.

Keyboard:

H: highlight, C: comment, P: pen, Esc: cancel, Del/Backspace: delete selection, Ctrl/Cmd+Z / Shift+Z: undo/redo.

Autosave: Debounce 800ms after a stable state; send batch-upsert.

Freehand Pen

Store stroke as { path: Array<{x,y}>, color_rgba, width }.

Draw with ctx.beginPath(); for smoothing, use quadratic interpolation (Catmull-Rom to Bezier).

Persist as JSON. On export, replay strokes into PDF or raster overlay.

Export (PNG, Annotated PDF)

PNG (client): Composite the base page canvas + overlay into an offscreen canvas, then toDataURL → download.

Annotated PDF (server):

Load base PDF (pdf-lib).

For each page: either draw vector shapes directly (drawRectangle, drawText) or render overlays to a PNG buffer and embed as image.

Save to storage; return URL.

Autosave & Versioning

Keep an in-memory undoStack/redoStack.

On each meaningful change, push a new version (bounded length, e.g., last 50).

On autosave, submit:

delta ops (upsert/delete changed annotations).

optional full snapshot for page_versions.

Environment Variables

For Netlify (UI → Site settings → Environment variables):

NEON_DATABASE_URL=postgres://USER:PASSWORD@HOST/db
NEON_POOLING=true
NEON_SSL=true
BLOBS_BUCKET_URL=...               # optional if using Netlify Blobs/S3
JWT_PUBLIC_KEY=...                 # optional if using auth


For Vite (local dev .env):

VITE_API_BASE=/.netlify/functions

Database Migrations

Use a single init SQL (or a tool like drizzle-kit/Prisma). See DDL above.
If using Drizzle:

npm i drizzle-orm pg
npm i -D drizzle-kit


drizzle.config.ts, then npx drizzle-kit generate && npx drizzle-kit push.

Build & Run

Frontend

npm i
npm i -D vite typescript @types/react @types/react-dom
npm i pdfjs-dist mammoth            # if you choose client DOCX
npm i zustand jotai                 # optional state libs
npm run dev


Netlify Functions

npm i -w functions pg pdf-lib sharp  # sharp if rasterizing overlays
netlify dev                          # or netlify functions:serve


pdf.js worker sanity check

Ensure workerUrl import (with ?url) resolves to an actual file in .vite/dist.

Never set GlobalWorkerOptions.workerSrc = undefined (invalid). Use a string URL.

Testing Plan
1) Unit (Vitest)

geometry.spec.ts: rect intersection, containment, resize handles math.

hitTest.spec.ts: hit-test for rect vs stroke (distance thresholds).

pdf.spec.ts: verifies GlobalWorkerOptions.workerSrc is string.

autosave.spec.ts: debounce behavior (no duplicate flushes under rapid actions).

2) Component (React Testing Library)

OverlayLayer: creates highlight on drag; comment on click; delete on key.

CommentCard: typing updates state; resize changes rect.

3) E2E (Playwright)

Upload a PDF → render page 1.

Draw highlight, add comment, pen stroke → autosave REST calls observed.

Reload → annotations restored.

Export PNG → downloaded file starts with data:image/png or correct file bytes.

4) Self-Tests (in-app)

Smoke tests: create/update/delete local annotations; PNG flatten; worker src check (string).

Example Vitest snippet

import { expect, test } from 'vitest';
import { hitTestRect, distanceToPolyline } from '../src/lib/hitTest';

test('rect hit', () => {
  expect(hitTestRect({x:10,y:10,w:20,h:20}, {x:15,y:18})).toBe(true);
  expect(hitTestRect({x:10,y:10,w:20,h:20}, {x:35,y:18})).toBe(false);
});

test('polyline distance', () => {
  const d = distanceToPolyline([{x:0,y:0},{x:10,y:0}], {x:5,y:5});
  expect(Math.round(d)).toBe(5);
});

Performance & Edge Cases

Large PDFs: lazy load pages; cache rendered bitmaps; throttle pen.

HiDPI: scale canvas by devicePixelRatio to keep text crisp.

Zoom: maintain world units; scale overlay accordingly.

Rotation: honor PDF rotation metadata; transform pointer coords.

DOCX quirks (client Mammoth): complex layouts may shift; prefer server conversion to PDF for fidelity.

Clipboard: allow copy/paste annotations between pages (optional).

Security & Compliance

Auth: restrict CRUD to owner/teachers in class; JWT claims (sub, role).

PII: Student identifiers in students.student_key; avoid storing sensitive free-text beyond feedback.

Audit: page_versions supports rollbacks; log author_id, timestamps.

Future Enhancements

Rubric tags on comments (Grammar, Style, Evidence, Structure).

Draft compare: side-by-side with diff highlights (same coordinates).

Realtime collaboration: WebSockets (Pusher/Ably/Supabase RT).

OCR assist: feed regions to your FastAIGrader / Azure DI / Google DocAI.

LMS integrations: Canvas/Google Classroom pushback.

Open Questions (please confirm)

DOCX path: Do you prefer client Mammoth (quick, lower fidelity) or server conversion to PDF (robust)?

Export: Is a flattened annotated PDF required on day one, or is PNG per page sufficient for MVP?

Pen tool: Should it support pressure/variable width (if device supports pointer pressure), or keep constant width?

Autosave cadence: OK with debounce 800ms after last change, or shorter/longer?

Access model: Are annotations private to the teacher or shared within a team/section?

Auth: Do you want me to wire JWT from your existing stack, or ship a simple cookie session for now?

Minimal Code Seeds (Copy/Paste Starters)

src/lib/pdf.ts

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; // local, bundled
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
export { pdfjsLib };


src/lib/api.ts

const BASE = import.meta.env.VITE_API_BASE || "/.netlify/functions";

export async function getAnnotations(documentId: string, pageNumber: number) {
  const r = await fetch(`${BASE}/annotations?document_id=${documentId}&page_number=${pageNumber}`);
  if (!r.ok) throw new Error("Failed to fetch annotations");
  return r.json();
}

export async function upsertAnnotations(payload: any) {
  const r = await fetch(`${BASE}/annotations/batch-upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error("Failed to upsert annotations");
  return r.json();
}


src/hooks/useAutosave.ts

import { useEffect, useRef } from "react";
export function useAutosave<T>(value: T, save: (v:T)=>void, delay=800) {
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => save(value), delay) as unknown as number;
    return () => { if (t.current) window.clearTimeout(t.current); };
  }, [value, save, delay]);
}

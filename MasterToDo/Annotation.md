# Plan: Annotation Functional Improvements

## Goal
Add teacher-driven annotation workflows on the **Annotated** essay view:
- Teachers can **select text** and **create an annotation**.
- Teachers can choose **severity**:
  - `warning` (Yellow Triangle)
  - `error` (Red Circle)
- Teachers can choose a **category pill**:
  - **Rubric-specific** criterion pills (preferred)
  - Optional **general / non-graded** pills (grammar/spelling/punctuation)
- When reviewing annotations, add an **LLM chat panel** that includes:
  - Context (selected quote + surrounding text + rubric info)
  - A teacher-provided prompt

**Important:** This file is a plan only. Do not implement until reviewed.

---

## Current System (What Exists Today)

### Current UI
- Inline annotation viewing/approval UI exists in:
  - `src/components/AnnotatedTextViewer.tsx`
  - Shown actions: **Approve**, **Edit**, **Reject**, **Approve All**
  - Severity icons already exist:
    - `warning` → triangle
    - `error` → circle

### Current Data Model
- Inline annotations are stored in Postgres:
  - `grader.annotations`
  - `grader.annotation_events` (audit trail)
- API endpoints currently exist:
  - `GET /.netlify/functions/annotations-inline-get?submission_id=...`
  - `POST /.netlify/functions/annotations-inline-update`

### Known Gaps
- `onAnnotationAdd` is currently **not implemented**:
  - `src/components/VerbatimViewer.tsx` contains `handleAnnotationAdd` stub.
- There are **two different “annotation” concepts** in the repo:
  - Inline text annotations (this plan)
  - Document/PDF drawing annotations (`netlify/functions/annotations-upsert.ts`)
  - This plan focuses on **inline text annotations** (quote + offsets).

---

## Proposed UX

### A) Teacher creates an annotation from selected text

#### Trigger / Entry point
- In `AnnotatedTextViewer` (Annotated mode), teacher selects a span of essay text.
- A small **floating toolbar** (or right-click context menu) appears with:
  - **Add Annotation**

#### Create Annotation UI (popover / modal)
Fields:
- **Selected quote preview** (read-only)
- **Severity selector**
  - Toggle buttons:
    - Warning (Yellow Triangle)
    - Error (Red Circle)
- **Category pills**
  - If rubric present: show `rubric.criteria` as pills (use criterion `id` as stored value, display `name`)
  - Also provide optional “General” group:
    - Grammar
    - Spelling
    - Punctuation
- **Suggestion / note text** (textarea)
  - Default placeholder: “Write your feedback…”

Actions:
- **Save Annotation** (primary)
- **Cancel**

Behavior:
- On save:
  - Annotation immediately appears inline in the list.
  - Status should be `teacher_created`.

#### Selection constraints (initial version)
To reduce complexity for v1:
- Support selection **within a single line** (same `line_number`).
- If selection spans multiple lines, show a friendly error and ask the teacher to select one line.

(We can extend to multi-line anchors later.)

### B) Annotation review: add LLM chat panel

When a teacher clicks an annotation card (already supported via `selectedAnnotation`):
- Add a **Chat** area that allows:
  - Teacher prompt input
  - “Ask AI” button
  - Render assistant responses below (chat history)

Recommended UI layout options:
- **Option 1 (lowest disruption):** In the selected annotation card, show a collapsible “Chat” panel.
- **Option 2 (best UX):** Split pane: annotation list on left, chat/details on right.

Chat should include context automatically:
- The annotation `quote`
- Surrounding text (N lines above/below)
- Rubric criterion name/description (if rubric + criterion_id known)
- The current suggestion text

---

## Data / Schema Considerations

### Annotation fields needed for teacher-created annotations
At minimum, teacher-created annotations can be represented with existing columns:
- `submission_id`
- `line_number`, `start_offset`, `end_offset`
- `quote`
- `category`
- `suggestion`
- `severity` (`warning`/`error`)
- `status = 'teacher_created'`
- `created_by` (teacher user id)

### Rubric + “General grammar” categories
- Rubric categories:
  - Store `category` as the **criterion id** (current pattern already supported by `getAnnotationDisplayLabel`).
- General grammar categories:
  - Use a consistent convention such as:
    - `category = 'non_graded'`
    - `subcategory = 'grammar' | 'spelling' | 'punctuation'`
    - `affects_grade = false`

**Note:** The frontend `Annotation` type currently includes `subcategory`, `criterion_id`, and `affects_grade`. The DB schema in `db_ref.md` should be re-verified in Neon to confirm these columns exist. If missing, add a migration (future step) to align DB with app usage.

---

## Backend/API Plan

### 1) Add create endpoint for inline annotations
Add a new Netlify function:
- `netlify/functions/annotations-inline-create.ts`

Responsibilities:
- Authenticate via `authenticateRequest`
- Validate input with Zod:
  - `submission_id` uuid
  - `line_number` integer
  - `start_offset`, `end_offset` integers
  - `quote` non-empty
  - `category` non-empty
  - `suggestion` non-empty
  - `severity` in {info, warning, error} (for this feature: warning/error)
- Verify submission belongs to tenant (same join pattern as `annotations-inline-get`)
- Insert into `grader.annotations`
- Insert `grader.annotation_events` with `event_type = 'teacher_create'`
- Return created annotation row (including `annotation_id`)

### 2) Add frontend API function
In `src/lib/api.ts`:
- `createInlineAnnotation(payload)` → calls `annotations-inline-create`

### 3) Optional: delete endpoint
If we want teachers to remove their own annotations:
- `annotations-inline-delete.ts` + UI “Delete” on `teacher_created` annotations.

---

## Frontend Implementation Plan (No code yet)

### 1) Selection → offsets mapping
We must map DOM selection to:
- `line_number`
- `start_offset`, `end_offset` (character offsets within full essay text)
- `quote`

Proposed approach:
- Render each line in `AnnotatedTextViewer` with a wrapper that includes:
  - `data-line-number`
  - the raw line text in a single text node (stable offsets)
- On selection:
  - use `window.getSelection()` + `Range`
  - ensure start and end containers are within same line wrapper
  - compute offsets within that line
  - convert to global offsets by summing lengths of previous lines + newline characters

### 2) UI components
Add components (or inline UI) in `AnnotatedTextViewer.tsx`:
- Selection state:
  - `selectedRange: { lineNumber, startOffset, endOffset, quote } | null`
- Create-annotation modal/popover:
  - Severity toggle (warning/error)
  - Category pills (rubric criteria + general)
  - Suggestion textarea

### 3) Wire to backend
- Implement `onAnnotationAdd` end-to-end:
  - In `VerbatimViewer.tsx`, replace TODO stub with a call to `createInlineAnnotation`
  - After create, refresh via `getInlineAnnotations(submissionId)`

### 4) LLM chat in annotation review
Add a new component:
- `AnnotationChatPanel` (location TBD, likely `src/components/`)

State:
- `messages: { role: 'teacher' | 'assistant'; content: string; createdAt: number }[]`

Backend:
- Create a new Netlify function:
  - `annotation-chat.ts`
- Request payload:
  - `submission_id` (uuid)
  - `annotation_id` (uuid)
  - `teacher_prompt` (string)
  - `context` (server-derived or client-provided)

Recommended: server-derived context to reduce tampering and ensure tenant checks.

LLM prompt design:
- System: “You are assisting a teacher reviewing an inline annotation. Provide concise, actionable guidance.”
- Include:
  - quote + line number
  - surrounding lines
  - rubric criterion name (if known)
  - current annotation suggestion
  - teacher prompt

Safety/FERPA:
- Do not send student names.
- Only submission text already stored under the tenant.

---

## Acceptance Criteria

### Teacher-created annotations
- Selecting text + clicking “Add Annotation” opens create UI.
- Teacher can choose `warning` or `error`.
- Teacher can choose a category pill.
- Saving creates an annotation that:
  - Appears immediately in the annotation list
  - Persists after refresh
  - Has `status = teacher_created`

### Annotation chat
- Teacher can open chat for a selected annotation.
- Teacher can enter prompt and receive a response.
- Response uses correct context (quote + surrounding text + rubric info when available).

---

## Testing Checklist

### Unit tests
- `AnnotatedTextViewer`:
  - Selection parsing edge cases (no selection, multi-line selection rejected)
  - Create form validation (missing severity/category/text)

### API tests (integration)
- `annotations-inline-create`:
  - Unauthorized → 401
  - Wrong tenant submission → 404
  - Valid create → 200 + annotation_id

### Manual QA
- Create warning + error annotations
- Create rubric category annotations and general grammar annotations
- Refresh page and confirm annotations persist
- Chat panel requests and responses render correctly

---

## Phased Rollout

### Phase 1 (MVP)
- Single-line selection only
- Create inline annotation (warning/error + category + suggestion)
- No chat persistence (in-memory only)

### Phase 2
- Multi-line selection support
- Add delete for teacher-created annotations

### Phase 3
- Persist chat history per annotation (new DB table) if needed

---

## Open Questions
- Should teacher-created annotations be included in “Approve All”?
  - Recommendation: No (they’re already teacher-authored).
- Should “General grammar” annotations be stored as `category='non_graded'` with `subcategory`, or as separate categories directly?
- Do we want to allow teachers to mark an annotation as “affects grade” vs “non-graded”?
- Chat: should the LLM be allowed to propose rewrites, or only explain rule/rubric reasoning?

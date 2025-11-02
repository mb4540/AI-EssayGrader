# Annotate Plan

## 1. Objective
- Deliver inline, teacher-reviewable annotations on student submissions while preserving the original text 100%.
- Provide a finalized PDF export that mirrors the live annotations (double-spaced, highlights, red inline notes).
- Maintain an auditable history of AI suggestions and teacher actions.

## 2. Guiding Rules & References
- Follow TypeScript and project conventions in `./windsurf/rules/code-style.md` for all implementation work.
- Apply UI/UX standards in `./windsurf/rules/frontend-components.md` for live annotation components (clarity, minimal clicks, progressive disclosure).
- Any schema adjustments must comply with `./windsurf/rules/database-design.md`, including reading `db_ref.md` before changes and updating it afterward.

## 3. Key Decisions from Brainstorm
1. Annotations visible live in the web app with teacher controls to edit, add, or reject feedback.
2. AI-generated issues must include both line numbers and the quoted text; teachers can add new comments manually.
3. Teacher workflow states: `AI Suggested`, `Teacher Edited`, `Teacher Rejected`, `Teacher Approved`.
4. Audit trail retained for all annotation lifecycle events (AI payload, teacher modifications, timestamps).
5. No shorthand markup legend; labels will use full words (e.g., “Spelling”).

## 4. LLM Contract & Processing Pipeline
1. **Pre-processing**
   - Inject zero-padded line numbers (e.g., `005| text`) before sending the essay to the LLM.
   - Explicitly instruct that line numbers aid referencing only and must not appear in quoted text.
2. **Prompt Output Requirements**
   - Return structured feedback records: `{ line: number, quote: string, category: "Spelling" | ... , suggestion: string, severity?: string }`.
   - Include rubric-type metadata so downstream UI can bucket issues.
3. **Validation Layer**
   - Confirm `line` is within range and `quote` matches the original essay near that line.
   - Compute and store character offsets (start/end) for reliable highlighting in both HTML and PDF.
   - If direct match fails, run fuzzy search ±2 lines; unresolved items flagged for manual teacher placement.
4. **Storage Schema Considerations**
   - Persist raw AI payload, normalized annotation entity, and audit events.
   - Ensure schema changes follow database design rules (primary key naming, timestamps, indexes).

## 5. Data Model Draft
- **Table: `grader.annotations`** (new)
  - `annotation_id` UUID PK, `submission_id` FK, `line_number`, `start_offset`, `end_offset`, `quote`, `category`, `suggestion`, `status`, `created_at`, `updated_at`.
- **Table: `grader.annotation_events`** (audit trail)
  - `event_id` UUID PK, `annotation_id` FK, `event_type` (`ai_created`, `teacher_edit`, `teacher_reject`, `teacher_approve`, `teacher_create`), `payload` JSONB, `created_by`, timestamps.
- Consider whether existing annotations feature can be extended versus new tables; evaluate how to reconcile with `annotations-upsert` API.
- After schema finalized, update migration + `db_ref.md` per database rules.

## 6. Application Workflow
1. **Import & Normalize**
   - Upon grading, parse LLM output, validate anchors, store annotations with status `AI Suggested`.
2. **Live Review UI (Annotate tab extension)**
   - Extend the existing middle-column `VerbatimViewer` so that, once grading completes, it gains a secondary tab/toggle labelled **Annotation** alongside the current text display. The toggle should reuse the existing `Tabs` pattern already in the component so teachers stay in the main grading viewport.
   - Within the Annotation tab, render the line-numbered essay body plus the highlight overlay and inline comment controls. Keep the default tab as “Original” so teachers can easily compare raw and annotated views.
   - Surface a right-hand drawer/side panel (attached to `VerbatimViewer`) listing annotations grouped by status/category; highlight the paragraph currently selected.
   - Provide controls: approve, edit (inline text area), reject, add new annotation. Teacher-created annotations should pick a line span directly in this component without navigating to a separate page.
   - Reflect status changes immediately and log audit events.
   - Continue exposing image/PDF upload tabs pre-grading; once text exists, the component conditionally renders the annotation toggle rather than the capture tabs, so the workflow remains centered on this card.
3. **Finalization**
   - When all desired annotations are `Teacher Approved` (or marked ready), trigger PDF export pipeline using stored offsets.

## 7. PDF Export Updates
- Use existing print template, double-space lines without altering original text content.
- Apply highlight styles over the stored offsets; insert red italicized feedback text immediately under the highlighted span.
- Flatten annotations on export (e.g., via PDFKit/pdf-lib) while ensuring fonts and spacing match the live view.
- Include footer metadata (submission id, export timestamp, teacher name).

## 8. Implementation Phases
1. **Phase A – Contract & Backend Foundation**
   - Update grading prompt and response schema.
   - Implement validation + normalization service, audit event logging, and initial persistence layer.
2. **Phase B – Live Annotation Experience**
   - Extend Annotate tab UI per frontend rules (clear hierarchy, minimal clicks, accessible controls).
   - Integrate teacher editing/review actions and real-time status updates.
3. **Phase C – PDF Rendering**
   - Adapt print pipeline to consume normalized annotations and render highlights/notes.
   - Add export confirmation and ensure parity with live view.
4. **Phase D – QA & Harden**
   - Test across varied submissions (length, multi-page, repeated phrases).
   - Verify audit trail integrity and filtering/reporting needs.
   - Update documentation and `db_ref.md` after schema migrations.

## 9. Risks & Mitigations
- **Ambiguous matches**: Fuzzy matching with human confirmation fallback.
- **UI overload**: Adhere to `frontend-components` guidelines—group annotations, progressive disclosure, status filters.
- **Performance**: Cache normalized annotations per submission; lazy-load long essays.
- **Data integrity**: Enforce foreign keys, timestamps, and transactional writes for annotations/events.

## 10. Resolved Decisions / Dependencies
- Start text-based annotations with a clean data model; use existing drawing/highlight tooling only as reference material.
- Place any unmatched AI comments at the bottom of the essay using the teacher comment styling so they remain visible for manual handling.
- No student-facing experience is required—students will only receive the exported PDF, so status states remain teacher-only.

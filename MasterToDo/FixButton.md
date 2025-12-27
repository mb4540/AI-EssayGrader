# Plan: Fix Run Grade Button Feedback Delay

## Problem
On the **Submission** page, clicking **Run Grade** can take a few seconds before:
- The button becomes disabled
- The spinner/"Grading..." label appears

This creates uncertainty and leads teachers to click the button multiple times, risking duplicate grading jobs.

## Where This Happens (Current Code)
- **Button UI**: `src/components/GradePanel.tsx`
  - Uses `isGrading` to show spinner/label and disable the button.
- **isGrading source**: `src/pages/Submission.tsx`
  - `isGrading={actions.gradeMutation.isPending}`
- **Click handler**: `src/pages/Submission/hooks/useSubmissionActions.ts` → `handleRunGrade`
  - For *new* submissions (no `submissionId`), `handleRunGrade`:
    1. Validates
    2. `await ingestMutation.mutateAsync(...)`
    3. (Optionally) `await uploadImage(...)`
    4. (Optionally) `await uploadFile(...)`
    5. **Only then** calls `await gradeMutation.mutateAsync(...)`

Because `gradeMutation.isPending` only flips to `true` when `gradeMutation.mutateAsync` begins, the UI shows **no immediate feedback** while ingestion/uploads run.

## Likely Root Cause
- The UI "loading" state is tied only to `gradeMutation.isPending`.
- `handleRunGrade` performs **pre-work** (ingest + uploads) before starting `gradeMutation`.
- Even on existing submissions, there can be a small render delay where a rapid double-click can fire twice.

## Goals / Acceptance Criteria
- **Immediate feedback:** Within ~50–100ms of clicking **Run Grade**, the button:
  - Disables
  - Shows a spinner and "Starting..." (or "Grading...")
- **Double-click safe:** Repeated clicks while a run is starting/running do **not** create multiple grading jobs.
- **No workflow regression:** New submission creation and grading still work for:
  - Single mode
  - Draft comparison mode
  - Image + file upload flows

## Proposed Fix (Frontend)

### 1) Add an immediate "starting" UI state (decouple from React Query timing)
**Approach:** Add a dedicated state flag in the submission actions/state layer:
- `isRunGradeStarting: boolean`

Set it to `true` **synchronously at the top** of `handleRunGrade` (before any `await`).

**Result:** Button switches to loading state immediately even while ingest/upload work runs.

**Implementation sketch (no code execution now):**
- In `useSubmissionState` (or inside `useSubmissionActions`), add `isRunGradeStarting` state.
- In `handleRunGrade`:
  - Set `isRunGradeStarting = true` at function entry
  - Reset in `finally` once the function finishes or errors
  - Make sure early validation failures also reset it.

**UI wiring:**
- In `Submission.tsx`, derive a single `isGradeBusy`:
  - `isGradeBusy = isRunGradeStarting || actions.gradeMutation.isPending`
- Pass `isGrading={isGradeBusy}` to `GradePanel`

### 2) Reorder work so grading begins ASAP
For the *new submission* path, after `ingestMutation` returns the `submission_id`:
- Start grading immediately (`gradeMutation.mutateAsync({ submission_id })`).
- Run image/file uploads **in parallel** or as fire-and-forget tasks so they don’t block the grading start.

Options (choose safest):
- **Option A (preferred):** Start grading first, then `await Promise.allSettled([uploadImage, uploadFile])` while grading is already in progress.
- **Option B:** Fire-and-forget uploads (`void uploadImage(...)`) and show non-blocking error toast if an upload fails.

### 3) Add a hard client-side click de-dupe lock
Even with `disabled`, there’s a short window before React re-renders.

Add an in-flight ref guard:
- `runGradeInFlightRef.current = true` at entry
- If already true, return early
- Reset in `finally`

This prevents duplicate calls even on very fast double clicks.

### 4) Improve microcopy for user confidence
Change button label based on stage:
- **Starting:** "Starting..."
- **Grading:** "Grading..."

Optional: show a tiny inline status text near the button:
- "Creating submission…"
- "Uploading file…"
- "Grading in background…"

(Keep it minimal to optimize teacher speed.)

## Optional Backend Safety (Recommended, but can be Phase 2)
Even with perfect UI, it’s good to guard against accidental duplicate jobs.

### Option: Server-side idempotency key
- Add a `client_request_id` (UUID) sent from frontend to `grade-bulletproof-trigger`.
- Store it in `grader.background_tasks.input_data` (or a new column).
- If the same `client_request_id` is seen again, return the existing `task_id`.

### Option: Prevent multiple active grading jobs per submission
- Before creating a new job, check `grader.background_tasks` for an existing task for the same `submission_id` with `status in ('pending','processing')` and reuse it.

Note: This may require DB schema changes/migrations; follow `db_ref.md` workflow if pursued.

## Observability / Debugging (Quick Instrumentation)
Add lightweight timing to identify where time is spent:
- `click -> setStarting`
- `click -> ingest done`
- `click -> gradeMutation started`

(Use `console.error` only for errors; prefer minimal/no logging in normal path.)

## Testing Plan

### Unit/Component Tests (Vitest)
- **GradePanel**
  - When `isGrading` true, shows spinner and disables button.
- **Submission flow**
  - Clicking Run Grade sets `isRunGradeStarting` immediately.
  - Double-click triggers only one call.

### Manual Tests
- New submission (no id) with text-only
- New submission with image
- New submission with PDF/DOCX (ensure annotate tab still appears once upload completes)
- Existing submission re-grade
- Slow network simulation (browser devtools)

## Rollout Steps
1. Add `isRunGradeStarting` + `isGradeBusy` plumbing.
2. Reorder ingest/upload/grade sequencing to start grading earlier.
3. Add click de-dupe ref lock.
4. Optional: backend idempotency.

## Files Expected to Change (When Executing This Plan)
- `src/pages/Submission/hooks/useSubmissionActions.ts`
- `src/pages/Submission/hooks/useSubmissionState.ts` (if storing state there)
- `src/pages/Submission.tsx`
- `src/components/GradePanel.tsx`
- Tests: `src/components/GradePanel.test.tsx` and/or `src/pages/Submission.test.tsx`
- Optional backend:
  - `netlify/functions/grade-bulletproof-trigger.ts`
  - `netlify/functions/grade-bulletproof-background.ts`
  - DB migration + `db_ref.md` update (only if we add schema changes)

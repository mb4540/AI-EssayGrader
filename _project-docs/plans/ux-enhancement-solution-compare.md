# UX Enhancement — Solution Compare

**Date:** 2026-04-04
**Author:** Cascade (requested by Mike Berry)
**Status:** PROPOSAL
**Scope:** Full application UX review and improvement recommendations

---

## Problem Statement

EssayEase is a functional grading tool, but several UX patterns create friction for teachers who grade dozens/hundreds of essays. The primary pain points are:

1. **Students page ("Bridge") is clunky** — Requires passphrase unlock, separate class period management, manual sync operations, and exposes technical concepts (UUID, "Bridge") that confuse teachers.
2. **Grading workflow has too many steps** — Teacher must select student, select assignment, enter/paste essay, configure rubric, THEN grade. Each step is a separate card with no progressive flow.
3. **Dashboard lacks actionable overview** — Three view modes (By Student, By Assignment, By Class) but no quick-glance summary of what needs attention (ungraded, low scores, missing).
4. **Navigation doesn't match mental model** — Teachers think in terms of "Classes → Students → Assignments → Grade" but the nav is flat: Dashboard | Grade | Students | Help.
5. **Settings are buried and technical** — AI model selection, prompt customization, and LLM provider choice are in a gear icon modal with 6 tabs — overwhelming for non-technical teachers.
6. **No batch grading workflow** — Teachers grade a stack of essays for the same assignment, but must create each submission individually.

---

## Current Application Architecture

### Pages & Routes

| Route | Page | Purpose | UX Issues |
|-------|------|---------|-----------|
| `/` | Dashboard | View/manage submissions | 3 view modes are confusing; no "needs attention" view |
| `/submission/:id?` | Submission | Create/edit/grade a single essay | Long scrolling page; too many sections visible at once |
| `/bridge` | BridgeManager | Manage student roster | 1003-line monolith; passphrase UX; "Bridge" terminology |
| `/help` | Help | Static guide | Good but long; no contextual help integration |
| `/login` | Login | Authentication | Clean, no major issues |
| `/register` | Register | Account creation | Clean, no major issues |

### Key Components

| Component | Lines | Purpose | UX Issues |
|-----------|-------|---------|-----------|
| `BridgeManager` | 1003 | Student roster CRUD | Massive; class management + roster table + bulk ops + modals all in one page |
| `CreateAssignmentModal` | 516 | Assignment CRUD | Too many fields visible at once; rubric extraction buried |
| `SettingsModal` | 604 | AI config, prompts | 6 tabs; teachers don't need most of this |
| `StudentInfoCard` | 252 | Student + assignment selection on Grade page | Class filter + student dropdown + assignment dropdown all crammed together |
| `CriteriaInput` | 234 | Rubric entry | Good but duplicates assignment rubric; confusing when both exist |
| `FileDrop` | 248 | Essay input (text/image/doc) | Three tabs (Text/Image/Documents); AI Vision toggle is confusing |
| `GradePanel` | ~200 | AI grade display + teacher override | Works well but buried below the fold |

---

## UX Pain Points — Detailed Analysis

### 1. Students Page (Critical)

**Current flow:**
1. Navigate to "Students"
2. See "Bridge Locked" screen → enter passphrase → unlock
3. See "Manage Class Periods" card → add class periods manually
4. See roster table → add students one by one or import CSV
5. Bulk select → assign class periods
6. Click "Sync All to Database" (what does this mean to a teacher?)

**Problems:**
- **"Bridge" terminology** — Teachers don't know what a "bridge" is. They want "My Students."
- **Passphrase friction** — Every session requires unlock. Teachers forget the passphrase.
- **Class period management is separate from roster** — Should be integrated (add students directly to a class).
- **UUID column visible** — Technical detail teachers don't need.
- **"Sync to Database" button** — Implies data isn't saved, creates anxiety.
- **No visual grouping by class** — Flat table with a filter dropdown. Teachers think in classes, not lists.
- **1003-line monolith** — Hard to maintain, hard to extend.

### 2. Grading Workflow (High)

**Current flow:**
1. Nav → "Grade"
2. Scroll: Student Info card (select class → select student → select assignment)
3. Scroll: Grading Criteria card (enter rubric OR use assignment rubric)
4. Scroll: Essay input (Text/Image/Documents tabs)
5. Scroll: Grade & Feedback section → "Run Grade" button
6. Wait for AI → review results → set teacher grade → "Save Final Grade"

**Problems:**
- **Everything visible at once** — All 4 sections are on one long page, even before any data is entered.
- **No wizard/stepper flow** — Teacher sees the full complexity upfront instead of progressive disclosure.
- **Rubric confusion** — CriteriaInput on Grade page can differ from assignment's saved rubric. Which one wins?
- **"Run Grade" button below the fold** — Most important action is the least visible.
- **No batch mode** — Grading 30 essays for "Assignment X" requires re-selecting the assignment 30 times.
- **Draft Comparison mode** — Good feature but the toggle is in the header, disconnected from the essay section.

### 3. Dashboard (Medium)

**Current state:** Three accordion-based views (By Student, By Assignment, By Class) with filter bar and date range picker.

**Problems:**
- **No "Needs Attention" view** — No way to see ungraded submissions or submissions without teacher review at a glance.
- **View mode tabs feel redundant** — "By Student" and "By Class" are nearly identical (class just adds a nesting level).
- **No inline grade editing** — Must click through to submission page to change a teacher grade.
- **Statistics bar is informational only** — Shows counts but not actionable (can't click "23 graded" to filter to graded).
- **Assignment management mixed in** — Edit/delete assignment buttons in the "By Assignment" view feel out of place.

### 4. Navigation & Information Architecture (Medium)

**Current nav:** `Dashboard | Grade | Students | Help | ⚙️ | 👤 User`

**Problems:**
- **"Grade" is a single-submission page** — Name implies it could be a grading overview.
- **"Students" opens the Bridge** — Teachers expect a student list, not a passphrase prompt.
- **No "Assignments" top-level page** — Assignments are created in a modal, managed inside Dashboard's "By Assignment" view, and selected in the Grade page. Three different places.
- **Settings gear is easy to miss** — Important config (AI model) hidden behind a small icon.
- **No breadcrumbs or page context** — On the submission page, you can't tell which assignment or student you're grading without scrolling up.

### 5. Settings (Low-Medium)

**Current state:** 6-tab modal (LLM Provider, Grading, Rubric, OCR, Document Types, Rubric Extraction).

**Problems:**
- **Too many tabs for most teachers** — 90% of teachers only need the LLM provider tab.
- **Prompt editing is power-user only** — Showing raw system prompts to non-technical teachers is intimidating.
- **No presets/profiles** — Can't save "ELA 6th Grade" vs "History AP" prompt configs.
- **Modal is large** — Takes over the entire screen; feels like a separate app.

---

## Solution A: Incremental Polish (Low Risk, Moderate Impact)

**Philosophy:** Keep the current architecture. Fix the worst pain points without restructuring pages or routes.

### Changes

| Area | Change | Effort |
|------|--------|--------|
| Students | Rename "Bridge" → "My Students" everywhere; auto-unlock with saved passphrase (cookie/session); hide UUID column | 0.5 days |
| Students | Move "Manage Class Periods" into a collapsible section; default collapsed | 0.25 days |
| Students | Add "Delete" button to roster table (currently only in Edit modal) | 0.25 days |
| Grade | Collapse empty sections by default; expand as teacher fills in data | 0.5 days |
| Grade | Sticky "Run Grade" button at bottom of viewport | 0.25 days |
| Grade | Remember last-used assignment and class period across sessions | 0.25 days |
| Dashboard | Add "Needs Review" filter (submissions with AI grade but no teacher grade) | 0.5 days |
| Dashboard | Make stats bar clickable (click "Graded: 23" → filter to graded) | 0.25 days |
| Nav | Rename "Grade" → "New Submission" | 0.1 days |
| Settings | Collapse advanced tabs by default; show only LLM provider tab initially | 0.25 days |

**Total effort:** ~3 days

### Comparison Dimensions

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Performance | ★★★★★ | No architectural changes |
| Cost | ★★★★★ | Minimal dev time |
| Complexity | ★★★★★ | Low risk, incremental changes |
| UX Impact | ★★☆☆☆ | Polishes rough edges but doesn't fix structural issues |
| Scalability | ★★☆☆☆ | Doesn't address batch grading or class-centric navigation |
| Time to Deliver | ★★★★★ | 3 days |
| Teacher Satisfaction | ★★★☆☆ | Noticeable improvement but still feels like the same app |

---

## Solution B: Class-Centric Redesign (Medium Risk, High Impact)

**Philosophy:** Restructure the app around how teachers actually think: **Classes → Students → Assignments → Grade**. Introduce a wizard-style grading flow and batch mode.

### New Information Architecture

```
Navigation:
  Dashboard (home)     → Overview with "Needs Attention" cards
  My Classes           → Class list → Students in class (replaces Bridge)  
  Assignments          → Assignment list with rubrics (new top-level page)
  Grade                → Wizard: Select Assignment → Select/Enter Student → Enter Essay → Grade
  Help                 → Same
  Settings (gear)      → Simplified (LLM only visible; advanced hidden)
```

### Key Changes

#### A. Replace "Students/Bridge" with "My Classes"

| Feature | Current | Proposed |
|---------|---------|----------|
| Entry | Passphrase unlock screen | Auto-unlock with session; only prompt on first use or after logout |
| Layout | Flat table with filter dropdown | Tab-per-class (e.g., "Period 1 | Period 2 | Period 3 | All") |
| Add student | Modal → type name/ID | Inline add row at bottom of class table |
| Class management | Separate card above roster | Classes are tabs; add/rename via right-click or "+" tab |
| Sync button | Manual "Sync All to Database" | Auto-sync on every change (silent, background) |
| Terminology | "Bridge", "UUID", "Local ID" | "My Students", hide UUID, "Student ID" |
| Bulk operations | Checkbox → dropdown → button | Drag-and-drop between class tabs (stretch goal) |

#### B. Assignment Management — Dedicated Page

| Feature | Current | Proposed |
|---------|---------|----------|
| Location | Modal + embedded in Dashboard "By Assignment" view | `/assignments` top-level page |
| Layout | Modal with many fields | Card grid: each assignment is a card showing title, rubric summary, submission count |
| Rubric entry | Textarea + "Enhance" button in modal | Visual rubric builder: categories as rows, levels as columns, drag to reorder |
| Document upload | Buried in modal | Drag-and-drop zone on assignment card |
| Source text | SourceTextSelector in modal | Inline file upload area on assignment detail page |

#### C. Grading Wizard (Progressive Disclosure)

Replace the single long-scroll page with a 3-step wizard:

| Step | Content | Navigation |
|------|---------|------------|
| **Step 1: Context** | Select assignment (pre-fills rubric + settings). Select or create student. Class period filter. | "Next →" button |
| **Step 2: Essay** | Enter essay text, upload image, or upload document. Full-width text area. AI transcription happens here. | "← Back" / "Next →" |
| **Step 3: Grade** | "Run Grade" button (prominent, top of page). AI results display. Teacher override fields. "Save & Next Student" button for batch flow. | "← Back" / "Save" / "Save & Next" |

**Batch mode:** After saving, "Save & Next Student" returns to Step 2 with the same assignment pre-selected and the next student in the class auto-selected. Teacher can grade an entire class's worth of essays without re-selecting the assignment.

#### D. Dashboard Redesign

| Feature | Current | Proposed |
|---------|---------|----------|
| Default view | Accordion list grouped by student | "Needs Attention" cards: ungraded, flagged, low-scoring |
| Quick actions | Click to view submission | Inline teacher grade entry; click to expand details |
| Filters | Class period + date range | + Status filter (Ungraded / AI Graded / Teacher Graded / Flagged) |
| Stats | Passive numbers | Clickable: click "12 Ungraded" → filters to those 12 |
| Assignment view | Edit/delete buttons in accordion | Separate Assignments page |

#### E. Simplified Settings

| Feature | Current | Proposed |
|---------|---------|----------|
| Tabs | 6 tabs visible | 2 tabs visible: "AI Model" + "Advanced" (collapsed) |
| Prompts | Raw textarea per prompt type | Hidden behind "Customize Prompts" expandable section |
| Presets | None | "Quick Setup" dropdown: "ELA Elementary", "ELA Middle School", "History AP", "Custom" |

### Effort Estimate

| Area | Effort |
|------|--------|
| My Classes page (replace Bridge) | 3 days |
| Assignments page (new) | 2 days |
| Grading Wizard (3-step) | 3 days |
| Batch grading mode | 1 day |
| Dashboard "Needs Attention" + inline grade | 2 days |
| Navigation restructure | 0.5 days |
| Settings simplification | 0.5 days |
| Testing & polish | 2 days |
| **Total** | **~14 days** |

### Comparison Dimensions

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Performance | ★★★★☆ | Slightly more components but same architecture |
| Cost | ★★★☆☆ | ~14 days of development |
| Complexity | ★★★☆☆ | Significant restructure but same tech stack |
| UX Impact | ★★★★★ | Transforms teacher experience; matches mental model |
| Scalability | ★★★★★ | Batch mode and class-centric design scale to large rosters |
| Time to Deliver | ★★★☆☆ | 2-3 weeks |
| Teacher Satisfaction | ★★★★★ | "This feels like it was built for teachers" |

---

## Solution C: Hybrid Approach (Recommended)

**Philosophy:** Do Solution A immediately for quick wins, then implement Solution B's highest-impact features in prioritized phases.

### Phase 1: Quick Wins (3 days)
All of Solution A — rename Bridge, hide UUIDs, sticky Run Grade, remember last assignment, "Needs Review" filter, clickable stats.

### Phase 2: Grading Wizard + Batch Mode (4 days)
Replace the single-scroll grade page with the 3-step wizard. Add "Save & Next Student" batch flow. This is the highest teacher-time-saving feature.

### Phase 3: My Classes Redesign (3 days)
Replace the Bridge manager with tab-per-class layout, auto-sync, inline add. Remove passphrase requirement (use session-based auto-unlock).

### Phase 4: Assignments Page (2 days)
Extract assignment management from Dashboard and CreateAssignmentModal into a dedicated `/assignments` page with card grid.

### Phase 5: Dashboard "Needs Attention" (2 days)
Add status-based filtering, clickable stats, and inline teacher grade entry.

### Total: ~14 days (same as Solution B, but delivers value at each phase)

### Comparison Dimensions

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Performance | ★★★★★ | Incremental, no big-bang risk |
| Cost | ★★★★☆ | Same total as B, but value at each checkpoint |
| Complexity | ★★★★☆ | Each phase is independently shippable |
| UX Impact | ★★★★★ | Quick wins in days, transformative changes in weeks |
| Scalability | ★★★★★ | Full redesign by Phase 5 |
| Time to Deliver | ★★★★☆ | Phase 1 ships in 3 days; full redesign in 2-3 weeks |
| Teacher Satisfaction | ★★★★★ | Iterative improvement keeps teachers engaged |

---

## Comparison Matrix

| Dimension | Solution A (Polish) | Solution B (Redesign) | Solution C (Hybrid) |
|-----------|--------------------|-----------------------|---------------------|
| **Performance** | ★★★★★ | ★★★★☆ | ★★★★★ |
| **Cost** | ★★★★★ (3 days) | ★★★☆☆ (14 days) | ★★★★☆ (14 days, phased) |
| **Complexity** | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| **UX Impact** | ★★☆☆☆ | ★★★★★ | ★★★★★ |
| **Scalability** | ★★☆☆☆ | ★★★★★ | ★★★★★ |
| **Time to First Value** | ★★★★★ (3 days) | ★★☆☆☆ (14 days) | ★★★★★ (3 days) |
| **Risk** | ★★★★★ (minimal) | ★★★☆☆ (big-bang) | ★★★★☆ (phased) |
| **Teacher Satisfaction** | ★★★☆☆ | ★★★★★ | ★★★★★ |

---

## RECOMMENDATION: Solution C (Hybrid)

### Rationale:
1. **Delivers value immediately** — Phase 1 quick wins ship in 3 days and address the most annoying friction points.
2. **Grading wizard is the highest-ROI feature** — Teachers grade hundreds of essays. A 3-step wizard with batch mode saves minutes per essay × hundreds of essays = hours saved.
3. **Phased delivery reduces risk** — Each phase is independently shippable and testable. No big-bang migration.
4. **Same total effort as Solution B** — But teachers see improvements at every checkpoint instead of waiting 2-3 weeks.

### Trade-offs:
- **Pros:** Fast initial wins, iterative feedback, lower risk, same end state as Solution B.
- **Cons:** Slightly more total git churn (intermediate refactors may be re-done in later phases). Teachers may give feedback that changes later phase priorities.

### Alternative:
If time is extremely limited (< 1 week), implement **Solution A only**. It delivers meaningful polish without any structural changes.

### Next Steps:
1. Review this document and select a solution approach.
2. Prioritize phases (or reorder based on teacher feedback).
3. Create execution plan(s) following the plan-file-constitution.
4. Execute phase by phase with stop-and-review protocol.

---

## Appendix: Feature Wishlist (from analysis, not in scope)

These emerged during analysis but are larger features beyond UX polish:

- **Real-time collaboration** — Multiple teachers grading the same assignment.
- **Student portal** — Students view their own grades and feedback.
- **Rubric template library** — Pre-built rubrics for common assignment types.
- **Grade analytics** — Charts showing class performance trends over time.
- **Mobile-responsive grading** — Grade on iPad/tablet (current UI is desktop-first).
- **Keyboard shortcuts** — Power users want Ctrl+Enter to grade, Tab to next student.
- **Undo/redo for teacher edits** — Currently no way to revert a teacher grade change.

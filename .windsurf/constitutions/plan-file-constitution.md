# Plan File Constitution

**Purpose:** This document defines the mandatory structure, conventions, and rules for creating execution plan files. All Cascade agents MUST follow this constitution when generating new plan files.

**Canonical examples:**
- `_project-docs/plans/00-{primary-feature}-execution.md` (in-progress, most complete template)
- `_project-docs/plans/completedPlans/{feature-name}-execution.md` (completed, proven pattern)
- `_project-docs/plans/completedPlans/{sub-feature}-execution.md` (completed, sub-plan example)

**Execution workflow:** `.windsurf/workflows/execute-phase.md`

---

## 1. File Naming and Location

### Naming Convention

```
{nn}-{kebab-case-name}-execution.md
```

- **`{nn}`** — Two-digit sequence number (`00`, `01`, etc.). Use `00` for the primary active plan. Completed plans move to `completedPlans/`.
- **`{kebab-case-name}`** — Short descriptive name of the work being done.
- **`-execution`** suffix — Required. Distinguishes execution plans from solution-compare docs, status docs, and meeting notes.

### Location

| State | Directory |
|---|---|
| Active / In Progress | `_project-docs/plans/` |
| Completed | `_project-docs/plans/completedPlans/` |

### Related Document Types (NOT execution plans)

These follow their own naming but are referenced by execution plans:

| Type | Pattern | Example |
|---|---|---|
| Solution Compare | `{name}-solution-compare.md` | `cc-workflows-visualization-solution-compare.md` |
| Meeting Notes | `meeting-notes/{name}.md` | `meeting-notes/DatabricksEmail.md` |
| Status Doc | `{name}-status.md` | `databricks-technical-status.md` |

---

## 2. Required Sections (In Order)

Every execution plan MUST contain these sections in this exact order. Do not omit any section. Do not reorder.

### Section 0: Title Block

```markdown
# {Feature Name} — Execution Plan

**Date:** YYYY-MM-DD
**Branch:** `feat/{branch-name}`
**Status:** READY FOR EXECUTION | IN PROGRESS | COMPLETE
**Mockup Source:** `{path to mockup HTML or design file, if applicable}`
**Template:** Follows `{reference plan file}` structure
```

**Rules:**
- **Date** is when the plan was authored (not when execution started).
- **Branch** is the Git branch where all phase commits land. Use `feat/` prefix.
- **Status** starts as `READY FOR EXECUTION`. Set to `IN PROGRESS` when Phase 1 begins. Set to `COMPLETE` when the final phase is `APPROVED`.
- **Mockup Source** is optional but strongly recommended for UI work. Points to the HTML mockup or design file that serves as the source of truth.
- **Template** references the plan file this one was modeled after.

### Section 1: Goal

```markdown
## Goal

{One paragraph describing what this plan accomplishes and why.}

Key outcomes:
1. **{Outcome 1}** — {brief description}
2. **{Outcome 2}** — {brief description}
3. ...
```

**Rules:**
- State what is being built, not how.
- Use numbered list for measurable outcomes.
- Bold the outcome name, follow with em-dash and description.
- 3–6 outcomes. If more are needed, the plan scope is probably too large — split it.

### Section 2: Execution Rules

This section is **identical in every plan file**. Copy it verbatim:

```markdown
## EXECUTION RULES — READ BEFORE ANY WORK

> **STOP-AND-REVIEW PROTOCOL**
>
> 1. Execute **ONE phase at a time**. Do NOT begin the next phase until the current phase is reviewed and approved by the human operator.
> 2. After completing each phase, update the **Phase Checklist** with completion status and the **Implementation Notes** section at the bottom of that phase with what was actually built.
> 3. Each phase is written to be **self-contained** — it includes full repo context so it can be executed in a new chat window with zero carryover context.
> 4. At the start of each phase, read the Implementation Notes from all prior completed phases to understand the as-built state (not just the original plan).
> 5. Do NOT skip steps. Do NOT combine phases. Do NOT start Phase N+1 until Phase N is marked `APPROVED` in the checklist.
> 6. If a phase requires changes to the plan based on what was actually built, note the deviation in the Implementation Notes and adjust subsequent phase instructions accordingly.
> 7. Commit at the end of each phase with the specified commit message. Do NOT push until the human operator approves.
```

### Section 3: Phase Checklist

```markdown
## Phase Checklist

Update this checklist after each phase completes. Mark `APPROVED` only after human review.

| Phase | Description | Status | Commit Hash | Approved By | Date |
|---|---|---|---|---|---|
| Phase 1 | {short description} | `NOT STARTED` | | | |
| Phase 2 | {short description} | `NOT STARTED` | | | |
| ... | ... | ... | | | |

**Status values:** `NOT STARTED` → `IN PROGRESS` → `COMPLETE` → `APPROVED`
```

**Rules:**
- Every phase gets a row.
- Status values are the exact strings shown above, wrapped in backticks.
- Commit Hash is filled by the agent after committing (short hash only, e.g., `a727eac`).
- Approved By is filled by the human operator.
- Date is filled when status becomes `APPROVED`.

### Section 4: Implementation Notes (Top-Level Deviations)

```markdown
## Implementation Notes (deviations from plan)

Record deviations here after each phase so subsequent phases can account for them.
```

**Rules:**
- This section starts empty when the plan is created.
- After each phase, append a `**Phase N:**` heading with bullet points for any deviations.
- If no deviations, write `**Phase N:** No deviations.`
- Deviations include: bug fixes discovered during execution, changes to assumptions, schema differences from mock, files that didn't exist as expected, scope adjustments.
- This section is the **first place** a new Cascade session should read to understand the as-built state.

### Section 5: Repository Context

```markdown
## Repository Context (As-Built Baseline)
```

**Rules:**
- This section provides the Cascade agent with everything it needs to execute without prior conversation context.
- Include the following subsections as applicable:

#### 5.1 Monorepo Structure
ASCII tree showing the relevant directories, their purpose, and port assignments (for web apps).

#### 5.2 Shared Packages / Reuse Inventory
Table listing every reusable component, type, config, and style available from shared packages. For each item, note which apps currently use it and whether the new work needs it. This prevents the agent from duplicating existing components.

#### 5.3 Current State of the Target
Describe the current state of the code being modified. List existing routes, pages, components, API endpoints — whatever is relevant. Call out what already works vs what is scaffold/placeholder.

#### 5.4 Mock / Design Inventory
If the work is driven by a mockup, list every page/component in the mock with:
- Mock page ID or name
- Current route (if exists)
- Gap level: `HIGH` (major rewrite), `MEDIUM` (enhancement), `LOW` (minor tweaks), `NEW` (doesn't exist yet)

#### 5.5 Route Table
If applicable, list the target route structure. Call out routes that exist, routes that need creation, and routes that need removal.

#### 5.6 New Components Needed
Table listing components that need to be created, whether they should be shared (`packages/ui`) or app-specific, and the rationale.

### Section 6: Backend Endpoints Map

```markdown
## Backend Endpoints — Complete Map
```

If the plan involves backend work, include three subsections:

#### 6.1 Endpoints That Exist and Are Ready
Table: `| Endpoint | Route File | Used By Page |`

#### 6.2 New Endpoints Needed
Table: `| Endpoint | Used By | Description |`

#### 6.3 Endpoints Where Existing Data May Be Insufficient
Table: `| Endpoint | Enhancement Needed | Mock Requires |`

**Rules:**
- Be exhaustive. Every API call the frontend will make must appear in one of these tables.
- The agent should be able to look at this section and know exactly which backend work is needed before any frontend phases begin.

### Section 7: Phase Definitions (the bulk of the plan)

Each phase is a numbered section:

```markdown
## {N}. Phase {P}: {Phase Title}

**Commit message:** `feat({scope}): phase {P} — {short description}`
**Prerequisite:** Phase {P-1} `APPROVED`
```

#### Phase Subsections (in order)

1. **Context** (`### N.0 Context`) — One paragraph explaining what this phase does and why it matters. Reference the mock page ID if applicable.

2. **Mock Layout** (`### N.1 Mock Layout`) — For UI phases, describe the visual layout in detail:
   - Row-by-row breakdown of what appears on the page
   - Stat card labels, table column names, chart types
   - Modal tab names and form fields
   - This is the source of truth for what the agent must build.

3. **Data Sources** (`### N.2 Data Sources`) — List every API endpoint this phase calls.

4. **Shared Components Used** (`### N.3 Shared Components Used`) — List every shared component and CSS class from `common.css` that this phase uses. This prevents the agent from creating custom styles for things that already exist.

5. **Implementation Steps** (`### N.X {Step Name}`) — Numbered substeps with:
   - **File path** — Always specify the full file path being created or modified.
   - **What to do** — Be specific enough that the agent can implement without guessing.
   - **Type definitions** — Include TypeScript interfaces when introducing new API response shapes.
   - **Code snippets** — Include key code patterns (endpoint signatures, SQL queries, component props) but do not write the entire implementation. The agent fills in the details.

6. **Verification** (`### N.Y Verification`) — Checklist of things to verify after the phase is built:
   ```markdown
   - [ ] {Verification item 1}
   - [ ] {Verification item 2}
   ```
   Always include:
   - `npx tsc --noEmit` — zero errors
   - `npm run build` — succeeds (note chunk sizes)
   - `npm test` — all tests pass, no regressions
   - Visual checks specific to this phase
   - Dark mode renders correctly (for UI phases)

7. **Implementation Notes** (`### N.Z Implementation Notes`) — Placeholder that the agent fills after execution:
   ```markdown
   ### N.Z Implementation Notes

   _(to be filled during execution)_
   ```

   When filled, the format is:
   ```markdown
   **Files created (N):**
   - `{path}` — {one-line description}

   **Files modified (N):**
   - `{path}` — {one-line description of changes}

   **Dependencies added:** (if any)

   **Deviations from plan:**
   - {deviation description and rationale}

   **Bug fixes applied during review:** (if any)

   **Verification:** `npx tsc --noEmit` — zero errors. `npm run build` — succeeds ({chunk sizes}). `npm test` — {N} tests pass ({N} test files). No regressions.
   ```

### Section 8: Shared Component Reuse Summary

```markdown
## Shared Component Reuse Summary

| Shared Resource | Package | Used By Pages |
|---|---|---|
| `{Component}` | `{package-name}` | {list of pages} |
```

**Rules:**
- List every shared resource used across the plan.
- This is the audit trail proving no duplication occurred.
- End with: `**No component is duplicated in {target app} that already exists in a shared package.**`

### Section 9: Follow-Up Items

```markdown
## Follow-Up Items (out of scope for this plan)
```

**Rules:**
- Numbered list of work discovered during execution that is explicitly out of scope.
- Each item includes enough context that a future plan can pick it up.
- Common items: CloudWatch SDK integration, real-time WebSocket updates, schema migrations, new agent workflows.

### Section 10: Timeline Estimate

```markdown
## Timeline Estimate

| Phase | Description | Effort | Cumulative |
|---|---|---|---|
| 1 | {description} | {N} days | {N} days |
```

**Rules:**
- Effort is in fractional days (0.5, 1, 1.5, 2, 2.5).
- Cumulative column is a running total.
- This is an estimate, not a commitment. Actual effort may vary.

### Section 11: Success Criteria

```markdown
## Success Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
```

**Rules:**
- Checkbox list of high-level acceptance criteria for the entire plan.
- These are the conditions that must be true for the plan to be considered complete.
- Always include: `npm run build` succeeds for all affected apps, dark mode works (UI plans), no `any` types in new code, all pages accessible.

---

## 3. Phase Design Principles

### Phase Ordering

1. **Backend first** — All new or enhanced endpoints before any frontend work. The agent should never build UI against endpoints that don't exist yet.
2. **Shared packages second** — New types, components, and styles that benefit multiple apps before app-specific work.
3. **Infrastructure third** — Layout, auth, routing changes before page content.
4. **Pages by complexity** — Build the hardest page first (e.g., Dashboard). This surfaces integration issues early.
5. **Final verification last** — Always end with a full build + manual walkthrough phase.

### Phase Sizing

- **Target: 1–3 hours of agent execution time per phase.**
- A phase that touches more than 6 files is probably too large. Split it.
- A phase that touches only 1 file with minor changes can be combined with an adjacent phase.
- Backend phases can be larger (many endpoints in one phase) because they're easier to verify.
- Complex UI phases (Dashboard, modals with multiple tabs) get their own phase.
- Simple UI phases (basic table page) can be grouped (e.g., "Phases 7–10: Skills, Tools, Activity, Evaluation").

### Phase Self-Containment

Each phase MUST be executable by a Cascade agent with **no prior conversation context**. This means:
- Reference file paths by their full path from the repo root.
- State which API endpoints to call, not "the endpoint from Phase 1."
- Include the commit message in the phase header.
- Include prerequisite phases that must be `APPROVED`.
- List shared components by their import path, not "the component we created."

### Commit Messages

Follow conventional commits:

```
feat({scope}): phase {N} — {short description}
```

- **scope** — The app or package being modified (e.g., `control-center`, `shared`, `backend`).
- **phase {N}** — Phase number for traceability.
- **short description** — What was built, in imperative mood.

---

## 4. Implementation Notes Format

Implementation Notes are the most important part of the plan after execution. They serve as the **ground truth** for what was actually built vs what was planned.

### Per-Phase Notes (bottom of each phase section)

Required subsections:

1. **Files created (N):** — New files with one-line descriptions.
2. **Files modified (N):** — Changed files with descriptions of what changed and approximate line counts.
3. **Dependencies added:** — New npm packages with versions.
4. **Deviations from plan:** — Bullet list of anything that differed from the plan and why.
5. **Bug fixes applied during review:** — Issues found during visual testing or review.
6. **Design decisions:** — Architectural choices made during implementation (e.g., "Skills remain as YAML files, not database. Git provides the audit trail.").
7. **Verification:** — Build output sizes, test counts, error counts.

### Top-Level Deviation Notes (Section 4)

Append after each phase with format:
```markdown
**Phase N:**
- {Deviation 1 — what happened and why}
- {Deviation 2}
```

These top-level notes are **critical** because:
- They are the first thing a new Cascade session reads.
- They override the original plan where they conflict.
- They chain forward — Phase 5's notes may say "due to Phase 3's sidebar width change..."

---

## 5. When NOT to Create an Execution Plan

Not every task needs a full execution plan. Use this decision tree:

| Condition | Action |
|---|---|
| Single file change or bug fix | Just do it. No plan needed. |
| 2–5 file changes, single session | Use a todo list, not a plan file. |
| 6+ file changes across multiple sessions | Create an execution plan. |
| Work requires human approval gates | Create an execution plan. |
| Work will be handed off between Cascade sessions | Create an execution plan. |
| Exploratory / investigative work | Use a solution-compare doc instead. |

---

## 6. Plan File Anti-Patterns

**DO NOT:**
- Write phases that depend on conversation context ("as we discussed...")
- Create phases with no verification steps
- Put implementation details in the Goal section
- Skip the Repository Context section (the agent WILL hallucinate file paths)
- Write phases that modify files outside the plan's scope without noting it
- Create plans with more than 20 phases (split into sub-plans instead)
- Leave Implementation Notes as placeholder after execution
- Reference mockup elements without describing them in Mock Layout (the agent cannot see images)

**DO:**
- Describe every mock element in text, not by reference to a screenshot
- Include TypeScript interface definitions for new API response shapes
- List every shared component and CSS class to prevent duplication
- Note when the mock differs from what the backend currently returns
- Record chunk sizes in verification so regressions are caught
- Cross-reference sub-plans when a phase spawns a separate execution plan

---

## 7. Sub-Plan Pattern

When a phase grows beyond its original scope, use the **sub-plan pattern**:

1. Create a new execution plan file for the sub-work (e.g., `{feature}-execution.md`).
2. In the parent plan's Implementation Notes, document that the phase was executed via the sub-plan.
3. List the sub-plan's commits in the parent phase's notes.
4. The sub-plan follows this same constitution — it gets its own Phase Checklist, Implementation Notes, etc.
5. Once the sub-plan is complete, the parent phase is marked `COMPLETE` (then `APPROVED` after review).

---

## 8. Quick Reference: Minimal Phase Template

```markdown
## {N}. Phase {P}: {Title}

**Commit message:** `feat({scope}): phase {P} — {description}`
**Prerequisite:** Phase {P-1} `APPROVED`

### {N}.0 Context

{What this phase does and why.}

### {N}.1 Implementation

{Step-by-step instructions with file paths.}

### {N}.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass
- [ ] {Phase-specific visual or functional checks}

### {N}.3 Implementation Notes

_(to be filled during execution)_
```

---

## 9. Checklist: Before Submitting a Plan for Execution

Before marking a plan as `READY FOR EXECUTION`, verify:

- [ ] Title Block has Date, Branch, Status, and Mockup Source (if applicable)
- [ ] Goal section has 3–6 measurable outcomes
- [ ] Execution Rules section is present (verbatim copy)
- [ ] Phase Checklist table has all phases with `NOT STARTED` status
- [ ] Implementation Notes section exists (empty is fine)
- [ ] Repository Context describes the as-built state of relevant code
- [ ] Backend Endpoints map is complete (if backend work is involved)
- [ ] Every phase has: commit message, prerequisite, context, implementation steps, verification, and Implementation Notes placeholder
- [ ] Phases are ordered: backend → shared packages → infrastructure → pages → final verification
- [ ] No phase touches more than 6 files
- [ ] Every API endpoint referenced by a UI phase exists in the Backend Endpoints map
- [ ] Every shared component referenced exists or is created in an earlier phase
- [ ] Timeline Estimate is provided
- [ ] Success Criteria checklist is provided
- [ ] Follow-Up Items section exists (even if empty)

---
description: Execute one phase of an execution plan, wait for approval, update checklist and notes, then begin the next phase
---

## Inputs

- `PLAN_FILE`: Absolute path to the execution plan markdown file (e.g., `_project-docs/plans/control-center-v3b-execution.md`)
- `PHASE_NUMBER`: The phase number to execute (e.g., `1`)

## Steps

### 1. Read the execution plan

Read `PLAN_FILE` in full. Locate:
- The **Phase Checklist** table (under `## Phase Checklist`)
- The **Implementation Notes** section (under `## Implementation Notes (deviations from plan)`)
- The **phase section** matching `PHASE_NUMBER` (look for `Phase {PHASE_NUMBER}:` in a heading — note: phase headings are prefixed with an outer section number, e.g., `## 3. Phase 1:`, `## 4. Phase 2:`, etc.)
- All prior phases' **Implementation Notes** subsections to understand the as-built state

### 2. Check prerequisites

- Confirm all prior phases are marked `APPROVED` in the Phase Checklist.
- If any prior phase is not `APPROVED`, **STOP** and tell the user which prerequisite is missing.

### 3. Update checklist to IN PROGRESS

Edit the Phase Checklist table: set the row for `Phase {PHASE_NUMBER}` status to `IN PROGRESS`.

### 4. Execute the phase

Follow every step in the phase section **literally and in order**:
- Create/modify files as specified.
- Run verification commands listed in the phase.
- Do NOT skip steps. Do NOT combine with other phases.
- If a step fails, debug and fix before proceeding to the next step.

### 5. Run verification

Execute the verification checklist at the end of the phase section. Every item must pass.

### 6. Commit

// turbo
Run the commit command specified in the phase header:
```
git add -A && git commit -m "{commit message from phase header}"
```
Do NOT push — wait for user approval.

### 7. Update checklist to COMPLETE

Edit the Phase Checklist table: set `Phase {PHASE_NUMBER}` status to `COMPLETE` and fill in the **Commit Hash** column (use the short hash from the commit).

### 8. Write Implementation Notes

Update **two** places:

1. **Per-phase notes** — Edit the `### {OUTER}.3 Implementation Notes` subsection at the bottom of the phase section (e.g., `### 3.3 Implementation Notes` for Phase 1, `### 4.3 Implementation Notes` for Phase 2, etc.). Replace the placeholder text with a concise summary of what was actually built (file names, line counts), any issues encountered and how they were resolved, and anything the next phase should know.

2. **Top-level deviations** — Append to the `## Implementation Notes (deviations from plan)` section near the top of the plan file. Add a `**Phase {PHASE_NUMBER}:**` heading followed by bullet points for any deviations from the plan and why, fixes applied during review, and anything that changes assumptions for later phases. If there were no deviations, write `**Phase {PHASE_NUMBER}:** No deviations.`

### 9. Present for review

Tell the user:
> **Phase {PHASE_NUMBER} complete.** Summary: {one-line summary}.
> 
> Please review the changes and reply `APPROVED` to proceed to Phase {PHASE_NUMBER + 1}, or provide feedback for revisions.

**STOP and wait for the user's response.** Do not proceed until the user replies.

### 10. Handle user response

- If the user says **APPROVED**: Edit the Phase Checklist table — set `Phase {PHASE_NUMBER}` status to `APPROVED`, fill in `Approved By` and `Date` columns. Then **automatically begin Step 1 again** with `PHASE_NUMBER` incremented by 1.
- If the user provides **feedback**: Make the requested changes, re-run verification, amend the commit, update Implementation Notes, and return to Step 9.
- If the user says **STOP** or asks to pause: Update the Implementation Notes with current state and stop.

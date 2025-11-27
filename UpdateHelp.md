# Update Help Page Plan

## Goal
Refresh the Help page (src/pages/Help.tsx) so that the "Advanced Features" section is organized by the app's primary tabs and communicates up-to-date workflows, including clearer FERPA guidance for the Students tab.

## Current Observations
- Branding is inconsistent: the UI still says "EssayEase" (correct product name) but other copy references a 6th-grade-only use case. The Help page should reinforce EssayEase branding while acknowledging it now supports all core subjects.
- The Advanced Features section mixes dashboard, grading, and annotation tips into a single linear list. Teachers have to skim everything to find the details they need.
- Several descriptions reference features that have moved (Search box on Dashboard, Settings modal layout changes, etc.).
- The Students tab section is minimal and does not remind teachers that student names are never stored server-side. No guidance on how to keep the encrypted Bridge file safe or what happens if the Bridge is locked.

## Requirements from User Request
1. Review the application and Help page (done).
2. Create a new plan file named `UpdateHelp.md` (this document).
3. Update the “Advanced Features” section to use tab-specific sub-sections for:
   - Dashboard
   - Grade
   - Students
4. For the Students tab description, provide explicit FERPA compliance instructions, explain the local encrypted Bridge file, how to manage it, and that it must live on the grading device.

## Proposed Updates

### Global Help Page Tweaks
- Keep the EssayEase name but refresh the hero copy to describe the broader, multi-subject scope (no longer only ELAR/6th grade).
- Add quick links (“Need help on a specific tab? Jump to…”) at the top of Advanced Features.
- Refresh Quick Start examples to include new AI Vision image transcription flow if necessary.

### Advanced Features Restructure
1. **Dashboard Tab**
   - Summaries of view modes (List, Grouped by Assignment, Grouped by Class) and how to switch.
   - Batch actions (delete, export CSV, status filters).
   - New submissions workflow and keyboard shortcuts (if any).
   - Settings gear references that affect global behavior (AI prompts, provider selection).
2. **Grade Tab**
   - Outline the grading experience (Verbatim viewer, AI Vision, Enhance Text, Annotate tab, Draft Comparison).
   - Highlight print/download options and how annotations export with PDFs.
   - Mention auto-save behavior for grading inputs if applicable.
3. **Students Tab (Bridge)**
   - Explain that all student names stay in the encrypted Bridge file stored **locally**.
   - Steps to unlock/lock the Bridge; requirement to keep the file on the same machine used for grading.
   - How to back up the encrypted file safely (e.g., encrypted drive or secure USB), and what happens if it’s lost.
   - Instructions for importing/exporting, managing class periods, and bulk student operations.
   - Callouts for FERPA compliance: no student PII synced to cloud, passphrase management best practices.

### FERPA Guidance (Students Tab Section)
- Add a callout (e.g., “🛡️ FERPA Compliance”) with:
  - Only UUIDs go to the cloud; names stay encrypted locally.
  - The Bridge file must remain on the teacher’s device (or a secure external drive) during grading sessions.
  - Unlocking the Bridge is required before the Dashboard shows student names.
  - Recommendations for passphrase strength, rotating passphrases each grading period, and logging out after each session.

## Implementation Checklist
1. Update copy in `Help.tsx` to new structure (split Advanced Features card into tab subsections, add FERPA callouts).
2. Refresh any outdated references (EssayEase branding, search box instructions, etc.).
3. Add headings/anchors for Dashboard, Grade, Students within the Advanced Features card for easier linking.
4. Ensure tests in `src/pages/Help.test.tsx` cover the new headings (“Advanced Features – Dashboard”, etc.).
5. Run `npm test src/pages/Help.test.tsx` to confirm updates.
6. Update screenshots/documentation if necessary (future task).

## Risks & Notes
- Help content is static; ensure copy changes mirror actual UI labels and flows.
- If future changes move settings or features, this help page must be updated again—consider linking to living documentation or referencing UI labels instead of detailed step-by-step instructions where possible.

## Next Steps
1. Implement the rewritten Help page content per this plan.
2. Update/expand Help page tests to assert the new sections.
3. Share with product/design for review before publishing.

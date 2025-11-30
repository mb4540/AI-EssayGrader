# Phase 1 Progress: Assignment Prompt Feature

**Date:** November 30, 2025  
**Branch:** `feature/assignment-prompt`  
**Status:** 🔵 IN PROGRESS (30% complete)

---

## ✅ Completed

### 1. Database Migration
- **File:** `migrations/add_assignment_prompt.sql`
- Added `assignment_prompt` column to `grader.assignments` table
- Added `assignment_prompt` column to `grader.submissions` table
- Both columns are `text` type, nullable (optional field)
- Includes verification queries

**Status:** ✅ Ready to run in Neon

### 2. Backend API Updates
- **File:** `netlify/functions/assignments.ts`
- Updated GET endpoint to include `assignment_prompt` in SELECT
- Updated POST endpoint to accept and insert `assignment_prompt`
- Updated PUT/PATCH endpoint to accept and update `assignment_prompt`
- Field is optional (uses `?.trim() || null` pattern)

**Status:** ✅ Complete

### 3. Frontend - CreateAssignmentModal
- **File:** `src/components/CreateAssignmentModal.tsx`
- Added `assignment_prompt` to Assignment interface
- Added `assignmentPrompt` state variable
- Added UI field (Textarea) between Description and Grading Criteria
- Field loads from `existingAssignment` in edit mode
- Field included in `createMutation.mutate()` payload
- Placeholder text and helper text added

**Status:** ✅ Complete

---

## 🔄 In Progress / TODO

### 4. Submission Ingestion (Next Step)
- **File:** `netlify/functions/ingest.ts`
- [ ] Add `assignment_prompt` to request schema validation
- [ ] Include in INSERT statement for submissions table
- [ ] Pass to background grading job

### 5. Background Grading
- **File:** `netlify/functions/grade-bulletproof-background.ts`
- [ ] Fetch `assignment_prompt` from submission
- [ ] Fetch `assignment_prompt` from assignment (if linked)
- [ ] Prioritize: submission.assignment_prompt || assignment.assignment_prompt
- [ ] Pass to prompt builder functions

### 6. LLM Prompt Integration
- **File:** `src/lib/prompts/extractor.ts`
- [ ] Add `assignmentPrompt` parameter to `buildExtractorPrompt()`
- [ ] Add `assignmentPrompt` parameter to `buildComparisonExtractorPrompt()`
- [ ] Include assignment instructions in prompt context
- [ ] Instruct LLM to evaluate adherence to prompt requirements

### 7. Frontend - Submission Page (Optional for Phase 1)
- **File:** `src/pages/Submission.tsx`
- [ ] Add `assignmentPrompt` state
- [ ] Load from assignment if `assignmentId` present
- [ ] Pass to CriteriaInput component
- [ ] Include in grading request

### 8. Testing
- [ ] Run database migration in Neon
- [ ] Create assignment with assignment_prompt
- [ ] Create assignment without assignment_prompt (test optional)
- [ ] Edit existing assignment to add prompt
- [ ] Grade submission with assignment prompt
- [ ] Verify prompt appears in LLM context
- [ ] Verify grading considers the prompt

### 9. Database Reference Update
- [ ] Update `db_ref.md` with new columns
- [ ] Document in Migration History section

---

## Production Deployment Status

### Phase 0: Annotation Category Fix
**Status:** ✅ DEPLOYED to production (main branch)
- Merged to main: November 30, 2025
- Pushed to GitHub: Triggers Netlify auto-deploy
- All 590 tests passing
- Production smoke test: PENDING (user testing now)

### Phase 1: Assignment Prompt
**Status:** 🔵 IN DEVELOPMENT (feature/assignment-prompt branch)
- Not yet merged to main
- Not yet deployed to production
- User can test Phase 0 in production while I continue Phase 1 development

---

## Git Workflow Summary

```bash
# Phase 0 Complete
✅ feature/annotation-enhancements → main (merged)
✅ main → origin/main (pushed - triggers Netlify deploy)

# Phase 1 In Progress
🔵 feature/assignment-prompt (current branch)
   - Migration file created
   - Backend API updated
   - CreateAssignmentModal updated
   - Committed as WIP
   - Ready to continue development
```

---

## Next Steps (Priority Order)

1. **Update ingest.ts** - Accept assignment_prompt in submission creation
2. **Update grade-bulletproof-background.ts** - Fetch and pass to prompts
3. **Update extractor.ts** - Include in LLM prompts
4. **Run migration** - Add columns to database
5. **Test end-to-end** - Create assignment → Grade submission → Verify prompt used
6. **Update db_ref.md** - Document schema changes
7. **Merge to main** - When Phase 1 complete and tested

---

## Estimated Time Remaining

- **Ingest.ts update:** 15 minutes
- **Grade-bulletproof-background.ts update:** 20 minutes
- **Extractor.ts update:** 30 minutes
- **Database migration:** 5 minutes
- **Testing:** 30 minutes
- **Documentation:** 15 minutes

**Total:** ~2 hours remaining for Phase 1

---

## Notes

- Assignment prompt is **optional** - backwards compatible with existing assignments
- Stored in both `assignments` and `submissions` tables
  - `assignments.assignment_prompt` - Default for all submissions of this assignment
  - `submissions.assignment_prompt` - Can override for ad-hoc grading
- Priority: Use submission's prompt if set, otherwise use assignment's prompt
- Helps LLM understand what students were asked to do (format, length, requirements)

---

## User Testing Instructions (Phase 0)

While I continue Phase 1 development, you can test Phase 0 in production:

1. **Go to production site** (Netlify auto-deployed from main branch)
2. **Grade a submission** with an ELAR rubric
3. **Verify:** All annotation categories use rubric criterion IDs (e.g., `ideas_development`)
4. **Verify:** No generic categories (e.g., `Content`, `Clarity`)
5. **Verify:** Consistent headers across:
   - Detailed Breakdown
   - Specific Corrections
   - Inline Annotations
6. **Report any issues** - I can fix while continuing Phase 1

---

**Last Updated:** November 30, 2025, 4:45 PM

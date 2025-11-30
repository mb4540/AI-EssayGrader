# Phase 0 Testing Checklist

**Phase:** Fix Annotation Category Inconsistency
**Status:** ✅ Code Complete - Ready for Testing
**Date:** November 30, 2025

---

## Changes Summary

Replaced generic annotation categories (`Content|Evidence|Organization|Clarity|Mechanics`) with rubric criterion IDs (e.g., `ideas_development|focus_organization|authors_craft|conventions`).

**Files Modified:**
- `src/lib/prompts/extractor.ts` (5 locations)

**Commit:** `cb901c3`

---

## Testing Checklist

### ✅ Database
- [x] No database changes required

### ⚪ Backend Testing

#### Test 1: Grade with Standard ELAR Rubric
- [ ] Run local dev server: `npm run dev`
- [ ] Navigate to Grade Submissions page
- [ ] Select or create assignment with ELAR rubric (IDEAS & DEVELOPMENT, FOCUS & ORGANIZATION, AUTHOR'S CRAFT, CONVENTIONS)
- [ ] Grade a submission
- [ ] **Verify:** All annotations use criterion IDs (e.g., `ideas_development`)
- [ ] **Verify:** NO generic categories appear (Content, Clarity, Mechanics)
- [ ] **Verify:** NO rubric display names appear (IDEAS & DEVELOPMENT)
- [ ] Check Netlify function logs for errors

#### Test 2: Grade with Different Rubric Type
- [ ] Create assignment with math/science rubric (different criteria)
- [ ] Grade a submission
- [ ] **Verify:** Annotations use the NEW rubric's criterion IDs
- [ ] **Verify:** System adapts to different rubric structure

#### Test 3: Pass 1 Annotations
- [ ] Grade submission
- [ ] Check browser console for LLM response
- [ ] **Verify:** Pass 1 annotations use rubric criterion IDs
- [ ] **Verify:** No generic categories in Pass 1

#### Test 4: Pass 2 Annotations
- [ ] Grade submission with rubric criteria that score < max points
- [ ] **Verify:** Pass 2 annotations use rubric criterion IDs
- [ ] **Verify:** criterion_id field matches category field

#### Test 5: Comparison Mode
- [ ] Grade submission with rough draft and final draft
- [ ] **Verify:** Comparison mode annotations use rubric criterion IDs
- [ ] **Verify:** No generic categories in comparison mode

### ⚪ Frontend Testing

#### Test 6: VerbatimViewer Display
- [ ] Open graded submission
- [ ] **Verify:** Annotations display correctly
- [ ] **Verify:** Hover tooltips work
- [ ] **Verify:** No console errors

#### Test 7: AnnotationViewer Display
- [ ] View "Specific Corrections" section
- [ ] **Verify:** Headers match rubric criterion IDs
- [ ] **Verify:** Grouping by criterion works correctly

#### Test 8: Print View
- [ ] Print graded submission
- [ ] **Verify:** Annotations display correctly
- [ ] **Verify:** Headers are consistent
- [ ] **Verify:** No layout issues

### ⚪ Integration Testing

#### Test 9: Consistent Headers Across Sections
- [ ] Grade submission
- [ ] Compare headers in:
  - Detailed Breakdown
  - Specific Corrections
  - Inline Annotations
- [ ] **Verify:** ALL sections use same criterion IDs
- [ ] **Verify:** No discrepancies between sections

#### Test 10: Multiple Rubrics
- [ ] Grade with ELAR rubric - note criterion IDs
- [ ] Grade with math rubric - note criterion IDs
- [ ] Grade with science rubric - note criterion IDs
- [ ] **Verify:** Each rubric's criterion IDs are used correctly
- [ ] **Verify:** No cross-contamination between rubrics

### ⚪ Production Smoke Test

#### Test 11: Deploy to Production
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor Netlify deployment logs
- [ ] **Verify:** No deployment errors

#### Test 12: Production Grading Test
- [ ] Grade 1 submission in production
- [ ] **Verify:** Consistent headers across all sections
- [ ] **Verify:** No generic categories
- [ ] Check Netlify function logs for errors
- [ ] **Verify:** No user-facing errors

---

## Success Criteria

### Must Pass:
- ✅ 100% of annotations use rubric criterion IDs
- ✅ 0 generic categories in output (Content, Clarity, Mechanics, etc.)
- ✅ Consistent headers across Detailed Breakdown, Specific Corrections, and Inline Annotations
- ✅ Works with any rubric (not just ELAR)
- ✅ No breaking changes to existing functionality

### Nice to Have:
- ✅ No performance degradation
- ✅ Clean Netlify function logs
- ✅ No console errors in browser

---

## Known Issues / Notes

_Document any issues found during testing here_

---

## Rollback Plan

If critical issues are found:

```bash
# Revert the commit
git revert cb901c3

# Or reset to previous commit
git reset --hard HEAD~1

# Force push to feature branch
git push origin feature/annotation-enhancements --force
```

---

## Test Results

### Local Testing
- **Date:** _____
- **Tester:** _____
- **Result:** ⚪ Not Started / 🟡 In Progress / ✅ Pass / ❌ Fail
- **Notes:** _____

### Production Testing
- **Date:** _____
- **Tester:** _____
- **Result:** ⚪ Not Started / 🟡 In Progress / ✅ Pass / ❌ Fail
- **Notes:** _____

---

## Next Steps

After Phase 0 passes all tests:
1. ✅ Mark Phase 0 as complete
2. ⚪ Begin Phase 1: Assignment Prompt - Database & Backend
3. ⚪ Update UpdateGrading.md with Phase 0 completion status

# Next Enhancements Plan

**Branch:** `feature/ui-polish-and-enhancements`  
**Created:** October 31, 2025  
**Status:** Ready for Development

---

## 🎯 Goals for This Feature Branch

Based on `FUTURE_WORK.md`, prioritize high-impact, low-effort improvements:

### Phase 1: UI/UX Polish (High Priority)
Focus on improving user experience with existing features.

### Phase 2: Bug Fixes (Medium Priority)
Address known issues that don't block core functionality.

### Phase 3: Nice-to-Have Features (Low Priority)
Add convenience features if time permits.

---

## 📋 Planned Enhancements

### 1. Dashboard Improvements ⭐ HIGH PRIORITY

#### A. Add Sorting Options
**Goal:** Allow teachers to sort submissions by different criteria

**Tasks:**
- [ ] Add sort dropdown to dashboard header
- [ ] Implement sort by:
  - Date (newest/oldest)
  - Student name (A-Z, Z-A)
  - AI grade (high to low, low to high)
  - Teacher grade (high to low, low to high)
- [ ] Persist sort preference in localStorage
- [ ] Update both List View and By Assignment view

**Files to modify:**
- `src/pages/Dashboard.tsx`

**Estimated time:** 1-2 hours

---

#### B. Add Date Range Filter
**Goal:** Filter submissions by date range

**Tasks:**
- [ ] Add date range picker component
- [ ] Implement filter logic
- [ ] Add "Last 7 days", "Last 30 days", "All time" presets
- [ ] Update API call to include date filters
- [ ] Update backend `list.ts` to handle date filtering

**Files to modify:**
- `src/pages/Dashboard.tsx`
- `netlify/functions/list.ts`

**Estimated time:** 2-3 hours

---

#### C. Add Statistics Summary
**Goal:** Show helpful statistics at top of dashboard

**Tasks:**
- [ ] Add stats card component
- [ ] Calculate and display:
  - Total submissions
  - Average AI grade
  - Average teacher grade
  - Submissions pending teacher review
  - Submissions graded today
- [ ] Add visual indicators (trend arrows, colors)

**Files to modify:**
- `src/pages/Dashboard.tsx`
- Create `src/components/DashboardStats.tsx`

**Estimated time:** 2-3 hours

---

### 2. Submission Form Improvements ⭐ HIGH PRIORITY

#### A. Add Draft Auto-Save
**Goal:** Prevent data loss if browser crashes

**Tasks:**
- [ ] Implement auto-save to localStorage every 30 seconds
- [ ] Show "Draft saved" indicator
- [ ] Restore draft on page load
- [ ] Clear draft after successful submission
- [ ] Add "Clear draft" button

**Files to modify:**
- `src/pages/Submission.tsx`

**Estimated time:** 2-3 hours

---

#### B. Add Assignment Templates
**Goal:** Quick-start with common assignment types

**Tasks:**
- [ ] Create templates for common assignments:
  - Personal Narrative
  - Persuasive Essay
  - Book Report
  - Research Paper
- [ ] Add "Load Template" button
- [ ] Pre-fill criteria from template
- [ ] Allow saving custom templates

**Files to modify:**
- `src/pages/Submission.tsx`
- Create `src/lib/templates.ts`

**Estimated time:** 2-3 hours

---

### 3. Grading Enhancements 🔵 MEDIUM PRIORITY

#### A. Add Grade History View
**Goal:** Show all versions of a submission's grades

**Tasks:**
- [ ] Create version history component
- [ ] Fetch versions from `submission_versions` table
- [ ] Display timeline of grade changes
- [ ] Show who changed what and when
- [ ] Add "Restore version" option

**Files to modify:**
- `src/pages/Submission.tsx`
- Create `src/components/VersionHistory.tsx`
- `netlify/functions/get-submission.ts` (add versions query)

**Estimated time:** 3-4 hours

---

#### B. Add Batch Grading Mode
**Goal:** Grade multiple submissions quickly

**Tasks:**
- [ ] Add "Batch Grade" button to dashboard
- [ ] Allow selecting multiple submissions
- [ ] Show submissions in queue
- [ ] Grade one at a time with quick navigation
- [ ] Show progress (3 of 10 graded)

**Files to modify:**
- `src/pages/Dashboard.tsx`
- Create `src/pages/BatchGrade.tsx`

**Estimated time:** 4-5 hours

---

### 4. CSV Export Enhancement 🔵 MEDIUM PRIORITY

#### A. Add Export Options
**Goal:** Customize what data to export

**Tasks:**
- [ ] Add export options modal
- [ ] Allow selecting columns to include
- [ ] Add date range filter for export
- [ ] Add "Export selected" option
- [ ] Add Excel format option (.xlsx)

**Files to modify:**
- `src/pages/Dashboard.tsx`
- `src/lib/csv.ts`

**Estimated time:** 2-3 hours

---

### 5. Student Bridge Improvements 🟢 LOW PRIORITY

#### A. Add Bulk Student Import
**Goal:** Import multiple students from CSV

**Tasks:**
- [ ] Add "Import CSV" button
- [ ] Parse CSV file (name, local ID)
- [ ] Validate data
- [ ] Add all students to bridge
- [ ] Show import summary

**Files to modify:**
- `src/pages/Students.tsx`
- `src/lib/bridge.ts`

**Estimated time:** 2-3 hours

---

#### B. Add Student Search
**Goal:** Quickly find students in large rosters

**Tasks:**
- [ ] Add search input to Students page
- [ ] Filter students by name or ID
- [ ] Highlight matching text
- [ ] Show "X of Y students" count

**Files to modify:**
- `src/pages/Students.tsx`

**Estimated time:** 1 hour

---

### 6. Performance Optimizations 🟢 LOW PRIORITY

#### A. Lazy Load Heavy Components
**Goal:** Improve initial page load time

**Tasks:**
- [ ] Lazy load OCR library (tesseract.js)
- [ ] Lazy load PDF library (pdfjs)
- [ ] Lazy load DOCX library (mammoth)
- [ ] Show loading spinner while loading

**Files to modify:**
- `src/pages/Submission.tsx`
- `src/lib/ocr.ts`
- `src/lib/docx.ts`

**Estimated time:** 2 hours

---

#### B. Add Loading Skeletons
**Goal:** Better perceived performance

**Tasks:**
- [ ] Add skeleton loaders for dashboard
- [ ] Add skeleton for submission view
- [ ] Add skeleton for grading panel
- [ ] Replace spinners with skeletons

**Files to modify:**
- `src/pages/Dashboard.tsx`
- `src/pages/Submission.tsx`
- Create `src/components/Skeletons.tsx`

**Estimated time:** 2-3 hours

---

## 🚫 Out of Scope for This Branch

These are documented in `FUTURE_WORK.md` but NOT included in this branch:

- ❌ Authentication & Multi-Tenancy (requires major backend changes)
- ❌ Blob Storage Configuration (requires Netlify setup)
- ❌ Mobile Optimization (separate mobile-focused branch)
- ❌ Internationalization (separate i18n branch)
- ❌ Notifications System (requires backend infrastructure)

---

## 📅 Recommended Implementation Order

### Week 1: Dashboard Polish
1. Dashboard sorting (1-2 hours)
2. Dashboard statistics (2-3 hours)
3. Date range filter (2-3 hours)
4. CSV export options (2-3 hours)

**Total: 7-11 hours**

### Week 2: Submission Improvements
1. Draft auto-save (2-3 hours)
2. Assignment templates (2-3 hours)
3. Student search (1 hour)
4. Loading skeletons (2-3 hours)

**Total: 7-10 hours**

### Week 3: Advanced Features (Optional)
1. Grade history view (3-4 hours)
2. Batch grading mode (4-5 hours)
3. Bulk student import (2-3 hours)
4. Performance optimizations (2 hours)

**Total: 11-14 hours**

---

## ✅ Definition of Done

For each enhancement:
- [ ] Code implemented and tested locally
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive design (works on mobile)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Documented in code comments
- [ ] User-facing changes documented in README (if applicable)

For the branch:
- [ ] All planned enhancements completed (or moved to future)
- [ ] Build passes (`npm run build`)
- [ ] Manual testing completed
- [ ] No regressions in existing features
- [ ] Ready to merge to main

---

## 🎯 Success Metrics

After this branch is merged:
- ✅ Dashboard is more useful (sorting, filtering, stats)
- ✅ Submission form is more reliable (auto-save)
- ✅ Teachers can work faster (templates, batch grading)
- ✅ Better user experience (loading states, skeletons)
- ✅ No new bugs introduced

---

## 📝 Notes

- Start with high-priority items first
- Test each feature thoroughly before moving to next
- Commit frequently with descriptive messages
- Update this plan as you progress
- Move incomplete items to FUTURE_WORK.md if needed

---

**Ready to start development!** 🚀

Choose a feature from the list and begin implementation.

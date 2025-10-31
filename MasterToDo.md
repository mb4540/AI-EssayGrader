# Master TODO List
## FastAI Grader - Consolidated Action Items

**Created:** October 31, 2025 - 8:59 AM  
**Branch:** `feature/ui-polish-and-enhancements`  
**Status:** Active Development

---

## ✅ Recently Completed (October 31, 2025)

### UI Polish & Consistency
- ✅ Dashboard refactored with "By Student" and "By Assignment" views
- ✅ Detached header cards across all pages
- ✅ Consistent styling (Dashboard, Grade Submission, Student Roster, Help)
- ✅ Navigation improvements (Grade, Add Assignment)
- ✅ New Assignment modal works globally
- ✅ Archived old Dashboard variants

### FERPA Compliance
- ✅ Student Bridge fully implemented
- ✅ Zero PII in database (production ready)
- ✅ All backend functions updated
- ✅ All frontend components using bridge

### Database
- ✅ Column naming standardized (`tablename_id` pattern)
- ✅ Schema documented in `db_ref.md`
- ✅ Migration scripts created

---

## 🎯 High Priority - Next Up

### 1. Dashboard Enhancements
**Goal:** Make Dashboard more useful for teachers

#### A. Add Sorting Options ⭐
- [ ] Add sort dropdown to dashboard header
- [ ] Implement sort by:
  - [ ] Date (newest/oldest)
  - [ ] Student name (A-Z, Z-A)
  - [ ] AI grade (high to low, low to high)
  - [ ] Teacher grade (high to low, low to high)
- [ ] Persist sort preference in localStorage
- [ ] Update both "By Student" and "By Assignment" views

**Files:** `src/pages/Dashboard.tsx`  
**Time:** 1-2 hours

#### B. Add Statistics Summary ⭐
- [ ] Create stats card component
- [ ] Display at top of dashboard:
  - [ ] Total submissions
  - [ ] Average AI grade
  - [ ] Average teacher grade
  - [ ] Submissions pending review
  - [ ] Submissions graded today
- [ ] Add visual indicators (colors, trend arrows)

**Files:** `src/pages/Dashboard.tsx`, `src/components/DashboardStats.tsx`  
**Time:** 2-3 hours

#### C. Add Date Range Filter ⭐
- [ ] Add date range picker component
- [ ] Implement filter logic
- [ ] Add presets: "Last 7 days", "Last 30 days", "All time"
- [ ] Update API to handle date filtering
- [ ] Update backend `list.ts`

**Files:** `src/pages/Dashboard.tsx`, `netlify/functions/list.ts`  
**Time:** 2-3 hours

---

### 2. Submission Form Improvements
**Goal:** Prevent data loss and speed up workflow

#### A. Add Draft Auto-Save ⭐
- [ ] Implement auto-save to localStorage every 30 seconds
- [ ] Show "Draft saved" indicator
- [ ] Restore draft on page load
- [ ] Clear draft after successful submission
- [ ] Add "Clear draft" button

**Files:** `src/pages/Submission.tsx`  
**Time:** 2-3 hours

#### B. Add Assignment Templates ⭐
- [ ] Create templates for common assignments:
  - [ ] Personal Narrative
  - [ ] Persuasive Essay
  - [ ] Book Report
  - [ ] Research Paper
- [ ] Add "Load Template" button
- [ ] Pre-fill criteria from template
- [ ] Allow saving custom templates

**Files:** `src/pages/Submission.tsx`, `src/lib/templates.ts`  
**Time:** 2-3 hours

---

### 3. CSV Export Enhancement
**Goal:** Give teachers more control over exports

- [ ] Add export options modal
- [ ] Allow selecting columns to include
- [ ] Add date range filter for export
- [ ] Add "Export selected" option
- [ ] Add Excel format option (.xlsx)

**Files:** `src/pages/Dashboard.tsx`, `src/lib/csv.ts`  
**Time:** 2-3 hours

---

## 🔵 Medium Priority

### 4. Grading Enhancements

#### A. Add Grade History View
- [ ] Create version history component
- [ ] Fetch versions from `submission_versions` table
- [ ] Display timeline of grade changes
- [ ] Show who changed what and when
- [ ] Add "Restore version" option

**Files:** `src/pages/Submission.tsx`, `src/components/VersionHistory.tsx`, `netlify/functions/get-submission.ts`  
**Time:** 3-4 hours

#### B. Add Batch Grading Mode
- [ ] Add "Batch Grade" button to dashboard
- [ ] Allow selecting multiple submissions
- [ ] Show submissions in queue
- [ ] Grade one at a time with quick navigation
- [ ] Show progress (3 of 10 graded)

**Files:** `src/pages/Dashboard.tsx`, `src/pages/BatchGrade.tsx`  
**Time:** 4-5 hours

---

### 5. Student Bridge Improvements

#### A. Add Student Search
- [ ] Add search input to Students page
- [ ] Filter students by name or ID
- [ ] Highlight matching text
- [ ] Show "X of Y students" count

**Files:** `src/components/bridge/BridgeManager.tsx`  
**Time:** 1 hour

#### B. Add Bulk Student Import
- [ ] Add "Import CSV" button
- [ ] Parse CSV file (name, local ID)
- [ ] Validate data
- [ ] Add all students to bridge
- [ ] Show import summary

**Files:** `src/components/bridge/BridgeManager.tsx`, `src/bridge/bridgeCore.ts`  
**Time:** 2-3 hours

---

## 🟢 Low Priority / Nice to Have

### 6. Performance Optimizations

#### A. Lazy Load Heavy Components
- [ ] Lazy load OCR library (tesseract.js)
- [ ] Lazy load PDF library (pdfjs)
- [ ] Lazy load DOCX library (mammoth)
- [ ] Show loading spinner while loading

**Files:** `src/pages/Submission.tsx`, `src/lib/ocr.ts`, `src/lib/docx.ts`  
**Time:** 2 hours

#### B. Add Loading Skeletons
- [ ] Add skeleton loaders for dashboard
- [ ] Add skeleton for submission view
- [ ] Add skeleton for grading panel
- [ ] Replace spinners with skeletons

**Files:** `src/pages/Dashboard.tsx`, `src/pages/Submission.tsx`, `src/components/Skeletons.tsx`  
**Time:** 2-3 hours

---

## 🚧 Known Issues to Fix

### Critical
- None currently

### Medium
- [ ] File upload errors (Netlify Blobs not configured)
  - Need to add `NETLIFY_SITE_ID` and `NETLIFY_BLOBS_TOKEN` env vars
  - Fix blob store initialization in `netlify/functions/upload-file.ts`

### Low
- [ ] Mobile optimization needed (separate branch)
- [ ] Dark mode inconsistencies (Help page had dark mode classes removed)

---

## 📅 Recommended Timeline

### This Week (Nov 1-7, 2025)
**Focus: Dashboard Polish**
1. Dashboard sorting (1-2 hours)
2. Dashboard statistics (2-3 hours)
3. Date range filter (2-3 hours)
4. CSV export options (2-3 hours)

**Total: 7-11 hours**

### Next Week (Nov 8-14, 2025)
**Focus: Submission Improvements**
1. Draft auto-save (2-3 hours)
2. Assignment templates (2-3 hours)
3. Student search (1 hour)
4. Loading skeletons (2-3 hours)

**Total: 7-10 hours**

### Week 3 (Nov 15-21, 2025)
**Focus: Advanced Features (Optional)**
1. Grade history view (3-4 hours)
2. Batch grading mode (4-5 hours)
3. Bulk student import (2-3 hours)
4. Performance optimizations (2 hours)

**Total: 11-14 hours**

---

## 🚫 Out of Scope (Future Branches)

These are documented but NOT for current branch:

### Authentication & Multi-Tenancy
- Requires major backend changes
- Need Netlify Identity or Auth0
- Extract `tenant_id` from auth context
- Update all backend functions

### Mobile Optimization
- Separate mobile-focused branch
- Touch-friendly UI
- Responsive improvements
- Mobile-specific features

### Internationalization (i18n)
- Separate i18n branch
- Multi-language support
- Translation management
- RTL support

### Notifications System
- Requires backend infrastructure
- Email notifications
- In-app notifications
- Push notifications

### Advanced Analytics
- Submission trends over time
- Student performance analytics
- Grade distribution charts
- Export analytics reports

---

## ✅ Definition of Done

### For Each Feature:
- [ ] Code implemented and tested locally
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive design (works on mobile)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Documented in code comments
- [ ] User-facing changes documented in README (if applicable)

### For the Branch:
- [ ] All planned enhancements completed (or moved to future)
- [ ] Build passes (`npm run build`)
- [ ] Manual testing completed
- [ ] No regressions in existing features
- [ ] Ready to merge to main

---

## 📝 Development Notes

### Best Practices
- Start with high-priority items first
- Test each feature thoroughly before moving to next
- Commit frequently with descriptive messages
- Update this TODO as you progress
- Move incomplete items back to FUTURE_WORK.md if needed

### File Organization
- Keep components small and focused
- Extract reusable logic to hooks
- Use TypeScript interfaces for all props
- Follow existing code style patterns
- Add comments for complex logic

### Testing Checklist
- Test on Chrome, Firefox, Safari
- Test on mobile viewport
- Test with real data (multiple students, assignments)
- Test edge cases (empty states, errors)
- Test keyboard navigation
- Test screen reader compatibility

---

## 🎯 Success Metrics

After completing high-priority items:
- ✅ Dashboard is more useful (sorting, filtering, stats)
- ✅ Submission form is more reliable (auto-save)
- ✅ Teachers can work faster (templates)
- ✅ Better user experience (loading states)
- ✅ No new bugs introduced
- ✅ Performance maintained or improved

---

## 📚 Related Documentation

- **FUTURE_WORK.md** - Long-term enhancements and ideas
- **NEXT_ENHANCEMENTS_PLAN.md** - Detailed implementation plans
- **DashboardRefactor.md** - Dashboard refactor documentation
- **db_ref.md** - Database schema reference
- **README.md** - Project overview and setup

---

## 🔄 Update Log

**October 31, 2025 - 8:59 AM**
- Created MasterToDo.md
- Consolidated items from NEXT_ENHANCEMENTS_PLAN.md and FUTURE_WORK.md
- Organized by priority (High, Medium, Low)
- Added time estimates
- Added recommended timeline
- Moved old plan files to OldPlans/

---

**Ready to continue development!** 🚀

Pick a high-priority item and start implementation.

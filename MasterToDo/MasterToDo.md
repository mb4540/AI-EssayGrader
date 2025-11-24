# Master TODO List
## FastAI Grader - Open Action Items

**Created:** October 31, 2025  
**Last Updated:** November 23, 2025  
**Branch:** `main`  
**Status:** Active Development

---

## 📑 Table of Contents

1. [TODO Management Instructions](#-todo-management-instructions)
2. [🔴 CRITICAL & BLOCKED](#-critical--blocked)
   - [Testing & Quality Assurance](#-testing--quality-assurance--highest-priority)
   - [Submission.tsx Refactor (Blocked)](#-submissiontsx-refactor-blocked)
3. [⭐⭐⭐ HIGH PRIORITY (Next Up)](#-high-priority-next-up)
   - [Assignment Modal Remaining Items](#-assignment-modal-remaining-items)
   - [Class Period Organization](#-class-period-organization)
   - [Clean Text Feature](#-clean-text-feature)
   - [Dashboard Enhancements](#-dashboard-enhancements)
   - [Submission Form Improvements](#-submission-form-improvements)
   - [High Priority User Feedback](#-high-priority-user-feedback)
4. [⭐⭐ MEDIUM PRIORITY](#-medium-priority)
   - [Blob Storage for Large Rubrics](#-blob-storage-for-large-rubrics)
   - [Anchor Chart Integration](#-anchor-chart-integration)
   - [Grading Enhancements](#-grading-enhancements)
   - [Student Bridge Improvements](#-student-bridge-improvements)
   - [Medium Priority User Feedback](#-medium-priority-user-feedback)
5. [⭐ LOW PRIORITY / NICE TO HAVE](#-low-priority--nice-to-have)
   - [Performance Optimizations](#-performance-optimizations)
   - [Refactoring & Code Organization](#-refactoring--code-organization)
6. [Known Issues to Fix](#-known-issues-to-fix)
7. [Out of Scope](#-out-of-scope-future-branches)

---

## 📋 TODO MANAGEMENT INSTRUCTIONS

### How to Use This File:
1. **This file contains OPEN TODO items only**
2. When items are complete, move them to `CompletedToDo.md`
3. Add completion date and commit reference when moving
4. Keep this file clean and focused on what's left to do
5. Update "Last Updated" timestamp when making changes

### File Organization:
- **MasterToDo.md** = Open TODO items (this file)
- **CompletedToDo.md** = Archived completed items  
- **REFACTOR_LESSONS_LEARNED.md** = Lessons from failed attempts

### Priority Levels:
- 🔴 **CRITICAL** - Must do immediately (blocks other work)
- ⭐⭐⭐ **HIGH** - Important, do soon  
- ⭐⭐ **MEDIUM** - Nice to have, not urgent
- ⭐ **LOW** - Future enhancement

---

## 🔴 CRITICAL & BLOCKED

### 🧪 TESTING & QUALITY ASSURANCE ⭐⭐⭐ HIGHEST PRIORITY

#### Test Suite Implementation
**Goal:** Achieve 75%+ test coverage with automated unit, integration, and E2E tests

**Status:** 🟢 **100% PASSING TESTS!** 🎉  
**Coverage:** ~59% current → 75%+ target  
**Tests:** 572 passing / 0 failing / 4 skipped (576 total)  
**Pass Rate:** 100% (was 92.5%)  
**Recent Work:** Fixed 40 test failures (Nov 23, 2025)

#### ✅ Recent Fixes (Nov 23, 2025)
- [x] **Fixed normalizer.test.ts** - Updated invalid annotation categories (19/19 passing)
- [x] **Fixed print.test.ts** - Updated to bulletproof feedback structure (34/34 passing)
- [x] **Fixed Help.test.tsx** - Added AuthProvider wrapper + text updates (11/11 passing)
- [x] **Fixed SettingsModal.test.tsx** - Removed duplicate tab + updated expectations (23/23 passing)
- [x] **Fixed CreateAssignmentModal.test.tsx** - Added OK button click after success (23/23 passing)

#### ✅ Completed Tests (14/40)
- [x] **Auth Utils** (25 tests)
- [x] **BridgeManager** (18 tests)
- [x] **Annotation Normalizer** (19 tests) ✨ **FIXED**
- [x] **PII Guard** (32 tests)
- [x] **Line Number Utilities** (37 tests)
- [x] **CSV Export** (17 tests)
- [x] **Rubric Parser** (19 tests)
- [x] **Rubric Builder** (36 tests)
- [x] **DOCX Parser** (16 tests)
- [x] **Document Types** (27 tests)
- [x] **Print Utilities** (34 tests) ✨ **FIXED**
- [x] **Help Page** (11 tests) ✨ **FIXED**
- [x] **Settings Modal** (23 tests) ✨ **FIXED**
- [x] **Create Assignment Modal** (23 tests) ✨ **FIXED**

#### 🔴 Priority 1: Unit Tests (Critical Functions - 90%+ coverage goal)

**Authentication & Security:**
- [ ] Password reset token generation - `netlify/functions/lib/password-reset.test.ts`
- [x] ✅ PII Guard validation - `src/lib/api/piiGuard.test.ts` (32/32 passing)

**Core Utilities:**
- [x] ✅ BulletProof Calculator
- [x] ✅ Annotation Normalizer ✨ **FIXED**
- [x] ✅ Line Number Utilities
- [x] ✅ CSV Parser
- [x] ✅ Rubric Parser
- [x] ✅ Rubric Builder
- [x] ✅ DOCX Parser
- [x] ✅ Document Types
- [x] ✅ Print Utilities ✨ **FIXED**
- [x] ✅ OCR Handler

**React Components (70%+ coverage goal):** ✅ **COMPLETE!**
- [x] ✅ GradePanel
- [x] ✅ AnnotatedTextViewer
- [x] ✅ AnnotationViewer
- [x] ✅ FileDrop
- [x] ✅ StudentSelector
- [x] ✅ CreateAssignmentModal
- [x] ✅ SettingsModal
- [x] ✅ VerbatimViewer

**Pages:** ✅ **5/7 COMPLETE!**
- [x] ✅ Login
- [x] ✅ Register
- [x] ✅ ForgotPassword
- [x] ✅ Help
- [x] ✅ Dashboard (Partial)
- [x] ✅ Submission (Partial)

#### 🟡 Priority 2: Integration Tests (15% of codebase)
- [ ] Submission Flow
- [ ] Authentication Flow
- [ ] Password Reset Flow
- [ ] Annotations Workflow

#### 🟢 Priority 3: E2E Tests (Critical User Flows)
- [ ] Complete Grading Flow
- [ ] Password Reset Flow
- [ ] File Upload Flow

---

### 🔴 Submission.tsx Refactor (BLOCKED)

**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Status:** 🔴 **BLOCKED** - Need to follow lessons learned from failed attempt  
**Previous Attempt:** Failed - Lost inline annotation feature (see `REFACTOR_LESSONS_LEARNED.md`)

**Goal:** Refactor the 697-line `Submission.tsx` file into smaller, maintainable components WITHOUT losing any features.

**Critical Success Factors:**
1. **Feature Parity is NON-NEGOTIABLE**
2. **Incremental approach**
3. **Test against production**
4. **Document existing features FIRST**

**Refactoring Plan:**
1. Document Current State
2. Extract State Hook
3. Extract Actions Hook
4. Extract Components One at a Time
5. Integration & Testing
6. Verification

---

## ⭐⭐⭐ HIGH PRIORITY (Next Up)

### Assignment Modal Remaining Items

**Estimated Time:** 1-2 hours  
**Plan File:** `OldPlans/PLAN_assignment_modal_confirmation.md`  
**Status:** Most features complete - Minor items remaining

**Remaining Tasks:**
- [ ] **Fix OK Button Not Closing Modal** (LOW PRIORITY)
  - Status: DEFERRED - Use X button workaround for now
  - Problem: Success/warning message displays, OK button click detected, but modal doesn't close
  - Workaround: Use X button in top-right to close modal
  - Files: `CreateAssignmentModal.tsx`, `Dashboard.tsx`

- [ ] **Testing & Deployment**
  - Run through all test cases
  - Deploy to production
  - Get user confirmation that fix works

---

### Class Period Organization

**Status:** 🟡 **OPEN** - Not started  
**Requested:** November 2, 2025

**Goal:** Allow teachers to organize students into class periods/groups for easier management.

**Tasks:**
- [ ] Update BridgeStudent interface with classPeriod field
- [ ] Add class period dropdown to Add Student form
- [ ] Add class period to Edit Student form
- [ ] Update StudentSelector to show class period
- [ ] Add class filter dropdown to Dashboard
- [ ] Implement filter logic in Dashboard
- [ ] Add "Group by Class" view option
- [ ] Update CSV export to include class period
- [ ] Add bulk edit feature (assign multiple students to class)

---

### Clean Text Feature

**Goal:** Clean up markdown artifacts and formatting issues when teachers paste text from PDFs

**Tasks:**
- [ ] Add "Clean Text" button to TEXT tab
- [ ] Reuse existing OCR cleanup prompt from SettingsModal
- [ ] Call `enhance-text` function with pasted text
- [ ] Replace textarea content with cleaned text
- [ ] Show loading state during cleanup
- [ ] Add tooltip: "Remove PDF artifacts and formatting issues"

---

### Dashboard Enhancements

**Goal:** Make Dashboard more useful for teachers

**A. Add Sorting Options**
- [ ] Add sort dropdown to dashboard header
- [ ] Implement sort by: Date, Student name, AI grade, Teacher grade
- [ ] Persist sort preference in localStorage

**B. Add Statistics Summary**
- [ ] Create stats card component
- [ ] Display: Total submissions, Average grades, Pending review, Graded today
- [ ] Add visual indicators

**C. Add Date Range Filter**
- [ ] Add date range picker component
- [ ] Implement filter logic
- [ ] Add presets: "Last 7 days", "Last 30 days", "All time"

---

### Submission Form Improvements

**Goal:** Prevent data loss and speed up workflow

**A. Add Draft Auto-Save**
- [ ] Implement auto-save to localStorage every 30 seconds
- [ ] Show "Draft saved" indicator
- [ ] Restore draft on page load
- [ ] Clear draft after successful submission

**B. Add Assignment Templates**
- [ ] Create templates for common assignments (Narrative, Persuasive, etc.)
- [ ] Add "Load Template" button
- [ ] Pre-fill criteria from template
- [ ] Allow saving custom templates

---

### High Priority User Feedback

**Shana (6th Grade ELAR):**
- [ ] **Bug: Create Assignment Modal not confirming save** (Priority: High)
  - Issue: No confirmation message after saving assignment

**Miranda (AP World History):**
- [ ] **Assignment save UX issue with large rubrics** (Priority: High)
  - Issue: Modal says "OK" but appears to fail (timeout with large rubric)
- [ ] **Assignment visibility on Dashboard** (Priority: High)
  - Issue: Saved assignments only visible in dropdown, not on Dashboard
- [ ] **Assignment switching bug - criteria not updating** (Priority: High)
  - Issue: When switching assignments, points update but criteria text doesn't

---

## ⭐⭐ MEDIUM PRIORITY

### Blob Storage for Large Rubrics

**Estimated Time:** 2-3 hours  
**Research File:** `BLOB_STORAGE_RESEARCH.md`  
**Status:** Research Complete - Implementation Optional

**Problem:** Large rubrics (7+ pages) cause storage/query issues.
**Solution:** Use Netlify Blobs for large rubrics.

**Implementation Phases:**
1. Setup (Install package, add column)
2. Upload (Detect large rubrics, store in blob)
3. Retrieval (Fetch from blob if key exists)
4. Deletion (Cleanup blobs)
5. Migration (Move existing large rubrics)

---

### Anchor Chart Integration

**Status:** ⚠️ BLOCKED - Need sample anchor chart from Shana
**Goal:** Support district-provided anchor charts that guide grading.

**Next Steps:**
- [ ] Get sample anchor chart from Shana
- [ ] Review page 50 of student edition book
- [ ] Determine format and usage pattern
- [ ] Spec out exact implementation

---

### Grading Enhancements

**A. Add Grade History View**
- [ ] Create version history component
- [ ] Fetch versions from `submission_versions` table
- [ ] Display timeline of grade changes
- [ ] Add "Restore version" option

**B. Add Batch Grading Mode**
- [ ] Add "Batch Grade" button to dashboard
- [ ] Allow selecting multiple submissions
- [ ] Grade one at a time with quick navigation

---

### Student Bridge Improvements

**A. Add Student Search**
- [ ] Add search input to Students page
- [ ] Filter students by name or ID
- [ ] Highlight matching text

**B. Add Bulk Student Import**
- [ ] Add "Import CSV" button
- [ ] Parse CSV file
- [ ] Validate data
- [ ] Add all students to bridge

---

### Medium Priority User Feedback

**Shana:**
- [ ] **CSV import: Handle header row**
- [ ] **Add capability for no student roster**

**Miranda:**
- [ ] **Support PDF/Word upload for rubrics**
- [ ] **Add ability to delete assignments**
- [ ] **Non-ELAR subject grading (focus on content not grammar)**

---

## ⭐ LOW PRIORITY / NICE TO HAVE

### Performance Optimizations

**A. Lazy Load Heavy Components**
- [ ] Lazy load OCR library (tesseract.js)
- [ ] Lazy load PDF library (pdfjs)
- [ ] Lazy load DOCX library (mammoth)

**B. Add Loading Skeletons**
- [ ] Add skeleton loaders for dashboard, submission view, grading panel

---

### Refactoring & Code Organization

**Component Directory Reorganization**
- [ ] Group components by feature (grading, annotations, submissions, etc.)
- [ ] Incremental migration
- [ ] Update imports

---

### Low Priority User Feedback

**Miranda:**
- [ ] **Mass edit/delete for student roster**

---

## 🚧 Known Issues to Fix

### Medium
- [ ] File upload errors (Netlify Blobs not configured)
  - Need to add `NETLIFY_SITE_ID` and `NETLIFY_BLOBS_TOKEN` env vars
  - Fix blob store initialization in `netlify/functions/upload-file.ts`

### Low
- [ ] Mobile optimization needed (separate branch)
- [ ] Dark mode inconsistencies

---

## 🚫 Out of Scope (Future Branches)

- **Authentication & Multi-Tenancy** (Requires major backend changes)
- **Mobile Optimization** (Separate branch)
- **Internationalization (i18n)**
- **Notifications System**
- **Advanced Analytics**

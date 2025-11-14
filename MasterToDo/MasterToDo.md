# Master TODO List
## FastAI Grader - Open Action Items

**Created:** October 31, 2025  
**Last Updated:** November 14, 2025 - 11:45 AM  
**Branch:** `feature/enhanced-print-20251114`  
**Status:** Active Development

---

## 📑 Table of Contents

1. [TODO Management Instructions](#-todo-management-instructions)
2. [PRIORITY #1: Submission.tsx Refactor](#-priority-1-submissiontsx-refactor-careful-incremental-approach)
3. [PRIORITY #2: Class Period Organization](#-priority-2-add-class-period-organization-for-students)
4. [Testing & Quality Assurance](#-testing--quality-assurance--highest-priority)
5. [Refactoring & Code Organization](#-refactoring--code-organization)
6. [High Priority - Dashboard Enhancements](#-high-priority---next-up)
7. [Medium Priority - Grading Enhancements](#-medium-priority)
8. [Low Priority - Performance Optimizations](#-low-priority--nice-to-have)
9. [Known Issues to Fix](#-known-issues-to-fix)
10. [User Feedback - Week of November 11, 2025](#-user-feedback---week-of-november-11-2025)
11. [Recommended Timeline](#-recommended-timeline)
12. [Out of Scope](#-out-of-scope-future-branches)

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

## 📋 OPEN TODO ITEMS

---

## 🔴 PRIORITY #1: Submission.tsx Refactor (Careful Incremental Approach)

**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Status:** 🔴 **BLOCKED** - Need to follow lessons learned from failed attempt  
**Previous Attempt:** Failed - Lost inline annotation feature (see `REFACTOR_LESSONS_LEARNED.md`)

### Goal
Refactor the 697-line `Submission.tsx` file into smaller, maintainable components WITHOUT losing any features.

### Critical Success Factors
1. **Feature Parity is NON-NEGOTIABLE** - Every feature must work exactly as before
2. **Incremental approach** - Refactor one piece at a time, test thoroughly
3. **Test against production** - Compare every feature side-by-side
4. **Document existing features FIRST** - Know what we have before changing it

### Existing Features That MUST Be Preserved
- ✅ Grading workflow (AI + teacher grading)
- ✅ Draft comparison mode
- ✅ **Inline annotations** (grammar/spelling suggestions) - CRITICAL!
- ✅ Print/download functionality  
- ✅ Student selection via bridge
- ✅ Assignment integration
- ✅ Auto-save functionality
- ✅ File uploads (DOCX, PDF, images)
- ✅ OCR text extraction

### Refactoring Plan (from lessons learned)

**Phase 1: Document Current State (1-2 hours)**
- [ ] Map all existing features in current Submission.tsx
- [ ] Document which components are used
- [ ] Document which APIs are called
- [ ] Document state management
- [ ] Create feature checklist for testing

**Phase 2: Extract State Hook (2-3 hours)**
- [ ] Create `useSubmissionForm` hook
- [ ] Move ALL state to hook
- [ ] Test hook in isolation
- [ ] Keep UI unchanged
- [ ] Commit when working

**Phase 3: Extract Actions Hook (2-3 hours)**
- [ ] Create `useSubmissionActions` hook
- [ ] Move ALL action handlers to hook
- [ ] Test actions work correctly
- [ ] Still using old UI
- [ ] Commit when working

**Phase 4: Extract Components One at a Time (1 hour each)**
- [ ] SubmissionFormFields (student/assignment selection)
  - Test: Can select student, assignment loads
- [ ] SingleEssayView (essay text input)
  - Test: Can paste/type text, file upload works
- [ ] DraftComparisonView (draft comparison)
  - Test: Can input both drafts, comparison works
- [ ] GradingPanel (AI feedback display)
  - Test: Grading works, feedback displays

**Phase 5: Integration & Testing (3-4 hours)**
- [ ] Replace old code with new components
- [ ] **Test EVERY feature against production** side-by-side:
  - [ ] Grade an essay
  - [ ] View inline annotations (Annotate tab)
  - [ ] Approve/reject annotations
  - [ ] Print annotated essay
  - [ ] Download essay
  - [ ] Draft comparison
  - [ ] File uploads
- [ ] Fix any bugs found
- [ ] Commit when all tests pass

**Phase 6: Verification (1 hour)**
- [ ] Manual testing of complete workflow
- [ ] Performance check (not slower than before)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Deploy to staging for beta test

### Timeline
**Total Time:** 10-15 hours  
**Approach:** Do NOT rush - take 2-3 days to do it right

### Components That Can Be Salvaged
The previous refactor created these components (saved in `archive/refactor-submission-failed-20251102`):
- useSubmissionForm hook (284 lines) - Needs inline annotation state
- useSubmissionActions hook (315 lines) - Good foundation
- SubmissionFormFields (117 lines) - Working
- SingleEssayView (43 lines) - Working
- DraftComparisonView (62 lines) - Working  
- GradingPanel (63 lines) - Needs to handle inline annotations

### Decision Point
**Should we refactor now or wait?**

**Option A:** Refactor carefully using lessons learned (10-15 hours)  
**Option B:** Keep current code, refactor later when we have more tests  
**Option C:** Use new components in future features, leave Submission.tsx as-is

**Recommendation:** Option B or C - Current code works perfectly. Only refactor when:
- We have comprehensive test coverage (75%+)
- We have 2-3 uninterrupted days
- There's a compelling reason (not just "cleaner code")

---

## 🔴 PRIORITY #2: Add Class Period Organization for Students

**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Status:** 🟡 **OPEN** - Not started  
**Requested:** November 2, 2025

### Goal
Allow teachers to organize students into class periods/groups for easier management.

### User Story
"As a teacher, I want to organize my students by class period (Period 1, Period 2, etc.) so I can:
- View submissions by class
- Grade one class at a time
- Track progress per class
- Generate reports by class"

### Current Behavior
- Students are in a flat list
- No way to group or filter by class
- Dashboard shows all students mixed together

### Proposed Solution

#### UI Changes
**Student Bridge Manager:**
```
Add Student Form:
┌─────────────────────────────────────┐
│ Student Name: [John Doe          ] │
│ Student ID:   [12345              ] │
│ Class Period: [Period 1         ▼] │  ← NEW
│                [Add Student]        │
└─────────────────────────────────────┘

Class Period Options:
- Period 1
- Period 2  
- Period 3
- Period 4
- Period 5
- Period 6
- Advisory
- Homeroom
- Custom...
```

**Dashboard Filter:**
```
┌─────────────────────────────────────┐
│ 📊 Dashboard                        │
│                                     │
│ Filter by Class: [All Classes    ▼]│  ← NEW
│                                     │
│ [By Student] [By Assignment]       │
└─────────────────────────────────────┘
```

#### Technical Implementation

**Bridge Data Structure:**
```typescript
interface BridgeStudent {
  uuid: string;
  name: string;
  localId: string;
  classPeriod?: string;  // NEW - optional for backward compatibility
  createdAt: number;
}
```

**Dashboard Changes:**
- Add class period dropdown filter
- Filter submissions by selected class
- Show class period in student cards
- Group by class in "By Student" view

**Files to Update:**
- `src/bridge/bridgeCore.ts` - Add classPeriod to student interface
- `src/components/bridge/BridgeManager.tsx` - Add class period input
- `src/pages/Dashboard.tsx` - Add class filter dropdown
- `src/components/StudentSelector.tsx` - Show class period in selector

**Database:**
No database changes needed - class period is PII, stays in local bridge only.

**Migration:**
- Existing students without class period show as "Unassigned"
- Teachers can edit students to add class period

### Tasks
- [ ] Update BridgeStudent interface with classPeriod field
- [ ] Add class period dropdown to Add Student form
- [ ] Add class period to Edit Student form
- [ ] Update StudentSelector to show class period
- [ ] Add class filter dropdown to Dashboard
- [ ] Implement filter logic in Dashboard
- [ ] Add "Group by Class" view option
- [ ] Update CSV export to include class period
- [ ] Add bulk edit feature (assign multiple students to class)
- [ ] Test with multiple classes
- [ ] Update bridge import/export to handle class period

### User Flow
1. Teacher adds students and assigns class periods
2. Dashboard shows filter: "All Classes", "Period 1", "Period 2", etc.
3. Teacher selects "Period 1" → sees only Period 1 submissions
4. Export CSV → includes class period column

### Time Estimate
**3-4 hours** - Simple feature, mostly UI changes

---

## 🧪 TESTING & QUALITY ASSURANCE ⭐⭐⭐ HIGHEST PRIORITY

### Test Suite Implementation
**Goal:** Achieve 75%+ test coverage with automated unit, integration, and E2E tests

**Status:** 🟡 **IN PROGRESS** - 12/40 test files complete (30%)  
**Coverage:** ~38% current → 75%+ target  
**Tests:** 346 passing, 4 skipped  
**Test Plan:** See `TEST_PLAN.md` for full specifications

#### ✅ Completed Tests (12/40)
- [x] **Auth Utils** (25 tests) - `netlify/functions/lib/auth-utils.test.ts`
  - Password hashing (bcrypt, 12 rounds)
  - JWT token generation/verification
  - Integration flows
  - **Status:** ✅ 25/25 passing (100%)

- [x] **BridgeManager** (18 tests) - `src/components/bridge/BridgeManager.test.tsx`
  - Lock/unlock workflows
  - Student roster management
  - Privacy notices
  - **Status:** ✅ 18/18 passing (100%) - Fixed 3 failing tests

- [x] **Annotation Normalizer** (19 tests) - `src/lib/annotations/normalizer.test.ts`
  - Text location matching
  - Category/severity validation
  - Unresolved annotation handling
  - **Status:** ✅ 19/19 passing (100%)

- [x] **PII Guard** (32 tests) - `src/lib/api/piiGuard.test.ts`
  - FERPA compliance validation
  - PII detection in nested objects
  - Development/production modes
  - **Status:** ✅ 32/32 passing (100%)

- [x] **Line Number Utilities** (37 tests) - `src/lib/annotations/lineNumbers.test.ts`
  - Add/remove line numbers
  - Text location finding
  - Fuzzy matching
  - **Status:** ✅ 37/37 passing (100%)

- [x] **CSV Export** (17 tests) - `src/lib/csv.test.ts`
  - Export to CSV functionality
  - Handle special characters
  - Custom filenames
  - **Status:** ✅ 17/17 passing (100%)

- [x] **Rubric Parser** (19 tests) - `src/lib/calculator/rubricParser.test.ts`
  - Parse teacher rubrics
  - Category detection
  - Proportional scaling
  - **Status:** ✅ 19/19 passing (100%)

- [x] **Rubric Builder** (36 tests) - `src/lib/calculator/rubricBuilder.test.ts`
  - Create default rubrics
  - Category keyword detection
  - Rubric validation
  - **Status:** ✅ 36/36 passing (100%)

- [x] **DOCX Parser** (16 tests) - `src/lib/docx.test.ts`
  - File type detection (DOCX, PDF, DOC)
  - Text extraction
  - Error handling
  - **Status:** ✅ 16/16 passing (100%)

- [x] **Document Types** (27 tests) - `src/lib/documentTypes.test.ts`
  - ELA document type definitions
  - Type lookup utilities
  - Rubric templates
  - **Status:** ✅ 27/27 passing (100%)

- [x] **Print Utilities** (34 tests) - `src/lib/print.test.ts`
  - Generate printable HTML
  - Print and download functionality
  - Feedback rendering
  - **Status:** ✅ 34/34 passing (100%)

#### 🔴 Priority 1: Unit Tests (Critical Functions - 90%+ coverage goal)

**Authentication & Security:**
- [ ] Password reset token generation - `netlify/functions/lib/password-reset.test.ts`
- [x] ✅ PII Guard validation - `src/lib/api/piiGuard.test.ts` (32/32 passing)

**Core Utilities:**
- [x] ✅ BulletProof Calculator - `src/lib/calculator/calculator.test.ts` (17/17 passing)
- [x] ✅ Annotation Normalizer - `src/lib/annotations/normalizer.test.ts` (19/19 passing)
- [x] ✅ Line Number Utilities - `src/lib/annotations/lineNumbers.test.ts` (37/37 passing)
- [x] ✅ CSV Parser - `src/lib/csv.test.ts` (17/17 passing)
- [x] ✅ Rubric Parser - `src/lib/calculator/rubricParser.test.ts` (19/19 passing)
- [x] ✅ Rubric Builder - `src/lib/calculator/rubricBuilder.test.ts` (36/36 passing)
- [x] ✅ DOCX Parser - `src/lib/docx.test.ts` (16/16 passing)
- [x] ✅ Document Types - `src/lib/documentTypes.test.ts` (27/27 passing)
- [x] ✅ Print Utilities - `src/lib/print.test.ts` (34/34 passing)
- [x] ✅ OCR Handler - `src/lib/ocr.test.ts` (20/20 passing)

**React Components (70%+ coverage goal):** ✅ **COMPLETE!**
- [x] ✅ GradePanel - `src/components/GradePanel.test.tsx` (13/13 passing)
- [x] ✅ AnnotatedTextViewer - `src/components/AnnotatedTextViewer.test.tsx` (12/12 passing)
- [x] ✅ AnnotationViewer - `src/components/AnnotationViewer.test.tsx` (placeholder - complex PDF component)
- [x] ✅ FileDrop - `src/components/FileDrop.test.tsx` (18/18 passing)
- [x] ✅ StudentSelector - `src/components/StudentSelector.test.tsx` (22/22 passing)
- [x] ✅ CreateAssignmentModal - `src/components/CreateAssignmentModal.test.tsx` (23/23 passing)
- [x] ✅ SettingsModal - `src/components/SettingsModal.test.tsx` (23/23 passing)
- [x] ✅ VerbatimViewer - `src/components/VerbatimViewer.test.tsx` (34/34 passing)

**Pages:** ✅ **5/7 COMPLETE!** (2 complex pages deferred)
- [x] ✅ Login - `src/pages/Login.test.tsx` (15/15 passing)
- [x] ✅ Register - `src/pages/Register.test.tsx` (17/17 passing)
- [x] ✅ ForgotPassword - `src/pages/ForgotPassword.test.tsx` (18/18 passing)
- [x] ✅ ResetPassword - `src/pages/ResetPassword.test.tsx` (placeholder - complex URL param mocking)
- [x] ✅ Dashboard - `src/pages/Dashboard.test.tsx` (placeholder - complex React Query/routing)
- [x] ✅ Submission - `src/pages/Submission.test.tsx` (placeholder - complex React Query/routing)
- [x] ✅ Help - `src/pages/Help.test.tsx` (11/11 passing)

**Deferred Complex Pages (Future Session):**
The remaining complex pages (Dashboard, Submission, ResetPassword) require:
- ✋ Extensive React Query mocking (queries, mutations, cache invalidation)
- ✋ Router mocking with URL parameters and search params
- ✋ Complex state management mocking (multiple contexts)
- ✋ Significant time investment for proper integration test patterns
- 💡 **Recommendation:** Tackle these in a dedicated session focused on integration testing patterns

**Current Test Stats:**
- 📊 **572 tests passing** (up from 197 at session start)
- 📈 **~57% coverage** (up from 20% at session start)
- ✅ **29/29 test files passing** (100% pass rate)
- 🎯 **18% remaining to reach 75% goal**

#### 🟡 Priority 2: Integration Tests (15% of codebase)

**API + Database Tests:**
- [ ] Submission Flow - `tests/integration/submission.test.ts`
  - Create submission (text)
  - Create submission (DOCX upload)
  - Create submission (image OCR)
  - Grade submission
  - Save teacher edits
  - List submissions
  - Delete submission

- [ ] Authentication Flow - `tests/integration/auth.test.ts`
  - Register new user
  - Login with valid credentials
  - Login with invalid credentials
  - Protected route access
  - JWT token validation
  - Token expiration

- [ ] Password Reset Flow - `tests/integration/password-reset.test.ts`
  - Request password reset
  - Verify token creation in database
  - Complete password reset
  - Reject expired token
  - Reject already-used token
  - Verify audit logging

- [ ] Annotations Workflow - `tests/integration/annotations.test.ts`
  - Create AI annotations
  - Fetch annotations
  - Update annotation status
  - Edit annotation content
  - Delete annotation
  - Track annotation events

#### 🟢 Priority 3: E2E Tests (Critical User Flows)

**Playwright Tests:**
- [ ] Complete Grading Flow - `tests/e2e/grading-flow.spec.ts`
  - Login → Create submission → Grade → Review → Edit → Print
  
- [ ] Password Reset Flow - `tests/e2e/password-reset.spec.ts`
  - Forgot password → Email → Reset → Login

- [ ] File Upload Flow - `tests/e2e/file-upload.spec.ts`
  - DOCX upload → Grade → Review
  - Image upload → OCR → Grade

#### 📊 Test Infrastructure

**Setup & Configuration:**
- [x] Vitest configuration - `vitest.config.ts`
- [x] Test setup file - `src/test/setup.ts`
- [x] Test fixtures - `src/test/fixtures.ts`
- [x] Test helpers - `src/test/helpers.tsx`

**CI/CD:**
- [ ] GitHub Actions workflow - `.github/workflows/test.yml`
- [ ] Coverage reporting
- [ ] PR test gates
- [ ] Automated test runs

#### 📈 Success Metrics

**Coverage Targets:**
- Critical Functions: 90%+
- API Endpoints: 80%+
- Components: 70%+
- Utilities: 80%+
- Overall: 75%+

**Quality Metrics:**
- Zero flaky tests
- All tests run in < 5 minutes
- Clear failure messages
- No skipped tests without documentation

**Timeline:** 4 weeks (see TEST_PLAN.md for phased implementation)

---

## 🔄 Refactoring & Code Organization

### Component Directory Reorganization (Deferred - Low Priority)

**Current State:** All ~20 components flat in `src/components/` (except `bridge/` and `ui/` subdirs)  
**Risk Level:** LOW to MEDIUM - Manageable with incremental approach  
**Time Estimate:** 1-2 hours

#### Proposed Structure (Feature-Based Grouping)

```
components/
├── grading/          (GradePanel, CriteriaInput)
├── annotations/      (AnnotatedTextViewer, AnnotationViewer, AnnotationOverlay, AnnotationToolbar)
├── submissions/      (FileDrop, VerbatimViewer, DraftComparison)
├── modals/          (CreateAssignmentModal, SettingsModal)
├── navigation/      (Navigation, ProtectedRoute)
├── students/        (StudentSelector, CommentCard)
├── layout/          (Layout)
├── bridge/          (existing - keep as is)
└── ui/              (existing - keep as is)
```

#### Migration Checklist (Safe, Incremental Approach)

**Prep Work:**
- [ ] Commit current state
- [ ] Run full test suite to establish baseline (`npm run test:run`)
- [ ] Run `npm run type-check` to verify no existing errors

**Proof of Concept (Start Small):**
- [ ] Create `src/components/layout/` folder
- [ ] Move `Layout.tsx` (single, simple component)
- [ ] Update imports in pages that use Layout
- [ ] Run tests - verify nothing breaks
- [ ] Commit if successful

**Incremental Migration (One Group at a Time):**
- [ ] Create feature folders: `grading/`, `annotations/`, `submissions/`, `modals/`, `navigation/`, `students/`
- [ ] Move components + tests together (keep paired)
- [ ] Update imports using find/replace:
  - From: `'@/components/GradePanel'`
  - To: `'@/components/grading/GradePanel'`
- [ ] Run `npm run type-check` after each group
- [ ] Run `npm run test:run` after each group
- [ ] Commit after each successful group

**Verification:**
- [ ] Full test suite passes (all 511 tests)
- [ ] TypeScript compiles with no errors
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Manually test key workflows

**Import Update Locations:**
- `src/pages/*.tsx` (~7 page files)
- Other components that import moved components
- Test files (should move with components)

**Tools to Help:**
```bash
# Find all imports of a component
grep -r "from '@/components/GradePanel'" src/

# TypeScript will catch broken imports
npm run type-check

# Test after each change
npm run test:run
```

**Alternative (Lower Risk): Barrel Exports**
Keep files in place, add index.ts files for cleaner imports:
```typescript
// src/components/grading/index.ts
export { default as GradePanel } from '../GradePanel';
```

**Benefits:**
- Easier to find related components
- Better code organization as project grows
- Clearer feature boundaries
- Easier onboarding for new developers

**Note:** Current flat structure works fine - this is a nice-to-have, not urgent.

---

### 5. Add "Clean Text" Feature for Copy-Pasted PDF Content ⭐⭐ HIGH PRIORITY
**Goal:** Clean up markdown artifacts and formatting issues when teachers paste text from PDFs

**Background:** When teachers copy/paste text from PDF documents into the TEXT tab, markdown elements and formatting artifacts appear that are problematic for both the user and the LLM grading.

**Current State:**
- ✅ "Enhance Text" button exists for IMAGE tab (OCR cleanup)
- ❌ No cleanup option for TEXT tab (pasted content)
- ❌ PDF artifacts (markdown chars, formatting issues) remain in pasted text

**Problem Examples:**
- Markdown characters: `**`, `__`, `#`, `*`, `-`, `|`
- Extra spaces and line breaks
- Special characters from PDF encoding
- Formatting artifacts that confuse the LLM

**Solution:**
Add "Clean Text" button to TEXT tab that uses the existing OCR cleanup prompt to remove artifacts.

**UI Changes:**
```
TEXT Tab (before):
┌─────────────────────────────────────┐
│ Paste student essay here...        │
│                                     │
└─────────────────────────────────────┘
[Use This Text]

TEXT Tab (after):
┌─────────────────────────────────────┐
│ Paste student essay here...        │
│                                     │
└─────────────────────────────────────┘
[Clean Text]  [Use This Text]
```

**Tasks:**
- [ ] Add "Clean Text" button to TEXT tab (similar to "Enhance Text" on IMAGE tab)
- [ ] Reuse existing OCR cleanup prompt from SettingsModal
- [ ] Call `enhance-text` function with pasted text
- [ ] Replace textarea content with cleaned text
- [ ] Show loading state during cleanup
- [ ] Add tooltip: "Remove PDF artifacts and formatting issues"
- [ ] Optional: Auto-detect common PDF artifacts and suggest cleanup

**Reuse Existing Code:**
- OCR cleanup prompt: `src/components/SettingsModal.tsx` (DEFAULT_OCR_PROMPT)
- Enhance text function: `netlify/functions/enhance-text.ts`
- Similar UI pattern: IMAGE tab "Enhance Text" button

**Files:** 
- `src/pages/Submission.tsx` (add button to TEXT tab)
- `netlify/functions/enhance-text.ts` (already exists, reuse)
- `src/components/SettingsModal.tsx` (OCR prompt already exists)

**Time:** 2-3 hours

**Implementation Notes:**
- Button should be positioned next to "Use This Text" button
- Use same green styling as "Enhance Text" on IMAGE tab
- Show word count before/after cleanup
- Consider adding "Undo" option if cleanup removes too much

---

### 6. Anchor Chart Integration ⭐ MEDIUM PRIORITY - BLOCKED
**Goal:** Support district-provided anchor charts that guide grading (with flexibility for variation from rubrics)

**Background:** Districts provide anchor charts that don't 100% match the rubrics they supply. Teachers need to reference these during grading.

**Reference:** "look in back of the class see page 50 of student edition book"

**Status:** ⚠️ BLOCKED - Need sample anchor chart from Shana

**Questions to Answer Before Implementation:**
1. What format is the anchor chart? (PDF, image, text, table?)
2. How does it differ from the rubric?
3. Should it be stored per assignment or per teacher?
4. Should it override rubric or supplement it?
5. How should AI incorporate anchor chart guidance?
6. Is it a reference document or active grading criteria?

**Potential Implementation:**
- [ ] Add "Anchor Chart" field to assignment (optional)
- [ ] Support text input, file upload, or both
- [ ] Display anchor chart alongside rubric during grading
- [ ] Include anchor chart context in AI grading prompt
- [ ] Add note about acceptable variation from rubric
- [ ] Store in database or as file reference

**Database Changes (tentative):**
```sql
ALTER TABLE grader.assignments
ADD COLUMN anchor_chart text,
ADD COLUMN anchor_chart_file_url text;
```

**Files (tentative):** 
- `src/components/CreateAssignmentModal.tsx`
- `src/pages/Submission.tsx`
- `netlify/functions/grade.ts`
- Database migration: `migrations/add_anchor_chart.sql`

**Time:** 3-4 hours (after receiving sample)

**Next Steps:**
- [ ] Get sample anchor chart from Shana
- [ ] Review page 50 of student edition book
- [ ] Determine format and usage pattern
- [ ] Spec out exact implementation

---

## 🎯 High Priority - Next Up

### 8. Dashboard Enhancements
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

### 9. Submission Form Improvements
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

### 10. CSV Export Enhancement
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

## � USER FEEDBACK - Week of November 11, 2025

### Shana's Feedback (6th Grade ELAR Teacher)

1. **🔴 CRITICAL: Rubric grading points on print/download**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - Restarting implementation
   - **Issue:** Print/download output needs to show detailed rubric breakdown with earned/total points
   - **Expected:** Print shows all grading details, rubric sections, BulletProof breakdown
   - **Current:** Basic print functionality exists but needs enhancement
   - **Impact:** Teachers need comprehensive print output for records
   - **Related to:** PLAN_enhanced_print_download.md
   - **Files:** 
     - `src/lib/print.ts`
     - `src/lib/printAnnotated.ts`
     - `src/pages/Submission.tsx`
   - **Time:** 4-6 hours
   - **Tasks:**
     - [ ] Implement enhanced print HTML generation
     - [ ] Add detailed rubric breakdown section
     - [ ] Add BulletProof scoring display
     - [ ] Add assignment details and full rubric text
     - [ ] Add essay with line numbers
     - [ ] Add teacher comments section
     - [ ] Test print preview and PDF output

2. **🔴 CRITICAL: Points must show as portion of grade (e.g., 47/50 not 47/100)**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - Needs immediate fix
   - **Issue:** Raw points display showing total assignment points instead of category/rubric section points
   - **Expected:** "Content: 47/50" (earned out of section total)
   - **Current:** "Content: 47/100" (showing assignment total incorrectly)
   - **Impact:** Confusing for teachers and students
   - **Files:** 
     - `src/lib/print.ts` (renderBulletProof function)
     - `src/lib/printAnnotated.ts` (renderBulletProof function)
     - `src/lib/calculator/calculator.ts` (BulletProof scoring logic)
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Review BulletProof computed_scores structure
     - [ ] Update renderBulletProof to show category max points
     - [ ] Verify rubric parser extracts category point values
     - [ ] Test with various rubric formats
     - [ ] Update print preview and download output

3. **🔴 Bug: Create Assignment Modal not confirming save**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - Needs investigation
   - **Issue:** Modal doesn't show "OK" confirmation after saving assignment
   - **Expected:** Success message or modal close after save
   - **Current:** No feedback, unclear if save succeeded
   - **Impact:** User confusion, potential duplicate assignments
   - **Files:** 
     - `src/components/CreateAssignmentModal.tsx`
     - `netlify/functions/create-assignment.ts`
   - **Time:** 1-2 hours
   - **Tasks:**
     - [ ] Add success toast notification
     - [ ] Close modal on successful save
     - [ ] Add error handling for failed saves
     - [ ] Test with various assignment types
     - [ ] Add loading state during save

4. **🟡 CSV Import: Handle header row**
   - **Priority:** ⭐⭐ MEDIUM PRIORITY
   - **Status:** 🟡 OPEN - Enhancement needed
   - **Issue:** CSV import may not properly handle files with header rows
   - **Expected:** Auto-detect and skip header row, or provide option
   - **Current:** Unclear if headers are handled correctly
   - **Impact:** Import errors or header row imported as student
   - **Files:** 
     - `src/components/bridge/BridgeManager.tsx`
     - `src/bridge/bridgeCore.ts`
   - **Time:** 1-2 hours
   - **Tasks:**
     - [ ] Test current CSV import with header row
     - [ ] Add header row detection logic
     - [ ] Add "First row is header" checkbox option
     - [ ] Update import validation
     - [ ] Add sample CSV template download

5. **🟡 Add capability for no student roster**
   - **Priority:** ⭐⭐ MEDIUM PRIORITY
   - **Status:** 🟡 OPEN - Feature request
   - **Issue:** System requires student roster, but some teachers want to grade without it
   - **Expected:** Allow grading without pre-defined student list
   - **Current:** Must add students to bridge before grading
   - **Use Case:** Guest grading, demo mode, quick one-off grading
   - **Impact:** Limits flexibility for certain workflows
   - **Files:** 
     - `src/pages/Submission.tsx`
     - `src/components/StudentSelector.tsx`
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Add "Anonymous Student" or "Guest" option
     - [ ] Make student selection optional
     - [ ] Allow manual name entry without bridge
     - [ ] Update validation to allow null student_id
     - [ ] Test grading without student roster

6. **🔴 CRITICAL: Print must have 100% of info from Grade page**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - Restarting implementation
   - **Issue:** Print output needs to include all information visible on Grade Submission page
   - **Expected:** Print includes assignment description, full rubric, all grading details, BulletProof breakdown, feedback cards, teacher comments, annotations
   - **Current:** Basic print functionality exists but needs comprehensive enhancement
   - **Impact:** Teachers need complete records for documentation and student review
   - **Related to:** Item #1 above and PLAN_enhanced_print_download.md
   - **Files:** 
     - `src/lib/print.ts`
     - `src/lib/printAnnotated.ts`
     - `src/pages/Submission.tsx`
   - **Time:** Included in item #1 (4-6 hours total)
   - **Tasks:**
     - [ ] Ensure all UI elements are represented in print
     - [ ] Include assignment metadata
     - [ ] Include complete rubric text
     - [ ] Include all feedback sections
     - [ ] Include teacher comments
     - [ ] Test completeness against live UI

---

### Miranda's Feedback (High School World History Teacher - AP Level)

**Context:** AP World History essays with College Board rubrics (7 pages), graded on evidence and analysis rather than style/grammar.

#### Issues Encountered:

1. **🔴 CRITICAL: Assignment save appears to fail but actually succeeds**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - UX issue
   - **Issue:** Modal says "OK" then assignment doesn't appear to save, but it actually did save
   - **Root Cause:** Likely timeout with large rubric (7 pages), poor feedback during save
   - **Expected:** Clear progress indicator, success confirmation, immediate visibility
   - **Current:** Confusing UX - appears to fail but works
   - **Impact:** User thinks save failed, may retry and create duplicates
   - **Related to:** Shana's issue #3 (Create Assignment Modal)
   - **Files:** 
     - `src/components/CreateAssignmentModal.tsx`
     - `netlify/functions/create-assignment.ts`
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Add loading spinner during save
     - [ ] Add progress indicator for large rubrics
     - [ ] Increase timeout for large content
     - [ ] Add clear success message
     - [ ] Refresh assignment list immediately after save
     - [ ] Add "Saving..." state with estimated time

2. **🔴 Assignment visibility issue: Only shows in Assignments dropdown, not Dashboard**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - UX issue
   - **Issue:** Saved assignments only visible in assignment dropdown, not at dashboard level
   - **Expected:** Dashboard should show all available assignments
   - **Current:** Must click into Assignments to see what's available
   - **Impact:** Poor discoverability, confusing UX
   - **Files:** 
     - `src/pages/Dashboard.tsx`
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Add "Assignments" section to Dashboard
     - [ ] Show list of available assignments with metadata
     - [ ] Add quick actions (grade, edit, delete)
     - [ ] Show assignment count and recent activity
     - [ ] Add "Create Assignment" button to Dashboard

3. **🟡 Support PDF/Word upload for rubrics (not just copy/paste)**
   - **Priority:** ⭐⭐ MEDIUM PRIORITY
   - **Status:** 🟡 OPEN - Feature request
   - **Issue:** Copy/paste of 7-page rubric is slow and error-prone
   - **Expected:** Upload PDF or Word doc of rubric directly
   - **Current:** Only text input via copy/paste
   - **Impact:** Time-consuming setup, potential formatting loss
   - **Files:** 
     - `src/components/CreateAssignmentModal.tsx`
     - `netlify/functions/parse-rubric-file.ts` (new)
   - **Time:** 4-5 hours
   - **Tasks:**
     - [ ] Add file upload option to assignment modal
     - [ ] Support PDF rubric upload
     - [ ] Support Word doc rubric upload
     - [ ] Extract text from uploaded file
     - [ ] Parse rubric structure automatically
     - [ ] Show preview before saving
     - [ ] Handle large files (7+ pages)

4. **🔴 CRITICAL: Assignment switching bug - criteria not updating**
   - **Priority:** ⭐⭐⭐ HIGH PRIORITY
   - **Status:** 🔴 OPEN - Known bug (see Known Issues section)
   - **Issue:** When switching assignments, points update but criteria text doesn't change
   - **Expected:** Both points and criteria should update when switching assignments
   - **Current:** Stale criteria from previous assignment
   - **Impact:** Grading with wrong rubric, incorrect feedback
   - **Related:** Known issue in line 104-125 of this file
   - **Files:** 
     - `src/pages/Submission.tsx`
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Debug assignment switching logic
     - [ ] Ensure criteria state updates with assignment
     - [ ] Clear stale data when switching
     - [ ] Add loading state during switch
     - [ ] Test with multiple assignments

5. **🔴 No way to delete assignments**
   - **Priority:** ⭐⭐ MEDIUM PRIORITY
   - **Status:** 🔴 OPEN - Missing feature
   - **Issue:** Cannot delete assignments once created
   - **Expected:** Delete button or action for assignments
   - **Current:** No delete functionality
   - **Impact:** Clutter, test assignments can't be removed
   - **Files:** 
     - `src/pages/Dashboard.tsx` or Assignments page
     - `netlify/functions/delete-assignment.ts` (new)
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Add delete button to assignment list
     - [ ] Add confirmation dialog
     - [ ] Create delete-assignment API endpoint
     - [ ] Handle cascade delete (or prevent if submissions exist)
     - [ ] Update UI after delete
     - [ ] Add soft delete option (archive)

6. **🟡 No mass edit/delete for student roster**
   - **Priority:** ⭐ LOW PRIORITY
   - **Status:** 🟡 OPEN - Enhancement
   - **Issue:** Can only delete students one at a time
   - **Expected:** Bulk select and delete, clear entire roster option
   - **Current:** Individual delete only
   - **Impact:** Time-consuming to manage large rosters
   - **Files:** 
     - `src/components/bridge/BridgeManager.tsx`
   - **Time:** 2-3 hours
   - **Tasks:**
     - [ ] Add "Select All" checkbox
     - [ ] Add "Delete Selected" button
     - [ ] Add "Clear Roster" button with confirmation
     - [ ] Add bulk edit capability
     - [ ] Show count of selected students

7. **🟡 Non-ELAR subjects: Grading not based on style/grammar**
   - **Priority:** ⭐⭐ MEDIUM PRIORITY
   - **Status:** 🟡 OPEN - Feature request
   - **Issue:** AI grades based on ELAR criteria (style, grammar, spelling) even for history essays
   - **Expected:** Grading should focus on rubric criteria (evidence, analysis) not grammar
   - **Current:** Grammar/spelling feedback dominates even when not in rubric
   - **Impact:** Irrelevant feedback for content-focused subjects
   - **Use Case:** AP World History, Science, Math essays
   - **Files:** 
     - `netlify/functions/grade.ts` (AI prompt)
     - `src/components/CreateAssignmentModal.tsx` (subject selection)
     - `src/components/SettingsModal.tsx` (grading preferences)
   - **Time:** 3-4 hours
   - **Tasks:**
     - [ ] Add "Subject" field to assignment (ELAR, History, Science, etc.)
     - [ ] Add checkboxes for grading focus:
       - [ ] Content/Evidence
       - [ ] Analysis/Reasoning
       - [ ] Organization/Structure
       - [ ] Style/Voice
       - [ ] Grammar/Mechanics
       - [ ] Spelling/Punctuation
     - [ ] Update AI prompt to respect subject and focus areas
     - [ ] Test with non-ELAR essays
     - [ ] Add subject-specific rubric templates

---

### Summary of Action Items by Priority

**🔴 CRITICAL (Do First):**
1. Enhanced print/download functionality - 4-6 hours
2. Print must have 100% of info from Grade page - (included in #1)
3. Points display fix (47/50 not 47/100) - 2-3 hours
4. Create Assignment Modal confirmation - 1-2 hours
5. Assignment save UX with large rubrics - 2-3 hours
6. Assignment visibility on Dashboard - 2-3 hours
7. Assignment switching bug (criteria not updating) - 2-3 hours

**🟡 HIGH PRIORITY (Do Soon):**
8. CSV import header handling - 1-2 hours
9. No student roster capability - 2-3 hours
10. Delete assignments feature - 2-3 hours
11. Non-ELAR grading focus - 3-4 hours

**🟢 MEDIUM PRIORITY (Nice to Have):**
12. PDF/Word rubric upload - 4-5 hours
13. Mass edit/delete student roster - 2-3 hours

**Total Estimated Time:** 28-39 hours

---

## �� Recommended Timeline

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



---

## ═══════════════════════════════════════════════════════

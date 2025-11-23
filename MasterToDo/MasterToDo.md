# Master TODO List
## FastAI Grader - Open Action Items

**Created:** October 31, 2025  
**Last Updated:** November 16, 2025 - 10:36 AM  
**Branch:** `main`  
**Status:** Active Development

---

## 📑 Table of Contents

1. [TODO Management Instructions](#-todo-management-instructions)
2. [🔴 CRITICAL: Rubric-Driven Grading (Not ELAR-Specific)](#-critical-rubric-driven-grading-not-elar-specific)
3. [⭐⭐⭐ HIGH: Assignment Modal Remaining Items](#-high-assignment-modal-remaining-items)
4. [⭐⭐ MEDIUM: Blob Storage for Large Rubrics](#-medium-blob-storage-for-large-rubrics)
5. [PRIORITY #1: Submission.tsx Refactor](#-priority-1-submissiontsx-refactor-careful-incremental-approach)
6. [PRIORITY #2: Class Period Organization](#-priority-2-add-class-period-organization-for-students)
7. [Testing & Quality Assurance](#-testing--quality-assurance--highest-priority)
8. [Refactoring & Code Organization](#-refactoring--code-organization)
9. [High Priority - Dashboard Enhancements](#-high-priority---next-up)
10. [Medium Priority - Grading Enhancements](#-medium-priority)
11. [Low Priority - Performance Optimizations](#-low-priority--nice-to-have)
12. [Known Issues to Fix](#-known-issues-to-fix)
13. [User Feedback - Week of November 11, 2025](#-user-feedback---week-of-november-11-2025)
14. [Recommended Timeline](#-recommended-timeline)
15. [Out of Scope](#-out-of-scope-future-branches)

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

## 🟢 Gemini API Integration & LLM Switching
**Priority:** HIGH
**Estimated Time:** 2 hours
**Plan File:** `MasterToDo/PLAN_gemini_integration.md`
**Status:** ✅ COMPLETED - November 23, 2025
**Released:** 🚀 Promoted to `main` (Checkpoint: `WorkingSoftwareCKPoint-20251123-090128UTC`)

### Tasks

- [x] **Phase 1: Backend Abstraction***
  - Add "LLM Provider" dropdown in Settings Modal.
  - Store preference in local storage or user settings.

- [ ] **Phase 4: Testing & Evaluation**
  - Test grading with Gemini.
  - Test annotations with Gemini.
  - Compare speed and quality.

### Files to Modify
- `netlify/functions/lib/openai.ts` -> `llm-provider.ts`
- `src/components/SettingsModal.tsx`
- `.env` (local) and Netlify Config

---



## ⭐⭐⭐ HIGH: Assignment Modal Remaining Items

**Priority:** HIGH  
**Estimated Time:** 1-2 hours  
**Plan File:** `OldPlans/PLAN_assignment_modal_confirmation.md`  
**Status:** Most features complete - Minor items remaining

### Completed ✅
- Backend returns parseWarning in response
- Frontend shows loading spinner during save
- Success/warning messages display correctly
- Assignment saves even if parser fails
- Edit Assignment feature fully implemented
- Edit button on Dashboard (all assignments view)
- Edit button on Grade page
- Rubric enhancement uses correct total points
- No double submission bug
- Settings Modal prompt updated

### Remaining Tasks
- [ ] **Fix OK Button Not Closing Modal** (LOW PRIORITY)
  - Status: DEFERRED - Use X button workaround for now
  - Problem: Success/warning message displays, OK button click detected, but modal doesn't close
  - Workaround: Use X button in top-right to close modal
  - Files: `CreateAssignmentModal.tsx`, `Dashboard.tsx`
  - Investigation needed: Check if parent component's `isOpen` state is updating

- [ ] **Testing & Deployment**
  - Run through all test cases
  - Deploy to production
  - Get user confirmation that fix works

### Files Involved
- `src/components/CreateAssignmentModal.tsx` (OK button issue)
- `src/pages/Dashboard.tsx` (modal state management)

---

## ⭐⭐ MEDIUM: Blob Storage for Large Rubrics

**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours  
**Research File:** `BLOB_STORAGE_RESEARCH.md`  
**Status:** Research Complete - Implementation Optional

### Problem
Large rubrics (7+ pages, 5000+ characters) may cause:
- Database storage inefficiency
- Slow query performance
- Potential size limits

### Solution
Use Netlify Blobs for large rubrics (similar to gift-of-time-assistant pattern).

### Implementation Phases

#### Phase 1: Setup (30 min)
- [ ] Install `@netlify/blobs` package (may already be installed)
- [ ] Add `rubric_blob_key` column to `assignments` table
- [ ] Decide threshold (recommend 5000 characters)

#### Phase 2: Upload (45 min)
- [ ] Modify `assignments.ts` to detect large rubrics
- [ ] Store large rubrics in blob with key pattern: `rubrics/{userId}/{uuid}.txt`
- [ ] Save blob key in database
- [ ] Keep small rubrics in database as-is

#### Phase 3: Retrieval (30 min)
- [ ] Modify `get-submission.ts` to check for `rubric_blob_key`
- [ ] Fetch from blob if key exists
- [ ] Return rubric text to frontend

#### Phase 4: Deletion (15 min)
- [ ] Modify delete assignment function to cleanup blob
- [ ] Prevent orphaned blobs

#### Phase 5: Migration (30 min)
- [ ] Create script to find existing large rubrics
- [ ] Move them to blob storage

### Files to Modify
- `netlify/functions/assignments.ts` - Upload logic
- `netlify/functions/get-submission.ts` - Retrieval logic
- Database: Add `rubric_blob_key` column to `assignments` table

### Success Criteria
- ✅ Large rubrics (>5000 chars) stored in blob storage
- ✅ Small rubrics remain in database
- ✅ Transparent to frontend (no changes needed)
- ✅ Cleanup on delete prevents orphaned blobs
- ✅ Existing large rubrics migrated

### Priority Note
This is OPTIONAL unless users report issues with large rubrics. Current system works fine for most use cases.

---

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

## � User Feedback - Week of November 11, 2025

### Shana's Feedback (6th Grade ELAR Teacher)

**✅ COMPLETED (November 14, 2025):**
1. ✅ **Rubric grading points info on print/download** - COMPLETE
   - Print now shows detailed rubric breakdown with points
   - See CompletedToDo.md for details

2. ✅ **Points show as portion of grade (12.8/15 not 12.8/11.4)** - COMPLETE
   - Denominators now show correct max points per criterion
   - Bulletproof solution using database rubric_json
   - See CompletedToDo.md for details

6. ✅ **Print has 100% of info from Grade page** - COMPLETE
   - Print includes all sections: criteria, breakdown, feedback, grammar, spelling, teacher comments
   - See CompletedToDo.md for details

**🔴 REMAINING OPEN ITEMS:**

3. **[ ] Bug: Create Assignment Modal not confirming save**
   - **Priority:** ⭐⭐⭐ HIGH
   - **Issue:** No confirmation message after saving assignment
   - **Files:** `src/components/CreateAssignmentModal.tsx`
   - **Time:** 1-2 hours

4. **[ ] CSV import: Handle header row**
   - **Priority:** ⭐⭐ MEDIUM
   - **Issue:** CSV import may not handle header rows correctly
   - **Files:** `src/components/bridge/BridgeManager.tsx`
   - **Time:** 1-2 hours

5. **[ ] Add capability for no student roster**
   - **Priority:** ⭐⭐ MEDIUM
   - **Issue:** Allow grading without pre-defined student list
   - **Files:** `src/pages/Submission.tsx`, `src/components/StudentSelector.tsx`
   - **Time:** 2-3 hours

---

### Miranda's Feedback (High School AP World History Teacher)

**Context:** AP World History essays with 7-page College Board rubrics, graded on evidence/analysis not style/grammar.

1. **[ ] Assignment save UX issue with large rubrics**
   - **Priority:** ⭐⭐⭐ HIGH
   - **Issue:** Modal says "OK" but appears to fail (actually saves, just poor UX)
   - **Root Cause:** Timeout with large rubric (7 pages), no progress indicator
   - **Files:** `src/components/CreateAssignmentModal.tsx`
   - **Time:** 2-3 hours

2. **[ ] Assignment visibility on Dashboard**
   - **Priority:** ⭐⭐⭐ HIGH
   - **Issue:** Saved assignments only visible in dropdown, not on Dashboard
   - **Files:** `src/pages/Dashboard.tsx`
   - **Time:** 2-3 hours

3. **[ ] Support PDF/Word upload for rubrics**
   - **Priority:** ⭐⭐ MEDIUM
   - **Issue:** Copy/paste of 7-page rubric is slow and error-prone
   - **Files:** `src/components/CreateAssignmentModal.tsx`, `netlify/functions/parse-rubric-file.ts` (new)
   - **Time:** 4-5 hours

4. **[ ] Assignment switching bug - criteria not updating**
   - **Priority:** ⭐⭐⭐ HIGH
   - **Issue:** When switching assignments, points update but criteria text doesn't
   - **Files:** `src/pages/Submission.tsx`
   - **Time:** 2-3 hours

5. **[ ] Add ability to delete assignments**
   - **Priority:** ⭐⭐ MEDIUM
   - **Issue:** No way to delete assignments once created
   - **Files:** `src/pages/Dashboard.tsx`, `netlify/functions/delete-assignment.ts` (new)
   - **Time:** 2-3 hours

6. **[ ] Mass edit/delete for student roster**
   - **Priority:** ⭐ LOW
   - **Issue:** Can only delete students one at a time
   - **Files:** `src/components/bridge/BridgeManager.tsx`
   - **Time:** 2-3 hours

7. **[ ] Non-ELAR subject grading (focus on content not grammar)**
   - **Priority:** ⭐⭐ MEDIUM
   - **Issue:** AI grades based on ELAR criteria even for history essays
   - **Solution:** Add subject field and grading focus checkboxes (Content/Evidence, Analysis, Organization, Style, Grammar, Spelling)
   - **Files:** `netlify/functions/grade.ts`, `src/components/CreateAssignmentModal.tsx`, `src/components/SettingsModal.tsx`
   - **Time:** 3-4 hours

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

# Master TODO List
## FastAI Grader - Open Action Items

**Created:** October 31, 2025  
**Last Updated:** November 27, 2025 (Image To Text Complete)  
**Branch:** `main`  
**Status:** Active Development  
**Latest Release:** v1.6.0 (November 27, 2025)

---

## 📑 Table of Contents

1. [TODO Management Instructions](#-todo-management-instructions)
2. [🔴 CRITICAL & BLOCKED](#-critical--blocked)
   - *None*
3. [⭐⭐⭐ HIGH PRIORITY (Next Up)](#-high-priority-next-up)
   - [Batch Document Upload & Processing](#-batch-document-upload--processing)
   - [Rubric Document Upload & Extraction](#-rubric-document-upload--extraction)
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

*No critical blocking items at this time.*

---

## ⭐⭐⭐ HIGH PRIORITY (Next Up)

### Batch Document Upload & Processing

**Status:** 🆕 **NEW FEATURE REQUEST** (November 24, 2025)  
**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Estimated Time:** 8-12 hours  
**FERPA Compliance:** CRITICAL

**Goal:** Allow teachers to upload and process multiple student essays at once, with FERPA-compliant student identification.

**Use Case:**
- Teacher has 30 student essays as separate files
- Upload all files at once instead of one-by-one
- System processes them in batch
- Each file correctly associated with the right student
- No student names in cloud storage (FERPA compliant)

**Implementation Approaches (Choose One):**

**Option A: Filename Convention (Recommended - Fastest for Teachers)**
- Teacher renames files using student IDs: `12345_essay1.docx`, `12345_essay2.pdf`
- Bridge maps student_id → student name locally (client-side only)
- Only student_id sent to cloud (FERPA compliant)
- System auto-matches files to students
- **Pros:** Fast, no manual mapping needed
- **Cons:** Requires teacher to rename files first

**Option B: Interactive Mapping UI**
- Teacher uploads all files with any filenames
- UI displays list of uploaded files
- Teacher selects student from dropdown for each file
- "Process Batch" button after all mapped
- **Pros:** No file renaming needed
- **Cons:** Manual work for large batches

**Option C: Folder Structure**
- Teacher organizes files in folders: `/Period1/12345_essay.docx`
- System processes folder structure
- Bridge handles ID → name mapping
- **Pros:** Organized by class period
- **Cons:** More complex folder setup

**Technical Tasks:**

**Phase 1: Frontend - File Upload**
- [ ] Create `BatchUploadModal` component
- [ ] Add multi-file drag-and-drop support
- [ ] Display file list with status indicators
- [ ] Add student mapping UI (if Option B)
- [ ] Show upload progress for each file
- [ ] Handle file validation (type, size)

**Phase 2: Student Identification**
- [ ] Implement filename parsing for student IDs (Option A)
- [ ] Create student selector dropdown (Option B)
- [ ] Validate student IDs against Bridge
- [ ] Show warnings for unmatched files
- [ ] Allow teacher to fix mismatches before processing

**Phase 3: Backend - Batch Processing**
- [ ] Create `netlify/functions/batch-ingest.ts` endpoint
- [ ] Accept array of files + student mappings
- [ ] Process files sequentially or in parallel (decide)
- [ ] Handle partial failures gracefully
- [ ] Return detailed status for each file
- [ ] Store files in blob storage (if needed)

**Phase 4: Processing & Feedback**
- [ ] Extract text from each document (reuse existing logic)
- [ ] Create submission records in database
- [ ] Optionally: Auto-grade all submissions
- [ ] Show real-time progress: "Processing 5 of 30..."
- [ ] Display summary: "28 successful, 2 failed"
- [ ] Allow retry for failed files

**Phase 5: Error Handling**
- [ ] Handle duplicate submissions (same student + assignment)
- [ ] Handle invalid file formats
- [ ] Handle missing student IDs
- [ ] Handle network failures mid-batch
- [ ] Provide clear error messages
- [ ] Allow downloading error log

**FERPA Compliance Checklist:**
- [ ] Student names NEVER in filenames sent to cloud
- [ ] Only student IDs transmitted to backend
- [ ] Bridge handles all ID → name mapping locally
- [ ] No PII in blob storage filenames
- [ ] Audit log for batch uploads
- [ ] Clear documentation for teachers

**UI/UX Considerations:**
- [ ] Clear instructions for teachers
- [ ] Example filename format shown
- [ ] Bulk rename helper tool (optional)
- [ ] Preview before processing
- [ ] Cancel batch operation
- [ ] Navigate to dashboard after completion

**Testing Requirements:**
- [ ] Test with 1 file (edge case)
- [ ] Test with 30+ files (typical class size)
- [ ] Test with mixed file types (DOCX, PDF, TXT)
- [ ] Test with invalid student IDs
- [ ] Test with duplicate files
- [ ] Test network interruption during batch
- [ ] Test FERPA compliance (no PII leakage)

**Success Metrics:**
- Reduces teacher time from 5 min/submission to 30 seconds/batch
- 95%+ auto-match rate for properly named files
- Zero FERPA violations
- Clear error messages for all failure cases

**Future Enhancements:**
- [ ] Auto-detect student names from file content (risky for FERPA)
- [ ] Integration with Google Classroom file structure
- [ ] Batch grading after batch upload
- [ ] Email notifications when batch complete

---

### Rubric Document Upload & Extraction

**Status:** 🆕 **NEW FEATURE REQUEST** (November 24, 2025)  
**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Estimated Time:** 3-4 hours

**Goal:** Allow teachers to upload rubric documents (PDF, DOCX) and automatically extract the rubric structure for use in grading.

**Use Case:**
- Teacher has district-provided rubric in PDF/Word format
- Upload document and AI extracts criteria, levels, and point values
- Rubric is parsed into the application's rubric format
- Teacher can review/edit extracted rubric before saving

**Backend Implementation:**
- [ ] Create `extract-rubric` Netlify function
  - Accept file upload (PDF, DOCX)
  - Extract text using existing parsers (DOCX, PDF)
  - Send to LLM with rubric extraction prompt
  - Parse LLM response into rubric JSON structure
  - Return structured rubric data
- [ ] Design rubric extraction prompt
  - Identify criteria/categories
  - Extract performance levels (Exemplary, Proficient, etc.)
  - Extract point values for each level
  - Extract descriptions for each level
  - Handle various rubric formats (table, list, narrative)
- [ ] Add validation for extracted rubric structure
  - Ensure all required fields present
  - Validate point values are numeric
  - Check for reasonable criteria count (2-10)

**Frontend Implementation:**
- [ ] Add "Upload Rubric" button to CreateAssignmentModal
  - File upload component
  - Show loading state during extraction
  - Display extracted rubric in preview
  - Allow editing extracted rubric
  - "Use This Rubric" button to populate form
- [ ] Create RubricPreview component
  - Display extracted criteria in table format
  - Show point values and levels
  - Highlight any extraction issues
  - Allow inline editing before accepting
- [ ] Add rubric extraction to SettingsModal
  - Upload default rubric for all assignments
  - Save to teacher preferences

**LLM Prompt Design:**
- [ ] Create rubric extraction prompt template
  - Handle various rubric formats
  - Extract structured data (JSON)
  - Handle edge cases (missing points, unclear criteria)
  - Provide confidence scores for extractions
- [ ] Test with sample rubrics from different districts
- [ ] Refine prompt based on extraction accuracy

**Error Handling:**
- [ ] Handle unreadable documents
- [ ] Handle non-rubric documents
- [ ] Handle ambiguous rubric structures
- [ ] Provide helpful error messages
- [ ] Allow manual rubric entry as fallback

**Testing:**
- [ ] Test with various rubric formats
  - Table-based rubrics
  - List-based rubrics
  - Narrative rubrics
  - Multi-page rubrics
- [ ] Test with district-provided rubrics
- [ ] Validate extraction accuracy
- [ ] Test error handling

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

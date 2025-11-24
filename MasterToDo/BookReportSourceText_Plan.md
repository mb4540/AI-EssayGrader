# 📋 Book Report / Source Text Feature - Implementation Plan

**Created:** November 24, 2025  
**Priority:** ⭐⭐⭐ HIGH PRIORITY  
**Estimated Time:** 7.5 hours  
**Status:** Ready to implement

---

## Overview

**Goal:** Enable teachers to upload source texts (books, articles, passages) that students write about, and include this context in AI grading for more accurate, context-aware evaluation.

**Use Case:** 
- Teacher uploads a book chapter or article to blob storage
- Teacher provides a writing prompt (e.g., "Analyze the theme of courage in Chapter 3")
- When grading student essays, the LLM receives both the source text and prompt for context-aware grading
- Enables grading of book reports, literary analysis, and source-based writing

---

## 📊 Phase 1: Database Schema (1 hour)

### Tasks
- [ ] Create `migrations/add_source_texts.sql` migration file
- [ ] Create `source_texts` table with columns:
  - source_text_id (UUID, PK)
  - tenant_id (UUID, FK to tenants)
  - teacher_id (UUID, FK to users)
  - title (TEXT, NOT NULL)
  - blob_key (TEXT, NOT NULL)
  - writing_prompt (TEXT)
  - file_type (TEXT, CHECK: pdf/docx/txt)
  - file_size_bytes (INTEGER)
  - created_at, updated_at (TIMESTAMPTZ)
- [ ] Add indexes on tenant_id, teacher_id, created_at
- [ ] Add source_text_id column to assignments table (FK, ON DELETE SET NULL)
- [ ] Add index on assignments.source_text_id
- [ ] Create auto-update timestamp trigger
- [ ] Test migration in Neon console
- [ ] Apply migration to production
- [ ] Update `db_ref.md` with new schema

---

## 🔧 Phase 2: Backend Functions (2 hours)

### 2.1 Upload Source Text
**File:** `netlify/functions/upload-source-text.ts`

**Tasks:**
- [ ] Create function file
- [ ] Implement multipart form data parsing
- [ ] Validate file type (pdf/docx/txt only)
- [ ] Validate file size (max 10MB)
- [ ] Extract text using existing parsers
- [ ] Store file in Netlify Blobs (store: 'source-texts')
- [ ] Use blob key format: `{tenant_id}/{uuid}.{ext}`
- [ ] Insert metadata into database
- [ ] Return source_text_id and text preview
- [ ] Add error handling
- [ ] Test with PDF, DOCX, TXT files

### 2.2 Get Source Text
**File:** `netlify/functions/get-source-text.ts`

**Tasks:**
- [ ] Create function file
- [ ] Query database for metadata
- [ ] Fetch blob from storage
- [ ] Extract text on-demand
- [ ] Return metadata + extracted text
- [ ] Add tenant_id security filter
- [ ] Handle missing blobs gracefully

### 2.3 List Source Texts
**File:** `netlify/functions/list-source-texts.ts`

**Tasks:**
- [ ] Create function file
- [ ] Query with tenant_id filter
- [ ] LEFT JOIN assignments to get usage count
- [ ] Sort by created_at DESC
- [ ] Return metadata only (no file content)

### 2.4 Delete Source Text
**File:** `netlify/functions/delete-source-text.ts`

**Tasks:**
- [ ] Create function file
- [ ] Verify user access (tenant_id)
- [ ] Delete blob from Netlify Blobs
- [ ] Delete database record (CASCADE handles assignments)
- [ ] Handle missing blobs
- [ ] Return success/error

---

## 🎨 Phase 3: Frontend UI (2 hours)

### 3.1 Update CreateAssignmentModal
**File:** `src/components/CreateAssignmentModal.tsx`

**Tasks:**
- [ ] Add "Source Text" section with radio buttons:
  - No source text
  - Upload new source text
  - Use existing source text
- [ ] Add file upload component (reuse FileDrop)
- [ ] Add title input for new source text
- [ ] Add writing prompt textarea
- [ ] Add dropdown for existing source texts
- [ ] Fetch existing source texts on mount
- [ ] Handle upload before assignment creation
- [ ] Update form validation
- [ ] Add loading states
- [ ] Add error handling

### 3.2 Create SourceTextManager Component
**File:** `src/components/SourceTextManager.tsx`

**Tasks:**
- [ ] Create component file
- [ ] Implement list view with cards
- [ ] Show: title, file type, size, upload date, usage count
- [ ] Add preview modal (display extracted text)
- [ ] Add edit prompt functionality
- [ ] Add delete confirmation dialog
- [ ] Add upload modal
- [ ] Add to navigation (Settings or new tab)
- [ ] Add loading states
- [ ] Add empty state

### 3.3 Update Dashboard
**File:** `src/pages/Dashboard/Dashboard.tsx`

**Tasks:**
- [ ] Add badge/icon for assignments with source texts
- [ ] Show source text title in assignment card
- [ ] Add tooltip with source text info
- [ ] Update assignment query to include source text data

---

## 🤖 Phase 4: LLM Integration (1 hour)

### 4.1 Update Prompt Template
**File:** `src/lib/prompts/extractor.ts`

**Tasks:**
- [ ] Create `buildExtractorPromptWithSourceText()` function
- [ ] Add SOURCE TEXT section
- [ ] Add WRITING PROMPT section
- [ ] Emphasize evidence-based evaluation
- [ ] Include instructions for source text analysis
- [ ] Test with sample essays
- [ ] Compare quality with/without source text

### 4.2 Update Grading Function
**File:** `netlify/functions/grade-bulletproof.ts`

**Tasks:**
- [ ] Update SQL query to LEFT JOIN source_texts
- [ ] Fetch source text blob_key, writing_prompt, file_type
- [ ] Retrieve blob from Netlify Blobs if present
- [ ] Extract text based on file_type (txt/docx/pdf)
- [ ] Use new prompt builder if source text exists
- [ ] Fall back to standard prompt if no source text
- [ ] Add error handling (don't fail grading if blob missing)
- [ ] Test grading with source text
- [ ] Test backward compatibility (no source text)

---

## 🧪 Phase 5: Testing (1 hour)

### Unit Tests
**Files:** `src/lib/__tests__/source-text-*.test.ts`

- [ ] Upload source text (PDF, DOCX, TXT)
- [ ] Validate file type restrictions
- [ ] Validate file size limits
- [ ] Fetch source text by ID
- [ ] List source texts with usage count
- [ ] Delete source text and blob
- [ ] Build prompt with source text
- [ ] Build prompt without source text

### Integration Tests
- [ ] End-to-end: Upload → Create Assignment → Grade Essay
- [ ] Delete source text (verify assignments SET NULL)
- [ ] Grade with missing blob (should continue)
- [ ] Compare grading quality with/without source text

### Manual Testing
- [ ] Upload 3 file types (PDF, DOCX, TXT)
- [ ] Create assignment with source text
- [ ] Submit and grade essay
- [ ] Verify LLM receives source text
- [ ] Check feedback quality
- [ ] Test source text library UI
- [ ] Test delete cascade behavior
- [ ] Test error cases

---

## 📝 Phase 6: Documentation (30 minutes)

### Files to Update
- [ ] `db_ref.md` - Add source_texts table schema
- [ ] `README.md` - Add source text feature description
- [ ] `MasterToDo.md` - Move to CompletedToDo.md
- [ ] `.env.example` - Add ALLOW_BLOB_STORAGE note
- [ ] Add JSDoc comments to new functions
- [ ] Document prompt template changes

---

## 🎯 Success Criteria

### Functional
- ✅ Teachers can upload source texts (PDF, DOCX, TXT)
- ✅ Source texts stored in Netlify Blobs
- ✅ Assignments can be linked to source texts
- ✅ LLM receives source text during grading
- ✅ Source text library management works
- ✅ Delete cascade handled properly

### Quality
- ✅ Grading accuracy improves with source text
- ✅ File upload handles errors gracefully
- ✅ UI is intuitive and fast
- ✅ All tests pass
- ✅ Code follows style conventions

### Security
- ✅ Authentication required
- ✅ Tenant isolation enforced
- ✅ File type validation
- ✅ File size limits
- ✅ Unpredictable blob keys

---

## 🚀 Deployment Checklist

- [ ] Run all tests locally
- [ ] Apply database migration
- [ ] Update `db_ref.md`
- [ ] Deploy to production
- [ ] Verify environment variables (NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN)
- [ ] Test file upload in production
- [ ] Monitor for errors
- [ ] Update user documentation

---

## 📊 Time Breakdown

| Phase | Time |
|-------|------|
| Database Schema | 1 hour |
| Backend Functions | 2 hours |
| Frontend UI | 2 hours |
| LLM Integration | 1 hour |
| Testing | 1 hour |
| Documentation | 0.5 hours |
| **Total** | **7.5 hours** |

---

## 🔮 Future Enhancements (Out of Scope)

- Multiple source texts per assignment
- Automatic citation checking
- Source text versioning
- Shared district-wide library
- OCR for scanned texts
- Audio/video transcription
- Teacher annotations on source texts

---

**Plan Status:** ✅ READY FOR IMPLEMENTATION  
**Next Step:** Begin Phase 1 (Database Schema)

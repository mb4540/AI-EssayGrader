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

## 🔥 CRITICAL - Beta Tester Feedback (October 30, 2025)

### 1. Point-Based Scoring System ⭐⭐⭐ CRITICAL
**Goal:** Support flexible point allocation for essays (full or partial assignments)

**Background:** Teachers need to grade essays that may be:
- **Mode 1:** Essay = 100% of assignment (simple grading)
- **Mode 2:** Essay = partial assignment (e.g., 60 pts out of 100-pt assignment)

**Example Scenario (Mode 2):**
```
Total Assignment: 100 points
├── Picture: 20 points (graded elsewhere)
├── Class Notes: 20 points (graded elsewhere)
└── Essay: 60 points (graded in this app)
    ├── Organization: 15 points
    ├── Evidence: 15 points
    ├── Grammar: 15 points
    └── Style: 15 points
```

**Tasks:**
- [ ] Add "Essay is partial assignment" toggle to Assignment modal
- [ ] If partial: Show two fields:
  - [ ] "Essay Point Value" (e.g., 60)
  - [ ] "Total Assignment Points" (e.g., 100)
- [ ] If full: Essay points = 100 automatically
- [ ] Update rubric to distribute points across categories
- [ ] Display category scores as points (e.g., "Organization: 12/15 pts")
- [ ] Display total essay score as points (e.g., "Essay: 48/60 pts")
- [ ] Add optional percentage toggle for gradebook entry (e.g., "80%")
- [ ] Update AI grading prompt to work with point-based rubrics
- [ ] Store scoring mode in database

**Database Changes:**
```sql
ALTER TABLE grader.assignments
ADD COLUMN is_partial_assignment boolean DEFAULT false,
ADD COLUMN essay_points integer DEFAULT 100,
ADD COLUMN total_assignment_points integer DEFAULT 100;
```

**Files:** 
- `src/components/CreateAssignmentModal.tsx`
- `src/pages/Submission.tsx`
- `netlify/functions/grade.ts`
- Database migration: `migrations/add_point_based_scoring.sql`

**Time:** 4-6 hours

---

### 2. Expand Assignment Types & Subject Areas ⭐⭐⭐ CRITICAL
**Goal:** Support comprehensive document types across all subject areas (not just essays)

**Background:** Teachers need to grade various writing types beyond essays, specific to their subject area (ELA, History, Science, Math, CTE, Arts, Health/PE).

**Document Type Hierarchy:**
We'll use a programmatic JSON structure to define:
- **25 document types** (argumentative, informational, research report, narrative, lab report, etc.)
- **7 subject areas** (English/ELA, History/Social Studies, Science, Math, CTE/Engineering, Arts, Health/PE)
- **Subject-specific document types** (each subject shows only relevant types)
- **Aliases** for common terms (persuasive → argumentative, book report → book review, etc.)

**JSON Structure:** (stored in `src/lib/documentTypes.json`)
```json
{
  "version": "1.0.0",
  "doc_types": {
    "argumentative": { "label": "Argument/Position Paper", "common": true },
    "informational": { "label": "Explanatory/Informational Report", "common": true },
    "research_report": { "label": "Research Report/Paper", "common": true },
    "summary": { "label": "Summary/Abstract/Executive Summary", "common": true },
    "compare_contrast": { "label": "Compare–Contrast Analysis", "common": true },
    "cause_effect": { "label": "Cause–Effect Analysis", "common": true },
    "problem_solution": { "label": "Problem–Solution Proposal", "common": true },
    "reflection": { "label": "Reflection/Learning Log", "common": true },
    "data_commentary": { "label": "Data Commentary (explain a chart/table)", "common": true },
    "case_study": { "label": "Case Study Analysis", "common": true },
    "procedural": { "label": "Procedural/How-To/Methodology", "common": true },
    "field_observation": { "label": "Field/Observation Report", "common": true },
    "policy_brief": { "label": "Policy Brief/Memo", "common": true },
    "source_analysis_dbq": { "label": "DBQ/Source Analysis", "common": true },
    "narrative_personal": { "label": "Personal Narrative", "common": true },
    "descriptive": { "label": "Descriptive Essay", "common": false },
    "literary_analysis": { "label": "Literary Analysis", "common": false },
    "rhetorical_analysis": { "label": "Rhetorical Analysis", "common": false },
    "short_story": { "label": "Short Story (Creative)", "common": false },
    "poetry": { "label": "Poetry", "common": false },
    "book_review": { "label": "Book Review/Critique", "common": false },
    "lab_report": { "label": "Lab Report", "common": false },
    "design_proposal": { "label": "Design/Engineering Proposal", "common": false },
    "technical_spec": { "label": "Technical Specification", "common": false },
    "math_explanation": { "label": "Math Explanation/Proof Write-Up", "common": false },
    "critique_review": { "label": "Critique/Review (Art/Performance)", "common": false }
  },
  "subjects": {
    "english_ela": {
      "label": "English/ELA",
      "doc_type_ids": ["narrative_personal", "descriptive", "reflection", "literary_analysis", "rhetorical_analysis", "argumentative", "informational", "compare_contrast", "cause_effect", "problem_solution", "research_report", "short_story", "poetry", "book_review", "summary"]
    },
    "history_social_studies": {
      "label": "History/Social Studies",
      "doc_type_ids": ["argumentative", "informational", "research_report", "summary", "compare_contrast", "cause_effect", "problem_solution", "case_study", "policy_brief", "source_analysis_dbq", "reflection", "data_commentary"]
    },
    "science": {
      "label": "Science",
      "doc_type_ids": ["informational", "research_report", "summary", "lab_report", "data_commentary", "procedural", "field_observation", "design_proposal", "argumentative", "reflection"]
    },
    "math": {
      "label": "Math",
      "doc_type_ids": ["math_explanation", "informational", "summary", "compare_contrast", "data_commentary", "argumentative", "reflection"]
    },
    "cte_engineering": {
      "label": "CTE/Engineering/Technology",
      "doc_type_ids": ["design_proposal", "technical_spec", "case_study", "procedural", "informational", "summary", "research_report", "argumentative", "reflection", "data_commentary"]
    },
    "arts": {
      "label": "Arts (Visual/Performing)",
      "doc_type_ids": ["critique_review", "reflection", "informational", "argumentative", "case_study", "summary", "compare_contrast"]
    },
    "health_pe": {
      "label": "Health/PE",
      "doc_type_ids": ["informational", "reflection", "case_study", "policy_brief", "procedural", "summary"]
    }
  },
  "aliases": {
    "persuasive": "argumentative",
    "position_paper": "argumentative",
    "expository": "informational",
    "executive_summary": "summary",
    "abstract": "summary",
    "book_report": "book_review",
    "lab_writeup": "lab_report",
    "cer": "argumentative",
    "how_to": "procedural",
    "sop": "procedural",
    "dbq": "source_analysis_dbq",
    "review": "critique_review"
  }
}
```

**Tasks:**
- [ ] Create `src/lib/documentTypes.json` with full structure above
- [ ] Create `src/lib/documentTypes.ts` TypeScript module to load/parse JSON
- [ ] Add subject area dropdown to Assignment modal (first selection)
- [ ] Add document type dropdown (filtered by selected subject)
- [ ] Store both `subject_area` and `document_type` in assignments table
- [ ] Update AI grading prompt to adjust based on document type
- [ ] Create document-type-specific rubric templates
- [ ] Handle aliases (e.g., "persuasive" → "argumentative")
- [ ] Add tooltips/help text for less common document types

**UI Flow:**
```
Assignment Modal:
1. Select Subject: [English/ELA ▼]
2. Select Document Type: [Personal Narrative ▼] (filtered list)
3. Rest of assignment fields...
```

**Database Changes:**
```sql
ALTER TABLE grader.assignments
ADD COLUMN subject_area text,
ADD COLUMN document_type text;

-- Add check constraint for valid document types
ALTER TABLE grader.assignments
ADD CONSTRAINT valid_document_type CHECK (
  document_type IN (
    'argumentative', 'informational', 'research_report', 'summary',
    'compare_contrast', 'cause_effect', 'problem_solution', 'reflection',
    'data_commentary', 'case_study', 'procedural', 'field_observation',
    'policy_brief', 'source_analysis_dbq', 'narrative_personal', 'descriptive',
    'literary_analysis', 'rhetorical_analysis', 'short_story', 'poetry',
    'book_review', 'lab_report', 'design_proposal', 'technical_spec',
    'math_explanation', 'critique_review'
  )
);
```

**Files:** 
- New: `src/lib/documentTypes.json`
- New: `src/lib/documentTypes.ts`
- `src/components/CreateAssignmentModal.tsx`
- `src/pages/Submission.tsx`
- `netlify/functions/grade.ts`
- Database migration: `migrations/add_document_types.sql`

**Time:** 5-7 hours

---

### 3. Update Essay Grading Prompt - Professional Tone ⭐⭐ HIGH PRIORITY
**Goal:** Change grading tone from "encouraging" to "constructive and professional"

**Background:** Beta tester feedback: "Constructive Criticism does not need to be rainbows butterflies and unicorns." Teachers want direct, honest feedback that follows the rubric strictly.

**Current Prompt (in SettingsModal.tsx):**
```
You are an encouraging 6th-grade ELA grader. Grade fairly to the teacher's criteria. 
Preserve the student's original words; do not rewrite their essay. Provide concise, 
supportive feedback that points to specific issues (grammar, spelling, capitalization, 
sentence structure, organization, evidence, clarity). Never include personal data about 
the student.
```

**Issues with Current Prompt:**
- ❌ "encouraging" - too soft, not direct enough
- ❌ "supportive" - implies sugar-coating
- ❌ Doesn't emphasize strict rubric adherence
- ❌ Too lenient in grading approach

**New Prompt (Professional & Constructive):**
```
You are a professional writing evaluator. Grade strictly according to the provided rubric 
and teacher's criteria. Preserve the student's original words; do not rewrite their work. 
Provide clear, direct, constructive feedback that identifies specific issues with concrete 
examples from the text. Focus on: grammar, spelling, punctuation, capitalization, sentence 
structure, organization, evidence quality, and clarity. Be honest about weaknesses while 
acknowledging strengths. Use professional language appropriate for educational feedback. 
Never include personal data about the student.
```

**Key Changes:**
- ✅ "professional writing evaluator" (not "encouraging grader")
- ✅ "Grade strictly according to rubric" (tighten criteria)
- ✅ "clear, direct, constructive" (not "supportive")
- ✅ "Be honest about weaknesses" (no sugar-coating)
- ✅ "concrete examples from the text" (specific feedback)
- ✅ Maintains respect and professionalism

**Tasks:**
- [ ] Update `DEFAULT_GRADING_PROMPT` in `src/components/SettingsModal.tsx`
- [ ] Add migration note for existing users (prompt stored in localStorage)
- [ ] Update any documentation referencing the prompt
- [ ] Test with sample essays to verify tone is appropriate
- [ ] Consider adding "Reset to Default" reminder for existing users

**Additional Considerations:**
- [ ] Add prompt preset options? (Encouraging, Professional, Strict)
- [ ] Allow grade-level adjustment in prompt? (6th grade vs high school)
- [ ] Document type should influence tone? (creative writing vs research paper)

**Files:** 
- `src/components/SettingsModal.tsx` (line 14: DEFAULT_GRADING_PROMPT)
- `netlify/functions/grade.ts` (uses prompt from localStorage or default)

**Time:** 1-2 hours

**Note:** This change affects the default prompt. Users who have customized their prompt will keep their version unless they click "Reset to Default."

---

### 4. Add "Clean Text" Feature for Copy-Pasted PDF Content ⭐⭐ HIGH PRIORITY
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

### 5. Anchor Chart Integration ⭐ MEDIUM PRIORITY - BLOCKED
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

### 6. PDF Annotation with Inline Feedback ⭐⭐⭐ HIGH PRIORITY - COMPLEX
**Goal:** Overlay feedback directly on student work using traditional teacher markup symbols

**Background:** Teachers want to "circle spelling and punctuation" and mark up student work like traditional grading. Feedback should be attached to specific portions of the original text.

**Teacher Quote:** "Circle spelling and punctuation"

**Requirements:**
- Identify specific locations in original text where issues occur
- Attach comments to specific portions of text
- Overlay feedback on PDF (if PDF submission)
- Use traditional teacher markup symbols
- Provide "markup key" for students to understand shorthand

**Traditional Teacher Markup Symbols (to research):**
- sp (spelling error)
- ^ (insert word/punctuation)
- ¶ (new paragraph needed)
- cap (capitalization)
- frag (sentence fragment)
- ro (run-on sentence)
- awk (awkward phrasing)
- ? (unclear meaning)
- ✓ (good point)
- Others to be determined

**Questions to Answer Before Implementation:**
1. Should this work for all submission types or just PDFs?
2. How should LLM identify text locations? (character positions, line numbers, text matching?)
3. What PDF annotation library should we use? (pdf-lib, PDFKit, other?)
4. Should markup be interactive or static?
5. How detailed should the markup key be?
6. Should students see markup key automatically or on request?
7. Should teachers be able to customize markup symbols?
8. How to handle handwritten submissions (images)?

**Research Needed:**
- [ ] Ask LLM for comprehensive list of traditional teacher markup symbols
- [ ] Research PDF annotation libraries (pdf-lib, PDFKit, pdf.js)
- [ ] Determine how to map feedback to text locations
- [ ] Design markup key format (legend, guide, reference sheet)
- [ ] Test with various PDF formats and layouts

**Potential Implementation:**
- [ ] Modify AI prompt to return feedback with text locations
- [ ] Return feedback with character positions or line numbers
- [ ] Implement PDF annotation library
- [ ] Overlay markup symbols and comments on PDF
- [ ] Generate annotated PDF for download
- [ ] Create student-facing "markup key" component
- [ ] Add markup key to Help page or as modal
- [ ] Support both inline symbols and margin comments

**Technical Challenges:**
- Text location identification (especially for handwritten/OCR text)
- PDF layout preservation during annotation
- Symbol placement accuracy
- Multi-page document handling
- File size management for annotated PDFs

**Database Changes:**
```sql
-- Store markup data with submission
ALTER TABLE grader.submissions
ADD COLUMN markup_data jsonb,
ADD COLUMN annotated_pdf_url text;

-- Markup data structure:
-- {
--   "markups": [
--     {
--       "type": "spelling",
--       "symbol": "sp",
--       "location": { "page": 1, "x": 100, "y": 200 },
--       "text": "teh",
--       "comment": "Check spelling"
--     }
--   ]
-- }
```

**Files:** 
- `netlify/functions/grade.ts` (AI prompt modification for location data)
- `src/pages/Submission.tsx` (display annotated PDF)
- New: `src/lib/pdfAnnotation.ts` (PDF annotation logic)
- New: `src/components/MarkupKey.tsx` (student reference guide)
- New: `netlify/functions/annotate-pdf.ts` (generate annotated PDF)

**Time:** 8-12 hours (complex feature)

**Implementation Phases:**
1. **Phase 1:** LLM returns feedback with text locations (2-3 hours)
2. **Phase 2:** PDF annotation library integration (3-4 hours)
3. **Phase 3:** Markup symbol system and key (2-3 hours)
4. **Phase 4:** Testing and refinement (1-2 hours)

**Next Steps:**
- [ ] Research and select PDF annotation library
- [ ] Create comprehensive markup symbol list
- [ ] Design markup key format
- [ ] Prototype text location identification
- [ ] Test with sample PDFs

---

## 🎯 High Priority - Next Up

### 2. Dashboard Enhancements
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

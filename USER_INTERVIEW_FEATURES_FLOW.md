# FastAI Grader - Feature List for User Interview

**Purpose:** This document lists all features in the FastAI Grader application for user feedback and enhancement planning. Features are organized by user workflow from Dashboard through to saving a final grade.

**Date:** October 30, 2025

---

## USER FLOW OVERVIEW

1. **Dashboard** - View and manage all submissions
2. **Create New Submission** - Start grading process
3. **Student Information** - Enter student details
4. **Assignment Selection** - Link to assignment (optional)
5. **Essay Input** - Multiple input methods (text, image, DOCX, PDF)
6. **Draft Comparison** - Compare rough vs. final drafts (optional)
7. **Grading Criteria** - Define or select rubric
8. **Run AI Grading** - Get AI feedback
9. **Review & Edit** - Modify AI suggestions
10. **Annotations** - Mark up documents (optional)
11. **Save Final Grade** - Persist to database
12. **Export/Print** - Share results

---

## 1. DASHBOARD - Starting Point

### 1.1 Dashboard Overview
**Description:** Main landing page showing all submissions and navigation.

**Current Implementation:**
- ✅ Header with app title and navigation
- ✅ "New Submission" button (primary action)
- ✅ "New Assignment" button
- ✅ Settings gear icon (AI prompt customization)
- ✅ Help link
- ✅ Search bar
- ✅ Export CSV button
- ✅ View mode toggle (List vs. Grouped)

**User Feedback:**


**Enhancement Ideas:**


---

### 1.2 Submission List View
**Description:** View all submissions in a sortable, searchable table.

**Current Implementation:**
- ✅ Table with columns: Student Name, Student ID, Assignment, AI Grade, Teacher Grade, Date
- ✅ Sortable by any column (ascending/descending)
- ✅ Click row to view/edit submission
- ✅ Pagination (20 items per page)
- ✅ Synchronized horizontal scrolling
- ✅ Delete individual submissions (trash icon)

**User Feedback:**


**Enhancement Ideas:**


---

### 1.3 Grouped View by Assignment
**Description:** View submissions organized by assignment in collapsible sections.

**Current Implementation:**
- ✅ Toggle between list and grouped views
- ✅ Accordion-style collapsible sections
- ✅ Submission count per assignment
- ✅ "No Assignment" group for unassigned submissions
- ✅ Delete entire assignment with all submissions (trash icon)
- ✅ Same sorting and filtering as list view

**User Feedback:**


**Enhancement Ideas:**


---

### 1.4 Search & Filter
**Description:** Find specific submissions quickly.

**Current Implementation:**
- ✅ Search by student name
- ✅ Real-time search (no submit button needed)
- ✅ Search icon in header
- ✅ Clear search functionality

**User Feedback:**


**Enhancement Ideas:**


---

### 1.5 CSV Export from Dashboard
**Description:** Export all submissions to spreadsheet format.

**Current Implementation:**
- ✅ Export button in dashboard header
- ✅ Includes: student name, student ID, assignment, grades, timestamps
- ✅ Filename includes current date
- ✅ Downloads directly to user's computer

**User Feedback:**


**Enhancement Ideas:**


---

### 1.6 Assignment Management from Dashboard
**Description:** Create and manage reusable assignments.

**Current Implementation:**
- ✅ "New Assignment" button opens modal
- ✅ Assign title and description
- ✅ Define grading criteria/rubric
- ✅ AI-powered rubric enhancement
- ✅ Assignments stored in database
- ✅ Reusable across multiple submissions
- ✅ Delete assignments with confirmation

**User Feedback:**


**Enhancement Ideas:**


---

### 1.7 AI Settings (Global)
**Description:** Customize AI behavior for all grading operations.

**Current Implementation:**
- ✅ Settings modal accessible from dashboard (gear icon)
- ✅ Three customizable prompts:
  - Grading prompt (how AI evaluates essays)
  - OCR enhancement prompt (how AI fixes OCR errors)
  - Rubric enhancement prompt (how AI improves rubrics)
- ✅ Live editing with immediate effect
- ✅ "Reset to Default" button for each prompt
- ✅ Stored in browser localStorage
- ✅ No deployment needed for changes
- ✅ Graceful fallback to defaults

**User Feedback:**


**Enhancement Ideas:**


---

### 1.8 Help Documentation
**Description:** Built-in help for teachers.

**Current Implementation:**
- ✅ Help page accessible from dashboard
- ✅ Step-by-step quick start guide
- ✅ Feature explanations with icons
- ✅ Tips and best practices
- ✅ Troubleshooting section
- ✅ Simple, teacher-friendly language

**User Feedback:**


**Enhancement Ideas:**


---

## 2. NEW SUBMISSION - Starting the Grading Process

### 2.1 Create New Submission Button
**Description:** Primary action to start grading a new essay.

**Current Implementation:**
- ✅ Prominent blue button in dashboard header
- ✅ Navigates to blank submission page
- ✅ All fields empty and ready for input
- ✅ Back button to return to dashboard

**User Feedback:**


**Enhancement Ideas:**


---

### 2.2 Edit Existing Submission
**Description:** Modify previously graded submissions.

**Current Implementation:**
- ✅ Click any submission row from dashboard to edit
- ✅ All fields pre-populated with saved data
- ✅ All fields editable
- ✅ Re-grade capability
- ✅ Version history preserved
- ✅ Updated timestamp tracking

**User Feedback:**


**Enhancement Ideas:**


---

## 3. STUDENT INFORMATION - Identifying the Student

### 3.1 Student Name & ID Input
**Description:** Enter student identifying information.

**Current Implementation:**
- ✅ Student Name field (required)
- ✅ Student ID field (optional)
- ✅ Clear labels and placeholders
- ✅ Simple text input fields
- ✅ Validation on required fields

**User Feedback:**


**Enhancement Ideas:**


---

## 4. ASSIGNMENT SELECTION - Linking to Assignment (Optional)

### 4.1 Assignment Dropdown
**Description:** Select existing assignment to auto-populate criteria.

**Current Implementation:**
- ✅ Dropdown selector on submission page
- ✅ Shows all available assignments
- ✅ Auto-populates grading criteria when assignment selected
- ✅ Optional - can grade without assignment
- ✅ Assignment title saved with submission
- ✅ Shown in dashboard for easy filtering

**User Feedback:**


**Enhancement Ideas:**


---

## 5. ESSAY INPUT - Getting Student Work into System

### 5.1 Single Essay vs. Draft Comparison Toggle
**Description:** Choose between grading one essay or comparing two drafts.

**Current Implementation:**
- ✅ Toggle at top of submission page
- ✅ Two modes: "Single Essay" and "Draft Comparison"
- ✅ Changes layout and input fields
- ✅ Icon indicators for each mode (FileText vs. GitCompare)

**User Feedback:**


**Enhancement Ideas:**


---

### 5.2 Multiple Input Methods (Single Essay Mode)
**Description:** Students' work can be submitted in multiple formats.

**Current Implementation:**
- ✅ Plain text (paste directly into text area)
- ✅ Handwritten photos (drag & drop or click to upload)
- ✅ DOCX files (Word documents)
- ✅ PDF files
- ✅ Image files (PNG, JPG)
- ✅ File drop zone with clear instructions
- ✅ Word count display
- ✅ Full-width essay display area

**User Feedback:**


**Enhancement Ideas:**


---

### 5.3 Draft Comparison Mode
**Description:** Compare rough draft vs. final draft side-by-side.

**Current Implementation:**
- ✅ 50/50 split layout for drafts
- ✅ Separate input areas for rough and final drafts
- ✅ All input methods supported for both drafts (text, image, DOCX, PDF)
- ✅ Side-by-side image viewing for handwritten drafts
- ✅ Independent file upload for each draft
- ✅ Word counts for both drafts
- ✅ Color-coded borders (blue for rough, green for final)
- ✅ Badge labels (ROUGH DRAFT / FINAL DRAFT)

**User Feedback:**


**Enhancement Ideas:**


---

### 5.4 Optical Character Recognition (OCR)
**Description:** Extract text from handwritten or printed images automatically.

**Current Implementation:**
- ✅ Automatic OCR when image uploaded
- ✅ Client-side processing using tesseract.js
- ✅ Works with photos of handwritten essays
- ✅ Works with printed documents
- ✅ Side-by-side view (original image + extracted text)
- ✅ No server upload required for basic OCR
- ✅ Works in both single essay and draft comparison modes
- ✅ Loading indicator during OCR processing
- ✅ Text appears in editable text area

**User Feedback:**


**Enhancement Ideas:**


---

### 5.5 AI Text Enhancement (OCR Cleanup)
**Description:** Improve OCR accuracy using AI after initial extraction.

**Current Implementation:**
- ✅ "Enhance Text" button appears automatically for image uploads
- ✅ Uses OpenAI to fix OCR errors
- ✅ Preserves student's original meaning
- ✅ Corrects obvious OCR mistakes (e.g., "tne" → "the")
- ✅ Updates text in place (replaces OCR text)
- ✅ Works for both single and draft comparison modes
- ✅ Customizable enhancement prompt (via Settings)
- ✅ Loading indicator during enhancement

**User Feedback:**


**Enhancement Ideas:**


---

## 6. GRADING CRITERIA - Defining the Rubric

### 6.1 Criteria Input Field
**Description:** Enter or edit the grading rubric/criteria.

**Current Implementation:**
- ✅ Large text area for criteria
- ✅ Auto-populated if assignment selected
- ✅ Manually editable at any time
- ✅ Supports detailed rubrics with point values
- ✅ Placeholder text with example
- ✅ Clear label and instructions

**User Feedback:**


**Enhancement Ideas:**


---

### 6.2 AI Rubric Enhancement
**Description:** AI helps improve and expand grading criteria.

**Current Implementation:**
- ✅ "Enhance Rubric" button next to criteria field
- ✅ AI expands brief criteria into detailed rubric
- ✅ Maintains teacher's intent
- ✅ Adds specific point values and expectations
- ✅ Adds clarity and structure
- ✅ Updates criteria field in place
- ✅ Works in both submission page and assignment creation
- ✅ Customizable via Settings (rubric prompt)
- ✅ Loading indicator during enhancement

**User Feedback:**


**Enhancement Ideas:**


---

## 7. RUN AI GRADING - Getting AI Feedback

### 7.1 Run Grade Button
**Description:** Trigger AI analysis of the submission.

**Current Implementation:**
- ✅ Prominent "Run Grade" button
- ✅ Requires student name, essay text, and criteria
- ✅ Disabled until requirements met
- ✅ Loading state with spinner
- ✅ Sub-10 second grading target
- ✅ Streaming status updates

**User Feedback:**


**Enhancement Ideas:**


---

### 7.2 AI-Generated Feedback (Grade Panel)
**Description:** Structured feedback from OpenAI analysis.

**Current Implementation:**
- ✅ Overall grade (0-100 scale)
- ✅ Grammar analysis with specific findings
- ✅ Spelling analysis with specific findings
- ✅ Structure analysis with specific findings
- ✅ Evidence analysis with specific findings
- ✅ Top 3 suggestions for improvement
- ✅ Supportive summary for student
- ✅ Configurable AI model (default: gpt-4o-mini)
- ✅ Displays in Grade Panel on right side (single mode) or below (comparison mode)
- ✅ Clear visual hierarchy
- ✅ Color-coded sections

**User Feedback:**


**Enhancement Ideas:**


---

## 8. REVIEW & EDIT - Teacher Override

### 8.1 Edit AI Feedback
**Description:** Teachers can modify all AI suggestions.

**Current Implementation:**
- ✅ Edit overall grade (number input)
- ✅ Edit all feedback sections (text areas)
- ✅ Edit grammar findings
- ✅ Edit spelling findings
- ✅ Edit structure findings
- ✅ Edit evidence findings
- ✅ Edit suggestions
- ✅ Edit summary
- ✅ Teacher edits clearly distinguished from AI feedback
- ✅ All fields editable in place

**User Feedback:**


**Enhancement Ideas:**


---

### 8.2 Version History & Audit Trail
**Description:** Track all changes to grades and feedback.

**Current Implementation:**
- ✅ Full version history tracking
- ✅ Immutable audit trail in database
- ✅ Timestamps for all changes
- ✅ Separate tracking of AI vs. teacher edits
- ✅ Updated timestamp shown in dashboard

**User Feedback:**


**Enhancement Ideas:**


---

## 9. ANNOTATIONS - Marking Up Documents (Optional)

### 9.1 Annotation Tab
**Description:** Switch to annotation mode for visual markup.

**Current Implementation:**
- ✅ Tab toggle between "Grade" and "Annotate"
- ✅ Only available when file uploaded (PDF, image, DOCX)
- ✅ Separate view from grading interface
- ✅ Full-screen document viewer

**User Feedback:**


**Enhancement Ideas:**


---

### 9.2 Annotation Tools
**Description:** Mark up student submissions like traditional red-pen grading.

**Current Implementation:**
- ✅ PDF rendering with pdf.js (local worker)
- ✅ Multiple annotation types:
  - Highlight (yellow marker style)
  - Comment (red header with text area)
  - Freehand pen/drawing
  - Underline
  - Strike-through
- ✅ Toolbar with all tools
- ✅ Select tool (move/resize annotations)
- ✅ Eraser tool (delete annotations)
- ✅ Color picker for annotations
- ✅ Drag and resize annotations
- ✅ Page navigation for multi-page documents
- ✅ Zoom in/out controls
- ✅ Page number display

**User Feedback:**


**Enhancement Ideas:**


---

### 9.3 Annotation Persistence
**Description:** Save and retrieve annotations automatically.

**Current Implementation:**
- ✅ Autosave to database (Neon Postgres)
- ✅ Per-submission annotation storage
- ✅ JSON format for flexibility
- ✅ Loads automatically when viewing submission
- ✅ Version tracking
- ✅ No manual save needed

**User Feedback:**


**Enhancement Ideas:**


---

### 9.4 Annotation Export
**Description:** Export annotated documents for sharing.

**Current Implementation:**
- ✅ Export to PNG (per page)
- ✅ Export to annotated PDF (flattened)
- ✅ Annotations permanently embedded in export
- ✅ Download button in annotation toolbar
- ✅ Filename includes student name and date

**User Feedback:**


**Enhancement Ideas:**


---

## 10. SAVE FINAL GRADE - Persisting to Database

### 10.1 Save Button
**Description:** Save all changes to the database.

**Current Implementation:**
- ✅ "Save" button in grade panel
- ✅ Saves all submission data:
  - Student information
  - Essay text
  - Grading criteria
  - AI feedback
  - Teacher edits
  - Final grade
- ✅ Creates new submission or updates existing
- ✅ Loading state during save
- ✅ Success confirmation
- ✅ Returns to dashboard after save
- ✅ Timestamps automatically updated

**User Feedback:**


**Enhancement Ideas:**


---

### 10.2 Data Persistence
**Description:** All submission data stored in database.

**Current Implementation:**
- ✅ Neon Postgres serverless database
- ✅ Submissions table (main data)
- ✅ Assignments table (reusable assignments)
- ✅ Annotations table (markup data)
- ✅ Version history tracking
- ✅ Timestamps for all records
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Parameterized SQL (injection protection)

**User Feedback:**


**Enhancement Ideas:**


---

## 11. EXPORT & PRINT - Sharing Results

### 11.1 Print Submission
**Description:** Print formatted submission with grades and feedback.

**Current Implementation:**
- ✅ Print button (printer icon) on submission page header
- ✅ Formatted print layout
- ✅ Includes:
  - Student name and ID
  - Assignment title
  - Essay text
  - Grading criteria
  - AI grade and feedback
  - Teacher grade and edits
- ✅ Print-friendly styling (no backgrounds)
- ✅ Opens browser print dialog
- ✅ Can save as PDF from print dialog

**User Feedback:**


**Enhancement Ideas:**


---

### 11.2 Download HTML
**Description:** Download submission as HTML file.

**Current Implementation:**
- ✅ Download button on submission page
- ✅ Self-contained HTML file
- ✅ Includes all submission data
- ✅ Can be opened in any browser
- ✅ Shareable format

**User Feedback:**


**Enhancement Ideas:**


---

## 12. PRIVACY & SECURITY

### 12.1 Privacy-First Design
**Description:** Minimal data storage with privacy focus.

**Current Implementation:**
- ✅ No file storage by default (text only)
- ✅ Optional blob storage (configurable)
- ✅ No third-party analytics
- ✅ Parameterized SQL (injection protection)
- ✅ Environment variables for sensitive data
- ✅ Immutable audit trail

**User Feedback:**


**Enhancement Ideas:**


---

### 12.2 Optional File Storage
**Description:** Store original files when needed (for annotations).

**Current Implementation:**
- ✅ Configurable via ALLOW_BLOB_STORAGE environment variable
- ✅ Netlify Blobs integration
- ✅ Stores PDFs and images for annotation feature
- ✅ Secure URL generation
- ✅ Per-submission file storage
- ✅ DOCX to PDF conversion for annotations

**User Feedback:**


**Enhancement Ideas:**


---

## 13. TECHNICAL & PERFORMANCE

### 13.1 Modern, Responsive Design
**Description:** Clean, professional interface that works on all devices.

**Current Implementation:**
- ✅ React + Vite frontend
- ✅ Tailwind CSS styling
- ✅ shadcn/ui component library
- ✅ Gradient backgrounds and modern aesthetics
- ✅ Dark mode support
- ✅ Mobile-responsive layouts
- ✅ Lucide icons throughout

**User Feedback:**


**Enhancement Ideas:**


---

### 13.2 Layout Optimization
**Description:** Efficient use of screen space.

**Current Implementation:**
- ✅ Single essay mode: Full-width essay with grade panel below
- ✅ Draft comparison: 50/50 split with grade panel below
- ✅ Top-to-bottom information flow
- ✅ Collapsible sections
- ✅ Sticky headers
- ✅ Synchronized scrolling (dashboard table)

**User Feedback:**


**Enhancement Ideas:**


---

### 13.3 Performance Features
**Description:** Fast, efficient processing.

**Current Implementation:**
- ✅ Sub-10 second grading target
- ✅ Streaming status updates
- ✅ Loading indicators
- ✅ Optimized API calls
- ✅ Efficient database queries
- ✅ Client-side OCR (tesseract.js)
- ✅ Client-side DOCX parsing (mammoth)
- ✅ Client-side PDF rendering (pdf.js)
- ✅ Local file validation
- ✅ Browser-based image processing

**User Feedback:**


**Enhancement Ideas:**


---

### 13.4 Serverless Architecture
**Description:** Scalable, cost-effective backend.

**Current Implementation:**
- ✅ Netlify Functions (serverless)
- ✅ Neon Postgres (serverless database)
- ✅ Auto-scaling
- ✅ Pay-per-use pricing
- ✅ No server maintenance

**User Feedback:**


**Enhancement Ideas:**


---

## 14. FUTURE FEATURE IDEAS

### 14.1 Not Yet Implemented
**Potential features to discuss:**

- [ ] Multi-teacher support with user accounts
- [ ] Student portal for viewing feedback
- [ ] Plagiarism detection
- [ ] Rubric templates library
- [ ] Grade curves and statistics
- [ ] Email notifications
- [ ] Mobile app
- [ ] Integration with Google Classroom / Canvas / Schoology
- [ ] Voice comments on annotations
- [ ] Collaborative grading (multiple teachers)
- [ ] AI-powered writing suggestions for students
- [ ] Progress tracking over time
- [ ] Parent portal
- [ ] Automated report generation
- [ ] Custom grade scales (not just 0-100)
- [ ] Batch upload (multiple submissions at once)
- [ ] Advanced search filters (by date range, grade range, etc.)
- [ ] Dashboard analytics (average grades, trends, etc.)

**User Feedback:**


**Enhancement Ideas:**


---

## INTERVIEW NOTES

### General Impressions


### Most Valuable Features


### Least Used Features


### Pain Points


### Feature Requests


### Workflow Observations


### Priority Enhancements

1. 

2. 

3. 

4. 

5. 

---

## NEXT STEPS

**Action Items:**


**Timeline:**


**Follow-up Date:**

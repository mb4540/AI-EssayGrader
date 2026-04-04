# Professional Development Goal — End-of-Year Report

**Teacher:** Shana Busby, Grade 6 ELA, Mansfield ISD
**School Year:** 2025–2026
**Community Partner / Developer:** Mike Berry
**Application:** FastAI Grader (AI-EssayGrader) — [ai-essaygrader.netlify.app](https://ai-essaygrader.netlify.app)
**Report Date:** April 2026

---

## 1. Executive Summary

At the start of the 2025–2026 school year, Shana Busby proposed a professional development goal centered on designing and piloting an AI-assisted reading and grading workflow for her Grade 6 ELA classes. The original vision described a broad platform encompassing book-based lesson planning, STAAR item import, Canvas/Google Docs publishing, adaptive learning, analytics dashboards, and AI-assisted grading — all delivered through a teacher-only tool with no student-facing interface.

Through iterative classroom piloting during the fall semester, Shana and her developer partner discovered that the **essay grading and high-quality student feedback** component delivered the most meaningful time savings and instructional value. The broader lesson-planning, LMS integration, and assessment-import features did not yield the expected efficiency gains in practice. Based on this real-world evidence, the project **pivoted** to focus entirely on building a production-grade AI essay grading platform — and that pivot paid off.

**The result is a deployed, FERPA-compliant web application used daily in Shana's classroom** that provides rubric-driven AI grading, inline text annotations, teacher-controlled feedback, and a secure student identity system — reducing grading turnaround from days to minutes while maintaining high-fidelity, evidence-based feedback for students.

---

## 2. Original Goals vs. Final Outcome

### 2.1 Comparison Matrix

| Original Goal Area | Proposed | Built | Status |
|---|---|---|---|
| **AI-Assisted Essay Grading** | AI suggests grades + comments tied to rubrics | Multi-provider LLM grading (Gemini, OpenAI, Anthropic) with BulletProof decimal-accurate scoring, rubric-driven feedback, teacher override | **Exceeded** |
| **Evidence-Based Feedback** | Feedback referencing text evidence, returned via Canvas | Inline annotations with line-by-line AI feedback, approve/edit/reject workflow, printable annotated PDFs | **Exceeded** |
| **Rubric Management** | Create/edit rubrics aligned to TEKS | Full rubric system: manual creation, AI enhancement, document upload & extraction (PDF/DOCX), rubric library per assignment | **Exceeded** |
| **Teacher-in-Control** | AI drafts; teacher reviews/approves | Complete teacher override on all grades and feedback, version history audit trail, teacher edits saved separately | **Met** |
| **FERPA / Privacy Compliance** | Student data stays in approved systems | Student Identity Bridge with AES-256-GCM encryption, zero PII in cloud, UUID-only storage, user-scoped data isolation | **Exceeded** |
| **Multiple Input Methods** | Import student work from Canvas/Docs | Direct upload: handwritten photos (AI Vision OCR via Gemini 2.5 Pro), DOCX files, plain text paste | **Adapted** |
| **Dashboard & Data Views** | Simple TEKS-by-skill summaries | Dashboard with search, filters, date ranges, class period organization, statistics cards, CSV export | **Adapted** |
| **Book-Based Lesson Planning** | RAG-powered lesson generation from uploaded books | Explored (Source Text feature built through Phase 4), then intentionally abandoned — cost and complexity outweighed benefit | **Not Built** |
| **STAAR Item Import** | Parse STAAR items from URLs/PDFs, map to TEKS | Not implemented — pivot to grading focus | **Not Built** |
| **Canvas/Google Docs Integration** | Publish assignments, sync grades, import submissions | Not implemented — teachers use print/export instead | **Not Built** |
| **Adaptive Learning / Differentiation** | Personalized content by learning style | Not implemented — outside the grading focus | **Not Built** |
| **TEKS Mastery Tracking / Analytics** | Aggregate performance by TEKS strand | Not implemented as a standalone feature; rubric criteria can align to standards | **Not Built** |
| **Vector Store / RAG Architecture** | Embeddings, FAISS/Weaviate, retrieval pipeline | Not implemented — the grading workflow proved more valuable without this complexity | **Not Built** |
| **SIS Integration** | Pull student demographics from district SIS | Not implemented — Bridge system handles student identity locally | **Not Built** |
| **SSO / District Authentication** | Google or Microsoft SSO | Custom JWT authentication with email/password; multi-tenant support | **Adapted** |

### 2.2 Why We Pivoted

The original proposal envisioned a comprehensive platform touching lesson planning, assessment creation, LMS integration, adaptive learning, and grading. During the Oct–Dec pilot cycle, three key insights emerged:

1. **Grading was the bottleneck.** Shana spent the majority of her non-instructional time grading essays and writing feedback — not creating lesson plans or importing STAAR items. Solving the grading problem had the highest return on time invested.

2. **LMS integration added friction, not efficiency.** Building Canvas API integrations would have required district IT approval, OAuth scoping, and significant development time — for a workflow that could be accomplished by printing or exporting the graded output and uploading it manually.

3. **Quality feedback was the student impact lever.** Students benefited most from detailed, evidence-based comments on their writing. The inline annotation system — where AI highlights specific passages and the teacher approves or edits each comment — produced better feedback than Shana could write manually in a fraction of the time.

The decision to pivot was a deliberate, data-informed instructional adjustment — exactly the kind of reflective practice outlined in the original professional development goals.

---

## 3. What Was Built — Feature Summary

### 3.1 Core Grading Engine

- **BulletProof Grading System** — Deterministic, auditable scoring using decimal-precision math (decimal.js). The LLM extracts rubric evaluations as structured JSON; a TypeScript calculator computes final scores with zero floating-point errors.
- **Multi-Provider LLM Support** — 16 models across OpenAI, Gemini, and Anthropic via Netlify AI Gateway. Teachers select their preferred provider in Settings.
- **Background Grading** — Trigger → background → polling architecture eliminates timeout issues on long essays. Grading completes reliably regardless of essay length.
- **Rubric-Driven (Not ELAR-Specific)** — Grading prompts are fully rubric-driven, making the system usable for any subject area. A second teacher (AP World History) has also adopted the tool.

### 3.2 Inline Annotations & Feedback

- **Two-Pass Annotation System** — Pass 1: general grading. Pass 2: criterion-specific inline feedback with line numbers, quotes, and suggestions.
- **Teacher Review Workflow** — Each AI annotation can be approved, edited, or rejected. "Approve All" for bulk action.
- **Annotation Chat** — Teachers can ask follow-up questions about specific annotations.
- **Print Integration** — Annotated PDFs with yellow highlights, inline corrections, strengths, improvement areas, and teacher comments.

### 3.3 Student Identity Bridge (FERPA)

- **Zero PII in Cloud** — Student names and district IDs are never transmitted to the server.
- **AES-256-GCM Encryption** — Student data encrypted locally with a teacher-chosen passphrase.
- **User-Scoped Isolation** — Each teacher's bridge is keyed to their user ID, preventing cross-teacher data exposure on shared computers.
- **Class Period Organization** — Students organized by period with filtering throughout the application.
- **CSV Import** — Bulk student roster import from CSV files.

### 3.4 Multiple Input Methods

- **Handwritten Essay Support** — AI Vision transcription using Gemini 2.5 Pro or GPT-4o for handwritten essay photos.
- **DOCX Upload** — Client-side Word document parsing via mammoth.
- **Plain Text** — Direct paste for typed essays.
- **Local OCR Fallback** — Tesseract.js for offline handwriting recognition.

### 3.5 Dashboard & Management

- **Submission Dashboard** — Search, filter by assignment and class period, date range filtering, sorting.
- **Statistics Cards** — Total assignments, total submissions, pending review, graded today.
- **Three View Modes** — By Student, By Assignment, By Class.
- **CSV Export** — Full data export for gradebook integration.
- **Assignment Management** — Create, edit, delete assignments with rubric configuration.

### 3.6 Authentication & Multi-Tenancy

- **Custom JWT Authentication** — Secure login with bcrypt password hashing.
- **Multi-Tenant Architecture** — Each teacher's data is fully isolated by tenant ID.
- **Password Reset** — Email-based password recovery flow.

### 3.7 Quality & Reliability

- **582+ Automated Tests** — ~60% code coverage across unit and integration tests.
- **Version History** — Immutable audit trail for all grade changes.
- **Help System** — Contextual help icons throughout the application with a dedicated Help page.
- **Production Deployed** — Live at [ai-essaygrader.netlify.app](https://ai-essaygrader.netlify.app) with continuous deployment.

---

## 4. Alignment to Professional Development Goals

### Goal 1 — Curriculum Design Leadership

> *Develop the ability to quickly produce and refine TEKS-aligned lesson materials tied to the actual texts used in class.*

**Outcome:** While the application did not ultimately include a lesson plan generator, Shana developed curriculum design skills through the process of creating detailed rubrics for each assignment type. The rubric creation and AI enhancement workflow required her to articulate clear, TEKS-aligned expectations for every writing assignment — a skill that directly improved the quality and consistency of her lesson materials.

**Evidence:** A library of rubrics created in the application, each with criteria explicitly tied to Grade 6 ELA expectations.

### Goal 2 — Assessment Literacy

> *Curate and adapt STAAR-formatted questions and rubrics; ensure items explicitly reference TEKS strands.*

**Outcome:** The STAAR item import feature was not built, but Shana's assessment literacy grew significantly through the rubric design process. She created, refined, and tested rubrics across 13 ELA document types (Personal Narrative, Argumentative Essay, Literary Analysis, etc.), evaluating how each rubric criterion aligned to specific TEKS strands and produced accurate, fair scoring.

**Evidence:** Rubric documents uploaded and extracted by the system; side-by-side comparison of AI-scored vs. teacher-scored essays demonstrating rubric calibration.

### Goal 3 — Feedback & Grading Efficiency

> *Adopt an AI-assisted grading workflow (teacher-in-control) that returns consistent, evidence-based comments to students, reducing turnaround time and increasing clarity.*

**Outcome: This goal was fully achieved and exceeded.** The AI-assisted grading workflow is the centerpiece of the application. The inline annotation system produces detailed, evidence-based feedback tied to specific passages in the student's essay. The teacher reviews, approves, or edits every piece of feedback before it reaches the student. Grading turnaround has been reduced from days to minutes per essay.

**Evidence:**
- Graded essay samples with AI-generated annotations and teacher approvals
- Printed annotated PDFs returned to students with highlighted feedback
- Grading time data: previously 10–15 minutes per essay manually → now 2–3 minutes per essay with AI assist + teacher review

### Goal 4 — Data-Informed Adjustments

> *Use artifacts and simple dashboards to monitor student progress and select targeted re-teaching or enrichment.*

**Outcome:** The Dashboard provides submission-level data with filtering by student, assignment, class period, and date range. While per-TEKS-strand tracking was not implemented as a standalone analytics feature, the teacher can review patterns across student grades and feedback to identify areas needing re-teaching. CSV export enables integration with existing gradebook and data tools.

**Evidence:** Dashboard screenshots showing class-level views, statistics cards, and filtered submission lists.

---

## 5. Student Benefits Achieved

| Proposed Benefit | Achieved? | Details |
|---|---|---|
| Clearer instructions and rubrics aligned to TEKS | **Yes** | Detailed rubrics with criteria, performance levels, and point values for every assignment |
| Faster, more consistent feedback pointing to specific passages | **Yes** | Inline annotations reference exact quotes from the student's essay with specific improvement suggestions |
| Differentiated materials via Canvas/Docs | **No** | Pivot to grading focus; differentiation was not the primary time-savings lever |

### Additional Student Benefits (Not Originally Proposed)

- **Higher-quality feedback** — AI-generated comments are more detailed and consistent than what could be produced manually for every student in every class period.
- **Faster turnaround** — Students receive graded essays sooner, enabling quicker revision cycles.
- **Fair, rubric-based scoring** — Deterministic calculator ensures every student is scored against the same criteria with mathematical precision.

---

## 6. Timeline Retrospective

| Period | Planned | Actual |
|---|---|---|
| **Aug–Sep** | Set-up, baseline metrics, prepare STAAR items | Set-up: Neon database, Netlify deployment, initial grading prototype. Baseline established for grading turnaround time. |
| **Oct–Dec** | Pilot Cycle 1: Implement workflow in one core unit | Pilot Cycle 1: Tested full grading workflow. Built BulletProof scoring, inline annotations, Student Bridge, Dashboard. Discovered grading was the highest-value feature. Made pivot decision. |
| **Jan–Mar** | Pilot Cycle 2: Expand to additional unit, refined rubrics | Pilot Cycle 2: Refined rubric system (rubric-driven grading, document upload/extraction). Added Image-to-Text (AI Vision). Added class period organization. Second teacher (Miranda, AP World History) began using the tool. |
| **Apr–May** | Document and share results | End-of-year report (this document). Application stable and in daily use. |

---

## 7. Technical Architecture (Final)

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Netlify Functions (serverless, Node.js) |
| **Database** | Neon Postgres (serverless, 7 tables, 21 indexes) |
| **AI/LLM** | Netlify AI Gateway — 16 models across OpenAI, Gemini, Anthropic |
| **OCR** | Gemini 2.5 Pro Vision (primary), Tesseract.js (fallback) |
| **Document Parsing** | mammoth (DOCX), client-side |
| **Authentication** | Custom JWT with bcrypt, multi-tenant |
| **Privacy** | Student Identity Bridge (AES-256-GCM, zero PII in cloud) |
| **Testing** | Vitest, 582+ tests, ~60% coverage |
| **Hosting** | Netlify (continuous deployment from GitHub) |

---

## 8. Lessons Learned

1. **Start with the pain point, not the feature list.** The original specification proposed a comprehensive platform. Classroom reality showed that one feature — grading with quality feedback — solved the biggest problem. Building that one thing well was more valuable than building everything partially.

2. **Pilot early, pivot quickly.** The Oct–Dec pilot cycle surfaced the pivot opportunity within weeks. By January, development was fully focused on the highest-impact feature set.

3. **Teacher-in-control is non-negotiable.** Every AI output in the system is a draft. The teacher reviews, approves, edits, or rejects. This principle was in the original proposal and remained central to the final product.

4. **FERPA compliance requires architectural commitment.** The Student Identity Bridge — encrypting all student data locally and sending only anonymous UUIDs to the cloud — was more complex to build than a simple database, but it ensures genuine FERPA compliance rather than policy-based compliance.

5. **A second user validates the design.** When a second teacher (AP World History) adopted the tool without modifications, it confirmed that the rubric-driven architecture generalized beyond ELA — an outcome that exceeded the original single-classroom scope.

---

## 9. Artifacts for Administration

The following artifacts are available for review:

1. **Application** — Live at [ai-essaygrader.netlify.app](https://ai-essaygrader.netlify.app) (login credentials available from Shana)
2. **Graded Essay Samples** — Printed annotated PDFs with AI-generated feedback and teacher approvals
3. **Rubric Library** — Assignment rubrics created and refined throughout the year
4. **Dashboard Data** — Submission counts, grading statistics, and class period views
5. **CSV Exports** — Full submission data for gradebook integration
6. **This Report** — End-of-year summary with comparison to original goals

---

## 10. Recommendation for Next Year

The FastAI Grader is stable, deployed, and in active use. Recommended next steps for 2026–2027:

- **Batch Upload** — Allow teachers to upload an entire class set of essays at once (design complete, implementation pending)
- **Expand Adoption** — Onboard additional teachers within the ELA department and other subject areas
- **Analytics** — Add per-rubric-criterion trend views to support data-informed re-teaching decisions
- **Canvas Integration** — Revisit LMS integration if district IT approves API access
- **Student Revision Tracking** — Track improvement across multiple drafts of the same assignment

---

*Prepared by Shana Busby with development support from Mike Berry.*
*Application source code maintained at GitHub under private repository.*

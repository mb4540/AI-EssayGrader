# FastAI Grader - Project Status

**Last Updated:** 2025-10-05 14:09 CST

## Project Overview
Building a 6th-grade essay grading application using React + Vite, Netlify Functions, Neon Postgres, and OpenAI.

## ✅ COMPLETED WORK

### 1. Project Structure & Configuration
- ✅ Vite + React + TypeScript setup complete
- ✅ Tailwind CSS configured with custom theme
- ✅ PostCSS and autoprefixer configured
- ✅ TypeScript configs (tsconfig.json, tsconfig.node.json)
- ✅ Path aliases configured (@/* points to ./src/*)
- ✅ .gitignore created

### 2. Dependencies Installed
**Frontend:**
- react, react-dom, react-router-dom
- @tanstack/react-query (state management)
- react-hook-form, @hookform/resolvers
- zod (validation)
- tesseract.js (OCR)
- mammoth (DOCX parsing)
- papaparse (CSV export)
- lucide-react (icons)
- clsx, tailwind-merge, class-variance-authority (styling utilities)
- @radix-ui/react-tabs, react-select, react-label, react-toast

**Dev Dependencies:**
- TypeScript, ESLint, Vite plugins
- Tailwind CSS, tailwindcss-animate

### 3. UI Components (shadcn/ui style) ✅
**Location:** `/src/components/ui/`
- ✅ button.tsx - Button component with variants
- ✅ input.tsx - Input field component
- ✅ textarea.tsx - Textarea component
- ✅ card.tsx - Card components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- ✅ tabs.tsx - Tabs components (Tabs, TabsList, TabsTrigger, TabsContent)
- ✅ label.tsx - Label component
- ✅ select.tsx - Select dropdown components

### 4. Library Utilities ✅
**Location:** `/src/lib/`
- ✅ utils.ts - cn() utility for className merging
- ✅ schema.ts - Zod schemas (FeedbackSchema, IngestRequestSchema, GradeRequestSchema, SaveEditsRequestSchema, ListRequestSchema)
- ✅ api.ts - API client functions (ingestSubmission, gradeSubmission, saveTeacherEdits, listSubmissions, getSubmission)
- ✅ ocr.ts - Tesseract.js OCR functions for image/PDF text extraction
- ✅ docx.ts - Mammoth DOCX text extraction
- ✅ csv.ts - CSV export functionality with PapaParse

### 5. Application Components ✅
**Location:** `/src/components/`
- ✅ FileDrop.tsx - File upload with tabs (Text/Image/DOCX), OCR processing with progress
- ✅ CriteriaInput.tsx - Teacher rubric input with example criteria
- ✅ VerbatimViewer.tsx - Read-only display of student essay
- ✅ GradePanel.tsx - AI feedback display + teacher override form

### 6. Pages ✅
**Location:** `/src/pages/`
- ✅ Dashboard.tsx - List view with search, pagination, CSV export
- ✅ Submission.tsx - Main grading workspace (3-column layout: Input | Verbatim | Grading)

### 7. App Structure ✅
- ✅ App.tsx - React Router setup with QueryClientProvider
- ✅ main.tsx - React root render
- ✅ index.css - Tailwind imports + CSS variables for theming

### 8. Backend - Netlify Functions ✅
**Dependencies installed:** `@neondatabase/serverless`, `openai`, `@netlify/functions`

**Functions created in `/netlify/functions/`:**
- ✅ db.ts - Neon Postgres connection utility
- ✅ ingest.ts - Create submission endpoint
- ✅ grade.ts - OpenAI grading endpoint with structured JSON feedback
- ✅ save-teacher-edits.ts - Update submission with teacher edits
- ✅ list.ts - List submissions with filters (assignment, student, search)
- ✅ get-submission.ts - Get single submission by ID

### 9. Database Setup ✅
- ✅ schema.sql - Complete SQL DDL with all tables and triggers
- ✅ Database connection utility using @neondatabase/serverless
- Tables created:
  - grader.students
  - grader.assignments
  - grader.submissions
  - grader.submission_versions

### 10. Configuration Files ✅
- ✅ netlify.toml - Netlify build configuration with redirects
- ✅ .env.example - Environment variables template
- ✅ README.md - Comprehensive setup and deployment instructions

## 🚧 REMAINING TASKS

### 11. Setup & Testing (READY TO START)
- ⏳ Set up Neon database and run schema.sql
- ⏳ Configure environment variables (.env)
- ⏳ Test locally with `netlify dev`
- ⏳ Deploy to Netlify
- ⏳ End-to-end testing (ingest → grade → save → export)

### 12. Optional Polish (FUTURE)
- ❌ Error boundaries
- ❌ Toast notifications for success/error states
- ❌ Loading states refinement
- ❌ Form validation improvements
- ❌ Responsive design testing

## 📋 ENVIRONMENT VARIABLES NEEDED

```env
OPENAI_API_KEY=***
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgres://USER:PASSWORD@HOST/db
ALLOW_BLOB_STORAGE=false
APP_BASE_URL=https://your-site.netlify.app
```

## 🔧 GRADING PROMPT (For grade.ts function)

**System Message:**
```
You are an encouraging 6th-grade ELA grader. Grade fairly to the teacher's criteria. Preserve the student's original words; do not rewrite their essay. Provide concise, supportive feedback that points to specific issues (grammar, spelling, capitalization, sentence structure, organization, evidence, clarity). Never include personal data about the student.
```

**User Template:**
```
TEACHER_CRITERIA (verbatim):
<<<
{{teacher_criteria}}
>>>

STUDENT_WORK_VERBATIM:
<<<
{{verbatim_text}}
>>>

CONSTRAINTS:
- Do NOT rewrite the essay.
- Focus on actionable comments tied to lines/sentences (quote short fragments as needed).
- Assign a numeric grade according to the teacher's criteria. If criteria specify weights, apply them.

RETURN JSON ONLY matching the FeedbackSchema
```

## 📁 PROJECT STRUCTURE

```
FastAIGrader/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── FileDrop.tsx
│   │   ├── CriteriaInput.tsx
│   │   ├── VerbatimViewer.tsx
│   │   └── GradePanel.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── schema.ts
│   │   ├── api.ts
│   │   ├── ocr.ts
│   │   ├── docx.ts
│   │   └── csv.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── Submission.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── netlify/
│   └── functions/       # TO BE CREATED
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── FastAIGrader.md      # Original spec
```

## 🚀 NEXT ACTIONS (Quick Start)

### 1. Set up Neon Database
   - Go to [neon.tech](https://neon.tech) and create a free database
   - Copy your connection string
   - Open Neon SQL Editor and run the contents of `schema.sql`

### 2. Configure Environment Variables
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials:
   # - OPENAI_API_KEY
   # - DATABASE_URL
   ```

### 3. Test Locally
   ```bash
   # Install Netlify CLI if needed
   npm install -g netlify-cli
   
   # Start dev server
   netlify dev
   ```
   Access at `http://localhost:8888`

### 4. Deploy to Netlify
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```
   Don't forget to add environment variables in Netlify dashboard!

## 📝 NOTES

- OCR and DOCX processing are client-side to reduce serverless cold starts
- Using Neon serverless driver for better Netlify Functions compatibility
- React Query handles caching and request deduplication
- All student text is preserved verbatim (no modifications)
- Version history tracks all grade changes
- Privacy-first: no file storage by default (ALLOW_BLOB_STORAGE=false)

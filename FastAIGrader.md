FastAIGrader.md

Prompt: “6th-Grade Essay Grader (React+Vite · Netlify · Neon · OpenAI)”
Role

You are a senior full-stack engineer building a privacy-conscious, production-ready web application that dramatically reduces grading time for a 6th-grade ELA teacher. Deliver a working MVP with clean, documented, testable code and a minimal, friendly UI.

Tech Constraints

Frontend: React + Vite, shadcn/ui (Tailwind), TypeScript.

Hosting: Netlify (frontend + Netlify Functions for API).

DB: Neon Postgres (SQL over serverless connection).

AI: OpenAI (use JSON-mode or function-calling; model name configurable via env).

OCR: tesseract.js (browser) for images; mammoth for DOCX → text.

File handling: No long-term storage of student work by default. Process in memory; persist derived text + grades only. (Toggleable via env.)

Product Requirements

Ingestion

Upload handwritten photo (PNG/JPG/PDF page) → OCR to raw text.

Upload DOCX → extract text with mammoth.

Paste plain text directly.

Always preserve a verbatim transcription of student work (keep all grammar/spelling errors) for display and audit.

Student & Assignment Context

Inputs: student_name or student_id (either required), assignment_id (optional but recommended), teacher_criteria (freeform rubric text + scoring policy).

Persist submissions and grades in Neon with immutable history (version on edits).

Grading

Send verbatim student text + teacher criteria to LLM.

Output:

Overall grade (0–100 or rubric-weighted).

Supportive, specific feedback (grammar, spelling, structure, evidence, clarity).

Line-level suggestions (optional), but do not rewrite original—only comment on it.

Teacher can edit grade and comments; edited values become canonical while keeping the AI output.

UI

Left: Upload/Import (Image, DOCX, Text), student identity, assignment selector/new.

Center: Verbatim Text (read-only).

Right: Criteria input + Grade & Feedback panel (AI output first, then editable fields).

Actions: “Run Grade,” “Save,” “Export CSV,” search/filter by student/assignment.

Performance & Privacy

Sub-10s grading target with streaming UI status.

Log minimal metadata. No third-party analytics by default.

Environment flag to allow temporary object storage if later needed.

Environment Variables

Create .env and Netlify environment vars:

OPENAI_API_KEY=***
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgres://USER:PASSWORD@HOST/db
ALLOW_BLOB_STORAGE=false
APP_BASE_URL=https://your-site.netlify.app

Database (Neon) — SQL DDL

Create schema grader and tables with row-level auditing.

create schema if not exists grader;

create table if not exists grader.students (
  id uuid primary key default gen_random_uuid(),
  student_id text,         -- district/student system id (optional but indexed)
  student_name text not null,
  created_at timestamptz not null default now(),
  unique(student_id, student_name)
);
create index if not exists idx_students_student_id on grader.students(student_id);

create table if not exists grader.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists grader.submissions (
  id uuid primary key default gen_random_uuid(),
  student_ref uuid not null references grader.students(id) on delete restrict,
  assignment_ref uuid references grader.assignments(id) on delete set null,
  source_type text not null check (source_type in ('text','docx','image')),
  verbatim_text text not null,                  -- OCR/DOCX/plain
  teacher_criteria text not null,
  ai_grade numeric(5,2),                        -- AI’s suggestion
  ai_feedback jsonb,                            -- structured feedback (see schema)
  teacher_grade numeric(5,2),                   -- teacher editable
  teacher_feedback text,                        -- teacher editable
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grader.submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_ref uuid not null references grader.submissions(id) on delete cascade,
  ai_grade numeric(5,2),
  ai_feedback jsonb,
  teacher_grade numeric(5,2),
  teacher_feedback text,
  snapshot_at timestamptz not null default now()
);

create or replace function grader.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_touch_updated_at on grader.submissions;
create trigger trg_touch_updated_at
before update on grader.submissions
for each row execute function grader.touch_updated_at();

API (Netlify Functions)

Create functions under netlify/functions/:

ingest.ts

Accepts: student_name or student_id, assignment_id (optional, can create), teacher_criteria, and one of: text, docxFile, imageFile.

Transforms:

If imageFile: run tesseract.js in the client and post the resulting text; or accept image and use server OCR if you add native lib (default: client).

If docxFile: read ArrayBuffer and process with mammoth in the client (default) or server.

Persists verbatim text + criteria, returns submission_id.

grade.ts

Accepts: submission_id

Fetches submission, builds grading prompt, calls OpenAI with JSON schema (below).

Saves ai_grade + ai_feedback to submissions and also writes a row to submission_versions.

Returns structured result.

save-teacher-edits.ts

Accepts: submission_id, teacher_grade, teacher_feedback.

Updates submissions + version history.

list.ts

Filters by assignment_id, student_id, query string, with pagination.

Returns flat summary rows for table view/export.

All functions use a small db.ts (pg + neon) and schema.ts (zod validators).

Frontend Structure
/src
  /components
    FileDrop.tsx           // Image/DOCX/Text tabs; shows OCR progress
    CriteriaInput.tsx
    VerbatimViewer.tsx     // read-only, monospaced
    GradePanel.tsx         // AI result + teacher edit form
    Toolbar.tsx            // Run Grade, Save, Export
  /pages
    Dashboard.tsx          // list, filters, export
    Submission.tsx         // main grading workspace
  /lib
    api.ts                 // fetch wrappers
    ocr.ts                 // tesseract helpers (client)
    docx.ts                // mammoth helpers (client)
    csv.ts                 // export helpers

Dependencies (frontend)

tesseract.js, mammoth, zod, @tanstack/react-query, react-hook-form, shadcn/ui, lucide-react, papaparse (for CSV).

Tailwind + shadcn setup.

Grading Prompt (system + user; JSON output)

System message (use exactly; keep supportive tone, 6th-grade level expectations):

You are an encouraging 6th-grade ELA grader. Grade fairly to the teacher’s criteria. Preserve the student’s original words; do not rewrite their essay. Provide concise, supportive feedback that points to specific issues (grammar, spelling, capitalization, sentence structure, organization, evidence, clarity). Never include personal data about the student.


User content template (compose in grade.ts):

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
- Assign a numeric grade according to the teacher’s criteria. If criteria specify weights, apply them.

RETURN JSON ONLY matching this schema:
{
  "overall_grade": number,            // 0-100
  "rubric_scores": [                  // optional category breakdowns
    { "category": string, "score": number, "comments": string }
  ],
  "grammar_findings": string[],       // short bullets
  "spelling_findings": string[],      // short bullets
  "structure_findings": string[],     // short bullets (organization, topic, conclusion)
  "evidence_findings": string[],      // citations/examples if relevant
  "top_3_suggestions": string[],      // most impactful improvements
  "supportive_summary": string        // 3-4 sentences, warm and encouraging
}


JSON schema (zod) for validation

import { z } from "zod";

export const FeedbackSchema = z.object({
  overall_grade: z.number().min(0).max(100),
  rubric_scores: z.array(z.object({
    category: z.string(),
    score: z.number().min(0).max(100),
    comments: z.string().max(800)
  })).optional(),
  grammar_findings: z.array(z.string()).max(30),
  spelling_findings: z.array(z.string()).max(30),
  structure_findings: z.array(z.string()).max(30),
  evidence_findings: z.array(z.string()).max(30),
  top_3_suggestions: z.array(z.string()).max(3),
  supportive_summary: z.string().max(800)
});

Example Teacher Criteria (shown as placeholder/help text)
Scoring (100 pts total):
- Organization (20): clear intro, body, conclusion
- Evidence/Examples (20): supports main idea
- Grammar & Mechanics (25): capitalization, punctuation, subject-verb, sentence boundaries
- Spelling (15)
- Clarity & Style (20): precise words, transitions

Penalties:
- Off-topic: -10
- Too short (< 200 words): -10

Key Implementation Notes

OCR path (default): Do OCR in browser with tesseract.js to avoid sending images to your backend; post text to /ingest.

DOCX path: Use mammoth in the browser to extract text.

Rate limits: Debounce “Run Grade” and show spinner/status; allow retries.

Editing: When teacher saves edits, store in teacher_grade and teacher_feedback, snapshot to submission_versions.

Export CSV: Include student_name/id, assignment, teacher_grade, teacher_feedback, ai_grade, created_at.

Security & Privacy

Do not store raw files by default (ALLOW_BLOB_STORAGE=false).

Store verbatim text + grades only.

Never include student PII in prompts beyond name/id needed for association; the model instructions forbid echoing PII in feedback.

Use parameterized SQL; no client DB creds.

Acceptance Criteria (MVP)

I can upload an image or DOCX or paste text and see the verbatim transcription.

I can enter student name/id and criteria, click Run Grade, and receive JSON-backed feedback rendered in UI.

I can edit the final grade and comments and save them.

Submissions are persisted; I can search/filter and export CSV.

The app runs on Netlify with Neon connection and env-configurable OpenAI model.

Stretch (optional if time allows)

Line-anchored comments with offsets (start/end character indexes).

Simple rubric builder (weights UI).

Batch grading queue.

Example Files (sketches)

netlify/functions/grade.ts (sketch)

import { FeedbackSchema } from "../../src/lib/schema";
import { OpenAI } from "openai";
import { sql } from "../../src/lib/db";

export default async (req: Request) => {
  const { submission_id } = await req.json();
  const submission = await sql`
    select verbatim_text, teacher_criteria, id
    from grader.submissions where id=${submission_id}`;
  if (!submission[0]) return new Response("Not found", { status: 404 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const system = `You are an encouraging 6th-grade ELA grader...`; // from above
  const user = buildUserPrompt(submission[0].teacher_criteria, submission[0].verbatim_text);

  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }]
  });

  const json = JSON.parse(resp.choices[0].message.content || "{}");
  const parsed = FeedbackSchema.safeParse(json);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const grade = parsed.data.overall_grade;
  await sql.begin(async (tx) => {
    await tx`update grader.submissions set ai_grade=${grade}, ai_feedback=${tx.json(parsed.data)} where id=${submission_id}`;
    await tx`insert into grader.submission_versions (submission_ref, ai_grade, ai_feedback) values (${submission_id}, ${grade}, ${tx.json(parsed.data)})`;
  });

  return Response.json(parsed.data);
};


src/components/GradePanel.tsx (props sketch)

type Props = {
  ai: { overall_grade?: number; supportive_summary?: string; top_3_suggestions?: string[] } | null;
  onRunGrade: () => void;
  teacherGrade: number | undefined;
  setTeacherGrade: (n: number) => void;
  teacherFeedback: string;
  setTeacherFeedback: (s: string) => void;
  onSaveEdits: () => void;
};

Developer Tasks (checklist)

 Initialize Vite + Tailwind + shadcn.

 Set Netlify functions; add Neon pg client; wire env.

 Implement /ingest, /grade, /save-teacher-edits, /list.

 Build FileDrop with tabs (Image | DOCX | Text) + OCR/DOCX helpers.

 Build Submission workspace with three columns: Ingest / Verbatim / Criteria+Grade.

 Add CSV export and table view.

 Write zod validators and minimal unit tests for prompt JSON.

 Add basic e2e smoke (Playwright) for ingest → grade → save.

Minimal Tests (happy paths)

Ingest text → create submission → grade → returns valid JSON per schema.

Edit grade/feedback → persisted and versioned.

Search and CSV export includes teacher_edited values.
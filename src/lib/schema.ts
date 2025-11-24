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
  supportive_summary: z.string().max(800),
  // Draft comparison fields (optional)
  improvement_summary: z.string().max(800).optional(),
  areas_improved: z.array(z.string()).max(10).optional(),
  areas_still_need_work: z.array(z.string()).max(10).optional(),
  growth_percentage: z.number().min(0).max(100).optional(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export const IngestRequestSchema = z.object({
  // FERPA COMPLIANT: Only UUID sent to cloud (no PII)
  // Student name resolved locally from encrypted bridge file
  student_id: z.string().uuid(), // Required - UUID from bridge
  assignment_id: z.string().uuid().optional(),
  assignment_title: z.string().optional(),
  teacher_criteria: z.string().min(1),
  source_type: z.enum(['text', 'docx', 'pdf', 'doc', 'image']),
  draft_mode: z.enum(['single', 'comparison']).default('single'),
  // For single mode
  verbatim_text: z.string().optional(),
  // For comparison mode
  rough_draft_text: z.string().optional(),
  final_draft_text: z.string().optional(),
}).refine(
  (data) => {
    if (data.draft_mode === 'single') {
      return !!data.verbatim_text;
    } else {
      return !!data.rough_draft_text && !!data.final_draft_text;
    }
  },
  {
    message: 'Single mode requires verbatim_text, comparison mode requires both rough_draft_text and final_draft_text',
  }
);

export type IngestRequest = z.infer<typeof IngestRequestSchema>;

export const GradeRequestSchema = z.object({
  submission_id: z.string().uuid(),
  // Optional custom prompts from AI Settings
  grading_prompt: z.string().optional(),
  ocr_prompt: z.string().optional(),
  rubric_prompt: z.string().optional(),
});

export type GradeRequest = z.infer<typeof GradeRequestSchema>;

export const SaveEditsRequestSchema = z.object({
  submission_id: z.string().uuid(),
  teacher_grade: z.number().min(0).max(100),
  teacher_feedback: z.string(),
});

export type SaveEditsRequest = z.infer<typeof SaveEditsRequestSchema>;

export const ListRequestSchema = z.object({
  assignment_id: z.string().uuid().optional(),
  student_id: z.string().optional(),
  search: z.string().optional(),
  class_period: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type ListRequest = z.infer<typeof ListRequestSchema>;

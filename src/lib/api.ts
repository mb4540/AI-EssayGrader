import type { IngestRequest, GradeRequest, SaveEditsRequest, ListRequest, Feedback } from './schema';
import { getCustomPrompts } from './prompts';

const API_BASE = '/.netlify/functions';

export async function ingestSubmission(data: IngestRequest) {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ingest failed: ${error}`);
  }

  return response.json() as Promise<{ submission_id: string }>;
}

export async function gradeSubmission(data: GradeRequest) {
  const customPrompts = getCustomPrompts();
  const response = await fetch(`${API_BASE}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ...customPrompts }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grading failed: ${error}`);
  }

  return response.json() as Promise<Feedback>;
}

export async function saveTeacherEdits(data: SaveEditsRequest) {
  const response = await fetch(`${API_BASE}/save-teacher-edits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Save failed: ${error}`);
  }

  return response.json();
}

export async function listSubmissions(params: ListRequest) {
  const queryParams = new URLSearchParams();
  if (params.assignment_id) queryParams.set('assignment_id', params.assignment_id);
  if (params.student_id) queryParams.set('student_id', params.student_id);
  if (params.search) queryParams.set('search', params.search);
  queryParams.set('page', params.page?.toString() || '1');
  queryParams.set('limit', params.limit?.toString() || '20');

  const response = await fetch(`${API_BASE}/list?${queryParams}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`List failed: ${error}`);
  }

  return response.json() as Promise<{
    submissions: Array<{
      id: string;
      student_name: string;
      student_id?: string;
      assignment_title?: string;
      teacher_grade?: number;
      ai_grade?: number;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
  }>;
}

export async function getSubmission(id: string) {
  const response = await fetch(`${API_BASE}/get-submission?id=${id}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Get submission failed: ${error}`);
  }

  return response.json() as Promise<{
    id: string;
    student_name: string;
    student_id?: string;
    assignment_title?: string;
    assignment_id?: string;
    source_type: string;
    draft_mode?: 'single' | 'comparison';
    verbatim_text?: string;
    rough_draft_text?: string;
    final_draft_text?: string;
    teacher_criteria: string;
    ai_grade?: number;
    ai_feedback?: Feedback;
    teacher_grade?: number;
    teacher_feedback?: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
  }>;
}

export async function listAssignments() {
  const response = await fetch(`${API_BASE}/assignments`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`List assignments failed: ${error}`);
  }

  return response.json() as Promise<{
    assignments: Array<{
      id: string;
      title: string;
      description?: string;
      grading_criteria?: string;
      created_at: string;
    }>;
  }>;
}

export async function createAssignment(data: { title: string; description?: string; grading_criteria?: string }) {
  const response = await fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create assignment failed: ${error}`);
  }

  return response.json() as Promise<{
    assignment: {
      id: string;
      title: string;
      description?: string;
      grading_criteria?: string;
      created_at: string;
    };
  }>;
}

export async function deleteSubmission(submissionId: string) {
  const response = await fetch(`${API_BASE}/delete-submission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete submission failed: ${error}`);
  }

  return response.json();
}

export async function uploadFile(
  submissionId: string,
  fileData: string,
  extension: string
): Promise<string> {
  const response = await fetch(`${API_BASE}/upload-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_data: fileData,
      submission_id: submissionId,
      file_extension: extension,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'File upload failed');
  }

  const data = await response.json();
  return data.file_url;
}

// ===== Annotation API Functions =====

export interface AnnotationData {
  id: string;
  page_id: string;
  type: 'highlight' | 'comment' | 'pen' | 'underline';
  rect?: { x: number; y: number; w: number; h: number };
  path?: { x: number; y: number }[];
  color_rgba?: string;
  stroke_width?: number;
  text?: string;
  z_index: number;
}

export interface AnnotationPageData {
  id: string;
  submission_id: string;
  page_number: number;
  width_px: number;
  height_px: number;
  annotations: AnnotationData[];
}

/**
 * Fetch annotations for a specific submission page
 */
export async function getAnnotations(
  submissionId: string,
  pageNumber: number
): Promise<AnnotationPageData> {
  const response = await fetch(
    `${API_BASE}/annotations-get?submission_id=${submissionId}&page_number=${pageNumber}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Get annotations failed: ${error}`);
  }

  return response.json();
}

/**
 * Upsert annotations (batch create/update/delete)
 */
export async function upsertAnnotations(data: {
  submission_id: string;
  page_number: number;
  width_px: number;
  height_px: number;
  ops: Array<{
    action: 'create' | 'update' | 'delete';
    annotation?: AnnotationData;
    annotation_id?: string;
  }>;
  create_version?: boolean;
}) {
  const response = await fetch(`${API_BASE}/annotations-upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upsert annotations failed: ${error}`);
  }

  return response.json();
}

/**
 * Export annotated PDF
 */
export async function exportAnnotatedPdf(
  submissionId: string,
  pages?: number[]
): Promise<{ download_url: string; file_size: number; pages_annotated: number }> {
  const response = await fetch(`${API_BASE}/annotations-export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId, pages }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Export PDF failed: ${error}`);
  }

  return response.json();
}

/**
 * Convert DOCX to PDF (when implemented)
 */
export async function convertDocxToPdf(
  submissionId: string
): Promise<{ pdf_url: string; page_count: number }> {
  const response = await fetch(`${API_BASE}/convert-docx-to-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DOCX conversion failed: ${error}`);
  }

  return response.json();
}

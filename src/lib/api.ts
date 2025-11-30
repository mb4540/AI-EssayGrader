import type { IngestRequest, GradeRequest, SaveEditsRequest, ListRequest, Feedback } from './schema';
import { getCustomPrompts } from './prompts';

const API_BASE = '/.netlify/functions';

// ============================================================================
// Authentication Helper
// ============================================================================

/**
 * Get authentication headers with JWT token
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response and check for authentication errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    // Redirect to login
    window.location.href = '/login';

    throw new Error('Authentication required. Redirecting to login...');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// API Functions
// ============================================================================

export async function ingestSubmission(data: IngestRequest) {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<{ submission_id: string }>(response);
}

/**
 * Start a background grading job (returns immediately with task_id)
 */
export async function startGradingJob(data: GradeRequest) {
  const customPrompts = getCustomPrompts();

  // Get LLM settings (default to Gemini 2.5 Pro)
  const llmProvider = localStorage.getItem('ai_provider') || 'gemini';
  const llmModel = llmProvider === 'gemini' ? 'gemini-2.5-pro' : 'gpt-4o';

  const response = await fetch(`${API_BASE}/grade-bulletproof-trigger`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      ...customPrompts,
      llmProvider,
      llmModel
    }),
  });

  return handleResponse<{
    ok: boolean;
    task_id: string;
    status: string;
    message: string;
  }>(response);
}

/**
 * Check the status of a background grading job
 */
export async function checkGradingStatus(taskId: string) {
  const response = await fetch(`${API_BASE}/grade-bulletproof-status?jobId=${taskId}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<{
    ok: boolean;
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    updatedAt: string;
    completedAt?: string;
    result?: {
      submission_id: string;
      ai_grade: number;
      annotation_stats: { saved: number; unresolved: number };
      computed_scores: any;
    };
    error?: string;
  }>(response);
}

/**
 * Grade a submission using background processing with polling
 * This replaces the old synchronous gradeSubmission
 */
export async function gradeSubmission(data: GradeRequest): Promise<Feedback> {
  // Start the background job
  const { task_id } = await startGradingJob(data);

  // Poll for completion
  const maxAttempts = 60; // 60 attempts = 2 minutes max
  const pollInterval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const status = await checkGradingStatus(task_id);

    if (status.status === 'completed') {
      // Fetch the updated submission to get the full feedback
      const submission = await getSubmission(data.submission_id);
      if (!submission.ai_feedback) {
        throw new Error('Grading completed but no feedback found');
      }
      return submission.ai_feedback;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Grading failed');
    }

    // Continue polling if status is 'pending' or 'processing'
  }

  throw new Error('Grading timeout - job is still processing');
}

export async function saveTeacherEdits(data: SaveEditsRequest) {
  const response = await fetch(`${API_BASE}/save-teacher-edits`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function listSubmissions(params: ListRequest) {
  const queryParams = new URLSearchParams();
  if (params.assignment_id) queryParams.set('assignment_id', params.assignment_id);
  if (params.student_id) queryParams.set('student_id', params.student_id);
  if (params.search) queryParams.set('search', params.search);
  if (params.class_period) queryParams.set('class_period', params.class_period);
  queryParams.set('page', params.page?.toString() || '1');
  queryParams.set('limit', params.limit?.toString() || '20');

  const response = await fetch(`${API_BASE}/list?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<{
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
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(response);
}

export async function getSubmission(id: string) {
  const response = await fetch(`${API_BASE}/get-submission?id=${id}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<{
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
  }>(response);
}

export async function listAssignments() {
  const response = await fetch(`${API_BASE}/assignments`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<{
    assignments: Array<{
      id: string;
      title: string;
      description?: string;
      assignment_prompt?: string;
      grading_criteria?: string;
      total_points?: number;
      created_at: string;
    }>;
  }>(response);
}

export async function createAssignment(data: {
  title: string; description?: string; assignment_prompt?: string;
  grading_criteria?: string; total_points?: number; document_type?: string
}) {
  const response = await fetch(`${API_BASE}/assignments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<{
    assignment: {
      id: string;
      title: string;
      description?: string;
      grading_criteria?: string;
      total_points?: number;
      created_at: string;
    };
    parseWarning?: string | null;
  }>(response);
}

export async function updateAssignment(
  assignmentId: string,
  data: {
    title: string;
    description?: string;
    assignment_prompt?: string;
    grading_criteria?: string;
    total_points?: number;
    document_type?: string;
  }
) {
  const response = await fetch(`${API_BASE}/assignments`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ assignment_id: assignmentId, ...data }),
  });

  return handleResponse<{
    assignment: {
      id: string;
      title: string;
      description?: string;
      grading_criteria?: string;
      total_points?: number;
      created_at: string;
    };
    parseWarning?: string | null;
  }>(response);
}

export async function deleteSubmission(submissionId: string) {
  const response = await fetch(`${API_BASE}/delete-submission`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ submission_id: submissionId }),
  });

  return handleResponse(response);
}

export async function uploadFile(
  submissionId: string,
  fileData: string,
  extension: string
): Promise<string> {
  const response = await fetch(`${API_BASE}/upload-file`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      file_data: fileData,
      submission_id: submissionId,
      file_extension: extension,
    }),
  });

  const data = await handleResponse<{ file_url: string }>(response);
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
    `${API_BASE}/annotations-get?submission_id=${submissionId}&page_number=${pageNumber}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return handleResponse<AnnotationPageData>(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ submission_id: submissionId, pages }),
  });

  return handleResponse<{ download_url: string; file_size: number; pages_annotated: number }>(response);
}

/**
 * Convert DOCX to PDF (when implemented)
 */
export async function convertDocxToPdf(
  submissionId: string
): Promise<{ pdf_url: string; page_count: number }> {
  const response = await fetch(`${API_BASE}/convert-docx-to-pdf`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ submission_id: submissionId }),
  });

  return handleResponse<{ pdf_url: string; page_count: number }>(response);
}

// ============================================================================
// Inline Annotations API
// ============================================================================

/**
 * Get inline text annotations for a submission
 */
export async function getInlineAnnotations(submissionId: string) {
  const response = await fetch(
    `${API_BASE}/annotations-inline-get?submission_id=${submissionId}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  return handleResponse<{
    submission_id: string;
    annotations: any[];
    count: number;
  }>(response);
}

/**
 * Update an inline annotation
 */
export async function updateInlineAnnotation(
  annotationId: string,
  updates: Record<string, any>
) {
  const response = await fetch(`${API_BASE}/annotations-inline-update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ annotation_id: annotationId, updates }),
  });

  return handleResponse<{ success: boolean }>(response);
}

// ============================================================================
// Student Management API
// ============================================================================

/**
 * Update student non-PII fields (e.g., class_period)
 */
export async function updateStudent(
  studentId: string,
  data: { class_period?: string | null }
) {
  const response = await fetch(`${API_BASE}/update-student`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ student_id: studentId, ...data }),
  });

  return handleResponse<{
    success: boolean;
    student: {
      student_id: string;
      class_period: string | null;
      created_at: string;
    };
  }>(response);
}

/**
 * Transcribe handwriting from an image using Multimodal LLM
 */
export async function transcribeImage(data: { image: string; provider?: 'gemini' | 'openai' }) {
  const response = await fetch(`${API_BASE}/transcribe-image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<{ text: string }>(response);
}

/**
 * Extract rubric criteria from a document (PDF/DOCX) using Gemini
 */
export async function extractRubricFromDocument(
  file: File,
  totalPoints: number,
  geminiModel: string,
  extractionPrompt?: string
): Promise<{
  success: boolean;
  rubricText: string;
  totalPoints: number;
  warning?: string;
  error?: string;
  raw?: any;
}> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });

  const response = await fetch(`${API_BASE}/extract-rubric-from-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      file: base64,
      fileName: file.name,
      fileType: file.type,
      totalPoints,
      geminiModel,
      extractionPrompt
    }),
  });

  return handleResponse<{
    success: boolean;
    rubricText: string;
    totalPoints: number;
    warning?: string;
    error?: string;
    raw?: any;
  }>(response);
}

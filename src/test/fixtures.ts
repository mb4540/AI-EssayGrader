// Test Fixtures
// Shared mock data for tests

export const mockStudent = {
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  created_at: new Date('2024-01-01').toISOString(),
};

export const mockTenant = {
  tenant_id: '323e4567-e89b-12d3-a456-426614174002',
  tenant_name: 'Test School District',
  is_active: true,
  created_at: new Date('2024-01-01').toISOString(),
};

export const mockUser = {
  user_id: '423e4567-e89b-12d3-a456-426614174003',
  tenant_id: mockTenant.tenant_id,
  email: 'teacher@example.com',
  full_name: 'Test Teacher',
  role: 'teacher' as const,
  is_active: true,
  email_verified: true,
  last_login_at: new Date('2024-01-15').toISOString(),
  created_at: new Date('2024-01-01').toISOString(),
};

export const mockAssignment = {
  assignment_id: '523e4567-e89b-12d3-a456-426614174004',
  tenant_id: mockTenant.tenant_id,
  title: 'Essay on Literature',
  description: 'Write an essay about your favorite book',
  grading_criteria: 'Grammar, structure, and content quality',
  document_type: 'argumentative',
  rubric_json: {
    criteria: [
      { name: 'Grammar', weight: 0.3, levels: [] },
      { name: 'Structure', weight: 0.3, levels: [] },
      { name: 'Content', weight: 0.4, levels: [] },
    ],
  },
  scale_mode: 'percent',
  created_at: new Date('2024-01-01').toISOString(),
};

export const mockSubmission = {
  submission_id: '223e4567-e89b-12d3-a456-426614174001',
  student_id: mockStudent.student_id,
  assignment_id: mockAssignment.assignment_id,
  tenant_id: mockTenant.tenant_id,
  verbatim_text: 'This is a test essay about literature and writing. It contains multiple sentences to demonstrate the annotation system.',
  teacher_criteria: 'Grade based on grammar, structure, and content.',
  source_type: 'text',
  ai_grade: 85,
  teacher_grade: null,
  teacher_comments: null,
  ai_feedback: {
    bulletproof: {
      extracted_scores: {
        scores: {
          grammar: 90,
          structure: 85,
          content: 80,
        },
        feedback: {
          strengths: ['Clear writing', 'Good structure'],
          improvements: ['Add more examples', 'Expand conclusion'],
        },
      },
    },
  },
  created_at: new Date('2024-01-15').toISOString(),
  updated_at: new Date('2024-01-15').toISOString(),
};

export const mockAnnotation = {
  annotation_id: '623e4567-e89b-12d3-a456-426614174005',
  submission_id: mockSubmission.submission_id,
  line_number: 1,
  start_offset: 0,
  end_offset: 10,
  quote: 'This is a',
  category: 'grammar',
  suggestion: 'Consider revising this sentence for clarity.',
  severity: 'low',
  status: 'ai_suggested',
  created_by: null,
  created_at: new Date('2024-01-15').toISOString(),
  updated_at: new Date('2024-01-15').toISOString(),
  ai_payload: {
    confidence: 0.85,
    model: 'gpt-4',
  },
};

export const mockPasswordResetToken = {
  reset_token_id: '723e4567-e89b-12d3-a456-426614174006',
  user_id: mockUser.user_id,
  token_hash: 'hashed_token_value',
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
  used_at: null,
  created_at: new Date().toISOString(),
};

export const mockPasswordResetAudit = {
  audit_id: '823e4567-e89b-12d3-a456-426614174007',
  user_id: mockUser.user_id,
  action: 'reset_requested',
  email: mockUser.email,
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  error_message: null,
  created_at: new Date().toISOString(),
};

// Collection fixtures
export const mockSubmissions = [
  mockSubmission,
  {
    ...mockSubmission,
    submission_id: '923e4567-e89b-12d3-a456-426614174008',
    verbatim_text: 'Second test essay with different content.',
    ai_grade: 92,
  },
  {
    ...mockSubmission,
    submission_id: 'a23e4567-e89b-12d3-a456-426614174009',
    verbatim_text: 'Third test essay for testing list views.',
    ai_grade: 78,
    teacher_grade: 82,
    teacher_comments: 'Good effort, needs improvement',
  },
];

export const mockAnnotations = [
  mockAnnotation,
  {
    ...mockAnnotation,
    annotation_id: 'b23e4567-e89b-12d3-a456-426614174010',
    line_number: 2,
    start_offset: 0,
    end_offset: 15,
    quote: 'It contains',
    category: 'style',
    suggestion: 'Vary sentence structure.',
    status: 'teacher_approved',
  },
  {
    ...mockAnnotation,
    annotation_id: 'c23e4567-e89b-12d3-a456-426614174011',
    line_number: 2,
    start_offset: 20,
    end_offset: 30,
    quote: 'multiple',
    category: 'word_choice',
    suggestion: 'Consider using "numerous" for variety.',
    status: 'teacher_rejected',
  },
];

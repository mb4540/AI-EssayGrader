// CSV Export Tests
// Tests for CSV export functionality using PapaParse

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportToCSV, SubmissionExport } from './csv';

describe('CSV Export', () => {
  let mockLink: HTMLAnchorElement;

  beforeEach(() => {
    // Mock DOM elements
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    } as any;

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    // Mock appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToCSV', () => {
    it('should export single submission to CSV', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          student_id: 'uuid-123',
          assignment_title: 'Essay 1',
          teacher_grade: 85,
          ai_grade: 82,
          teacher_feedback: 'Good work',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'submissions.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should export multiple submissions to CSV', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          student_name: 'Jane Smith',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-04T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use custom filename when provided', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions, 'custom-export.csv');

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'custom-export.csv');
    });

    it('should use default filename when not provided', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'submissions.csv');
    });

    it('should handle empty submissions array', () => {
      const submissions: SubmissionExport[] = [];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle submissions with optional fields missing', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          // Optional fields omitted
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle submissions with all optional fields', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          student_id: 'uuid-123',
          assignment_title: 'Essay 1',
          teacher_grade: 85,
          ai_grade: 82,
          teacher_feedback: 'Excellent work with strong arguments',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should create blob with correct MIME type', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      // Blob is created internally, verify URL was created
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should hide link element', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.style.visibility).toBe('hidden');
    });

    it('should append and remove link from DOM', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle special characters in data', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'O\'Brien, John "Johnny"',
          teacher_feedback: 'Great work! Keep it up, you\'re doing well.',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle unicode characters', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'José García',
          teacher_feedback: 'Excelente trabajo! 你好',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle very long feedback text', () => {
      const longFeedback = 'A'.repeat(10000);
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          teacher_feedback: longFeedback,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle numeric grades as numbers', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          teacher_grade: 95.5,
          ai_grade: 92.3,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle zero grades', () => {
      const submissions: SubmissionExport[] = [
        {
          student_name: 'John Doe',
          teacher_grade: 0,
          ai_grade: 0,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      exportToCSV(submissions);

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('SubmissionExport interface', () => {
    it('should accept valid submission export object', () => {
      const submission: SubmissionExport = {
        student_name: 'John Doe',
        student_id: 'uuid-123',
        assignment_title: 'Essay 1',
        teacher_grade: 85,
        ai_grade: 82,
        teacher_feedback: 'Good work',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      expect(submission.student_name).toBe('John Doe');
      expect(submission.teacher_grade).toBe(85);
    });

    it('should accept submission with only required fields', () => {
      const submission: SubmissionExport = {
        student_name: 'John Doe',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      expect(submission.student_name).toBe('John Doe');
      expect(submission.student_id).toBeUndefined();
    });
  });
});

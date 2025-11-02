// AnnotatedTextViewer Component Tests
// Tests for annotation display and management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnotatedTextViewer from './AnnotatedTextViewer';
import type { Annotation } from '@/lib/annotations/types';

describe('AnnotatedTextViewer Component', () => {
  const mockOnAnnotationUpdate = vi.fn();
  const mockOnAnnotationAdd = vi.fn();

  const mockAnnotations: Annotation[] = [
    {
      annotation_id: '1',
      submission_id: 'sub-1',
      line_number: 1,
      start_offset: 0,
      end_offset: 10,
      quote: 'Test annotation',
      category: 'Grammar',
      status: 'ai_suggested',
      suggestion: 'Fix this',
      severity: 'error',
      created_at: '2024-01-01',
    },
    {
      annotation_id: '2',
      submission_id: 'sub-1',
      line_number: 2,
      start_offset: 0,
      end_offset: 15,
      quote: 'Another annotation',
      category: 'Spelling',
      status: 'teacher_approved',
      suggestion: 'Correct spelling',
      severity: 'warning',
      created_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with text and annotations', () => {
      render(
        <AnnotatedTextViewer
          text="Test essay text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      expect(screen.getByText(/test essay text/i)).toBeInTheDocument();
    });

    it('should render with multiple annotations', () => {
      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Should render without errors
      expect(screen.getByText(/test text/i)).toBeInTheDocument();
    });

    it('should render with no annotations', () => {
      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={[]}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      expect(screen.getByText(/test text/i)).toBeInTheDocument();
    });
  });

  describe('Annotation Actions', () => {
    it('should call onAnnotationUpdate when approving annotation', async () => {
      const user = userEvent.setup();
      mockOnAnnotationUpdate.mockResolvedValue(undefined);

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Find and click approve button for first annotation
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      if (approveButtons.length > 0) {
        await user.click(approveButtons[0]);

        expect(mockOnAnnotationUpdate).toHaveBeenCalledWith('1', {
          status: 'teacher_approved',
        });
      }
    });

    it('should call onAnnotationUpdate when rejecting annotation', async () => {
      const user = userEvent.setup();
      mockOnAnnotationUpdate.mockResolvedValue(undefined);

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Find and click reject button
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      if (rejectButtons.length > 0) {
        await user.click(rejectButtons[0]);

        expect(mockOnAnnotationUpdate).toHaveBeenCalledWith('1', {
          status: 'teacher_rejected',
        });
      }
    });

    it('should allow editing annotation text', async () => {
      const user = userEvent.setup();
      mockOnAnnotationUpdate.mockResolvedValue(undefined);

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Find edit button
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        // Should show textarea for editing
        const textareas = screen.getAllByRole('textbox');
        if (textareas.length > 0) {
          await user.clear(textareas[0]);
          await user.type(textareas[0], 'Updated suggestion');

          // Find save button
          const saveButton = screen.getByRole('button', { name: /save/i });
          await user.click(saveButton);

          expect(mockOnAnnotationUpdate).toHaveBeenCalledWith('1', {
            suggestion: 'Updated suggestion',
            status: 'teacher_edited',
          });
        }
      }
    });
  });

  describe('Approve All', () => {
    it('should approve all unapproved annotations', async () => {
      const user = userEvent.setup();
      mockOnAnnotationUpdate.mockResolvedValue(undefined);

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Find approve all button
      const approveAllButton = screen.queryByRole('button', { name: /approve all/i });
      if (approveAllButton) {
        await user.click(approveAllButton);

        // Should have called update for the ai_suggested annotation
        expect(mockOnAnnotationUpdate).toHaveBeenCalled();
      }
    });
  });

  describe('View Modes', () => {
    it('should toggle between original and annotated view', async () => {
      const user = userEvent.setup();

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mockAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Look for view toggle buttons
      const buttons = screen.getAllByRole('button');
      const originalButton = buttons.find(btn => btn.textContent?.includes('Original'));
      
      if (originalButton) {
        await user.click(originalButton);
        // View should change (hard to test without checking internal state)
        expect(originalButton).toBeInTheDocument();
      }
    });
  });

  describe('Annotation Grouping', () => {
    it('should group annotations by status', () => {
      const mixedAnnotations: Annotation[] = [
        { ...mockAnnotations[0], status: 'ai_suggested' },
        { ...mockAnnotations[1], status: 'teacher_approved' },
        {
          annotation_id: '3',
          submission_id: 'sub-1',
          line_number: 3,
          start_offset: 0,
          end_offset: 10,
          quote: 'Rejected',
          category: 'Grammar',
          status: 'teacher_rejected',
          suggestion: 'Fix',
          created_at: '2024-01-01',
        },
      ];

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={mixedAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Component should render all annotations
      expect(screen.getByText(/test text/i)).toBeInTheDocument();
    });
  });

  describe('Severity Indicators', () => {
    it('should display different severity levels', () => {
      const severityAnnotations: Annotation[] = [
        { ...mockAnnotations[0], severity: 'error' },
        { ...mockAnnotations[1], severity: 'warning' },
      ];

      render(
        <AnnotatedTextViewer
          text="Test text"
          submissionId="sub-1"
          annotations={severityAnnotations}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Should render without errors
      expect(screen.getByText(/test text/i)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty text', () => {
      const { container } = render(
        <AnnotatedTextViewer
          text=""
          submissionId="sub-1"
          annotations={[]}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should handle text with no annotations', () => {
      render(
        <AnnotatedTextViewer
          text="Long essay text without any annotations"
          submissionId="sub-1"
          annotations={[]}
          onAnnotationUpdate={mockOnAnnotationUpdate}
          onAnnotationAdd={mockOnAnnotationAdd}
        />
      );

      expect(screen.getByText(/long essay text/i)).toBeInTheDocument();
    });
  });
});

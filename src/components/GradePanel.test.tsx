// GradePanel Component Tests
// Tests for grading UI with AI feedback and teacher overrides

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradePanel from './GradePanel';
import type { Feedback } from '@/lib/schema';

describe('GradePanel Component', () => {
  const mockOnRunGrade = vi.fn();
  const mockOnSaveEdits = vi.fn();
  const mockSetTeacherGrade = vi.fn();
  const mockSetTeacherFeedback = vi.fn();

  const mockFeedback: Feedback = {
    overall_grade: 85,
    supportive_summary: 'Great work!',
    top_3_suggestions: ['Add more examples', 'Improve transitions'],
    grammar_findings: ['Missing comma'],
    spelling_findings: [],
    structure_findings: ['Good organization'],
    evidence_findings: ['Strong evidence'],
    rubric_scores: [
      { category: 'Content', score: 85, comments: 'Good' },
    ],
    improvement_summary: 'Keep improving',
    growth_percentage: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render grade panel with title', () => {
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByText(/grade & feedback/i)).toBeInTheDocument();
    });

    it('should render Run Grade button', () => {
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByRole('button', { name: /run grade/i })).toBeInTheDocument();
    });
  });

  describe('AI Feedback Display', () => {
    it('should display AI feedback when available', () => {
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText(/great work/i)).toBeInTheDocument();
    });

    it('should not display AI feedback when null', () => {
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.queryByText('85')).not.toBeInTheDocument();
    });
  });

  describe('Grading Button States', () => {
    it('should disable Run Grade button when canGrade is false', () => {
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={false}
          isSaving={false}
        />
      );

      const button = screen.getByRole('button', { name: /run grade/i });
      expect(button).toBeDisabled();
    });

    it('should show loading state when grading', () => {
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={true}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByText(/grading\.\.\./i)).toBeInTheDocument();
    });

    it('should call onRunGrade when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <GradePanel
          aiFeedback={null}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      const button = screen.getByRole('button', { name: /run grade/i });
      await user.click(button);

      expect(mockOnRunGrade).toHaveBeenCalled();
    });
  });

  describe('Teacher Override', () => {
    it('should render teacher feedback textarea', () => {
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByLabelText(/teacher comments/i)).toBeInTheDocument();
    });

    it('should call setTeacherFeedback when feedback changes', async () => {
      const user = userEvent.setup();
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      const textarea = screen.getByLabelText(/teacher comments/i);
      await user.type(textarea, 'Great job!');

      expect(mockSetTeacherFeedback).toHaveBeenCalled();
    });
  });

  describe('Save Button', () => {
    it('should render Save Final Grade button', () => {
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={90}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      expect(screen.getByRole('button', { name: /save final grade/i })).toBeInTheDocument();
    });

    it('should show saving state', () => {
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={90}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={true}
        />
      );

      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
    });

    it('should call onSaveEdits when save button clicked', async () => {
      const user = userEvent.setup();
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={90}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback="Good work"
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      const button = screen.getByRole('button', { name: /save final grade/i });
      await user.click(button);

      expect(mockOnSaveEdits).toHaveBeenCalled();
    });

    it('should disable save button when no grade or feedback', () => {
      render(
        <GradePanel
          aiFeedback={mockFeedback}
          isGrading={false}
          teacherGrade={undefined}
          setTeacherGrade={mockSetTeacherGrade}
          teacherFeedback=""
          setTeacherFeedback={mockSetTeacherFeedback}
          onRunGrade={mockOnRunGrade}
          onSaveEdits={mockOnSaveEdits}
          canGrade={true}
          isSaving={false}
        />
      );

      const button = screen.getByRole('button', { name: /save final grade/i });
      expect(button).toBeDisabled();
    });
  });
});

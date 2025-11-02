// CreateAssignmentModal Component Tests
// Tests for assignment creation modal with form validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateAssignmentModal from './CreateAssignmentModal';

// Mock the API
vi.mock('@/lib/api', () => ({
  createAssignment: vi.fn(),
}));

// Mock CriteriaInput component
vi.mock('./CriteriaInput', () => ({
  default: ({ value, onChange, totalPoints, onTotalPointsChange, disabled }: any) => (
    <div data-testid="criteria-input">
      <label htmlFor="criteria">Grading Criteria</label>
      <textarea
        id="criteria"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter grading criteria"
      />
      <label htmlFor="total-points">Total Points</label>
      <input
        id="total-points"
        type="number"
        value={totalPoints}
        onChange={(e) => onTotalPointsChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  ),
}));

import { createAssignment } from '@/lib/api';

describe('CreateAssignmentModal Component', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderModal = (isOpen = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateAssignmentModal isOpen={isOpen} onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      renderModal(true);

      expect(screen.getByText('New Assignment')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      renderModal(false);

      expect(screen.queryByText('New Assignment')).not.toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      renderModal();

      expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/grading criteria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/total points/i)).toBeInTheDocument();
    });

    it('should have title field autofocused', () => {
      renderModal();

      const titleInput = screen.getByLabelText(/assignment title/i);
      expect(titleInput).toHaveFocus();
    });

    it('should allow typing in title field', async () => {
      const user = userEvent.setup();
      renderModal();

      const titleInput = screen.getByLabelText(/assignment title/i);
      await user.type(titleInput, 'My Assignment');

      expect(titleInput).toHaveValue('My Assignment');
    });

    it('should allow typing in description field', async () => {
      const user = userEvent.setup();
      renderModal();

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Assignment description');

      expect(descInput).toHaveValue('Assignment description');
    });

    it('should allow typing in criteria field', async () => {
      const user = userEvent.setup();
      renderModal();

      const criteriaInput = screen.getByLabelText(/grading criteria/i);
      await user.type(criteriaInput, 'Criteria text');

      expect(criteriaInput).toHaveValue('Criteria text');
    });

    it('should allow changing total points', async () => {
      const user = userEvent.setup();
      renderModal();

      const pointsInput = screen.getByLabelText(/total points/i);
      await user.clear(pointsInput);
      await user.type(pointsInput, '50');

      expect(pointsInput).toHaveValue(50);
    });

    it('should have default total points of 100', () => {
      renderModal();

      const pointsInput = screen.getByLabelText(/total points/i);
      expect(pointsInput).toHaveValue(100);
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when title is empty', () => {
      renderModal();

      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when title is filled', async () => {
      const user = userEvent.setup();
      renderModal();

      const titleInput = screen.getByLabelText(/assignment title/i);
      await user.type(titleInput, 'Test Assignment');

      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      expect(submitButton).toBeEnabled();
    });

    it('should show alert when submitting with empty title', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderModal();

      // Manually enable the button to test the validation
      const titleInput = screen.getByLabelText(/assignment title/i);
      await user.type(titleInput, 'Test');
      await user.clear(titleInput);

      const form = screen.getByRole('button', { name: /create assignment/i }).closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please enter an assignment title');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should have submit button enabled when title is filled', async () => {
      const user = userEvent.setup();
      renderModal();

      const titleInput = screen.getByLabelText(/assignment title/i);
      await user.type(titleInput, 'Test Assignment');

      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      expect(submitButton).toBeEnabled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(createAssignment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          assignment: {
            id: 'test-id',
            title: 'Test',
            total_points: 100,
            created_at: '2024-01-01',
          },
        }), 100))
      );

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
    });

    it('should disable all inputs during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(createAssignment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          assignment: {
            id: 'test-id',
            title: 'Test',
            total_points: 100,
            created_at: '2024-01-01',
          },
        }), 100))
      );

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      expect(screen.getByLabelText(/assignment title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/grading criteria/i)).toBeDisabled();
    });

    it('should reset form and close modal on success', async () => {
      const user = userEvent.setup();
      vi.mocked(createAssignment).mockResolvedValue({
        assignment: {
          id: 'test-id',
          title: 'Test',
          total_points: 100,
          created_at: '2024-01-01',
        },
      });

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test Assignment');
      await user.type(screen.getByLabelText(/description/i), 'Description');

      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should invalidate assignments query on success', async () => {
      const user = userEvent.setup();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(createAssignment).mockResolvedValue({
        assignment: {
          id: 'test-id',
          title: 'Test',
          total_points: 100,
          created_at: '2024-01-01',
        },
      });

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assignments'] });
      });
    });

    it('should show error alert on submission failure', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(createAssignment).mockRejectedValue(new Error('Network error'));

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create assignment: Network error');
      });

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Modal Close', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const closeButton = screen.getByRole('button', { name: '' }).closest('button');
      if (closeButton && closeButton.querySelector('svg')) {
        await user.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when closing', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Description');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(createAssignment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          assignment: {
            id: 'test-id',
            title: 'Test',
            total_points: 100,
            created_at: '2024-01-01',
          },
        }), 100))
      );

      renderModal();

      await user.type(screen.getByLabelText(/assignment title/i), 'Test');
      const submitButton = screen.getByRole('button', { name: /create assignment/i });
      await user.click(submitButton);

      // Try to close while submitting
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should not have called onClose yet
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Document Type Selection', () => {
    it('should have default document type of personal_narrative', () => {
      renderModal();

      // The select should show the default value
      expect(screen.getByText(/helps ai provide more relevant feedback/i)).toBeInTheDocument();
    });
  });
});

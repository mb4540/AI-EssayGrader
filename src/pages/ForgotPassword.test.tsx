// ForgotPassword Page Tests
// Tests for password reset request form

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

// Mock fetch
global.fetch = vi.fn();

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForgotPassword = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render password reset form', () => {
      renderForgotPassword();

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      renderForgotPassword();

      const loginLink = screen.getByText(/back to login/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should display security notice', () => {
      renderForgotPassword();

      expect(screen.getByText(/for security reasons/i)).toBeInTheDocument();
      expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument();
    });

    it('should have instructions text', () => {
      renderForgotPassword();

      expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required email field', () => {
      renderForgotPassword();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      renderForgotPassword();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Form Submission - Success', () => {
    it('should send reset request with email', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, message: 'Reset link sent' }),
      } as Response);

      renderForgotPassword();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'teacher@school.edu');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth-send-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'teacher@school.edu' }),
        });
      });
    });

    it('should display success message on successful request', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, message: 'Reset link sent to your email' }),
      } as Response);

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/reset link sent to your email/i)).toBeInTheDocument();
      });
    });

    it('should display default success message if none provided', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/if an account with that email exists/i)).toBeInTheDocument();
      });
    });

    it('should clear email field on success', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      renderForgotPassword();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(emailInput).toHaveValue('');
      });
    });
  });

  describe('Form Submission - Error', () => {
    it('should display error message on failed request', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false }),
      } as Response);

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });

    it('should display network error message on fetch failure', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not clear email field on error', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      renderForgotPassword();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Loading State', () => {
    it('should show loading text when submitting', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ ok: true }),
        } as Response), 100))
      );

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();
    });

    it('should disable submit button when loading', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ ok: true }),
        } as Response), 100))
      );

      renderForgotPassword();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /sending/i });
      expect(loadingButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for email field', () => {
      renderForgotPassword();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('should have autocomplete attribute', () => {
      renderForgotPassword();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
    });

    it('should have placeholder text', () => {
      renderForgotPassword();

      expect(screen.getByPlaceholderText('teacher@school.edu')).toBeInTheDocument();
    });
  });
});

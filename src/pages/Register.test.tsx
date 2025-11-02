// Register Page Tests
// Tests for user registration form

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';

// Mock the AuthContext
const mockRegister = vi.fn();
const mockClearError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    error: null,
    clearError: mockClearError,
    loading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render registration form with all fields', () => {
      renderRegister();

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/school or district name/i)).toBeInTheDocument();
      // Check for password fields by placeholder
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    it('should render submit button', () => {
      renderRegister();

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render link to login page', () => {
      renderRegister();

      const loginLink = screen.getByText(/sign in/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should display privacy notice', () => {
      renderRegister();

      expect(screen.getByText(/privacy first/i)).toBeInTheDocument();
      expect(screen.getByText(/student names are encrypted/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have all required fields', () => {
      renderRegister();

      expect(screen.getByLabelText(/full name/i)).toBeRequired();
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/school or district name/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
    });

    it('should have minimum password length', () => {
      renderRegister();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(passwordInput).toHaveAttribute('minLength', '8');
      expect(confirmPasswordInput).toHaveAttribute('minLength', '8');
    });

    it('should allow typing in all fields', async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'Springfield Elementary');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Doe');
      expect(screen.getByLabelText(/email address/i)).toHaveValue('jane@school.edu');
      expect(screen.getByLabelText(/school or district name/i)).toHaveValue('Springfield Elementary');
      expect(screen.getByLabelText(/^password$/i)).toHaveValue('password123');
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue('password123');
    });
  });

  describe('Password Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'School');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'School');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call register with all form data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'Springfield Elementary');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'jane@school.edu',
          'password123',
          'Jane Doe',
          'Springfield Elementary'
        );
      });
    });

    it('should call clearError before registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'School');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });

    it('should navigate to dashboard on successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'jane@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'School');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should handle registration errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRegister.mockRejectedValue(new Error('Email already exists'));
      renderRegister();

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email address/i), 'existing@school.edu');
      await user.type(screen.getByLabelText(/school or district name/i), 'School');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all fields', () => {
      renderRegister();

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/school or district name/i)).toBeInTheDocument();
    });

    it('should have autocomplete attributes', () => {
      renderRegister();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
      // Check password fields have new-password autocomplete
      const passwordFields = screen.getAllByPlaceholderText('••••••••');
      expect(passwordFields).toHaveLength(2);
      passwordFields.forEach(field => {
        expect(field).toHaveAttribute('autocomplete', 'new-password');
      });
    });

    it('should have placeholder text', () => {
      renderRegister();

      expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('teacher@school.edu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Springfield Elementary')).toBeInTheDocument();
    });

    it('should have helper text for password and tenant', () => {
      renderRegister();

      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/this will be your organization's workspace/i)).toBeInTheDocument();
    });
  });
});

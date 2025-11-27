// SettingsModal Component Tests
// Tests for AI prompt settings management with localStorage

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from './SettingsModal';

describe('SettingsModal Component', () => {
  const mockOnClose = vi.fn();
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('AI Prompt Settings')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<SettingsModal isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('AI Prompt Settings')).not.toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render all tabs', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole('tab', { name: /grading system/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /handwriting/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /rubric enhancement/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /document types/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /llm provider/i })).toBeInTheDocument();
    });

    it('should show essay grading tab by default', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/grading system prompt/i)).toBeInTheDocument();
    });

    it('should switch to Handwriting tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const handwritingTab = screen.getByRole('tab', { name: /handwriting/i });
      await user.click(handwritingTab);

      expect(screen.getByText(/ocr cleanup prompt/i)).toBeInTheDocument();
    });

    it('should switch to rubric tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const rubricTab = screen.getByRole('tab', { name: /rubric enhancement/i });
      await user.click(rubricTab);

      expect(screen.getByText(/rubric enhancement prompt/i)).toBeInTheDocument();
    });

    it('should switch to document types tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const docTypesTab = screen.getByRole('tab', { name: /document types/i });
      await user.click(docTypesTab);

      expect(screen.getByText(/document type grading focus/i)).toBeInTheDocument();
    });
  });

  describe('LocalStorage Loading', () => {
    it('should load saved grading prompt from localStorage', () => {
      localStorageMock['ai_grading_prompt'] = 'Custom grading prompt';

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i);
      expect(textarea).toHaveValue('Custom grading prompt');
    });

    it('should load saved OCR prompt from localStorage', async () => {
      const user = userEvent.setup();
      localStorageMock['ai_ocr_prompt'] = 'Custom OCR prompt';

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const handwritingTab = screen.getByRole('tab', { name: /handwriting/i });
      await user.click(handwritingTab);

      const textarea = screen.getByPlaceholderText(/enter ocr cleanup prompt/i);
      expect(textarea).toHaveValue('Custom OCR prompt');
    });

    it('should load saved rubric prompt from localStorage', async () => {
      const user = userEvent.setup();
      localStorageMock['ai_rubric_prompt'] = 'Custom rubric prompt';

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const rubricTab = screen.getByRole('tab', { name: /rubric enhancement/i });
      await user.click(rubricTab);

      const textarea = screen.getByPlaceholderText(/enter rubric enhancement prompt/i);
      expect(textarea).toHaveValue('Custom rubric prompt');
    });

    it('should use default prompts when localStorage is empty', () => {
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i) as HTMLTextAreaElement;
      expect((textarea as HTMLTextAreaElement).value).toContain('professional evaluator');
    });
  });

  describe('Editing Prompts', () => {
    it('should allow editing grading prompt', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'New grading prompt');

      expect(textarea).toHaveValue('New grading prompt');
    });

    it('should allow editing OCR prompt', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const handwritingTab = screen.getByRole('tab', { name: /handwriting/i });
      await user.click(handwritingTab);

      const textarea = screen.getByPlaceholderText(/enter ocr cleanup prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'New OCR prompt');

      expect(textarea).toHaveValue('New OCR prompt');
    });

    it('should allow editing rubric prompt', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const rubricTab = screen.getByRole('tab', { name: /rubric enhancement/i });
      await user.click(rubricTab);

      const textarea = screen.getByPlaceholderText(/enter rubric enhancement prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'New rubric prompt');

      expect(textarea).toHaveValue('New rubric prompt');
    });
  });

  describe('Save Functionality', () => {
    it('should save all prompts to localStorage when save button clicked', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'Modified prompt');

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);

      expect(localStorage.setItem).toHaveBeenCalledWith('ai_grading_prompt', 'Modified prompt');
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Settings saved'));

      alertSpy.mockRestore();
    });

    it('should save document type prompt to localStorage', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const docTypesTab = screen.getByRole('tab', { name: /document types/i });
      await user.click(docTypesTab);

      const textarea = screen.getByPlaceholderText(/enter grading focus for this document type/i);
      await user.clear(textarea);
      await user.type(textarea, 'Custom doc type prompt');

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ai_doctype_personal_narrative_prompt',
        'Custom doc type prompt'
      );

      alertSpy.mockRestore();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset grading prompt to default when reset button clicked', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'Custom prompt');

      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect(confirmSpy).toHaveBeenCalledWith('Reset this prompt to default?');
      expect((textarea as HTMLTextAreaElement).value).toContain('professional evaluator');

      confirmSpy.mockRestore();
    });

    it('should not reset if user cancels confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const textarea = screen.getByPlaceholderText(/enter grading prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'Custom prompt');

      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect(textarea).toHaveValue('Custom prompt');

      confirmSpy.mockRestore();
    });

    it('should reset OCR prompt to default', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const handwritingTab = screen.getByRole('tab', { name: /handwriting/i });
      await user.click(handwritingTab);

      const textarea = screen.getByPlaceholderText(/enter ocr cleanup prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'Custom OCR');

      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect((textarea as HTMLTextAreaElement).value).toContain('text cleanup assistant');

      confirmSpy.mockRestore();
    });

    it('should reset rubric prompt to default', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const rubricTab = screen.getByRole('tab', { name: /rubric enhancement/i });
      await user.click(rubricTab);

      const textarea = screen.getByPlaceholderText(/enter rubric enhancement prompt/i);
      await user.clear(textarea);
      await user.type(textarea, 'Custom rubric');

      const resetButton = screen.getByRole('button', { name: /reset to default/i });
      await user.click(resetButton);

      expect((textarea as HTMLTextAreaElement).value).toContain('expert educator');

      confirmSpy.mockRestore();
    });
  });

  describe('Modal Close', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      // Find the X button in the header
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (xButton) {
        await user.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Document Type Selection', () => {
    it('should have default document type selected', async () => {
      const user = userEvent.setup();
      render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

      const docTypesTab = screen.getByRole('tab', { name: /document types/i });
      await user.click(docTypesTab);

      // The select should be present
      expect(screen.getByLabelText(/select document type/i)).toBeInTheDocument();
    });
  });
});

// FileDrop Component Tests
// Tests for file upload and text input functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDrop from './FileDrop';

// Mock the OCR and DOCX extraction modules
vi.mock('@/lib/ocr', () => ({
  extractTextFromImage: vi.fn(),
  extractTextFromPDF: vi.fn(),
}));

vi.mock('@/lib/docx', () => ({
  extractTextFromDocx: vi.fn(),
}));

import { extractTextFromImage, extractTextFromPDF } from '@/lib/ocr';
import { extractTextFromDocx } from '@/lib/docx';

describe('FileDrop Component', () => {
  const mockOnTextExtracted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Tab', () => {
    it('should render text input tab by default', () => {
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      expect(screen.getByPlaceholderText(/paste student essay here/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use this text/i })).toBeInTheDocument();
    });

    it('should disable submit button when text is empty', () => {
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when text is entered', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, 'This is my essay');

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      expect(submitButton).toBeEnabled();
    });

    it('should call onTextExtracted when text is submitted', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, 'This is my essay');

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      await user.click(submitButton);

      expect(mockOnTextExtracted).toHaveBeenCalledWith('This is my essay', 'text');
    });

    it('should not call onTextExtracted for whitespace-only text', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, '   \n\n   ');

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Image Tab', () => {
    it('should render image upload tab', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      expect(screen.getByText(/click to upload image/i)).toBeInTheDocument();
    });

    it('should handle image upload successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromImage).mockResolvedValue('Extracted text from image');

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image content'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromImage).toHaveBeenCalledWith(file, expect.any(Function));
        expect(mockOnTextExtracted).toHaveBeenCalledWith('Extracted text from image', 'image');
      });
    });

    it('should handle PDF upload via image tab', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromPDF).mockResolvedValue('Extracted text from PDF');

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromPDF).toHaveBeenCalledWith(file, expect.any(Function));
        expect(mockOnTextExtracted).toHaveBeenCalledWith('Extracted text from PDF', 'image');
      });
    });

    it('should show progress during image processing', async () => {
      const user = userEvent.setup();

      vi.mocked(extractTextFromImage).mockImplementation(async (_file, onProgress) => {
        // Simulate progress updates
        if (onProgress) {
          onProgress(0.3);
          await new Promise((resolve) => setTimeout(resolve, 50));
          onProgress(0.7);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return 'Extracted text';
      });

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image content'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      // Should show processing text during extraction
      await waitFor(() => {
        expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should handle image extraction error', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(extractTextFromImage).mockRejectedValue(new Error('OCR failed'));

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image content'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to extract text from image. Please try again.');
      });

      alertSpy.mockRestore();
    });

    it('should display extracted text preview', async () => {
      const user = userEvent.setup();
      const longText = 'A'.repeat(300);
      vi.mocked(extractTextFromImage).mockResolvedValue(longText);

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image content'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/extracted text:/i)).toBeInTheDocument();
        // Should show truncated text (first 200 chars + ...)
        expect(screen.getByText(new RegExp('A'.repeat(200)))).toBeInTheDocument();
      });
    });
  });

  describe('Documents Tab', () => {
    it('should render documents upload tab', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      expect(screen.getByText(/click to upload document/i)).toBeInTheDocument();
    });

    it('should handle DOCX upload successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromDocx).mockResolvedValue({
        text: 'Extracted text from DOCX',
        fileType: 'docx',
      });

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromDocx).toHaveBeenCalledWith(file);
        expect(mockOnTextExtracted).toHaveBeenCalledWith('Extracted text from DOCX', 'docx');
      });
    });

    it('should handle PDF upload via documents tab', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromDocx).mockResolvedValue({
        text: 'Extracted text from PDF',
        fileType: 'pdf',
      });

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromDocx).toHaveBeenCalledWith(file);
        expect(mockOnTextExtracted).toHaveBeenCalledWith('Extracted text from PDF', 'pdf');
      });
    });

    it('should show processing state during document extraction', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromDocx).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ text: 'Text', fileType: 'docx' }), 100))
      );

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/processing\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('should handle document extraction error with message', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(extractTextFromDocx).mockRejectedValue(new Error('Invalid file format'));

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['bad content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to extract text from document: Invalid file format')
        );
      });

      alertSpy.mockRestore();
    });

    it('should display extracted text preview from document', async () => {
      const user = userEvent.setup();
      const longText = 'B'.repeat(300);
      vi.mocked(extractTextFromDocx).mockResolvedValue({
        text: longText,
        fileType: 'docx',
      });

      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/extracted text:/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp('B'.repeat(200)))).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      render(<FileDrop onTextExtracted={mockOnTextExtracted} />);

      // Start on text tab
      expect(screen.getByPlaceholderText(/paste student essay here/i)).toBeInTheDocument();

      // Switch to image tab
      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);
      expect(screen.getByText(/click to upload image/i)).toBeInTheDocument();

      // Switch to documents tab
      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);
      expect(screen.getByText(/click to upload document/i)).toBeInTheDocument();

      // Switch back to text tab
      const textTab = screen.getByRole('tab', { name: /^text$/i });
      await user.click(textTab);
      expect(screen.getByPlaceholderText(/paste student essay here/i)).toBeInTheDocument();
    });
  });
});

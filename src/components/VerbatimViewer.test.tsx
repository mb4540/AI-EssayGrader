// VerbatimViewer Component Tests
// Tests for essay display and file upload functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerbatimViewer from './VerbatimViewer';

// Mock external dependencies
vi.mock('@/lib/ocr', () => ({
  extractTextFromImage: vi.fn(),
  extractTextFromPDF: vi.fn(),
}));

vi.mock('@/lib/docx', () => ({
  extractTextFromDocx: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getInlineAnnotations: vi.fn(),
  updateInlineAnnotation: vi.fn(),
  transcribeImage: vi.fn(),
}));

vi.mock('./AnnotatedTextViewer', () => ({
  default: () => <div>AnnotatedTextViewer Mock</div>,
}));

import { extractTextFromImage, extractTextFromPDF } from '@/lib/ocr';
import { extractTextFromDocx } from '@/lib/docx';
import { getInlineAnnotations, transcribeImage } from '@/lib/api';

describe('VerbatimViewer Component', () => {
  const mockOnTextExtracted = vi.fn();
  const mockOnTextEnhanced = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    URL.createObjectURL = vi.fn(() => 'mock-object-url');
    URL.revokeObjectURL = vi.fn();
  });

  describe('Display Mode - With Text', () => {
    it('should display text when provided', () => {
      render(<VerbatimViewer text="This is a test essay" />);

      expect(screen.getByText(/this is a test essay/i)).toBeInTheDocument();
    });

    it('should calculate and display word count', () => {
      render(<VerbatimViewer text="One two three four five" />);

      expect(screen.getByText(/word count:/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display zero word count for empty text', () => {
      render(<VerbatimViewer text="" />);

      expect(screen.queryByText(/word count:/i)).not.toBeInTheDocument();
    });

    it('should display source type badge when provided', () => {
      render(<VerbatimViewer text="Test" sourceType="docx" />);

      expect(screen.getByText(/docx/i)).toBeInTheDocument();
    });

    it('should use custom title when provided', () => {
      render(<VerbatimViewer text="Test" title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should display badge text when provided', () => {
      render(<VerbatimViewer text="Test" badgeText="Draft 1" />);

      expect(screen.getByText('Draft 1')).toBeInTheDocument();
    });

    it('should show enhance button for image source type', () => {
      render(
        <VerbatimViewer 
          text="Test" 
          sourceType="image" 
          onTextEnhanced={mockOnTextEnhanced}
          showEnhanceButton={true}
        />
      );

      expect(screen.getByRole('button', { name: /enhance text/i })).toBeInTheDocument();
    });

    it('should not show enhance button for non-image source types', () => {
      render(
        <VerbatimViewer 
          text="Test" 
          sourceType="text" 
          onTextEnhanced={mockOnTextEnhanced}
        />
      );

      expect(screen.queryByRole('button', { name: /enhance text/i })).not.toBeInTheDocument();
    });

    it('should not show enhance button when showEnhanceButton is false', () => {
      render(
        <VerbatimViewer 
          text="Test" 
          sourceType="image" 
          onTextEnhanced={mockOnTextEnhanced}
          showEnhanceButton={false}
        />
      );

      expect(screen.queryByRole('button', { name: /enhance text/i })).not.toBeInTheDocument();
    });
  });

  describe('Upload Mode - No Text', () => {
    it('should show upload tabs when no text and onTextExtracted provided', () => {
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      expect(screen.getByRole('tab', { name: /text/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /image/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument();
    });

    it('should not show upload tabs when text is present', () => {
      render(<VerbatimViewer text="Existing text" onTextExtracted={mockOnTextExtracted} />);

      expect(screen.queryByRole('tab', { name: /text/i })).not.toBeInTheDocument();
    });

    it('should show placeholder message when no text and no upload handler', () => {
      render(<VerbatimViewer text="" />);

      expect(screen.getByText(/no text loaded yet/i)).toBeInTheDocument();
    });
  });

  describe('Text Tab', () => {
    it('should allow typing in textarea', async () => {
      const user = userEvent.setup();
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, 'New essay text');

      expect(textarea).toHaveValue('New essay text');
    });

    it('should disable submit button when textarea is empty', () => {
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when text is entered', async () => {
      const user = userEvent.setup();
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, 'Test essay');

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      expect(submitButton).toBeEnabled();
    });

    it('should call onTextExtracted when text is submitted', async () => {
      const user = userEvent.setup();
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const textarea = screen.getByPlaceholderText(/paste student essay here/i);
      await user.type(textarea, 'Test essay');

      const submitButton = screen.getByRole('button', { name: /use this text/i });
      await user.click(submitButton);

      expect(mockOnTextExtracted).toHaveBeenCalledWith('Test essay', 'text');
    });

    it('should use custom placeholder when provided', () => {
      render(
        <VerbatimViewer 
          text="" 
          onTextExtracted={mockOnTextExtracted}
          placeholder="Custom placeholder"
        />
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });
  });

  describe('Image Tab', () => {
    it('should show image upload area', async () => {
      const user = userEvent.setup();
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      expect(screen.getByText(/click to upload image/i)).toBeInTheDocument();
    });

    it('should call transcribeImage for image files (Default AI Vision)', async () => {
      const user = userEvent.setup();
      vi.mocked(transcribeImage).mockResolvedValue({ text: 'Extracted from AI' });

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      // transcribeImage should be called
      await waitFor(() => {
        expect(transcribeImage).toHaveBeenCalledWith(expect.objectContaining({
          image: expect.any(String)
        }));
      }, { timeout: 2000 });
    });

    it('should call extractTextFromImage when AI Vision is disabled', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromImage).mockResolvedValue('Extracted from local OCR');

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      // Disable AI Vision
      const toggleButton = screen.getByRole('button', { name: /ai vision enabled/i });
      await user.click(toggleButton);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromImage).toHaveBeenCalledWith(file, expect.any(Function));
      }, { timeout: 2000 });
    });

    it('should handle PDF upload via image tab', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromPDF).mockResolvedValue('Extracted from PDF');

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(extractTextFromPDF).toHaveBeenCalled();
      });
    });

    it('should disable input during image processing', async () => {
      const user = userEvent.setup();
      
      // Mock a slow extraction
      vi.mocked(transcribeImage).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { text: 'Extracted' };
      });

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      // Input should not be disabled initially
      expect(input).not.toBeDisabled();

      await user.upload(input, file);

      // Input should be disabled during processing
      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });

    it('should handle image extraction error', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(transcribeImage).mockRejectedValue(new Error('AI Vision failed'));

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const imageTab = screen.getByRole('tab', { name: /image/i });
      await user.click(imageTab);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = screen.getByLabelText(/click to upload image/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('OCR failed:', expect.any(Error));
        // The actual alert message will be "Failed to extract text: AI Vision failed"
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to extract text'));
      }, { timeout: 2000 });

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Documents Tab', () => {
    it('should show document upload area', async () => {
      const user = userEvent.setup();
      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      expect(screen.getByText(/click to upload document/i)).toBeInTheDocument();
    });

    it('should handle DOCX upload', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromDocx).mockResolvedValue({
        text: 'Extracted from DOCX',
        fileType: 'docx',
      });

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['docx'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
        result: 'data:application/docx;base64,mock',
      };
      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      await user.upload(input, file);

      // Trigger FileReader onloadend
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend.call(mockFileReader as unknown as FileReader, {} as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        expect(extractTextFromDocx).toHaveBeenCalled();
      });
    });

    it('should show processing state during document extraction', async () => {
      const user = userEvent.setup();
      vi.mocked(extractTextFromDocx).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ text: 'Text', fileType: 'docx' }), 100))
      );

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['docx'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
    });

    it('should handle document extraction error', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(extractTextFromDocx).mockRejectedValue(new Error('Invalid format'));

      render(<VerbatimViewer text="" onTextExtracted={mockOnTextExtracted} />);

      const docxTab = screen.getByRole('tab', { name: /documents/i });
      await user.click(docxTab);

      const file = new File(['bad'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const input = screen.getByLabelText(/click to upload document/i) as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to extract text from document')
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Enhance Text Feature', () => {
    it('should call enhance text API when button clicked', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ enhanced_text: 'Enhanced version' }),
      });
      global.fetch = mockFetch;

      render(
        <VerbatimViewer 
          text="Original text" 
          sourceType="image"
          onTextEnhanced={mockOnTextEnhanced}
          showEnhanceButton={true}
        />
      );

      const enhanceButton = screen.getByRole('button', { name: /enhance text/i });
      await user.click(enhanceButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/.netlify/functions/enhance-text',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ text: 'Original text', ocr_prompt: undefined }),
          })
        );
        expect(mockOnTextEnhanced).toHaveBeenCalledWith('Enhanced version');
      });
    });

    it('should show enhancing state during API call', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ enhanced_text: 'Enhanced' }),
        }), 100))
      );
      global.fetch = mockFetch;

      render(
        <VerbatimViewer 
          text="Original text" 
          sourceType="image"
          onTextEnhanced={mockOnTextEnhanced}
          showEnhanceButton={true}
        />
      );

      const enhanceButton = screen.getByRole('button', { name: /enhance text/i });
      await user.click(enhanceButton);

      expect(screen.getByText(/enhancing\.\.\./i)).toBeInTheDocument();
    });

    it('should handle enhance text API error', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch;

      render(
        <VerbatimViewer 
          text="Original text" 
          sourceType="image"
          onTextEnhanced={mockOnTextEnhanced}
          showEnhanceButton={true}
        />
      );

      const enhanceButton = screen.getByRole('button', { name: /enhance text/i });
      await user.click(enhanceButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to enhance text. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Annotations Feature', () => {
    it('should fetch annotations when submissionId and showAnnotations are provided', async () => {
      vi.mocked(getInlineAnnotations).mockResolvedValue({
        submission_id: 'sub-1',
        count: 1,
        annotations: [
          {
            annotation_id: '1',
            submission_id: 'sub-1',
            start_line: 1,
            end_line: 1,
            start_char: 0,
            end_char: 10,
            annotation_text: 'Test annotation',
            annotation_type: 'grammar',
            created_at: '2024-01-01',
          },
        ],
      });

      render(
        <VerbatimViewer 
          text="Test essay" 
          submissionId="sub-1"
          showAnnotations={true}
        />
      );

      await waitFor(() => {
        expect(getInlineAnnotations).toHaveBeenCalledWith('sub-1');
      });
    });

    it('should show annotations tab when annotations are available', async () => {
      vi.mocked(getInlineAnnotations).mockResolvedValue({
        submission_id: 'sub-1',
        count: 1,
        annotations: [
          {
            annotation_id: '1',
            submission_id: 'sub-1',
            start_line: 1,
            end_line: 1,
            start_char: 0,
            end_char: 10,
            annotation_text: 'Test',
            annotation_type: 'grammar',
            created_at: '2024-01-01',
          },
        ],
      });

      render(
        <VerbatimViewer 
          text="Test essay" 
          submissionId="sub-1"
          showAnnotations={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /annotations \(1\)/i })).toBeInTheDocument();
      });
    });

    it('should not fetch annotations when showAnnotations is false', () => {
      render(
        <VerbatimViewer 
          text="Test essay" 
          submissionId="sub-1"
          showAnnotations={false}
        />
      );

      expect(getInlineAnnotations).not.toHaveBeenCalled();
    });
  });

  describe('Image Display', () => {
    it('should show side-by-side view for image source with imageUrl', () => {
      render(
        <VerbatimViewer 
          text="Extracted text" 
          sourceType="image"
          imageUrl="https://example.com/image.jpg"
        />
      );

      expect(screen.getByText(/original image:/i)).toBeInTheDocument();
      expect(screen.getByText(/extracted text:/i)).toBeInTheDocument();
      expect(screen.getByAltText(/student's handwritten essay/i)).toBeInTheDocument();
    });

    it('should not show side-by-side view for non-image sources', () => {
      render(
        <VerbatimViewer 
          text="Regular text" 
          sourceType="text"
        />
      );

      expect(screen.queryByText(/original image:/i)).not.toBeInTheDocument();
      expect(screen.queryByAltText(/student's handwritten essay/i)).not.toBeInTheDocument();
    });
  });
});

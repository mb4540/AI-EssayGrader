// OCR Handler Tests
// Tests for extracting text from images using Tesseract.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromImage, extractTextFromPDF } from './ocr';

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}));

import { createWorker } from 'tesseract.js';

describe('OCR Handler', () => {
  let mockWorker: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockWorker = {
      recognize: vi.fn(),
      terminate: vi.fn(),
    };

    vi.mocked(createWorker).mockResolvedValue(mockWorker);
  });

  describe('extractTextFromImage', () => {
    it('should extract text from image file', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Extracted text from image' },
      });

      const result = await extractTextFromImage(mockFile);

      expect(result).toBe('Extracted text from image');
      expect(createWorker).toHaveBeenCalledWith('eng', 1, expect.any(Object));
      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile);
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should create worker with English language', async () => {
      const mockFile = new File(['image data'], 'test.png', { type: 'image/png' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromImage(mockFile);

      expect(createWorker).toHaveBeenCalledWith('eng', 1, expect.any(Object));
    });

    it('should terminate worker after recognition', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromImage(mockFile);

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should call progress callback during recognition', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      // Simulate progress updates
      let loggerCallback: any;
      vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options: any) => {
        loggerCallback = options.logger;
        return mockWorker;
      });

      mockWorker.recognize.mockImplementation(async () => {
        // Simulate progress updates
        loggerCallback({ status: 'recognizing text', progress: 0.5 });
        loggerCallback({ status: 'recognizing text', progress: 1.0 });
        return { data: { text: 'Text' } };
      });

      await extractTextFromImage(mockFile, onProgress);

      expect(onProgress).toHaveBeenCalledWith(0.5);
      expect(onProgress).toHaveBeenCalledWith(1.0);
    });

    it('should not call progress callback if not provided', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      let loggerCallback: any;
      vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options: any) => {
        loggerCallback = options.logger;
        return mockWorker;
      });

      mockWorker.recognize.mockImplementation(async () => {
        // Simulate progress updates without callback
        loggerCallback({ status: 'recognizing text', progress: 0.5 });
        return { data: { text: 'Text' } };
      });

      // Should not throw error
      await expect(extractTextFromImage(mockFile)).resolves.toBe('Text');
    });

    it('should handle empty text result', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: '' },
      });

      const result = await extractTextFromImage(mockFile);

      expect(result).toBe('');
    });

    it('should handle recognition errors', async () => {
      const mockFile = new File(['bad image'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockRejectedValue(new Error('Recognition failed'));

      await expect(extractTextFromImage(mockFile)).rejects.toThrow('Recognition failed');
      // Note: terminate() is not called on error in current implementation
    });

    it('should handle different image types', async () => {
      const pngFile = new File(['png data'], 'test.png', { type: 'image/png' });
      const jpgFile = new File(['jpg data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromImage(pngFile);
      await extractTextFromImage(jpgFile);

      expect(mockWorker.recognize).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-line text', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Line 1\nLine 2\nLine 3' },
      });

      const result = await extractTextFromImage(mockFile);

      expect(result).toBe('Line 1\nLine 2\nLine 3');
      expect(result).toContain('\n');
    });

    it('should handle text with special characters', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text with $pecial ch@racters & symbols!' },
      });

      const result = await extractTextFromImage(mockFile);

      expect(result).toBe('Text with $pecial ch@racters & symbols!');
    });
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from PDF file', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Extracted text from PDF' },
      });

      const result = await extractTextFromPDF(mockFile);

      expect(result).toBe('Extracted text from PDF');
      expect(createWorker).toHaveBeenCalledWith('eng', 1, expect.any(Object));
      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile);
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should create worker with English language', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromPDF(mockFile);

      expect(createWorker).toHaveBeenCalledWith('eng', 1, expect.any(Object));
    });

    it('should terminate worker after recognition', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromPDF(mockFile);

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should call progress callback during recognition', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });
      const onProgress = vi.fn();

      let loggerCallback: any;
      vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options: any) => {
        loggerCallback = options.logger;
        return mockWorker;
      });

      mockWorker.recognize.mockImplementation(async () => {
        loggerCallback({ status: 'recognizing text', progress: 0.75 });
        return { data: { text: 'Text' } };
      });

      await extractTextFromPDF(mockFile, onProgress);

      expect(onProgress).toHaveBeenCalledWith(0.75);
    });

    it('should handle empty PDF result', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: '' },
      });

      const result = await extractTextFromPDF(mockFile);

      expect(result).toBe('');
    });

    it('should handle PDF recognition errors', async () => {
      const mockFile = new File(['bad pdf'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockRejectedValue(new Error('PDF recognition failed'));

      await expect(extractTextFromPDF(mockFile)).rejects.toThrow('PDF recognition failed');
      // Note: terminate() is not called on error in current implementation
    });

    it('should handle multi-page PDF text', async () => {
      const mockFile = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Page 1 content\n\nPage 2 content' },
      });

      const result = await extractTextFromPDF(mockFile);

      expect(result).toContain('Page 1 content');
      expect(result).toContain('Page 2 content');
    });
  });

  describe('Worker lifecycle', () => {
    it('should create new worker for each extraction', async () => {
      const file1 = new File(['data1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['data2'], 'test2.jpg', { type: 'image/jpeg' });

      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Text' },
      });

      await extractTextFromImage(file1);
      await extractTextFromImage(file2);

      expect(createWorker).toHaveBeenCalledTimes(2);
      expect(mockWorker.terminate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Progress tracking', () => {
    it('should only report progress for recognizing text status', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      let loggerCallback: any;
      vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options: any) => {
        loggerCallback = options.logger;
        return mockWorker;
      });

      mockWorker.recognize.mockImplementation(async () => {
        loggerCallback({ status: 'loading tesseract', progress: 0.1 });
        loggerCallback({ status: 'recognizing text', progress: 0.5 });
        loggerCallback({ status: 'other status', progress: 0.9 });
        return { data: { text: 'Text' } };
      });

      await extractTextFromImage(mockFile, onProgress);

      // Should only be called for 'recognizing text' status
      expect(onProgress).toHaveBeenCalledTimes(1);
      expect(onProgress).toHaveBeenCalledWith(0.5);
    });

    it('should handle progress values from 0 to 1', async () => {
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      let loggerCallback: any;
      vi.mocked(createWorker).mockImplementation(async (_lang, _oem, options: any) => {
        loggerCallback = options.logger;
        return mockWorker;
      });

      mockWorker.recognize.mockImplementation(async () => {
        loggerCallback({ status: 'recognizing text', progress: 0 });
        loggerCallback({ status: 'recognizing text', progress: 0.25 });
        loggerCallback({ status: 'recognizing text', progress: 0.5 });
        loggerCallback({ status: 'recognizing text', progress: 0.75 });
        loggerCallback({ status: 'recognizing text', progress: 1 });
        return { data: { text: 'Text' } };
      });

      await extractTextFromImage(mockFile, onProgress);

      expect(onProgress).toHaveBeenCalledWith(0);
      expect(onProgress).toHaveBeenCalledWith(0.25);
      expect(onProgress).toHaveBeenCalledWith(0.5);
      expect(onProgress).toHaveBeenCalledWith(0.75);
      expect(onProgress).toHaveBeenCalledWith(1);
    });
  });
});

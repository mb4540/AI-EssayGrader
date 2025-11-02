// DOCX Parser Tests
// Tests for document text extraction logic

import { describe, it, expect, vi } from 'vitest';
import { extractTextFromDocx } from './docx';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

describe('DOCX Parser', () => {
  // Helper to create a properly mocked File
  const createMockFile = (name: string, type: string, arrayBufferMock?: ArrayBuffer) => {
    const file = {
      name,
      type,
      arrayBuffer: vi.fn().mockResolvedValue(arrayBufferMock || new ArrayBuffer(8)),
      text: vi.fn().mockResolvedValue('mock text content'),
    } as unknown as File;
    return file;
  };

  describe('File type detection', () => {
    it('should detect DOCX by MIME type', async () => {
      const file = createMockFile('test.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'DOCX content',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('docx');
      expect(result.text).toBe('DOCX content');
    });

    it('should detect DOCX by file extension', async () => {
      const file = createMockFile('test.docx', 'application/octet-stream');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'DOCX content',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('docx');
    });

    it('should detect PDF by MIME type', async () => {
      const file = createMockFile('test.pdf', 'application/pdf');

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'PDF text' }],
          }),
        }),
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as any);

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('pdf');
    });

    it('should detect PDF by file extension', async () => {
      const file = createMockFile('test.pdf', 'application/octet-stream');

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'PDF text' }],
          }),
        }),
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as any);

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('pdf');
    });

    it('should detect DOC by MIME type', async () => {
      const file = createMockFile('test.doc', 'application/msword');

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('doc');
    });

    it('should handle case-insensitive extensions', async () => {
      const file = createMockFile('TEST.DOCX', 'application/octet-stream');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'content',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('docx');
    });

    it('should default to DOCX for unknown types', async () => {
      const file = createMockFile('unknown.xyz', 'application/unknown');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'content',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('docx');
    });
  });

  describe('Text extraction', () => {
    it('should extract text from DOCX', async () => {
      const file = createMockFile('test.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'This is the extracted text',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.text).toBe('This is the extracted text');
      expect(mammoth.extractRawText).toHaveBeenCalled();
    });

    it('should extract text from multi-page PDF', async () => {
      const file = createMockFile('test.pdf', 'application/pdf');

      const mockPdf = {
        numPages: 2,
        getPage: vi.fn(),
      };

      mockPdf.getPage
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Page' }, { str: '1' }],
          }),
        })
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Page' }, { str: '2' }],
          }),
        });

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as any);

      const result = await extractTextFromDocx(file);

      expect(result.text).toContain('Page 1');
      expect(result.text).toContain('Page 2');
      expect(mockPdf.getPage).toHaveBeenCalledTimes(2);
    });

    it('should clean non-printable characters from DOC', async () => {
      const file = createMockFile('test.doc', 'application/msword');
      file.text = vi.fn().mockResolvedValue('Text\x00with\x01binary\x02chars');

      const result = await extractTextFromDocx(file);

      expect(result.text).toBe('Textwithbinarychars');
    });
  });

  describe('Error handling', () => {
    it('should throw error on DOCX extraction failure', async () => {
      const file = createMockFile('bad.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Corrupt file'));

      await expect(extractTextFromDocx(file)).rejects.toThrow('Failed to extract text from bad.docx');
      await expect(extractTextFromDocx(file)).rejects.toThrow('Corrupt file');
    });

    it('should throw error on PDF extraction failure', async () => {
      const file = createMockFile('bad.pdf', 'application/pdf');

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF')),
      } as any);

      await expect(extractTextFromDocx(file)).rejects.toThrow('PDF extraction failed');
    });

    it('should include filename in error message', async () => {
      const file = createMockFile('important.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Error'));

      await expect(extractTextFromDocx(file)).rejects.toThrow('important.docx');
    });
  });

  describe('Special cases', () => {
    it('should handle Google Docs MIME type', async () => {
      const file = createMockFile('google-doc.docx', 'application/vnd.google-apps.document');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: 'Google Docs content',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.fileType).toBe('docx');
      expect(result.text).toBe('Google Docs content');
    });

    it('should handle empty DOCX', async () => {
      const file = createMockFile('empty.docx', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      vi.mocked(mammoth.extractRawText).mockResolvedValue({
        value: '',
        messages: [],
      });

      const result = await extractTextFromDocx(file);

      expect(result.text).toBe('');
      expect(result.fileType).toBe('docx');
    });

    it('should trim whitespace from PDF text', async () => {
      const file = createMockFile('test.pdf', 'application/pdf');

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: '  Text  ' }],
          }),
        }),
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      } as any);

      const result = await extractTextFromDocx(file);

      expect(result.text).toBe('Text');
    });
  });
});

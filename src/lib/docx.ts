import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker file that's copied by Vite
if (typeof window !== 'undefined') {
  // In production (Netlify) and development, the worker is in /assets/
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
}

/**
 * Extract text from PDF files using PDF.js
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX files using mammoth
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from DOC files (legacy Word format)
 * Note: This is a simplified approach. For better results, consider server-side conversion.
 */
async function extractTextFromDOC(file: File): Promise<string> {
  // Legacy .doc files are binary and harder to parse
  // For now, we'll attempt to read as text and clean it up
  const text = await file.text();
  // Remove non-printable characters and clean up
  return text.replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
}

/**
 * Main function to extract text from various document formats
 * Supports: DOCX, PDF, DOC, and Google Docs (when downloaded as DOCX)
 * Returns both the extracted text and the detected file type
 */
export async function extractTextFromDocx(file: File): Promise<{ text: string; fileType: 'pdf' | 'docx' | 'doc' }> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  console.log('Extracting text from file:', { fileName, fileType, size: file.size });
  
  try {
    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Detected PDF file, using PDF extraction');
      const text = await extractTextFromPDF(file);
      return { text, fileType: 'pdf' };
    }
    
    // Handle DOCX files (including Google Docs exported as DOCX)
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx') ||
      fileType === 'application/vnd.google-apps.document'
    ) {
      console.log('Detected DOCX file, using DOCX extraction');
      const text = await extractTextFromDOCX(file);
      return { text, fileType: 'docx' };
    }
    
    // Handle legacy DOC files
    if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      console.log('Detected DOC file, using DOC extraction');
      const text = await extractTextFromDOC(file);
      return { text, fileType: 'doc' };
    }
    
    // Default to DOCX extraction for unknown types
    console.log('Unknown file type, defaulting to DOCX extraction');
    const text = await extractTextFromDOCX(file);
    return { text, fileType: 'docx' };
  } catch (error) {
    console.error('Document extraction error:', error);
    throw new Error(`Failed to extract text from ${fileName}. ${error instanceof Error ? error.message : 'Please ensure the file is a valid document.'}`);
  }
}

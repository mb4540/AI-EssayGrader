import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    const { data: { text } } = await worker.recognize(file);
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error('Failed to extract text from image using OCR');
  } finally {
    // Safely terminate worker if it exists
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Error terminating Tesseract worker:', terminateError);
      }
    }
  }
}

export async function extractTextFromPDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // For PDF, we'll need to convert to images first
  // This is a simplified version - in production, you might want to use pdf.js
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    const { data: { text } } = await worker.recognize(file);
    return text;
  } catch (error) {
    console.error('Tesseract PDF OCR error:', error);
    throw new Error('Failed to extract text from PDF using OCR');
  } finally {
    // Safely terminate worker if it exists
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Error terminating Tesseract worker:', terminateError);
      }
    }
  }
}

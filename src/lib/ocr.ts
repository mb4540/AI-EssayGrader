import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  return text;
}

export async function extractTextFromPDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // For PDF, we'll need to convert to images first
  // This is a simplified version - in production, you might want to use pdf.js
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  return text;
}

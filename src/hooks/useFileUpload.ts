// useFileUpload Hook
// Handles file upload logic for images, PDFs, and DOCX files

import { useState } from 'react';
import { extractTextFromImage, extractTextFromPDF } from '@/lib/ocr';
import { extractTextFromDocx } from '@/lib/docx';
import { transcribeImage } from '@/lib/api';

export type FileSourceType = 'text' | 'docx' | 'pdf' | 'doc' | 'image';

interface UseFileUploadReturn {
  isProcessing: boolean;
  progress: number;
  uploadedImage: string | null;
  handleImageUpload: (
    file: File,
    onTextExtracted: (text: string, sourceType: FileSourceType, imageDataUrl?: string) => void,
    options?: { useAiVision?: boolean }
  ) => Promise<void>;
  handleDocxUpload: (
    file: File,
    onTextExtracted: (text: string, sourceType: FileSourceType, fileData?: string) => void
  ) => Promise<void>;
  setUploadedImage: (url: string | null) => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = async (
    file: File,
    onTextExtracted: (text: string, sourceType: FileSourceType, imageDataUrl?: string) => void,
    options?: { useAiVision?: boolean }
  ) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Create object URL for image preview
      let imageDataUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setUploadedImage(objectUrl);
        
        // Also convert to base64 for storage
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file, setProgress);
      } else if (options?.useAiVision && imageDataUrl) {
        // AI Vision Path
        const globalProvider = localStorage.getItem('ai_provider');
        const handwritingProvider = localStorage.getItem('ai_handwriting_provider');
        
        let provider: 'gemini' | 'openai' = (globalProvider === 'openai' || globalProvider === 'gemini') ? globalProvider : 'gemini';
        
        if (handwritingProvider && handwritingProvider !== 'default') {
           provider = handwritingProvider as 'gemini' | 'openai';
        }
        
        const result = await transcribeImage({ image: imageDataUrl, provider });
        extractedText = result.text;
      } else {
        // Legacy Tesseract Path
        extractedText = await extractTextFromImage(file, setProgress);
      }
      
      onTextExtracted(extractedText, 'image', imageDataUrl);
    } catch (error) {
      console.error('OCR failed:', error);
      
      // Check if it's a quota error
      const errorObj = error as any;
      if (errorObj?.quotaExceeded || (errorObj?.message && errorObj.message.includes('quota'))) {
        throw new Error('API quota exceeded. Please try again later or use the legacy OCR option in settings.');
      }
      
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract text: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDocxUpload = async (
    file: File,
    onTextExtracted: (text: string, sourceType: FileSourceType, fileData?: string) => void
  ) => {
    setIsProcessing(true);

    try {
      // Extract text from document
      const { text: extractedText, fileType } = await extractTextFromDocx(file);
      
      // Read file as base64 for storage (if ALLOW_BLOB_STORAGE is enabled)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        // Pass both extracted text and file data
        onTextExtracted(extractedText, fileType, base64Data);
      };
      reader.onerror = () => {
        // If file reading fails, still pass the extracted text
        onTextExtracted(extractedText, fileType);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Document extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to extract text from document: ${errorMessage}\n\nPlease ensure the file is a valid DOCX, PDF, or DOC file.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    progress,
    uploadedImage,
    handleImageUpload,
    handleDocxUpload,
    setUploadedImage,
  };
}

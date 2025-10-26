import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Configure PDF.js worker - use local worker file
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
}

export interface PageDimensions {
  width: number;
  height: number;
}

interface PdfPagesState {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  scale: number;
}

interface UsePdfPagesOptions {
  fileUrl?: string;
  initialPage?: number;
  initialScale?: number;
  onPageChange?: (pageNumber: number) => void;
}

/**
 * Hook for rendering and navigating PDF documents
 * - Loads PDF from URL or File object
 * - Renders pages to canvas
 * - Page navigation (next/prev/goto)
 * - Zoom/scale support
 */
export function usePdfPages({
  fileUrl,
  initialPage = 1,
  initialScale = 1.0,
  onPageChange,
}: UsePdfPagesOptions = {}) {
  const [state, setState] = useState<PdfPagesState>({
    pdfDoc: null,
    currentPage: initialPage,
    totalPages: 0,
    isLoading: false,
    error: null,
    scale: initialScale,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  /**
   * Load PDF document from URL
   */
  const loadPdf = useCallback(async (url: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdfDoc = await loadingTask.promise;

      setState((prev) => ({
        ...prev,
        pdfDoc,
        totalPages: pdfDoc.numPages,
        isLoading: false,
        currentPage: Math.min(prev.currentPage, pdfDoc.numPages),
      }));

      return pdfDoc;
    } catch (error) {
      console.error('PDF load error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load PDF',
      }));
      return null;
    }
  }, []);

  /**
   * Load PDF from File object
   */
  const loadPdfFromFile = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      setState((prev) => ({
        ...prev,
        pdfDoc,
        totalPages: pdfDoc.numPages,
        isLoading: false,
        currentPage: Math.min(prev.currentPage, pdfDoc.numPages),
      }));

      return pdfDoc;
    } catch (error) {
      console.error('PDF load from file error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load PDF',
      }));
      return null;
    }
  }, []);

  /**
   * Get a specific page from the PDF
   */
  const getPage = useCallback(
    async (pageNumber: number): Promise<PDFPageProxy | null> => {
      if (!state.pdfDoc || pageNumber < 1 || pageNumber > state.totalPages) {
        return null;
      }

      try {
        const page = await state.pdfDoc.getPage(pageNumber);
        return page;
      } catch (error) {
        console.error('Get page error:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to get page',
        }));
        return null;
      }
    },
    [state.pdfDoc, state.totalPages]
  );

  /**
   * Render a PDF page to the canvas
   */
  const renderPage = useCallback(
    async (
      pageNumber: number,
      canvas: HTMLCanvasElement,
      scale: number = state.scale
    ): Promise<PageDimensions | null> => {
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await getPage(pageNumber);
      if (!page) return null;

      try {
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport,
          canvas,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        return {
          width: viewport.width,
          height: viewport.height,
        };
      } catch (error: any) {
        // Ignore cancellation errors
        if (error?.name === 'RenderingCancelledException') {
          return null;
        }
        console.error('Render page error:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to render page',
        }));
        return null;
      }
    },
    [getPage, state.scale]
  );

  /**
   * Get dimensions of a page without rendering
   */
  const getPageDimensions = useCallback(
    async (pageNumber: number, scale: number = state.scale): Promise<PageDimensions | null> => {
      const page = await getPage(pageNumber);
      if (!page) return null;

      const viewport = page.getViewport({ scale });
      return {
        width: viewport.width,
        height: viewport.height,
      };
    },
    [getPage, state.scale]
  );

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber < 1 || pageNumber > state.totalPages) {
        return;
      }

      setState((prev) => ({ ...prev, currentPage: pageNumber }));
      onPageChange?.(pageNumber);
    },
    [state.totalPages, onPageChange]
  );

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    if (state.currentPage < state.totalPages) {
      goToPage(state.currentPage + 1);
    }
  }, [state.currentPage, state.totalPages, goToPage]);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    if (state.currentPage > 1) {
      goToPage(state.currentPage - 1);
    }
  }, [state.currentPage, goToPage]);

  /**
   * Set zoom scale
   */
  const setScale = useCallback((scale: number) => {
    setState((prev) => ({ ...prev, scale: Math.max(0.1, Math.min(5.0, scale)) }));
  }, []);

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setScale(state.scale + 0.25);
  }, [state.scale, setScale]);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setScale(state.scale - 0.25);
  }, [state.scale, setScale]);

  /**
   * Reset zoom to 100%
   */
  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, [setScale]);

  /**
   * Extract text from a specific page
   */
  const getPageText = useCallback(
    async (pageNumber: number): Promise<string> => {
      const page = await getPage(pageNumber);
      if (!page) return '';

      try {
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        return pageText;
      } catch (error) {
        console.error('Get page text error:', error);
        return '';
      }
    },
    [getPage]
  );

  /**
   * Extract text from all pages
   */
  const getAllText = useCallback(async (): Promise<string> => {
    if (!state.pdfDoc) return '';

    let fullText = '';
    for (let i = 1; i <= state.totalPages; i++) {
      const pageText = await getPageText(i);
      fullText += pageText + '\n\n';
    }
    return fullText.trim();
  }, [state.pdfDoc, state.totalPages, getPageText]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (state.pdfDoc) {
        state.pdfDoc.destroy();
      }
    };
  }, []);

  /**
   * Auto-load PDF if fileUrl is provided
   */
  useEffect(() => {
    if (fileUrl) {
      loadPdf(fileUrl);
    }
  }, [fileUrl, loadPdf]);

  return {
    // State
    pdfDoc: state.pdfDoc,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    isLoading: state.isLoading,
    error: state.error,
    scale: state.scale,

    // Loading
    loadPdf,
    loadPdfFromFile,

    // Page access
    getPage,
    renderPage,
    getPageDimensions,
    getPageText,
    getAllText,

    // Navigation
    goToPage,
    nextPage,
    prevPage,
    canGoNext: state.currentPage < state.totalPages,
    canGoPrev: state.currentPage > 1,

    // Zoom
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,

    // Canvas ref for external use
    canvasRef,
  };
}

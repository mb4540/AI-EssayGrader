import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { usePdfPages } from '@/hooks/usePdfPages';
import { useAnnotations, AnnotationType } from '@/hooks/useAnnotations';
import AnnotationToolbar from './AnnotationToolbar';
import AnnotationOverlay from './AnnotationOverlay';
import { Loader2, FileText } from 'lucide-react';

interface AnnotationViewerProps {
  submissionId: string;
  originalFileUrl: string;
  sourceType?: string;
}

type Tool = AnnotationType | 'select' | 'eraser';

export default function AnnotationViewer({
  submissionId,
  originalFileUrl,
  sourceType = 'pdf',
}: AnnotationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState('rgba(255,235,59,0.45)'); // Yellow highlight
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // PDF rendering hook
  const {
    currentPage,
    totalPages,
    isLoading: isPdfLoading,
    error: pdfError,
    renderPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    scale,
    setScale,
    loadPdf,
  } = usePdfPages({ initialScale: 1.0 });

  // Annotations hook
  const {
    annotations,
    isLoading: isAnnotationsLoading,
    isSaving,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
    forceSave,
  } = useAnnotations({
    submissionId,
    pageNumber: currentPage,
    canvasWidth: canvasDimensions.width,
    canvasHeight: canvasDimensions.height,
  });

  // Load PDF on mount
  useEffect(() => {
    if (originalFileUrl) {
      loadPdf(originalFileUrl);
    }
  }, [originalFileUrl, loadPdf]);

  // Render current page when it changes
  useEffect(() => {
    if (canvasRef.current && currentPage > 0) {
      renderPage(currentPage, canvasRef.current, scale).then((dimensions) => {
        if (dimensions) {
          setCanvasDimensions(dimensions);
        }
      });
    }
  }, [currentPage, scale, renderPage]);

  // Drawing state for pen and highlight tools
  const [drawingData, setDrawingData] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    path?: { x: number; y: number }[];
  } | null>(null);

  /**
   * Get mouse position relative to canvas
   */
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  /**
   * Handle mouse down - start drawing
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (currentTool === 'select') return;

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);

      if (currentTool === 'pen') {
        setDrawingData({
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
          path: [coords],
        });
      } else if (currentTool === 'highlight' || currentTool === 'comment') {
        setDrawingData({
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
        });
      }
    },
    [currentTool, getCanvasCoordinates]
  );

  /**
   * Handle mouse move - update drawing
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !drawingData) return;

      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      if (currentTool === 'pen') {
        setDrawingData((prev) =>
          prev
            ? {
                ...prev,
                currentX: coords.x,
                currentY: coords.y,
                path: [...(prev.path || []), coords],
              }
            : null
        );
      } else if (currentTool === 'highlight' || currentTool === 'comment') {
        setDrawingData((prev) =>
          prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
        );
      }
    },
    [isDrawing, drawingData, currentTool, getCanvasCoordinates]
  );

  /**
   * Handle mouse up - finish drawing and create annotation
   */
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawingData) return;

    setIsDrawing(false);

    // Create annotation based on tool type
    if (currentTool === 'highlight') {
      const rect = {
        x: Math.min(drawingData.startX, drawingData.currentX),
        y: Math.min(drawingData.startY, drawingData.currentY),
        w: Math.abs(drawingData.currentX - drawingData.startX),
        h: Math.abs(drawingData.currentY - drawingData.startY),
      };

      // Only create if rect has meaningful size
      if (rect.w > 5 && rect.h > 5) {
        addAnnotation({
          type: 'highlight',
          rect,
          color_rgba: currentColor,
          z_index: annotations.length,
        });
      }
    } else if (currentTool === 'comment') {
      const rect = {
        x: Math.min(drawingData.startX, drawingData.currentX),
        y: Math.min(drawingData.startY, drawingData.currentY),
        w: Math.abs(drawingData.currentX - drawingData.startX),
        h: Math.abs(drawingData.currentY - drawingData.startY),
      };

      // Only create if rect has meaningful size
      if (rect.w > 20 && rect.h > 20) {
        addAnnotation({
          type: 'comment',
          rect,
          text: '',
          color_rgba: 'rgba(244,67,54,0.9)', // Red
          z_index: annotations.length,
        });
      }
    } else if (currentTool === 'pen' && drawingData.path && drawingData.path.length > 2) {
      addAnnotation({
        type: 'pen',
        path: drawingData.path,
        color_rgba: currentColor,
        stroke_width: 2,
        z_index: annotations.length,
      });
    }

    setDrawingData(null);
  }, [isDrawing, drawingData, currentTool, currentColor, annotations.length, addAnnotation]);

  /**
   * Handle page navigation
   */
  const handlePageChange = useCallback(
    async (newPage: number) => {
      await forceSave(); // Save current page before switching
      if (newPage === currentPage + 1) {
        nextPage();
      } else if (newPage === currentPage - 1) {
        prevPage();
      }
    },
    [currentPage, nextPage, prevPage, forceSave]
  );

  if (pdfError) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return (
      <Card className="h-full border-red-500 border-l-4">
        <CardHeader className="bg-red-50 dark:bg-red-950">
          <CardTitle className="text-lg text-red-600 dark:text-red-400">
            {isLocalhost ? 'PDF Not Available in Localhost' : 'Failed to Load PDF'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isLocalhost ? (
              <>
                <strong>Development Mode:</strong> PDF annotations require blob storage which doesn't work on localhost.
                <br /><br />
                <strong>To test this feature:</strong>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Deploy your code to Netlify production</li>
                  <li>Upload a PDF/DOCX file on the live site</li>
                  <li>The Annotate tab will work fully with real PDFs</li>
                </ol>
                <br />
                <strong>Note:</strong> All the UI components, autosave, and export features are fully built and will work in production.
              </>
            ) : (
              pdfError
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg border-l-4 border-purple-500">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </div>
            <span>Annotate Document</span>
            {sourceType && (
              <span className="text-xs font-normal px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded uppercase">
                {sourceType}
              </span>
            )}
          </CardTitle>

          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Toolbar */}
        <AnnotationToolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={currentColor}
          onColorChange={setCurrentColor}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={() => canGoNext && handlePageChange(currentPage + 1)}
          onPrevPage={() => canGoPrev && handlePageChange(currentPage - 1)}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          scale={scale}
          onScaleChange={setScale}
          submissionId={submissionId}
          onForceSave={forceSave}
        />

        {/* Canvas + Annotation Overlay */}
        {isPdfLoading || isAnnotationsLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading {isPdfLoading ? 'PDF' : 'annotations'}...
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-auto max-h-[700px] min-h-[500px] bg-gray-100 dark:bg-gray-900"
            style={{ 
              cursor: currentTool === 'select' ? 'default' : 'crosshair',
              width: canvasDimensions.width || '100%',
              height: canvasDimensions.height || 'auto'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                handleMouseUp();
              }
            }}
          >
            {/* PDF Canvas */}
            <canvas ref={canvasRef} className="relative" style={{ display: 'block', margin: '0 auto' }} />

            {/* Annotation Overlay */}
            <AnnotationOverlay
              annotations={annotations}
              canvasWidth={canvasDimensions.width}
              canvasHeight={canvasDimensions.height}
              drawingData={drawingData}
              currentTool={currentTool}
              currentColor={currentColor}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          </div>
        )}

        {/* Page Info */}
        {totalPages > 0 && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages} • {annotations.length} annotation
            {annotations.length !== 1 ? 's' : ''} on this page
          </div>
        )}
      </CardContent>
    </Card>
  );
}

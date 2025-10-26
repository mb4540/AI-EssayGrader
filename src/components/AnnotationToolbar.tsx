import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MousePointer,
  Highlighter,
  MessageSquare,
  Pen,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  FileDown,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { exportAnnotatedPdf } from '@/lib/api';
import { useState } from 'react';

type Tool = 'select' | 'highlight' | 'comment' | 'pen' | 'eraser' | 'underline';

interface AnnotationToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  scale: number;
  onScaleChange: (scale: number) => void;
  submissionId: string;
  onForceSave: () => void;
}

const COLORS = [
  { name: 'Yellow', value: 'rgba(255,235,59,0.45)', hex: '#FFEB3B' },
  { name: 'Green', value: 'rgba(76,175,80,0.45)', hex: '#4CAF50' },
  { name: 'Blue', value: 'rgba(33,150,243,0.45)', hex: '#2196F3' },
  { name: 'Pink', value: 'rgba(233,30,99,0.45)', hex: '#E91E63' },
  { name: 'Orange', value: 'rgba(255,152,0,0.45)', hex: '#FF9800' },
  { name: 'Red', value: 'rgba(244,67,54,0.9)', hex: '#F44336' },
];

export default function AnnotationToolbar(props: AnnotationToolbarProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    currentTool,
    onToolChange,
    currentColor,
    onColorChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    canGoNext,
    canGoPrev,
    scale,
    onScaleChange,
    submissionId,
    onForceSave,
  } = props;

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await onForceSave(); // Save current annotations first
      const result = await exportAnnotatedPdf(submissionId);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = result.download_url;
      link.download = `annotated-${submissionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = () => {
    // PNG export will be implemented in Phase 5
    alert('PNG export coming soon! For now, use the PDF export.');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Button
          size="sm"
          variant={currentTool === 'select' ? 'default' : 'outline'}
          onClick={() => onToolChange('select')}
          title="Select (Esc)"
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={currentTool === 'highlight' ? 'default' : 'outline'}
          onClick={() => onToolChange('highlight')}
          title="Highlight (H)"
          className={currentTool === 'highlight' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
        >
          <Highlighter className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={currentTool === 'comment' ? 'default' : 'outline'}
          onClick={() => onToolChange('comment')}
          title="Comment (C)"
          className={currentTool === 'comment' ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={currentTool === 'pen' ? 'default' : 'outline'}
          onClick={() => onToolChange('pen')}
          title="Pen (P)"
          className={currentTool === 'pen' ? 'bg-blue-500 hover:bg-blue-600' : ''}
        >
          <Pen className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={currentTool === 'eraser' ? 'default' : 'outline'}
          onClick={() => onToolChange('eraser')}
          title="Eraser (E)"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            title={color.name}
            className={`w-7 h-7 rounded border-2 transition-all ${
              currentColor === color.value
                ? 'border-gray-800 dark:border-white scale-110'
                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
            }`}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onPrevPage}
          disabled={!canGoPrev}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[80px] text-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onNextPage}
          disabled={!canGoNext}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onScaleChange(scale - 0.25)}
          disabled={scale <= 0.25}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onScaleChange(scale + 0.25)}
          disabled={scale >= 3.0}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onForceSave}
          title="Force Save"
        >
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportPng}
          title="Export Current Page as PNG"
        >
          <Download className="w-4 h-4 mr-1" />
          PNG
        </Button>
        <Button
          size="sm"
          onClick={handleExportPdf}
          disabled={isExporting}
          title="Export Full Annotated PDF"
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        >
          <FileDown className="w-4 h-4 mr-1" />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>

      {/* Help Button */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 ml-2"
          >
            <HelpCircle className="w-4 h-4" />
            Help
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              How to Use PDF Annotations
            </DialogTitle>
            <DialogDescription className="text-base">
              Mark up student PDFs with highlights, drawings, and comments
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-sm">
            {/* Tools Overview */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">🎨 Annotation Tools</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <MousePointer className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Select Tool</p>
                    <p className="text-gray-700 dark:text-gray-300">Click to select and move existing annotations. Drag comment boxes to reposition them.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <Highlighter className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Highlight Tool</p>
                    <p className="text-gray-700 dark:text-gray-300">Click and drag over text to highlight important sections. Choose from 6 colors!</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <Pen className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Pen Tool</p>
                    <p className="text-gray-700 dark:text-gray-300">Draw freehand marks directly on the PDF. Great for circling errors or underlining.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Comment Tool</p>
                    <p className="text-gray-700 dark:text-gray-300">Drag to create a comment box, then type feedback. Perfect for detailed notes!</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Eraser className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Eraser Tool</p>
                    <p className="text-gray-700 dark:text-gray-300">Click any annotation to delete it. Or double-click annotations with Select tool.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">💡 Quick Tips</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Auto-save:</strong> Your annotations save automatically every second</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Undo/Redo:</strong> Made a mistake? Use the undo button or Ctrl+Z</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Color palette:</strong> Click any color to change your highlight/pen color</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Export PDF:</strong> Click "Export PDF" to download with all annotations flattened</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Zoom:</strong> Use zoom controls or mouse wheel to get a closer look</p>
                </div>
              </div>
            </div>

            {/* Workflow */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">📋 Suggested Workflow</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Review the AI's suggested grade and feedback in the "AI Grade" tab</li>
                <li>Switch to "Annotate" tab to mark up the actual PDF</li>
                <li>Use highlights to mark strong passages (green) or areas needing work (yellow/red)</li>
                <li>Use pen tool to circle specific errors or underline key phrases</li>
                <li>Add comment boxes with specific feedback for the student</li>
                <li>Export the annotated PDF to give to the student alongside their grade</li>
              </ol>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">⚠️ Important Notes</h3>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>• Annotations only work with PDF and DOCX files (not plain text submissions)</li>
                <li>• Double-click any annotation with Select tool to delete it</li>
                <li>• The exported PDF includes all your marks - perfect for returning to students!</li>
                <li>• Annotations are tied to this submission - they won't appear on other essays</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

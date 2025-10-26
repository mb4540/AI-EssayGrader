import { useState, useRef, useEffect } from 'react';
import { Annotation } from '@/hooks/useAnnotations';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { X, GripVertical } from 'lucide-react';

interface CommentCardProps {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Annotation>) => void;
  onDelete: () => void;
}

export default function CommentCard({
  annotation,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: CommentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [text, setText] = useState(annotation.text || '');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-save text changes with debounce
  useEffect(() => {
    if (text !== annotation.text) {
      const timer = setTimeout(() => {
        onUpdate({ text });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [text, annotation.text, onUpdate]);

  // Get card position and size
  const rect = annotation.rect || { x: 100, y: 100, w: 200, h: 120 };

  /**
   * Handle drag start
   */
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    onSelect();

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (cardRect) {
      setDragOffset({
        x: e.clientX - cardRect.left,
        y: e.clientY - cardRect.top,
      });
    }
  };

  /**
   * Handle resize start
   */
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    onSelect();
  };

  /**
   * Handle mouse move (drag or resize)
   */
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const parent = cardRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();

      if (isDragging) {
        // Calculate new position relative to parent
        const newX = e.clientX - parentRect.left - dragOffset.x;
        const newY = e.clientY - parentRect.top - dragOffset.y;

        // Ensure card stays within bounds
        const maxX = parentRect.width - rect.w;
        const maxY = parentRect.height - rect.h;

        onUpdate({
          rect: {
            ...rect,
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          },
        });
      } else if (isResizing) {
        // Calculate new size
        const newWidth = e.clientX - parentRect.left - rect.x;
        const newHeight = e.clientY - parentRect.top - rect.y;

        // Minimum size constraints
        const minWidth = 150;
        const minHeight = 80;
        const maxWidth = parentRect.width - rect.x;
        const maxHeight = parentRect.height - rect.y;

        onUpdate({
          rect: {
            ...rect,
            w: Math.max(minWidth, Math.min(newWidth, maxWidth)),
            h: Math.max(minHeight, Math.min(newHeight, maxHeight)),
          },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, rect, onUpdate]);

  return (
    <div
      ref={cardRef}
      className={`absolute pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all ${
        isSelected
          ? 'border-red-500 shadow-xl ring-2 ring-red-200 dark:ring-red-800'
          : 'border-red-400 hover:border-red-500'
      }`}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        minHeight: rect.h,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: isSelected ? 1000 : annotation.z_index || 100,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Red Title Bar (Teacher Red Pen Style) */}
      <div
        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-t-md flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          <span className="text-xs font-semibold">Teacher Comment</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Comment Text Area */}
      <div className="p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your feedback here..."
          className="min-h-[60px] text-sm border-red-200 focus:border-red-400 dark:border-red-800 dark:focus:border-red-600 resize-none"
          onClick={(e) => e.stopPropagation()}
          style={{ height: rect.h - 50 }}
        />
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-tl cursor-nwse-resize hover:bg-red-600"
          onMouseDown={handleResizeStart}
          style={{ cursor: 'nwse-resize' }}
        />
      )}

      {/* Instruction Hint (only when empty) */}
      {!text && !isSelected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center px-4">
            Click to add feedback
          </p>
        </div>
      )}
    </div>
  );
}

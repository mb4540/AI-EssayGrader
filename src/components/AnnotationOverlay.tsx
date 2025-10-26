import { useState } from 'react';
import { Annotation } from '@/hooks/useAnnotations';
import CommentCard from './CommentCard';

interface AnnotationOverlayProps {
  annotations: Annotation[];
  canvasWidth: number;
  canvasHeight: number;
  drawingData: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    path?: { x: number; y: number }[];
  } | null;
  currentTool: string;
  currentColor: string;
  onUpdateAnnotation: (annotationId: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (annotationId: string) => void;
}

export default function AnnotationOverlay({
  annotations,
  canvasWidth,
  canvasHeight,
  drawingData,
  currentTool,
  currentColor,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AnnotationOverlayProps) {
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  /**
   * Render a highlight annotation
   */
  const renderHighlight = (annotation: Annotation) => {
    if (!annotation.rect) return null;

    return (
      <rect
        key={annotation.id}
        x={annotation.rect.x}
        y={annotation.rect.y}
        width={annotation.rect.w}
        height={annotation.rect.h}
        fill={annotation.color_rgba || 'rgba(255,235,59,0.45)'}
        stroke={selectedAnnotationId === annotation.id ? '#000' : 'transparent'}
        strokeWidth={selectedAnnotationId === annotation.id ? 2 : 0}
        strokeDasharray={selectedAnnotationId === annotation.id ? '5,5' : undefined}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnnotationId(annotation.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this highlight?')) {
            onDeleteAnnotation(annotation.id);
            setSelectedAnnotationId(null);
          }
        }}
      />
    );
  };

  /**
   * Render a pen stroke annotation
   */
  const renderPenStroke = (annotation: Annotation) => {
    if (!annotation.path || annotation.path.length < 2) return null;

    const pathData = annotation.path
      .map((point, index) => {
        if (index === 0) {
          return `M ${point.x} ${point.y}`;
        }
        return `L ${point.x} ${point.y}`;
      })
      .join(' ');

    return (
      <path
        key={annotation.id}
        d={pathData}
        stroke={annotation.color_rgba || 'rgba(33,150,243,1)'}
        strokeWidth={annotation.stroke_width || 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnnotationId(annotation.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this pen stroke?')) {
            onDeleteAnnotation(annotation.id);
            setSelectedAnnotationId(null);
          }
        }}
      />
    );
  };

  /**
   * Render an underline annotation
   */
  const renderUnderline = (annotation: Annotation) => {
    if (!annotation.rect) return null;

    return (
      <line
        key={annotation.id}
        x1={annotation.rect.x}
        y1={annotation.rect.y + annotation.rect.h}
        x2={annotation.rect.x + annotation.rect.w}
        y2={annotation.rect.y + annotation.rect.h}
        stroke={annotation.color_rgba || 'rgba(244,67,54,1)'}
        strokeWidth={annotation.stroke_width || 2}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAnnotationId(annotation.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (confirm('Delete this underline?')) {
            onDeleteAnnotation(annotation.id);
            setSelectedAnnotationId(null);
          }
        }}
      />
    );
  };

  /**
   * Render current drawing preview
   */
  const renderDrawingPreview = () => {
    if (!drawingData) return null;

    if (currentTool === 'highlight' || currentTool === 'comment') {
      const rect = {
        x: Math.min(drawingData.startX, drawingData.currentX),
        y: Math.min(drawingData.startY, drawingData.currentY),
        w: Math.abs(drawingData.currentX - drawingData.startX),
        h: Math.abs(drawingData.currentY - drawingData.startY),
      };

      return (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill={currentTool === 'comment' ? 'rgba(244,67,54,0.3)' : currentColor}
          stroke={currentTool === 'comment' ? '#F44336' : '#000'}
          strokeWidth={1}
          strokeDasharray="5,5"
          pointerEvents="none"
        />
      );
    } else if (currentTool === 'pen' && drawingData.path && drawingData.path.length > 1) {
      const pathData = drawingData.path
        .map((point, index) => {
          if (index === 0) {
            return `M ${point.x} ${point.y}`;
          }
          return `L ${point.x} ${point.y}`;
        })
        .join(' ');

      return (
        <path
          d={pathData}
          stroke={currentColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      );
    }

    return null;
  };

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
      onClick={() => setSelectedAnnotationId(null)}
    >
      {/* SVG layer for highlights, pen strokes, underlines */}
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="pointer-events-auto"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Render existing annotations */}
        {annotations.map((annotation) => {
          if (annotation.type === 'highlight') {
            return renderHighlight(annotation);
          } else if (annotation.type === 'pen') {
            return renderPenStroke(annotation);
          } else if (annotation.type === 'underline') {
            return renderUnderline(annotation);
          }
          return null;
        })}

        {/* Render drawing preview */}
        {renderDrawingPreview()}
      </svg>

      {/* HTML layer for comment cards */}
      {annotations
        .filter((a) => a.type === 'comment')
        .map((annotation) => (
          <CommentCard
            key={annotation.id}
            annotation={annotation}
            isSelected={selectedAnnotationId === annotation.id}
            onSelect={() => setSelectedAnnotationId(annotation.id)}
            onUpdate={(updates: Partial<Annotation>) => onUpdateAnnotation(annotation.id, updates)}
            onDelete={() => {
              if (confirm('Delete this comment?')) {
                onDeleteAnnotation(annotation.id);
                setSelectedAnnotationId(null);
              }
            }}
          />
        ))}
    </div>
  );
}

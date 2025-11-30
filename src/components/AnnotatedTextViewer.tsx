/**
 * AnnotatedTextViewer Component
 * 
 * Displays essay text with inline annotations (highlights and feedback)
 * Allows teachers to approve, edit, reject, or add new annotations
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Check, 
  X, 
  Edit2, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  CheckCheck 
} from 'lucide-react';
import type { Annotation, AnnotationStatus } from '@/lib/annotations/types';
import type { RubricJSON } from '@/lib/calculator/types';
import { addLineNumbers } from '@/lib/annotations/lineNumbers';
import { getAnnotationDisplayLabel } from '@/lib/annotations/display';

interface AnnotatedTextViewerProps {
  text: string;
  submissionId: string;
  annotations: Annotation[];
  rubric?: RubricJSON | null;
  onAnnotationUpdate: (annotationId: string, updates: Partial<Annotation>) => Promise<void>;
  onAnnotationAdd: (annotation: Omit<Annotation, 'annotation_id'>) => Promise<void>;
}

export default function AnnotatedTextViewer({
  text,
  submissionId: _submissionId,
  annotations,
  rubric,
  onAnnotationUpdate,
  onAnnotationAdd: _onAnnotationAdd,
}: AnnotatedTextViewerProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [viewMode, setViewMode] = useState<'original' | 'annotated'>('annotated');

  // Group annotations by status
  const groupedAnnotations = {
    ai_suggested: annotations.filter(a => a.status === 'ai_suggested'),
    teacher_edited: annotations.filter(a => a.status === 'teacher_edited'),
    teacher_approved: annotations.filter(a => a.status === 'teacher_approved'),
    teacher_rejected: annotations.filter(a => a.status === 'teacher_rejected'),
    teacher_created: annotations.filter(a => a.status === 'teacher_created'),
  };

  const handleApprove = async (annotationId: string) => {
    await onAnnotationUpdate(annotationId, { status: 'teacher_approved' });
  };

  const handleReject = async (annotationId: string) => {
    await onAnnotationUpdate(annotationId, { status: 'teacher_rejected' });
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation.annotation_id!);
    setEditText(annotation.suggestion);
  };

  const handleSaveEdit = async (annotationId: string) => {
    await onAnnotationUpdate(annotationId, { 
      suggestion: editText,
      status: 'teacher_edited' 
    });
    setEditingAnnotation(null);
  };

  const handleApproveAll = async () => {
    // Get all annotations that are not already approved
    const toApprove = annotations.filter(
      a => a.status === 'ai_suggested' || a.status === 'teacher_edited'
    );
    
    // Approve all in parallel
    await Promise.all(
      toApprove.map(annotation => 
        onAnnotationUpdate(annotation.annotation_id!, { status: 'teacher_approved' })
      )
    );
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: AnnotationStatus) => {
    switch (status) {
      case 'ai_suggested':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'teacher_edited':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'teacher_approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'teacher_rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher_created':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    }
  };

  // Render text with highlights
  const renderAnnotatedText = () => {
    if (viewMode === 'original') {
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm leading-loose text-gray-800 dark:text-gray-200">
          {addLineNumbers(text)}
        </pre>
      );
    }

    // Sort annotations by start_offset
    const sortedAnnotations = [...annotations]
      .filter(a => a.status !== 'teacher_rejected')
      .sort((a, b) => a.start_offset - b.start_offset);

    const lines = text.split('\n');

    return (
      <div className="font-mono text-sm leading-loose">
        {lines.map((line, lineIdx) => {
          const lineNumber = lineIdx + 1;
          const lineAnnotations = sortedAnnotations.filter(a => a.line_number === lineNumber);
          const lineNum = lineNumber.toString().padStart(3, '0');

          return (
            <div key={lineIdx} className="mb-4">
              {/* Line with number in fixed column */}
              <div className="flex">
                <div className="flex-shrink-0 w-12 text-gray-400 select-none">
                  {lineNum}|
                </div>
                <div className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {line}
                </div>
              </div>
              {lineAnnotations.map(annotation => (
                <div
                  key={annotation.annotation_id}
                  className={`mt-2 ml-12 p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                    selectedAnnotation === annotation.annotation_id
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                  onClick={() => setSelectedAnnotation(annotation.annotation_id!)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getSeverityIcon(annotation.severity)}
                    <Badge className={getStatusColor(annotation.status)}>
                      {getAnnotationDisplayLabel(annotation, rubric)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      "{annotation.quote}"
                    </span>
                  </div>

                  {editingAnnotation === annotation.annotation_id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(annotation.annotation_id!)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnnotation(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-red-600 dark:text-red-400 italic mb-2">
                        {annotation.suggestion}
                      </p>

                      {annotation.status === 'ai_suggested' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(annotation.annotation_id!);
                            }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(annotation);
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(annotation.annotation_id!);
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'annotated' ? 'default' : 'outline'}
            onClick={() => setViewMode('annotated')}
          >
            Annotated
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'original' ? 'default' : 'outline'}
            onClick={() => setViewMode('original')}
          >
            Original
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleApproveAll}
            className="ml-4 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
            disabled={groupedAnnotations.ai_suggested.length === 0 && groupedAnnotations.teacher_edited.length === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Approve All
          </Button>
        </div>

        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-50">
            {groupedAnnotations.ai_suggested.length} AI Suggested
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {groupedAnnotations.teacher_approved.length} Approved
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            {groupedAnnotations.teacher_rejected.length} Rejected
          </Badge>
        </div>
      </div>

      {/* Annotated Text */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
        {renderAnnotatedText()}
      </div>
    </div>
  );
}

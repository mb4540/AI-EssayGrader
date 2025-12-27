/**
 * AnnotatedTextViewer Component
 * 
 * Displays essay text with inline annotations (highlights and feedback)
 * Allows teachers to approve, edit, reject, or add new annotations
 */

import { useState, useRef, useCallback } from 'react';
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
  CheckCheck,
  Plus,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { sendAnnotationChat } from '@/lib/api';
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

// Selection state for creating new annotations
interface TextSelection {
  lineNumber: number;
  startOffset: number;
  endOffset: number;
  quote: string;
}

// Chat message type
interface ChatMessage {
  role: 'teacher' | 'assistant';
  content: string;
}

export default function AnnotatedTextViewer({
  text,
  submissionId,
  annotations,
  rubric,
  onAnnotationUpdate,
  onAnnotationAdd,
}: AnnotatedTextViewerProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [viewMode, setViewMode] = useState<'original' | 'annotated'>('annotated');

  // Text selection state for creating annotations
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSeverity, setCreateSeverity] = useState<'warning' | 'error'>('warning');
  const [createCategory, setCreateCategory] = useState<string>('');
  const [createSuggestion, setCreateSuggestion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  // Handle text selection for creating new annotations
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textContainerRef.current) {
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Find the line element containing the selection
    let lineElement = range.startContainer.parentElement;
    while (lineElement && !lineElement.hasAttribute('data-line-number')) {
      lineElement = lineElement.parentElement;
    }

    if (!lineElement) {
      // Selection not within a line element
      return;
    }

    const lineNumber = parseInt(lineElement.getAttribute('data-line-number') || '0', 10);
    if (lineNumber < 1) return;

    // Check if selection spans multiple lines
    let endLineElement = range.endContainer.parentElement;
    while (endLineElement && !endLineElement.hasAttribute('data-line-number')) {
      endLineElement = endLineElement.parentElement;
    }

    if (endLineElement && endLineElement !== lineElement) {
      alert('Please select text within a single line for now.');
      selection.removeAllRanges();
      return;
    }

    // Calculate offsets within the line
    const lines = text.split('\n');
    const lineText = lines[lineNumber - 1] || '';
    const startOffset = lineText.indexOf(selectedText);

    if (startOffset === -1) {
      // Could not find exact match, use approximate
      return;
    }

    // Calculate global offsets
    let globalStartOffset = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      globalStartOffset += lines[i].length + 1; // +1 for newline
    }
    globalStartOffset += startOffset;

    setTextSelection({
      lineNumber,
      startOffset: globalStartOffset,
      endOffset: globalStartOffset + selectedText.length,
      quote: selectedText,
    });
    setShowCreateForm(true);
    setCreateCategory('');
    setCreateSuggestion('');
    setCreateSeverity('warning');
  }, [text]);

  // Create new annotation
  const handleCreateAnnotation = async () => {
    if (!textSelection || !createCategory || !createSuggestion.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      await onAnnotationAdd({
        submission_id: submissionId,
        line_number: textSelection.lineNumber,
        start_offset: textSelection.startOffset,
        end_offset: textSelection.endOffset,
        quote: textSelection.quote,
        category: createCategory,
        suggestion: createSuggestion,
        severity: createSeverity,
        status: 'teacher_created',
      });
      setShowCreateForm(false);
      setTextSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Failed to create annotation:', error);
      alert('Failed to create annotation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Cancel annotation creation
  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedAnnotation) return;

    const teacherMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'teacher', content: teacherMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const result = await sendAnnotationChat({
        submission_id: submissionId,
        annotation_id: selectedAnnotation,
        teacher_prompt: teacherMessage,
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Get category options from rubric
  const getCategoryOptions = () => {
    const options: { id: string; name: string; isRubric: boolean }[] = [];
    
    // Add rubric criteria if available
    if (rubric?.criteria) {
      rubric.criteria.forEach(c => {
        options.push({ id: c.id, name: c.name, isRubric: true });
      });
    }
    
    // Add general categories
    options.push({ id: 'grammar', name: 'Grammar', isRubric: false });
    options.push({ id: 'spelling', name: 'Spelling', isRubric: false });
    options.push({ id: 'punctuation', name: 'Punctuation', isRubric: false });
    
    return options;
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
                <div 
                  className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words"
                  data-line-number={lineNumber}
                >
                  {line}
                </div>
              </div>
              {lineAnnotations.map(annotation => {
                const isNonGraded = annotation.category === 'non_graded' || annotation.affects_grade === false;
                return (
                <div
                  key={annotation.annotation_id}
                  className={`mt-2 ml-12 p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                    selectedAnnotation === annotation.annotation_id
                      ? isNonGraded
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      : isNonGraded
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-600'
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
                  
                  {/* Non-graded indicator */}
                  {isNonGraded && (
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      ℹ️ Does not affect grade
                    </div>
                  )}
                </div>
              );
              })}
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

      {/* Create Annotation Form */}
      {showCreateForm && textSelection && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-2 border-indigo-300 dark:border-indigo-600">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-indigo-800 dark:text-indigo-200">Create Annotation</span>
          </div>
          
          <div className="mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected text: </span>
            <span className="text-sm font-mono bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
              "{textSelection.quote}"
            </span>
            <span className="text-xs text-gray-500 ml-2">(Line {textSelection.lineNumber})</span>
          </div>

          {/* Severity Toggle */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Severity</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={createSeverity === 'warning' ? 'default' : 'outline'}
                onClick={() => setCreateSeverity('warning')}
                className={createSeverity === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Warning
              </Button>
              <Button
                size="sm"
                variant={createSeverity === 'error' ? 'default' : 'outline'}
                onClick={() => setCreateSeverity('error')}
                className={createSeverity === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {getCategoryOptions().map(opt => (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={createCategory === opt.id ? 'default' : 'outline'}
                  onClick={() => setCreateCategory(opt.id)}
                  className={`text-xs ${opt.isRubric ? 'border-purple-300' : 'border-gray-300'}`}
                >
                  {opt.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Suggestion Text */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Feedback</label>
            <Textarea
              value={createSuggestion}
              onChange={(e) => setCreateSuggestion(e.target.value)}
              placeholder="Write your feedback for the student..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreateAnnotation}
              disabled={isCreating || !createCategory || !createSuggestion.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isCreating ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Creating...</>
              ) : (
                <><Plus className="w-3 h-3 mr-1" />Create Annotation</>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelCreate}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Annotated Text */}
      <div 
        ref={textContainerRef}
        className="bg-white dark:bg-slate-900 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto"
        onMouseUp={handleTextSelection}
      >
        {renderAnnotatedText()}
      </div>

      {/* Chat Panel for selected annotation */}
      {selectedAnnotation && showChat && (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-300 dark:border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-800 dark:text-slate-200">AI Assistant</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowChat(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-sm text-gray-500 italic">Ask the AI about this annotation...</p>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm ${
                  msg.role === 'teacher'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 ml-8'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
              placeholder="Ask about this annotation..."
              className="flex-1 px-3 py-2 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600"
              disabled={isChatLoading}
            />
            <Button size="sm" onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Chat Toggle Button when annotation is selected */}
      {selectedAnnotation && !showChat && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowChat(true);
              setChatMessages([]);
            }}
            className="text-slate-600"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI about this annotation
          </Button>
        </div>
      )}
    </div>
  );
}

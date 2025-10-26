import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/.netlify/functions';

// Annotation types matching database schema
export type AnnotationType = 'highlight' | 'comment' | 'pen' | 'underline';

export interface AnnotationRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnnotationPath {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  page_id: string;
  type: AnnotationType;
  rect?: AnnotationRect;
  path?: AnnotationPath[];
  color_rgba?: string;
  stroke_width?: number;
  text?: string;
  z_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnnotationPageData {
  id: string;
  submission_id: string;
  page_number: number;
  width_px: number;
  height_px: number;
  annotations: Annotation[];
}

interface UpsertOperation {
  action: 'create' | 'update' | 'delete';
  annotation?: Annotation;
  annotation_id?: string;
}

interface AnnotationsState {
  annotations: Annotation[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  pageData: AnnotationPageData | null;
}

interface UseAnnotationsOptions {
  submissionId: string;
  pageNumber: number;
  canvasWidth: number;
  canvasHeight: number;
  autosaveDelay?: number; // milliseconds, default 800
  enableVersioning?: boolean; // Enable undo/redo snapshots
}

/**
 * Hook for managing PDF/DOCX annotations
 * - Fetches annotations from API
 * - Provides add/update/delete operations
 * - Debounced autosave (800ms default)
 * - Undo/redo stack support
 */
export function useAnnotations({
  submissionId,
  pageNumber,
  canvasWidth,
  canvasHeight,
  autosaveDelay = 800,
  enableVersioning = true,
}: UseAnnotationsOptions) {
  const [state, setState] = useState<AnnotationsState>({
    annotations: [],
    isLoading: true,
    isSaving: false,
    error: null,
    pageData: null,
  });

  // Pending operations queue for batch autosave
  const pendingOpsRef = useRef<UpsertOperation[]>([]);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Fetch annotations on mount or when page changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchAnnotations();

    return () => {
      isMountedRef.current = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [submissionId, pageNumber]);

  /**
   * Fetch annotations for current page
   */
  const fetchAnnotations = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `${API_BASE}/annotations-get?submission_id=${submissionId}&page_number=${pageNumber}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch annotations');
      }

      const data: AnnotationPageData = await response.json();

      if (isMountedRef.current) {
        setState({
          annotations: data.annotations || [],
          isLoading: false,
          isSaving: false,
          error: null,
          pageData: data,
        });
      }
    } catch (error) {
      console.error('Fetch annotations error:', error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load annotations',
        }));
      }
    }
  }, [submissionId, pageNumber]);

  /**
   * Save pending operations to server (batched)
   */
  const savePendingOperations = useCallback(async () => {
    if (pendingOpsRef.current.length === 0) return;

    const opsToSave = [...pendingOpsRef.current];
    pendingOpsRef.current = [];

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const response = await fetch(`${API_BASE}/annotations-upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          page_number: pageNumber,
          width_px: canvasWidth,
          height_px: canvasHeight,
          ops: opsToSave,
          create_version: enableVersioning,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save annotations');
      }

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isSaving: false, error: null }));
      }
    } catch (error) {
      console.error('Save annotations error:', error);
      // Re-queue failed operations
      pendingOpsRef.current.unshift(...opsToSave);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error.message : 'Failed to save annotations',
        }));
      }
    }
  }, [submissionId, pageNumber, canvasWidth, canvasHeight, enableVersioning]);

  /**
   * Schedule autosave with debounce
   */
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      savePendingOperations();
    }, autosaveDelay);
  }, [savePendingOperations, autosaveDelay]);

  /**
   * Push current state to undo stack
   */
  const pushToUndoStack = useCallback(() => {
    if (!enableVersioning) return;
    setUndoStack((prev) => [...prev, [...state.annotations]]);
    setRedoStack([]); // Clear redo stack on new action
  }, [state.annotations, enableVersioning]);

  /**
   * Add new annotation
   */
  const addAnnotation = useCallback(
    (annotation: Omit<Annotation, 'id' | 'page_id' | 'created_at' | 'updated_at'>) => {
      pushToUndoStack();

      const newAnnotation: Annotation = {
        ...annotation,
        id: `temp-${Date.now()}-${Math.random()}`,
        page_id: state.pageData?.id || '',
        z_index: annotation.z_index ?? state.annotations.length,
      };

      setState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newAnnotation],
      }));

      pendingOpsRef.current.push({
        action: 'create',
        annotation: newAnnotation,
      });

      scheduleAutosave();
      return newAnnotation.id;
    },
    [state.annotations, state.pageData, pushToUndoStack, scheduleAutosave]
  );

  /**
   * Update existing annotation
   */
  const updateAnnotation = useCallback(
    (annotationId: string, updates: Partial<Annotation>) => {
      pushToUndoStack();

      setState((prev) => ({
        ...prev,
        annotations: prev.annotations.map((a) =>
          a.id === annotationId ? { ...a, ...updates } : a
        ),
      }));

      const updatedAnnotation = state.annotations.find((a) => a.id === annotationId);
      if (updatedAnnotation) {
        pendingOpsRef.current.push({
          action: 'update',
          annotation: { ...updatedAnnotation, ...updates },
        });
      }

      scheduleAutosave();
    },
    [state.annotations, pushToUndoStack, scheduleAutosave]
  );

  /**
   * Delete annotation
   */
  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      pushToUndoStack();

      setState((prev) => ({
        ...prev,
        annotations: prev.annotations.filter((a) => a.id !== annotationId),
      }));

      pendingOpsRef.current.push({
        action: 'delete',
        annotation_id: annotationId,
      });

      scheduleAutosave();
    },
    [pushToUndoStack, scheduleAutosave]
  );

  /**
   * Clear all annotations on current page
   */
  const clearAnnotations = useCallback(() => {
    pushToUndoStack();

    const annotationsToDelete = [...state.annotations];
    setState((prev) => ({ ...prev, annotations: [] }));

    annotationsToDelete.forEach((annotation) => {
      pendingOpsRef.current.push({
        action: 'delete',
        annotation_id: annotation.id,
      });
    });

    scheduleAutosave();
  }, [state.annotations, pushToUndoStack, scheduleAutosave]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack((prev) => [...prev, [...state.annotations]]);
    setUndoStack(newUndoStack);

    setState((prev) => ({ ...prev, annotations: previousState }));

    // Queue operations to restore previous state
    // (simplified - in production, consider storing actual operations)
    savePendingOperations();
  }, [undoStack, state.annotations, savePendingOperations]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack((prev) => [...prev, [...state.annotations]]);
    setRedoStack(newRedoStack);

    setState((prev) => ({ ...prev, annotations: nextState }));

    savePendingOperations();
  }, [redoStack, state.annotations, savePendingOperations]);

  /**
   * Force immediate save (bypass debounce)
   */
  const forceSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    await savePendingOperations();
  }, [savePendingOperations]);

  return {
    // State
    annotations: state.annotations,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    pageData: state.pageData,

    // Actions
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAnnotations,
    refresh: fetchAnnotations,
    forceSave,

    // Undo/Redo
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

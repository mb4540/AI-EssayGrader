/**
 * Type definitions for inline annotations
 */

export type AnnotationStatus = 
  | 'ai_suggested' 
  | 'teacher_edited' 
  | 'teacher_rejected' 
  | 'teacher_approved' 
  | 'teacher_created';

export type AnnotationSeverity = 'info' | 'warning' | 'error';

export type AnnotationCategory = 
  | 'Spelling'
  | 'Grammar'
  | 'Punctuation'
  | 'Organization'
  | 'Clarity'
  | 'Evidence'
  | 'Style'
  | 'Other';

/**
 * Annotation from LLM (before normalization)
 */
export interface RawAnnotation {
  line: number;
  quote: string;
  category: string;
  suggestion: string;
  severity?: AnnotationSeverity;
}

/**
 * Normalized annotation (after validation and offset calculation)
 */
export interface Annotation {
  annotation_id?: string;
  submission_id: string;
  line_number: number;
  start_offset: number;
  end_offset: number;
  quote: string;
  category: AnnotationCategory;
  suggestion: string;
  severity?: AnnotationSeverity;
  status: AnnotationStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  ai_payload?: RawAnnotation;
}

/**
 * Annotation event for audit trail
 */
export interface AnnotationEvent {
  event_id?: string;
  annotation_id: string;
  event_type: 
    | 'ai_created' 
    | 'teacher_edit' 
    | 'teacher_reject' 
    | 'teacher_approve' 
    | 'teacher_create'
    | 'teacher_delete';
  payload: Record<string, unknown>;
  created_by?: string;
  created_at?: string;
}

/**
 * Extended feedback structure with inline annotations
 */
export interface ExtendedFeedback {
  grammar_findings?: string[];
  spelling_findings?: string[];
  punctuation_findings?: string[];
  strengths?: string[];
  areas_for_improvement?: string[];
  top_3_suggestions?: string[];
  
  // NEW: Inline annotations with line numbers
  inline_annotations?: RawAnnotation[];
}

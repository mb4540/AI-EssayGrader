/**
 * Document Types for ELA/English
 * Simplified implementation - ELA only
 */

export interface DocumentType {
  id: string;
  label: string;
  description?: string;
}

/**
 * ELA Document Types
 * Common writing types for English/Language Arts
 */
export const ELA_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'personal_narrative',
    label: 'Personal Narrative',
    description: 'A story about a personal experience',
  },
  {
    id: 'argumentative',
    label: 'Argumentative Essay',
    description: 'Takes a position and supports it with evidence',
  },
  {
    id: 'informational',
    label: 'Informational/Explanatory',
    description: 'Explains a topic or process',
  },
  {
    id: 'literary_analysis',
    label: 'Literary Analysis',
    description: 'Analyzes a piece of literature',
  },
  {
    id: 'compare_contrast',
    label: 'Compare & Contrast',
    description: 'Compares two or more things',
  },
  {
    id: 'research_paper',
    label: 'Research Paper',
    description: 'In-depth research on a topic',
  },
  {
    id: 'book_review',
    label: 'Book Review/Report',
    description: 'Review or summary of a book',
  },
  {
    id: 'descriptive',
    label: 'Descriptive Essay',
    description: 'Describes a person, place, or thing',
  },
  {
    id: 'creative_writing',
    label: 'Creative Writing/Short Story',
    description: 'Original creative fiction',
  },
  {
    id: 'poetry',
    label: 'Poetry',
    description: 'Original poem',
  },
  {
    id: 'reflection',
    label: 'Reflection',
    description: 'Reflects on learning or experience',
  },
  {
    id: 'summary',
    label: 'Summary',
    description: 'Summarizes a text or event',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other writing type',
  },
];

/**
 * Get document type by ID
 */
export function getDocumentType(id: string): DocumentType | undefined {
  return ELA_DOCUMENT_TYPES.find((type) => type.id === id);
}

/**
 * Get document type label by ID
 */
export function getDocumentTypeLabel(id: string): string {
  const type = getDocumentType(id);
  return type?.label || 'Essay';
}

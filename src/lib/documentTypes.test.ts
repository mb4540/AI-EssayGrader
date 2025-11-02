// Document Types Tests
// Tests for ELA document type definitions and utilities

import { describe, it, expect } from 'vitest';
import { ELA_DOCUMENT_TYPES, getDocumentType, getDocumentTypeLabel } from './documentTypes';

describe('Document Types', () => {
  describe('ELA_DOCUMENT_TYPES', () => {
    it('should have 13 document types', () => {
      expect(ELA_DOCUMENT_TYPES).toHaveLength(13);
    });

    it('should have all required fields for each type', () => {
      ELA_DOCUMENT_TYPES.forEach(type => {
        expect(type.id).toBeDefined();
        expect(type.label).toBeDefined();
        expect(type.id.length).toBeGreaterThan(0);
        expect(type.label.length).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs', () => {
      const ids = ELA_DOCUMENT_TYPES.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have grading focus for each type', () => {
      ELA_DOCUMENT_TYPES.forEach(type => {
        expect(type.gradingFocus).toBeDefined();
        expect(type.gradingFocus!.length).toBeGreaterThan(0);
      });
    });

    it('should have rubric template for each type', () => {
      ELA_DOCUMENT_TYPES.forEach(type => {
        expect(type.rubricTemplate).toBeDefined();
        expect(type.rubricTemplate!.length).toBeGreaterThan(0);
      });
    });

    it('should include personal_narrative type', () => {
      const type = ELA_DOCUMENT_TYPES.find(t => t.id === 'personal_narrative');
      expect(type).toBeDefined();
      expect(type!.label).toBe('Personal Narrative');
    });

    it('should include argumentative type', () => {
      const type = ELA_DOCUMENT_TYPES.find(t => t.id === 'argumentative');
      expect(type).toBeDefined();
      expect(type!.label).toBe('Argumentative Essay');
    });

    it('should include informational type', () => {
      const type = ELA_DOCUMENT_TYPES.find(t => t.id === 'informational');
      expect(type).toBeDefined();
      expect(type!.label).toBe('Informational/Explanatory');
    });

    it('should include literary_analysis type', () => {
      const type = ELA_DOCUMENT_TYPES.find(t => t.id === 'literary_analysis');
      expect(type).toBeDefined();
      expect(type!.label).toBe('Literary Analysis');
    });

    it('should include other type as fallback', () => {
      const type = ELA_DOCUMENT_TYPES.find(t => t.id === 'other');
      expect(type).toBeDefined();
      expect(type!.label).toBe('Other');
    });

    it('should have descriptions for all types', () => {
      ELA_DOCUMENT_TYPES.forEach(type => {
        expect(type.description).toBeDefined();
        expect(type.description!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getDocumentType', () => {
    it('should return document type by ID', () => {
      const type = getDocumentType('argumentative');
      
      expect(type).toBeDefined();
      expect(type!.id).toBe('argumentative');
      expect(type!.label).toBe('Argumentative Essay');
    });

    it('should return personal narrative type', () => {
      const type = getDocumentType('personal_narrative');
      
      expect(type).toBeDefined();
      expect(type!.label).toBe('Personal Narrative');
    });

    it('should return undefined for non-existent ID', () => {
      const type = getDocumentType('nonexistent');
      
      expect(type).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const type = getDocumentType('');
      
      expect(type).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const type = getDocumentType('ARGUMENTATIVE');
      
      expect(type).toBeUndefined();
    });

    it('should return type with all fields', () => {
      const type = getDocumentType('literary_analysis');
      
      expect(type).toBeDefined();
      expect(type!.id).toBe('literary_analysis');
      expect(type!.label).toBeDefined();
      expect(type!.description).toBeDefined();
      expect(type!.gradingFocus).toBeDefined();
      expect(type!.rubricTemplate).toBeDefined();
    });
  });

  describe('getDocumentTypeLabel', () => {
    it('should return label for valid ID', () => {
      const label = getDocumentTypeLabel('argumentative');
      
      expect(label).toBe('Argumentative Essay');
    });

    it('should return label for personal narrative', () => {
      const label = getDocumentTypeLabel('personal_narrative');
      
      expect(label).toBe('Personal Narrative');
    });

    it('should return "Essay" for non-existent ID', () => {
      const label = getDocumentTypeLabel('nonexistent');
      
      expect(label).toBe('Essay');
    });

    it('should return "Essay" for empty string', () => {
      const label = getDocumentTypeLabel('');
      
      expect(label).toBe('Essay');
    });

    it('should return "Essay" for undefined ID', () => {
      const label = getDocumentTypeLabel('undefined');
      
      expect(label).toBe('Essay');
    });

    it('should return correct labels for all types', () => {
      expect(getDocumentTypeLabel('personal_narrative')).toBe('Personal Narrative');
      expect(getDocumentTypeLabel('argumentative')).toBe('Argumentative Essay');
      expect(getDocumentTypeLabel('informational')).toBe('Informational/Explanatory');
      expect(getDocumentTypeLabel('literary_analysis')).toBe('Literary Analysis');
      expect(getDocumentTypeLabel('compare_contrast')).toBe('Compare & Contrast');
      expect(getDocumentTypeLabel('research_paper')).toBe('Research Paper');
      expect(getDocumentTypeLabel('book_review')).toBe('Book Review/Report');
      expect(getDocumentTypeLabel('descriptive')).toBe('Descriptive Essay');
      expect(getDocumentTypeLabel('creative_writing')).toBe('Creative Writing/Short Story');
      expect(getDocumentTypeLabel('poetry')).toBe('Poetry');
      expect(getDocumentTypeLabel('reflection')).toBe('Reflection');
      expect(getDocumentTypeLabel('summary')).toBe('Summary');
      expect(getDocumentTypeLabel('other')).toBe('Other');
    });
  });

  describe('Rubric Templates', () => {
    it('should have multi-line rubric templates', () => {
      const type = getDocumentType('argumentative');
      
      expect(type!.rubricTemplate).toContain('\n');
      expect(type!.rubricTemplate).toContain('Claim/Thesis');
      expect(type!.rubricTemplate).toContain('Evidence');
    });

    it('should have relevant criteria in templates', () => {
      const narrative = getDocumentType('personal_narrative');
      expect(narrative!.rubricTemplate).toContain('Narrative Elements');
      
      const argumentative = getDocumentType('argumentative');
      expect(argumentative!.rubricTemplate).toContain('Counterarguments');
      
      const research = getDocumentType('research_paper');
      expect(research!.rubricTemplate).toContain('Citations');
    });
  });

  describe('Grading Focus', () => {
    it('should have detailed grading focus', () => {
      const type = getDocumentType('argumentative');
      
      expect(type!.gradingFocus).toContain('claim');
      expect(type!.gradingFocus).toContain('evidence');
      expect(type!.gradingFocus).toContain('reasoning');
    });

    it('should provide guidance for each type', () => {
      ELA_DOCUMENT_TYPES.forEach(type => {
        expect(type.gradingFocus!.length).toBeGreaterThan(50);
        expect(type.gradingFocus).toContain('Focus on');
      });
    });
  });
});

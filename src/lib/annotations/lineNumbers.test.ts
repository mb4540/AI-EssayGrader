// Line Number Utilities Tests
// Tests for adding/removing line numbers and finding text locations in essays

import { describe, it, expect } from 'vitest';
import {
  addLineNumbers,
  removeLineNumbers,
  findTextLocation,
  validateAnnotationLocation,
} from './lineNumbers';

describe('Line Number Utilities', () => {
  describe('addLineNumbers', () => {
    it('should add zero-padded line numbers to single line', () => {
      const text = 'This is a test.';
      const result = addLineNumbers(text);
      expect(result).toBe('001| This is a test.');
    });

    it('should add line numbers to multiple lines', () => {
      const text = 'Line one\nLine two\nLine three';
      const result = addLineNumbers(text);
      
      expect(result).toBe('001| Line one\n002| Line two\n003| Line three');
    });

    it('should use minimum 3 digits for padding', () => {
      const text = 'Line 1\nLine 2';
      const result = addLineNumbers(text);
      
      expect(result).toContain('001|');
      expect(result).toContain('002|');
    });

    it('should expand padding for > 999 lines', () => {
      const lines = Array(1001).fill('text').join('\n');
      const result = addLineNumbers(lines);
      
      // Should use 4 digits for 1001 lines
      expect(result).toContain('0001|');
      expect(result).toContain('1001|');
    });

    it('should handle empty string', () => {
      const result = addLineNumbers('');
      expect(result).toBe('001| ');
    });

    it('should handle text with trailing newline', () => {
      const text = 'Line one\nLine two\n';
      const result = addLineNumbers(text);
      
      expect(result).toBe('001| Line one\n002| Line two\n003| ');
    });

    it('should preserve empty lines', () => {
      const text = 'Line one\n\nLine three';
      const result = addLineNumbers(text);
      
      expect(result).toBe('001| Line one\n002| \n003| Line three');
    });
  });

  describe('removeLineNumbers', () => {
    it('should remove line numbers from single line', () => {
      const text = '001| This is a test.';
      const result = removeLineNumbers(text);
      expect(result).toBe('This is a test.');
    });

    it('should remove line numbers from multiple lines', () => {
      const text = '001| Line one\n002| Line two\n003| Line three';
      const result = removeLineNumbers(text);
      
      expect(result).toBe('Line one\nLine two\nLine three');
    });

    it('should handle text without line numbers', () => {
      const text = 'Line one\nLine two';
      const result = removeLineNumbers(text);
      
      expect(result).toBe('Line one\nLine two');
    });

    it('should handle 4-digit line numbers', () => {
      const text = '0001| Line one\n1000| Line thousand';
      const result = removeLineNumbers(text);
      
      expect(result).toBe('Line one\nLine thousand');
    });

    it('should preserve content after pipe', () => {
      const text = '001| This has a | pipe character';
      const result = removeLineNumbers(text);
      
      expect(result).toBe('This has a | pipe character');
    });
  });

  describe('addLineNumbers and removeLineNumbers - round trip', () => {
    it('should be reversible', () => {
      const original = 'Line one\nLine two\nLine three';
      const withNumbers = addLineNumbers(original);
      const restored = removeLineNumbers(withNumbers);
      
      expect(restored).toBe(original);
    });

    it('should handle complex text', () => {
      const original = 'This is a test essay.\n\nIt has multiple paragraphs.\nAnd special characters: !@#$%';
      const withNumbers = addLineNumbers(original);
      const restored = removeLineNumbers(withNumbers);
      
      expect(restored).toBe(original);
    });
  });

  describe('findTextLocation', () => {
    const sampleText = `This is line one.
This is line two with more text.
This is line three.
This is line four.`;

    it('should find exact match at suggested line', () => {
      const result = findTextLocation(sampleText, 'line two', 2);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(2);
      expect(result.startOffset).toBeGreaterThan(0);
      expect(result.endOffset).toBeGreaterThan(result.startOffset!);
    });

    it('should calculate correct offsets', () => {
      const result = findTextLocation(sampleText, 'line one', 1);
      
      expect(result.found).toBe(true);
      const extracted = sampleText.substring(result.startOffset!, result.endOffset!);
      expect(extracted).toBe('line one');
    });

    it('should find text when suggested line is wrong (fuzzy search)', () => {
      // Quote is on line 2, but we suggest line 1
      const result = findTextLocation(sampleText, 'line two', 1);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(2); // Should find it on correct line
    });

    it('should search ±2 lines from suggested line', () => {
      // Quote is on line 4, suggest line 2 (within ±2 range)
      const result = findTextLocation(sampleText, 'line four', 2);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(4);
    });

    it('should fall back to full document search', () => {
      // No suggested line
      const result = findTextLocation(sampleText, 'line three');
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(3);
    });

    it('should return not found for nonexistent text', () => {
      const result = findTextLocation(sampleText, 'nonexistent text', 1);
      
      expect(result.found).toBe(false);
      expect(result.line).toBeUndefined();
      expect(result.startOffset).toBeUndefined();
      expect(result.endOffset).toBeUndefined();
    });

    it('should handle quote at start of line', () => {
      const result = findTextLocation(sampleText, 'This is line one', 1);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(1);
    });

    it('should handle quote at end of line', () => {
      const result = findTextLocation(sampleText, 'more text.', 2);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(2);
    });

    it('should handle multi-word quotes', () => {
      const result = findTextLocation(sampleText, 'line two with more', 2);
      
      expect(result.found).toBe(true);
      const extracted = sampleText.substring(result.startOffset!, result.endOffset!);
      expect(extracted).toBe('line two with more');
    });

    it('should handle quotes spanning partial lines', () => {
      const result = findTextLocation(sampleText, 'is line two with', 2);
      
      expect(result.found).toBe(true);
      expect(result.line).toBe(2);
    });

    it('should handle empty quote', () => {
      const result = findTextLocation(sampleText, '', 1);
      
      // Empty string is found at position 0 (JavaScript indexOf behavior)
      expect(result.found).toBe(true);
      expect(result.startOffset).toBe(0);
      expect(result.endOffset).toBe(0);
    });

    it('should handle suggested line out of range', () => {
      const result = findTextLocation(sampleText, 'line one', 999);
      
      // Should still find it via full document search
      expect(result.found).toBe(true);
      expect(result.line).toBe(1);
    });

    it('should handle negative suggested line', () => {
      const result = findTextLocation(sampleText, 'line one', -1);
      
      // Should still find it via full document search
      expect(result.found).toBe(true);
      expect(result.line).toBe(1);
    });
  });

  describe('validateAnnotationLocation', () => {
    const sampleText = 'Line one\nLine two\nLine three';

    it('should validate correct location', () => {
      const result = validateAnnotationLocation(sampleText, 2, 9, 17);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject line number too low', () => {
      const result = validateAnnotationLocation(sampleText, 0, 0, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('out of range');
    });

    it('should reject line number too high', () => {
      const result = validateAnnotationLocation(sampleText, 999, 0, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('out of range');
    });

    it('should reject negative start offset', () => {
      const result = validateAnnotationLocation(sampleText, 1, -1, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid offsets');
    });

    it('should reject end offset before start offset', () => {
      const result = validateAnnotationLocation(sampleText, 1, 10, 5);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid offsets');
    });

    it('should reject end offset beyond text length', () => {
      const result = validateAnnotationLocation(sampleText, 1, 0, 999);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds text length');
    });

    it('should allow zero-length annotation (start === end)', () => {
      const result = validateAnnotationLocation(sampleText, 1, 5, 5);
      
      expect(result.valid).toBe(true);
    });

    it('should validate annotation at text boundaries', () => {
      const textLength = sampleText.length;
      const result = validateAnnotationLocation(sampleText, 3, 0, textLength);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Integration - Complete workflow', () => {
    it('should add line numbers, find location, and validate', () => {
      const original = 'This is a test essay.\nIt has multiple lines.\nFor testing purposes.';
      
      // Step 1: Add line numbers for LLM
      const withNumbers = addLineNumbers(original);
      expect(withNumbers).toContain('001|');
      expect(withNumbers).toContain('002|');
      
      // Step 2: LLM returns annotation with quote
      const quote = 'multiple lines';
      const suggestedLine = 2;
      
      // Step 3: Find location in original text
      const location = findTextLocation(original, quote, suggestedLine);
      expect(location.found).toBe(true);
      expect(location.line).toBe(2);
      
      // Step 4: Validate location
      const validation = validateAnnotationLocation(
        original,
        location.line!,
        location.startOffset!,
        location.endOffset!
      );
      expect(validation.valid).toBe(true);
      
      // Step 5: Extract text to verify
      const extracted = original.substring(location.startOffset!, location.endOffset!);
      expect(extracted).toBe(quote);
    });

    it('should handle fuzzy matching when LLM line number is off', () => {
      const original = 'Line 1\nLine 2\nLine 3\nLine 4';
      
      // LLM suggests line 1, but quote is actually on line 3
      const location = findTextLocation(original, 'Line 3', 1);
      
      expect(location.found).toBe(true);
      expect(location.line).toBe(3); // Corrected line
      
      const validation = validateAnnotationLocation(
        original,
        location.line!,
        location.startOffset!,
        location.endOffset!
      );
      expect(validation.valid).toBe(true);
    });
  });
});

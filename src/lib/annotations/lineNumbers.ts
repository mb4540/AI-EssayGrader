/**
 * Line numbering utilities for inline annotations
 * 
 * Adds zero-padded line numbers to essay text for LLM reference.
 * Line numbers are helpers only and should not appear in quoted text.
 */

/**
 * Add zero-padded line numbers to text
 * Format: "001| First line text"
 */
export function addLineNumbers(text: string): string {
  const lines = text.split('\n');
  const maxDigits = Math.max(3, lines.length.toString().length);
  
  return lines
    .map((line, index) => {
      const lineNum = (index + 1).toString().padStart(maxDigits, '0');
      return `${lineNum}| ${line}`;
    })
    .join('\n');
}

/**
 * Remove line numbers from text
 * Strips "001| " prefix from each line
 */
export function removeLineNumbers(text: string): string {
  return text
    .split('\n')
    .map(line => line.replace(/^\d+\|\s/, ''))
    .join('\n');
}

/**
 * Find text location in original essay
 * Returns line number and character offsets
 */
export function findTextLocation(
  originalText: string,
  quote: string,
  suggestedLine?: number
): {
  found: boolean;
  line?: number;
  startOffset?: number;
  endOffset?: number;
} {
  const lines = originalText.split('\n');
  
  // Try exact match at suggested line first
  if (suggestedLine && suggestedLine > 0 && suggestedLine <= lines.length) {
    const lineIndex = suggestedLine - 1;
    const lineText = lines[lineIndex];
    const index = lineText.indexOf(quote);
    
    if (index !== -1) {
      // Calculate character offset from start of document
      const startOffset = lines.slice(0, lineIndex).join('\n').length + 
                         (lineIndex > 0 ? 1 : 0) + // newline character
                         index;
      const endOffset = startOffset + quote.length;
      
      return {
        found: true,
        line: suggestedLine,
        startOffset,
        endOffset,
      };
    }
  }
  
  // Try fuzzy search ±2 lines
  if (suggestedLine) {
    const searchStart = Math.max(0, suggestedLine - 3);
    const searchEnd = Math.min(lines.length, suggestedLine + 2);
    
    for (let i = searchStart; i < searchEnd; i++) {
      const lineText = lines[i];
      const index = lineText.indexOf(quote);
      
      if (index !== -1) {
        const startOffset = lines.slice(0, i).join('\n').length + 
                           (i > 0 ? 1 : 0) +
                           index;
        const endOffset = startOffset + quote.length;
        
        return {
          found: true,
          line: i + 1,
          startOffset,
          endOffset,
        };
      }
    }
  }
  
  // Last resort: search entire document
  const fullText = lines.join('\n');
  const index = fullText.indexOf(quote);
  
  if (index !== -1) {
    // Find which line contains this offset
    let currentOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (currentOffset + lineLength > index) {
        return {
          found: true,
          line: i + 1,
          startOffset: index,
          endOffset: index + quote.length,
        };
      }
      currentOffset += lineLength;
    }
  }
  
  return { found: false };
}

/**
 * Validate annotation location
 * Ensures line number and offsets are valid
 */
export function validateAnnotationLocation(
  text: string,
  line: number,
  startOffset: number,
  endOffset: number
): { valid: boolean; error?: string } {
  const lines = text.split('\n');
  
  if (line < 1 || line > lines.length) {
    return {
      valid: false,
      error: `Line ${line} is out of range (1-${lines.length})`,
    };
  }
  
  if (startOffset < 0 || endOffset < startOffset) {
    return {
      valid: false,
      error: `Invalid offsets: start=${startOffset}, end=${endOffset}`,
    };
  }
  
  if (endOffset > text.length) {
    return {
      valid: false,
      error: `End offset ${endOffset} exceeds text length ${text.length}`,
    };
  }
  
  return { valid: true };
}

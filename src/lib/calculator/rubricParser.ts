/**
 * Rubric Parser - Extract structured rubrics from teacher's text
 * 
 * Parses various rubric formats:
 * - Point-based: "Category (XX pts):"
 * - Percentage-based: "Category (XX%):"
 * - Level descriptions with point ranges
 */

import type { RubricJSON } from './types';

/**
 * Parse teacher's rubric text into structured RubricJSON
 */
export function parseTeacherRubric(
  criteriaText: string,
  assignmentId: string = 'parsed',
  totalPoints?: number | null
): RubricJSON {
  if (!criteriaText || criteriaText.trim().length === 0) {
    throw new Error('Criteria text is empty');
  }

  const lines = criteriaText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Detect total points from text
  const detectedTotal = detectTotalPoints(lines);
  const finalTotal = totalPoints || detectedTotal || 100;
  
  // Extract categories with points
  const categories = extractCategories(lines, finalTotal);
  
  if (categories.length === 0) {
    throw new Error('No categories found in rubric text. Expected format: "**Category (XX pts):**"');
  }
  
  // Build criteria with levels
  const criteria = categories.map(cat => buildCriterion(cat, lines));
  
  // Determine scale mode
  const scaleMode = detectScaleMode(lines, finalTotal);
  
  return {
    rubric_id: `parsed-${assignmentId}`,
    title: 'Parsed Rubric',
    criteria,
    scale: {
      mode: scaleMode,
      total_points: scaleMode === 'points' ? finalTotal.toString() : null,
      rounding: {
        mode: 'HALF_UP',
        decimals: 2,
      },
    },
    schema_version: 1,
  };
}

/**
 * Detect total points from text
 */
function detectTotalPoints(lines: string[]): number | null {
  for (const line of lines) {
    // Match: "Scoring (100 pts total):" or "Total: 100 points"
    const totalMatch = line.match(/(?:total|scoring)[:\s]*\(?(\d+)\s*(?:pts?|points?)\)?/i);
    if (totalMatch) {
      return parseInt(totalMatch[1], 10);
    }
  }
  return null;
}

/**
 * Detect scale mode (percent vs points)
 */
function detectScaleMode(lines: string[], totalPoints: number): 'percent' | 'points' {
  // If total is 100, likely percent mode
  if (totalPoints === 100) {
    return 'percent';
  }
  
  // Check for explicit "out of X points" language
  const hasPointsLanguage = lines.some(l => 
    /out of \d+ points?/i.test(l) || 
    /total:?\s*\d+ points?/i.test(l)
  );
  
  return hasPointsLanguage ? 'points' : 'percent';
}

/**
 * Extract categories with point values
 */
interface Category {
  name: string;
  id: string;
  points: number;
  startLine: number;
}

function extractCategories(lines: string[], _totalPoints: number): Category[] {
  const categories: Category[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match: "**Category Name (XX pts):**" or "- **Category (XX pts):**"
    const categoryMatch = line.match(/[-*]*\s*\*\*(.+?)\s*\((\d+)\s*(?:pts?|points?)\)\*\*:?/i);
    
    if (categoryMatch) {
      const name = categoryMatch[1].trim();
      const points = parseInt(categoryMatch[2], 10);
      const id = name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      categories.push({
        name,
        id,
        points,
        startLine: i,
      });
    }
  }
  
  // If no categories found, try simpler format: "Category (XX pts)"
  if (categories.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const simpleMatch = line.match(/^[-*]?\s*(.+?)\s*\((\d+)\s*(?:pts?|points?)\)/i);
      
      if (simpleMatch) {
        const name = simpleMatch[1].trim().replace(/^\*\*|\*\*$/g, '');
        const points = parseInt(simpleMatch[2], 10);
        const id = name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50);
        
        categories.push({
          name,
          id,
          points,
          startLine: i,
        });
      }
    }
  }
  
  return categories;
}

/**
 * Build criterion with levels
 */
function buildCriterion(category: Category, allLines: string[]) {
  const { name, id, points, startLine } = category;
  
  // Extract level descriptions after this category
  const levels = extractLevels(allLines, startLine, points);
  
  // If no levels found, generate default levels
  const finalLevels = levels.length > 0 ? levels : generateDefaultLevels(points);
  
  return {
    id,
    name,
    max_points: points.toString(),
    weight: '1.0',
    levels: finalLevels,
  };
}

/**
 * Extract level descriptions from text
 */
interface Level {
  label: string;
  points: string;
  descriptor: string;
}

function extractLevels(lines: string[], startLine: number, _maxPoints: number): Level[] {
  const levels: Level[] = [];
  
  // Look at next 10 lines for level descriptions
  for (let i = startLine + 1; i < Math.min(startLine + 11, lines.length); i++) {
    const line = lines[i];
    
    // Stop if we hit another category
    if (/\*\*.*\(\d+\s*(?:pts?|points?)\)\*\*/.test(line)) {
      break;
    }
    
    // Match: "- 25-30 pts: Description" or "- Exemplary (25 pts): Description"
    const rangeMatch = line.match(/[-*]\s*(\d+)[-–](\d+)\s*(?:pts?|points?):\s*(.+)/i);
    const labelMatch = line.match(/[-*]\s*(\w+)\s*\((\d+)\s*(?:pts?|points?)\):\s*(.+)/i);
    
    if (rangeMatch) {
      const midPoint = (parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2;
      levels.push({
        label: `${rangeMatch[1]}-${rangeMatch[2]} pts`,
        points: midPoint.toFixed(1),
        descriptor: rangeMatch[3].trim(),
      });
    } else if (labelMatch) {
      levels.push({
        label: labelMatch[1],
        points: labelMatch[2],
        descriptor: labelMatch[3].trim(),
      });
    }
  }
  
  return levels;
}

/**
 * Generate default 4-level rubric
 */
function generateDefaultLevels(maxPoints: number): Level[] {
  return [
    {
      label: 'Exemplary',
      points: (maxPoints * 0.95).toFixed(1),
      descriptor: 'Exceeds expectations with exceptional quality',
    },
    {
      label: 'Proficient',
      points: (maxPoints * 0.85).toFixed(1),
      descriptor: 'Meets expectations with good quality',
    },
    {
      label: 'Developing',
      points: (maxPoints * 0.70).toFixed(1),
      descriptor: 'Approaching expectations, needs improvement',
    },
    {
      label: 'Beginning',
      points: (maxPoints * 0.50).toFixed(1),
      descriptor: 'Below expectations, significant improvement needed',
    },
  ];
}

/**
 * Validate parsed rubric
 */
export function validateParsedRubric(rubric: RubricJSON): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (rubric.criteria.length === 0) {
    errors.push('No criteria found');
  }
  
  let totalPoints = 0;
  for (const criterion of rubric.criteria) {
    const points = parseFloat(criterion.max_points);
    if (isNaN(points) || points <= 0) {
      errors.push(`Invalid points for ${criterion.name}: ${criterion.max_points}`);
    }
    totalPoints += points;
    
    if (criterion.levels.length === 0) {
      errors.push(`No levels defined for ${criterion.name}`);
    }
  }
  
  // Warn if total doesn't match expected
  if (rubric.scale.total_points) {
    const expected = parseFloat(rubric.scale.total_points);
    if (Math.abs(totalPoints - expected) > 0.1) {
      errors.push(`Total points mismatch: criteria sum to ${totalPoints}, expected ${expected}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

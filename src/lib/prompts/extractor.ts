/**
 * LLM Extractor Prompt for BulletProof Grading
 * 
 * This prompt instructs the LLM to output ONLY per-criterion scores and rationales.
 * The LLM does NOT calculate totals - that's handled by the calculator.
 * 
 * Philosophy: "LLM for language, tools for math."
 */

import type { RubricJSON } from '../calculator/types';
import { getDocumentType } from '../documentTypes';
import { addLineNumbers } from '../annotations/lineNumbers';

export const EXTRACTOR_SYSTEM_MESSAGE = `You are a rubric scorer. Your job is to evaluate student work against specific criteria and choose appropriate performance levels.

CRITICAL RULES:
1. Output ONLY per-criterion scores - DO NOT calculate totals or percentages
2. Choose a performance level for EACH criterion in the rubric
3. Points must be within the valid range [0, max_points] for each criterion
4. Provide specific rationale for each score based on evidence in the student's work
5. Output ONLY valid JSON matching the ExtractedScores schema
6. Never include personal data about the student

Your output will be validated and passed to a deterministic calculator for final scoring.`;

/**
 * Build extractor prompt for structured per-criterion scoring
 */
export function buildExtractorPrompt(
  rubric: RubricJSON,
  essayText: string,
  submissionId: string,
  customGradingPrompt?: string,
  documentType?: string,
  _sourceTextContext?: any, // Future: SourceTextContext for book reports (unused - reserved for future)
  assignmentPrompt?: string
): string {
  // Build criterion descriptions for the prompt
  const criteriaDescriptions = rubric.criteria
    .map((c) => {
      const levelsDesc = c.levels
        .map((l) => `    - ${l.label} (${l.points} pts): ${l.descriptor}`)
        .join('\n');
      return `  ${c.name} (${c.id}):
    Max Points: ${c.max_points}
    Weight: ${c.weight}
    Levels:
${levelsDesc}`;
    })
    .join('\n\n');

  // Use custom grading prompt or default

  // Get document type specific guidance
  const docType = documentType ? getDocumentType(documentType) : null;
  const documentTypeGuidance = docType?.gradingFocus 
    ? `\nDOCUMENT TYPE: ${docType.label}\nGRADING FOCUS: ${docType.gradingFocus}\n`
    : "";
  
  // Add assignment prompt context if provided
  const assignmentContext = assignmentPrompt
    ? `\n## ASSIGNMENT INSTRUCTIONS\n\nThe student was given the following instructions:\n\n"${assignmentPrompt}"\n\nWhen grading, consider whether the student:\n- Followed the assignment instructions\n- Addressed the prompt requirements\n- Met the specified format/length/structure\n`
    : "";
  
  const gradingPhilosophy = customGradingPrompt || EXTRACTOR_SYSTEM_MESSAGE;
  
  // Use rubric criterion IDs as annotation categories for consistency
  const annotationCategories = rubric.criteria.map(c => c.id).join('|');

  return `${gradingPhilosophy}

RUBRIC: "${rubric.title}"
${documentTypeGuidance}${assignmentContext}

CRITERIA TO EVALUATE:
${criteriaDescriptions}

STUDENT ESSAY (with line numbers for reference):
<<<
${addLineNumbers(essayText)}
>>>

NOTE: Line numbers (e.g., "001|") are for YOUR REFERENCE ONLY. They are NOT part of the student's text.
When quoting text, do NOT include the line numbers in your quotes.

TASK:
Evaluate the essay against EACH criterion above. For each criterion:
1. Choose the most appropriate performance level
2. Award the points associated with that level
3. Provide a specific rationale citing evidence from the essay

FEEDBACK GUIDELINES:

1. Rubric-Based Scoring (AFFECTS GRADE):
   - Provide specific rationale for each rubric criterion
   - Cite examples from the essay
   - Explain why you chose that level
   - Points must be within [0, max_points] for each criterion

2. Inline Annotations (Based on Rubric Criteria):
   - Create annotations for issues that affect the rubric criteria
   - Tag each annotation with the rubric criterion ID it relates to:
${rubric.criteria.map(c => `     * ${c.id}: Issues related to "${c.name}"`).join('\n')}
   - Choose the criterion that BEST matches the issue
   - If an issue affects multiple criteria, pick the PRIMARY one
   - Put ALL issues in inline_annotations array (NOT in grammar_findings/spelling_findings arrays)
   - Include line number and exact quoted text for each issue
   - Provide clear, specific correction or suggestion for each issue
   - Be specific and constructive
   - Focus on issues that affect the rubric criteria

3. Strengths:
   - Highlight what the student did well
   - Be specific and genuine
   - Connect to rubric criteria when possible

4. Areas for Improvement:
   - Focus on rubric categories
   - Provide actionable suggestions
   - Prioritize most impactful changes

5. Top 3 Suggestions:
   - Most important improvements for next time
   - Should align with rubric categories
   - Be specific and achievable

CONSTRAINTS:
- Do NOT calculate totals, percentages, or final grades
- Do NOT sum points across criteria
- Only evaluate and score each criterion individually
- Be specific in rationales - cite actual text when possible
- Never include student names or personal information

OUTPUT ONLY THIS JSON STRUCTURE:
{
  "submission_id": "${submissionId}",
  "scores": [
    {
      "criterion_id": "string",
      "level": "string",
      "points_awarded": "string",
      "rationale": "string"
    }
  ],
  "feedback": {
    "grammar_findings": [],
    "spelling_findings": [],
    "punctuation_findings": [],
    "strengths": ["string"],
    "areas_for_improvement": ["string"],
    "top_3_suggestions": ["string"],
    "inline_annotations": [
      {
        "line": 5,
        "quote": "the exact text with the issue",
        "category": "${annotationCategories}",
        "suggestion": "Specific correction or improvement",
        "severity": "info|warning|error"
      }
    ]
  },
  "notes": "string or null"
}

CRITICAL INLINE ANNOTATIONS RULES:
- Put ALL issues related to rubric criteria in inline_annotations array
- Leave grammar_findings, spelling_findings, and punctuation_findings as EMPTY arrays []
- Use line numbers from the numbered essay (e.g., line 5 means "005| ...")
- Quote ONLY the problematic text, WITHOUT line numbers
- Keep quotes short and precise (5-15 words max)
- Category must be one of: ${annotationCategories}
- Choose the rubric criterion that this issue MOST affects:
${rubric.criteria.map(c => `  * ${c.id} = issues affecting "${c.name}"`).join('\n')}
- If an issue affects multiple criteria, choose the PRIMARY one
- Every annotation MUST map to a rubric criterion
- Severity: error (must fix), warning (should fix), info (suggestion)
- Provide actionable suggestions, not just identification
- Include ALL issues you find - do not limit the number of annotations

IMPORTANT: Output ONLY the JSON. No additional text before or after.`;
}

/**
 * Build prompt for Pass 2: Generate targeted annotations for each rubric criterion
 */
export function buildCriteriaAnnotationsPrompt(
  rubric: RubricJSON,
  essayText: string,
  scores: Array<{ criterion_id: string; points_awarded: string; rationale: string }>,
  submissionId: string
): string {
  // Build list of criteria with their scores and issues
  const criteriaWithIssues = rubric.criteria
    .map((criterion) => {
      const score = scores.find(s => s.criterion_id === criterion.id);
      const pointsAwarded = score ? parseFloat(score.points_awarded) : 0;
      const maxPoints = typeof criterion.max_points === 'string' ? parseFloat(criterion.max_points) : criterion.max_points;
      const hasIssues = pointsAwarded < maxPoints;
      
      return {
        criterion,
        score,
        hasIssues,
        pointsAwarded,
        maxPoints
      };
    })
    .filter(c => c.hasIssues); // Only include criteria with issues

  const criteriaDescriptions = criteriaWithIssues
    .map(({ criterion, score, pointsAwarded, maxPoints }) => {
      return `${criterion.name} (${criterion.id}):
  Scored: ${pointsAwarded}/${maxPoints} points
  Issues identified: ${score?.rationale || 'See detailed breakdown'}
  
  Your task: Find 2-4 specific examples in the essay where this criterion could be improved.`;
    })
    .join('\n\n');

  return `You are reviewing an essay to provide SPECIFIC, LINE-BY-LINE feedback for each rubric criterion that needs improvement.

ESSAY (with line numbers):
<<<
${addLineNumbers(essayText)}
>>>

RUBRIC CRITERIA NEEDING IMPROVEMENT:
${criteriaDescriptions}

TASK:
For EACH criterion listed above, identify 2-4 specific locations in the essay where the student could improve on that criterion.

INSTRUCTIONS:
1. Focus on providing ACTIONABLE, SPECIFIC feedback
2. Quote the exact text that needs improvement (5-15 words)
3. Tag each annotation with the rubric criterion ID it addresses:
   - Use the criterion_id from the list above
   - This links the annotation directly to the rubric criterion
   - Example: If addressing "${criteriaWithIssues[0]?.criterion.name || 'a criterion'}", use "${criteriaWithIssues[0]?.criterion.id || 'criterion_id'}"
4. Provide clear suggestions for improvement
5. Include line numbers from the numbered essay
6. Make sure EVERY criterion gets at least 2 annotations

OUTPUT THIS JSON STRUCTURE:
{
  "submission_id": "${submissionId}",
  "inline_annotations": [
    {
      "line": 5,
      "quote": "exact text with the issue",
      "category": "${criteriaWithIssues.map(c => c.criterion.id).join('|')}",
      "suggestion": "Specific improvement suggestion",
      "severity": "warning",
      "criterion_id": "the rubric criterion this addresses"
    }
  ]
}

CRITICAL RULES:
- Provide 2-4 annotations per criterion
- Quote ONLY the problematic text, WITHOUT line numbers
- Keep quotes short and precise (5-15 words max)
- Category must be one of the rubric criterion IDs: ${criteriaWithIssues.map(c => c.criterion.id).join(', ')}
- Include criterion_id to link back to the rubric
- Be specific and actionable in suggestions

IMPORTANT: Output ONLY the JSON. No additional text before or after.`;
}

/**
 * Build comparison extractor prompt for draft comparison mode
 */
export function buildComparisonExtractorPrompt(
  rubric: RubricJSON,
  roughDraft: string,
  finalDraft: string,
  submissionId: string,
  customGradingPrompt?: string,
  documentType?: string,
  _sourceTextContext?: any, // Future: SourceTextContext for book reports (unused - reserved for future)
  assignmentPrompt?: string
): string {
  const criteriaDescriptions = rubric.criteria
    .map((c) => {
      const levelsDesc = c.levels
        .map((l) => `    - ${l.label} (${l.points} pts): ${l.descriptor}`)
        .join('\n');
      return `  ${c.name} (${c.id}):
    Max Points: ${c.max_points}
    Weight: ${c.weight}
    Levels:
${levelsDesc}`;
    })
    .join('\n\n');

  // Use custom grading prompt or default
  const gradingPhilosophy = customGradingPrompt || EXTRACTOR_SYSTEM_MESSAGE;
  
  // Get document type specific guidance
  const docType = documentType ? getDocumentType(documentType) : null;
  const documentTypeGuidance = docType?.gradingFocus 
    ? `\nDOCUMENT TYPE: ${docType.label}\nGRADING FOCUS: ${docType.gradingFocus}\n`
    : "";
  
  // Add assignment prompt context if provided
  const assignmentContext = assignmentPrompt
    ? `\n## ASSIGNMENT INSTRUCTIONS\n\nThe student was given the following instructions:\n\n"${assignmentPrompt}"\n\nWhen grading, consider whether the student:\n- Followed the assignment instructions\n- Addressed the prompt requirements\n- Met the specified format/length/structure\n`
    : "";
  
  // Use rubric criterion IDs as annotation categories for consistency
  const annotationCategories = rubric.criteria.map(c => c.id).join('|');

  return `${gradingPhilosophy}

RUBRIC: "${rubric.title}"
${documentTypeGuidance}${assignmentContext}

CRITERIA TO EVALUATE:
${criteriaDescriptions}

ROUGH DRAFT (First Version):
<<<
${roughDraft}
>>>

FINAL DRAFT (Revised Version - with line numbers for reference):
<<<
${addLineNumbers(finalDraft)}
>>>

NOTE: Line numbers (e.g., "001|") are for YOUR REFERENCE ONLY. They are NOT part of the student's text.
When quoting text, do NOT include the line numbers in your quotes.

TASK:
1. Evaluate the FINAL DRAFT against EACH criterion above
2. For each criterion, choose the most appropriate performance level
3. Award points and provide rationale based on the FINAL draft
4. In your rationale, you may note improvements from the rough draft

FEEDBACK GUIDELINES:

1. Rubric-Based Scoring (AFFECTS GRADE):
   - Provide specific rationale for each rubric criterion
   - Cite examples from the FINAL draft
   - Explain why you chose that level
   - You may note improvements from rough draft
   - Points must be within [0, max_points] for each criterion

2. Inline Annotations (Based on Rubric Criteria):
   - Create annotations for issues that affect the rubric criteria
   - Tag each annotation with the rubric criterion ID it relates to:
${rubric.criteria.map(c => `     * ${c.id}: Issues related to "${c.name}"`).join('\n')}
   - Choose the criterion that BEST matches the issue
   - If an issue affects multiple criteria, pick the PRIMARY one
   - Put ALL issues in inline_annotations array (NOT in grammar_findings/spelling_findings arrays)
   - Include line number and exact quoted text for each issue
   - Provide clear, specific correction or suggestion for each issue
   - Note any errors in the FINAL draft
   - Be specific and constructive
   - Focus on issues that affect the rubric criteria

3. Strengths:
   - Highlight what improved between drafts
   - Note what the student did well in final draft
   - Be specific and encouraging

4. Areas for Improvement:
   - Focus on rubric categories
   - Suggest next steps for further revision
   - Prioritize most impactful changes

5. Top 3 Suggestions:
   - Most important improvements for next time
   - Should align with rubric categories
   - Be specific and achievable

CONSTRAINTS:
- Grade the FINAL DRAFT (not the rough draft)
- Do NOT calculate totals, percentages, or final grades
- Do NOT sum points across criteria
- Only evaluate and score each criterion individually
- Be specific in rationales - cite actual text when possible
- Never include student names or personal information

OUTPUT ONLY THIS JSON STRUCTURE:
{
  "submission_id": "${submissionId}",
  "scores": [
    {
      "criterion_id": "string",
      "level": "string",
      "points_awarded": "string",
      "rationale": "string"
    }
  ],
  "feedback": {
    "grammar_findings": [],
    "spelling_findings": [],
    "punctuation_findings": [],
    "strengths": ["string"],
    "areas_for_improvement": ["string"],
    "top_3_suggestions": ["string"],
    "inline_annotations": [
      {
        "line": 5,
        "quote": "the exact text with the issue",
        "category": "${annotationCategories}",
        "suggestion": "Specific correction or improvement",
        "severity": "info|warning|error"
      }
    ]
  },
  "notes": "string or null"
}

CRITICAL INLINE ANNOTATIONS RULES:
- Put ALL issues related to rubric criteria in inline_annotations array
- Leave grammar_findings, spelling_findings, and punctuation_findings as EMPTY arrays []
- Use line numbers from the numbered FINAL DRAFT (e.g., line 5 means "005| ...")
- Quote ONLY the problematic text, WITHOUT line numbers
- Keep quotes short and precise (5-15 words max)
- Category must be one of: ${annotationCategories}
- Choose the rubric criterion that this issue MOST affects:
${rubric.criteria.map(c => `  * ${c.id} = issues affecting "${c.name}"`).join('\n')}
- If an issue affects multiple criteria, choose the PRIMARY one
- Every annotation MUST map to a rubric criterion
- Severity: error (must fix), warning (should fix), info (suggestion)
- Provide actionable suggestions, not just identification
- Include ALL issues you find - do not limit the number of annotations

IMPORTANT: Output ONLY the JSON. No additional text before or after.`;
}

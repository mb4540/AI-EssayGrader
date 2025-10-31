/**
 * LLM Extractor Prompt for BulletProof Grading
 * 
 * This prompt instructs the LLM to output ONLY per-criterion scores and rationales.
 * The LLM does NOT calculate totals - that's handled by the calculator.
 * 
 * Philosophy: "LLM for language, tools for math."
 */

import type { RubricJSON } from '../calculator/types';

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
  customGradingPrompt?: string
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
  const gradingPhilosophy = customGradingPrompt || EXTRACTOR_SYSTEM_MESSAGE;
  
  // Check if grammar/spelling/punctuation are in rubric
  const rubricIds = rubric.criteria.map(c => c.id.toLowerCase());
  const hasGrammar = rubricIds.some(id => 
    id.includes('grammar') || 
    id.includes('convention') || 
    id.includes('mechanics') ||
    id.includes('language')
  );

  return `${gradingPhilosophy}

RUBRIC: "${rubric.title}"

CRITERIA TO EVALUATE:
${criteriaDescriptions}

STUDENT ESSAY:
<<<
${essayText}
>>>

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

2. Grammar/Spelling/Punctuation Feedback:
   ${hasGrammar 
     ? '- These ARE in the rubric - include in scoring'
     : '- These are NOT in the rubric - provide as INFORMATIONAL FEEDBACK ONLY'
   }
   - Be specific: "Line 3: 'their' should be 'there'"
   - Keep it constructive and encouraging
   ${!hasGrammar ? '- DO NOT deduct points for these items' : ''}

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
    "grammar_findings": ["string"],
    "spelling_findings": ["string"],
    "punctuation_findings": ["string"],
    "strengths": ["string"],
    "areas_for_improvement": ["string"],
    "top_3_suggestions": ["string"]
  },
  "notes": "string or null"
}

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
  customGradingPrompt?: string
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
  
  // Check if grammar/spelling/punctuation are in rubric
  const rubricIds = rubric.criteria.map(c => c.id.toLowerCase());
  const hasGrammar = rubricIds.some(id => 
    id.includes('grammar') || 
    id.includes('convention') || 
    id.includes('mechanics') ||
    id.includes('language')
  );

  return `${gradingPhilosophy}

RUBRIC: "${rubric.title}"

CRITERIA TO EVALUATE:
${criteriaDescriptions}

ROUGH DRAFT (First Version):
<<<
${roughDraft}
>>>

FINAL DRAFT (Revised Version):
<<<
${finalDraft}
>>>

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

2. Grammar/Spelling/Punctuation Feedback:
   ${hasGrammar 
     ? '- These ARE in the rubric - include in scoring'
     : '- These are NOT in the rubric - provide as INFORMATIONAL FEEDBACK ONLY'
   }
   - Note any errors in the FINAL draft
   - Be specific and constructive
   ${!hasGrammar ? '- DO NOT deduct points for these items' : ''}

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
    "grammar_findings": ["string"],
    "spelling_findings": ["string"],
    "punctuation_findings": ["string"],
    "strengths": ["string"],
    "areas_for_improvement": ["string"],
    "top_3_suggestions": ["string"]
  },
  "notes": "string or null"
}

IMPORTANT: Output ONLY the JSON. No additional text before or after.`;
}

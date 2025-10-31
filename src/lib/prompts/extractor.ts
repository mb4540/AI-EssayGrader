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
  submissionId: string
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

  return `RUBRIC: "${rubric.title}"

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

CONSTRAINTS:
- Do NOT calculate totals, percentages, or final grades
- Do NOT sum points across criteria
- Only evaluate and score each criterion individually
- Points must be within [0, max_points] for each criterion
- Be specific in rationales - cite actual text when possible
- Never include student names or personal information

OUTPUT ONLY THIS JSON STRUCTURE:
{
  "submission_id": "${submissionId}",
  "scores": [
    {
      "criterion_id": "string",  // e.g., "organization"
      "level": "string",          // e.g., "Proficient"
      "points_awarded": "string", // e.g., "3.0" (as string, Decimal format)
      "rationale": "string"       // Specific evidence from essay
    }
  ],
  "notes": "string or null"       // Optional overall observations
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
  submissionId: string
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

  return `RUBRIC: "${rubric.title}"

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

CONSTRAINTS:
- Grade the FINAL DRAFT (not the rough draft)
- Do NOT calculate totals, percentages, or final grades
- Do NOT sum points across criteria
- Only evaluate and score each criterion individually
- Points must be within [0, max_points] for each criterion
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
      "rationale": "string"  // May include improvement notes
    }
  ],
  "notes": "string or null"  // Optional observations about growth
}

IMPORTANT: Output ONLY the JSON. No additional text before or after.`;
}

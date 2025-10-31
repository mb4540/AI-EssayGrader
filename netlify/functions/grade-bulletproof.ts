/**
 * BulletProof Grading Function
 * 
 * Uses deterministic Decimal calculator for accurate scoring.
 * LLM extracts per-criterion scores, calculator computes totals.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { OpenAI } from 'openai';
import { sql } from './db';
import { GradeRequestSchema } from '../../src/lib/schema';
import { authenticateRequest } from './lib/auth';
import { computeScores, validateRubric } from '../../src/lib/calculator/calculator';
import { rubricFromJSON, extractedScoresFromJSON } from '../../src/lib/calculator/converters';
import { createDefaultRubric, isValidRubric } from '../../src/lib/calculator/rubricBuilder';
import { 
  EXTRACTOR_SYSTEM_MESSAGE, 
  buildExtractorPrompt, 
  buildComparisonExtractorPrompt 
} from '../../src/lib/prompts/extractor';
import type { RubricJSON, ExtractedScoresJSON } from '../../src/lib/calculator/types';

const CALCULATOR_VERSION = 'v1.0.0-ts';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Authenticate request
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id } = auth;

    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validation = GradeRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.issues 
        }),
      };
    }

    const { submission_id } = validation.data;

    // Fetch submission with assignment rubric
    const submission = await sql`
      SELECT 
        s.submission_id, 
        s.verbatim_text, 
        s.rough_draft_text, 
        s.final_draft_text, 
        s.draft_mode, 
        s.teacher_criteria,
        s.assignment_id,
        a.rubric_json,
        a.scale_mode,
        a.total_points,
        a.rounding_mode,
        a.rounding_decimals
      FROM grader.submissions s
      LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (submission.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found or access denied' }),
      };
    }

    const { 
      verbatim_text, 
      rough_draft_text, 
      final_draft_text, 
      draft_mode, 
      teacher_criteria,
      assignment_id,
      rubric_json,
      scale_mode,
      total_points,
      rounding_mode,
      rounding_decimals
    } = submission[0];

    // Get or create rubric
    let rubric: RubricJSON;
    
    if (rubric_json && isValidRubric(rubric_json)) {
      // Use existing rubric from assignment
      rubric = rubric_json as RubricJSON;
      
      // Override scale settings if provided
      if (scale_mode) {
        rubric.scale.mode = scale_mode;
      }
      if (total_points) {
        rubric.scale.total_points = total_points.toString();
      }
      if (rounding_mode) {
        rubric.scale.rounding.mode = rounding_mode as 'HALF_UP' | 'HALF_EVEN' | 'HALF_DOWN';
      }
      if (rounding_decimals !== null && rounding_decimals !== undefined) {
        rubric.scale.rounding.decimals = rounding_decimals;
      }
    } else {
      // Create default rubric from teacher criteria
      rubric = createDefaultRubric(assignment_id || 'default', teacher_criteria);
    }

    // Validate rubric
    const rubricObj = rubricFromJSON(rubric);
    validateRubric(rubricObj);

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    // Call OpenAI with extractor prompt
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Build extractor prompt based on draft mode
    const essayText = draft_mode === 'comparison' ? final_draft_text : verbatim_text;
    const extractorPrompt = draft_mode === 'comparison'
      ? buildComparisonExtractorPrompt(rubric, rough_draft_text, final_draft_text, submission_id)
      : buildExtractorPrompt(rubric, essayText, submission_id);

    const response = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_MESSAGE },
        { role: 'user', content: extractorPrompt }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No response from OpenAI' }),
      };
    }

    // Parse extracted scores
    const extractedJSON: ExtractedScoresJSON = JSON.parse(content);
    
    // Validate extracted scores structure
    if (!extractedJSON.scores || !Array.isArray(extractedJSON.scores)) {
      throw new Error('Invalid extracted scores format: missing scores array');
    }

    // Convert to Decimal objects
    const extracted = extractedScoresFromJSON(extractedJSON);

    // Compute final scores using calculator
    const computed = computeScores(rubricObj, extracted);

    // Convert computed scores to legacy format for backward compatibility
    const legacyGrade = parseFloat(computed.percent);
    const legacyFeedback = {
      overall_grade: legacyGrade,
      rubric_scores: extracted.scores.map(s => ({
        category: s.criterion_id,
        score: parseFloat(s.points_awarded.toString()),
        comments: s.rationale,
      })),
      grammar_findings: [],
      spelling_findings: [],
      structure_findings: [],
      evidence_findings: [],
      top_3_suggestions: [],
      supportive_summary: extracted.notes || 'Graded using bulletproof calculator',
      // BulletProof specific fields
      computed_scores: computed,
      calculator_version: CALCULATOR_VERSION,
    };

    // Update submission with both extracted and computed scores
    await sql`
      UPDATE grader.submissions 
      SET 
        ai_grade = ${legacyGrade},
        ai_feedback = ${JSON.stringify(legacyFeedback)},
        extracted_scores = ${JSON.stringify(extractedJSON)},
        computed_scores = ${JSON.stringify(computed)},
        calculator_version = ${CALCULATOR_VERSION}
      WHERE submission_id = ${submission_id}
    `;

    // Create version snapshot
    await sql`
      INSERT INTO grader.submission_versions (
        submission_id,
        ai_grade,
        ai_feedback,
        draft_mode,
        rough_draft_text,
        final_draft_text
      )
      VALUES (
        ${submission_id},
        ${legacyGrade},
        ${JSON.stringify(legacyFeedback)},
        ${draft_mode},
        ${rough_draft_text || null},
        ${final_draft_text || null}
      )
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...legacyFeedback,
        bulletproof: {
          extracted_scores: extractedJSON,
          computed_scores: computed,
          calculator_version: CALCULATOR_VERSION,
        },
      }),
    };
  } catch (error) {
    console.error('BulletProof grade error:', error);
    
    // Handle authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || 
          error.message.includes('Invalid or expired token')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }
      
      // Handle validation errors
      if (error.message.includes('Invalid points') || 
          error.message.includes('Criterion mismatch') ||
          error.message.includes('not in range')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Grading validation failed',
            message: error.message 
          }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };

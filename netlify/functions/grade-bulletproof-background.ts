/**
 * BulletProof Grading Background Function
 * 
 * Runs the actual grading process without time limits.
 * Called by grade-bulletproof-trigger.ts via fire-and-forget pattern.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getLLMProvider, LLMProviderName } from './lib/llm/factory';
import { sql } from './db';
import { computeScores, validateRubric } from '../../src/lib/calculator/calculator';
import { rubricFromJSON, extractedScoresFromJSON } from '../../src/lib/calculator/converters';
import { createDefaultRubric, isValidRubric } from '../../src/lib/calculator/rubricBuilder';
import { parseTeacherRubric, validateParsedRubric } from '../../src/lib/calculator/rubricParser';
import {
  EXTRACTOR_SYSTEM_MESSAGE,
  buildExtractorPrompt,
  buildComparisonExtractorPrompt,
  buildCriteriaAnnotationsPrompt
} from '../../src/lib/prompts/extractor';
import type { RubricJSON, ExtractedScoresJSON } from '../../src/lib/calculator/types';
import { normalizeAnnotations } from '../../src/lib/annotations/normalizer';
import type { RawAnnotation } from '../../src/lib/annotations/types';

const CALCULATOR_VERSION = 'v1.0.0-ts';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  let jobId: string | null = null;

  try {
    const body = JSON.parse(event.body || '{}');
    jobId = body.jobId;

    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'jobId is required' }),
      };
    }

    console.log(`🎯 Starting background grading job: ${jobId}`);

    // Mark job as processing in DB
    await sql`
      INSERT INTO grader.background_tasks (task_id, tenant_id, task_type, status, input_data, created_at, updated_at)
      VALUES (${jobId}, ${body.tenant_id}, 'grading', 'processing', ${JSON.stringify(body)}, NOW(), NOW())
      ON CONFLICT (task_id) DO UPDATE SET status='processing', updated_at=NOW(), input_data=${JSON.stringify(body)}
    `;

    const { tenant_id, submission_id, grading_prompt, llmProvider = 'openai', llmModel } = body;

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
        a.rounding_decimals,
        a.document_type
      FROM grader.submissions s
      LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
      JOIN grader.students st ON s.student_id = st.student_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (submission.length === 0) {
      throw new Error('Submission not found or access denied');
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
      rounding_decimals,
      document_type
    } = submission[0];

    // Get or create rubric
    let rubric: RubricJSON;

    if (rubric_json && isValidRubric(rubric_json)) {
      rubric = rubric_json as RubricJSON;

      if (scale_mode) rubric.scale.mode = scale_mode;
      if (total_points) rubric.scale.total_points = total_points.toString();
      if (rounding_mode) rubric.scale.rounding.mode = rounding_mode as 'HALF_UP' | 'HALF_EVEN' | 'HALF_DOWN';
      if (rounding_decimals !== null && rounding_decimals !== undefined) {
        rubric.scale.rounding.decimals = rounding_decimals;
      }
    } else if (teacher_criteria && teacher_criteria.trim().length > 0) {
      try {
        rubric = parseTeacherRubric(
          teacher_criteria,
          assignment_id || 'default',
          total_points
        );

        const validation = validateParsedRubric(rubric);
        if (!validation.valid) {
          console.warn('Parsed rubric validation warnings:', validation.errors);
        }

        if (scale_mode) rubric.scale.mode = scale_mode;
        if (total_points) rubric.scale.total_points = total_points.toString();
        if (rounding_mode) rubric.scale.rounding.mode = rounding_mode as 'HALF_UP' | 'HALF_EVEN' | 'HALF_DOWN';
        if (rounding_decimals !== null) rubric.scale.rounding.decimals = rounding_decimals;

        console.log('Successfully parsed rubric:', {
          categories: rubric.criteria.length,
          total_points: rubric.scale.total_points,
          mode: rubric.scale.mode,
        });

      } catch (parseError) {
        console.warn('Failed to parse teacher rubric, using default:', parseError);
        rubric = createDefaultRubric(assignment_id || 'default', teacher_criteria);
      }
    } else {
      throw new Error('No grading criteria provided. Please add criteria to grade this submission.');
    }

    // Validate rubric
    const rubricObj = rubricFromJSON(rubric);
    validateRubric(rubricObj);

    // Initialize LLM Provider (default to Gemini)
    const providerName = (llmProvider as LLMProviderName) || 'gemini';

    // DEBUG: Log available env keys
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('URL')));

    const apiKey = providerName === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(`${providerName.toUpperCase()} API key not configured`);
    }

    const provider = getLLMProvider(providerName, apiKey, llmModel);
    console.log(`Using LLM Provider: ${providerName} (${llmModel || 'default'})`);

    const essayText = draft_mode === 'comparison' ? final_draft_text : verbatim_text;
    const extractorPrompt = draft_mode === 'comparison'
      ? buildComparisonExtractorPrompt(
        rubric,
        rough_draft_text,
        final_draft_text,
        submission_id,
        grading_prompt,
        document_type
      )
      : buildExtractorPrompt(
        rubric,
        essayText,
        submission_id,
        grading_prompt,
        document_type
      );

    console.log('Calling LLM for grading...');
    const response = await provider.generate({
      systemMessage: EXTRACTOR_SYSTEM_MESSAGE,
      userMessage: extractorPrompt,
      jsonMode: true,
      temperature: 0.2, // Low temperature for consistent grading
    });

    const content = response.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse extracted scores
    const extractedJSON: ExtractedScoresJSON = JSON.parse(content);

    if (!extractedJSON.scores || !Array.isArray(extractedJSON.scores)) {
      throw new Error('Invalid extracted scores format: missing scores array');
    }

    // Process inline annotations if present
    let annotationStats = { saved: 0, unresolved: 0 };

    // DEBUG: Log what we received from AI
    console.log('Checking for inline_annotations in AI response...');
    console.log('extractedJSON.feedback keys:', Object.keys(extractedJSON.feedback || {}));
    console.log('inline_annotations present?', !!extractedJSON.feedback?.inline_annotations);
    console.log('inline_annotations is array?', Array.isArray(extractedJSON.feedback?.inline_annotations));
    if (extractedJSON.feedback?.inline_annotations) {
      console.log('inline_annotations count:', extractedJSON.feedback.inline_annotations.length);
      console.log('First annotation sample:', JSON.stringify(extractedJSON.feedback.inline_annotations[0], null, 2));
    }

    if (extractedJSON.feedback?.inline_annotations && Array.isArray(extractedJSON.feedback.inline_annotations)) {
      const rawAnnotations = extractedJSON.feedback.inline_annotations as RawAnnotation[];
      const originalText = draft_mode === 'comparison' ? final_draft_text : verbatim_text;

      console.log(`Processing ${rawAnnotations.length} raw annotations...`);
      const normalizationResult = normalizeAnnotations(rawAnnotations, originalText, submission_id);

      // Save normalized annotations
      console.log(`Normalized: ${normalizationResult.normalized.length}, Unresolved: ${normalizationResult.unresolved.length}`);

      for (const annotation of normalizationResult.normalized) {
        try {
          console.log('Saving annotation:', { line: annotation.line_number, category: annotation.category, quote: annotation.quote.substring(0, 50) });
          await sql`
            INSERT INTO grader.annotations (
              submission_id,
              line_number,
              start_offset,
              end_offset,
              quote,
              category,
              suggestion,
              severity,
              status,
              criterion_id,
              ai_payload
            ) VALUES (
              ${submission_id},
              ${annotation.line_number},
              ${annotation.start_offset},
              ${annotation.end_offset},
              ${annotation.quote},
              ${annotation.category},
              ${annotation.suggestion},
              ${annotation.severity || null},
              ${annotation.status},
              ${annotation.criterion_id || null},
              ${JSON.stringify(annotation.ai_payload || null)}
            )
          `;
          annotationStats.saved++;
          console.log('✓ Annotation saved successfully');
        } catch (error) {
          console.error('✗ Failed to save annotation:', error);
        }
      }

      annotationStats.unresolved = normalizationResult.unresolved.length;

      if (normalizationResult.unresolved.length > 0) {
        console.log('⚠ Unresolved annotations (could not match text):', normalizationResult.unresolved);
      }

      console.log(`Final annotation stats (Pass 1): ${annotationStats.saved} saved, ${annotationStats.unresolved} unresolved`);
    } else {
      console.log('⚠ No inline_annotations found in AI response');
    }

    // PASS 2: Generate targeted annotations for each rubric criterion
    console.log('🔍 Pass 2: Generating targeted annotations for each rubric criterion...');

    const criteriaPrompt = buildCriteriaAnnotationsPrompt(
      rubric,
      draft_mode === 'comparison' ? final_draft_text : verbatim_text,
      extractedJSON.scores,
      submission_id
    );

    try {
      const criteriaResponse = await provider.generate({
        systemMessage: 'You are a detailed evaluator providing specific, actionable feedback for each rubric criterion.',
        userMessage: criteriaPrompt,
        jsonMode: true,
        temperature: 0.4, // Slightly higher for more natural feedback
      });

      const criteriaContent = criteriaResponse.content;
      if (criteriaContent) {
        const criteriaJSON = JSON.parse(criteriaContent);

        if (criteriaJSON.inline_annotations && Array.isArray(criteriaJSON.inline_annotations)) {
          const criteriaAnnotations = criteriaJSON.inline_annotations;
          const originalText = draft_mode === 'comparison' ? final_draft_text : verbatim_text;

          console.log(`Processing ${criteriaAnnotations.length} criterion-specific annotations...`);
          const criteriaResult = normalizeAnnotations(criteriaAnnotations, originalText, submission_id);

          // Save criterion-specific annotations
          for (const annotation of criteriaResult.normalized) {
            try {
              await sql`
                INSERT INTO grader.annotations (
                  submission_id,
                  line_number,
                  start_offset,
                  end_offset,
                  quote,
                  category,
                  suggestion,
                  severity,
                  status,
                  criterion_id,
                  ai_payload
                ) VALUES (
                  ${submission_id},
                  ${annotation.line_number},
                  ${annotation.start_offset},
                  ${annotation.end_offset},
                  ${annotation.quote},
                  ${annotation.category},
                  ${annotation.suggestion},
                  ${annotation.severity || null},
                  ${annotation.status},
                  ${annotation.criterion_id || null},
                  ${JSON.stringify(annotation.ai_payload || null)}
                )
              `;
              annotationStats.saved++;
            } catch (error) {
              console.error('✗ Failed to save criterion annotation:', error);
            }
          }

          console.log(`✓ Pass 2 complete: ${criteriaResult.normalized.length} criterion-specific annotations saved`);
        }
      }
    } catch (error) {
      console.error('⚠ Pass 2 criterion annotations failed:', error);
      // Don't fail the whole grading if Pass 2 fails
    }

    // Convert to Decimal objects
    const extracted = extractedScoresFromJSON(extractedJSON);

    // Compute final scores using calculator
    const computed = computeScores(rubricObj, extracted);

    // Convert computed scores to legacy format
    const legacyGrade = parseFloat(computed.percent);

    // DEBUG: Log rubric structure to verify max_points are present
    console.log('Rubric criteria count:', rubric.criteria.length);
    rubric.criteria.forEach((c, idx) => {
      console.log(`  Criterion ${idx}: id=${c.id}, max_points=${c.max_points}, weight=${c.weight}`);
    });

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
      computed_scores: computed,
      calculator_version: CALCULATOR_VERSION,
      // Include bulletproof section with rubric for frontend display
      bulletproof: {
        rubric: rubric, // Include rubric so UI can show max points per criterion
        extracted_scores: extractedJSON,
        computed_scores: computed,
        calculator_version: CALCULATOR_VERSION,
      },
    };

    // DEBUG: Verify bulletproof section is complete
    console.log('Bulletproof section has rubric:', !!legacyFeedback.bulletproof.rubric);
    console.log('Rubric has criteria:', legacyFeedback.bulletproof.rubric.criteria?.length || 0);

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

    // Mark job completed in DB
    const outputData = {
      submission_id,
      ai_grade: legacyGrade,
      annotation_stats: annotationStats,
      computed_scores: computed,
    };

    await sql`
      UPDATE grader.background_tasks
      SET status='completed', output_data=${JSON.stringify(outputData)}, updated_at=NOW(), completed_at=NOW()
      WHERE task_id=${jobId}
    `;

    console.log(`✅ Background grading job completed: ${jobId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (error) {
    console.error('Background grading error:', error);

    try {
      if (jobId) {
        await sql`
          UPDATE grader.background_tasks
          SET status='failed', error_message=${String(error instanceof Error ? error.message : error)}, updated_at=NOW()
          WHERE task_id=${jobId}
        `;
      }
    } catch (dbError) {
      console.error('Failed to update task status:', dbError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error instanceof Error ? error.message : error) }),
    };
  }
};

export { handler };

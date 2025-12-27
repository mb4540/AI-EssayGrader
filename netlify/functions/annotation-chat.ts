/**
 * Annotation Chat - LLM-assisted annotation review
 * Uses Gemini 2.5 Pro as the default LLM
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from './db';
import { authenticateRequest } from './lib/auth';

interface ChatPayload {
  submission_id: string;
  annotation_id: string;
  teacher_prompt: string;
}

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const auth = await authenticateRequest(event.headers.authorization);
    const { tenant_id } = auth;

    const body: ChatPayload = JSON.parse(event.body || '{}');
    const { submission_id, annotation_id, teacher_prompt } = body;

    // Validate required fields
    if (!submission_id || !annotation_id || !teacher_prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: submission_id, annotation_id, teacher_prompt' }),
      };
    }

    // Verify submission belongs to tenant and get context
    const submissionResult = await sql`
      SELECT 
        s.submission_id,
        s.verbatim_text,
        s.teacher_criteria,
        a.rubric_json
      FROM grader.submissions s
      JOIN grader.students st ON s.student_id = st.student_id
      LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
      WHERE s.submission_id = ${submission_id}
      AND st.tenant_id = ${tenant_id}
      LIMIT 1
    `;

    if (submissionResult.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found or access denied' }),
      };
    }

    const submission = submissionResult[0];

    // Get the annotation
    const annotationResult = await sql`
      SELECT 
        annotation_id,
        line_number,
        quote,
        category,
        suggestion,
        severity,
        status,
        criterion_id
      FROM grader.annotations
      WHERE annotation_id = ${annotation_id}
      AND submission_id = ${submission_id}
      LIMIT 1
    `;

    if (annotationResult.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Annotation not found' }),
      };
    }

    const annotation = annotationResult[0];

    // Get surrounding context (3 lines before and after)
    const lines = (submission.verbatim_text || '').split('\n');
    const lineNumber = annotation.line_number;
    const startLine = Math.max(0, lineNumber - 4);
    const endLine = Math.min(lines.length, lineNumber + 3);
    const surroundingLines = lines.slice(startLine, endLine).map((line: string, idx: number) => {
      const actualLineNum = startLine + idx + 1;
      const marker = actualLineNum === lineNumber ? ' >>> ' : '     ';
      return `${marker}${actualLineNum}: ${line}`;
    }).join('\n');

    // Get rubric criterion info if available
    let criterionInfo = '';
    if (annotation.criterion_id && submission.rubric_json) {
      try {
        const rubric = typeof submission.rubric_json === 'string' 
          ? JSON.parse(submission.rubric_json) 
          : submission.rubric_json;
        const criterion = rubric.criteria?.find((c: any) => c.id === annotation.criterion_id);
        if (criterion) {
          criterionInfo = `\n\nRubric Criterion: ${criterion.name}\nDescription: ${criterion.description || 'N/A'}`;
        }
      } catch (e) {
        // Ignore rubric parsing errors
      }
    }

    // Build the system prompt
    const systemPrompt = `You are an AI assistant helping a teacher review an inline annotation on a student essay.

Your role is to:
1. Explain grammar, spelling, or writing rules when asked
2. Suggest alternative phrasings or corrections
3. Provide context about why certain feedback is appropriate
4. Help the teacher understand the annotation in context

Be concise, helpful, and educational. Focus on the specific annotation and surrounding text.
Do NOT include student names or any personally identifiable information in your response.`;

    // Build the user message with context
    const userMessage = `## Annotation Context

**Quoted Text:** "${annotation.quote}"
**Category:** ${annotation.category}
**Severity:** ${annotation.severity || 'info'}
**Current Feedback:** ${annotation.suggestion}
**Line Number:** ${lineNumber}
${criterionInfo}

## Surrounding Text
\`\`\`
${surroundingLines}
\`\`\`

## Teacher's Question
${teacher_prompt}`;

    // Call Gemini 2.5 Pro
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(userMessage);
    const response = result.response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response,
      }),
    };
  } catch (error) {
    console.error('Annotation chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

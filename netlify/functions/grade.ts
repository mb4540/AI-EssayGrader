import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { OpenAI } from 'openai';
import { sql } from './db';
import { FeedbackSchema, GradeRequestSchema } from '../../src/lib/schema';
import { authenticateRequest } from './lib/auth';

const SYSTEM_MESSAGE = `You are an encouraging 6th-grade ELA grader. Grade fairly to the teacher's criteria. Preserve the student's original words; do not rewrite their essay. Provide concise, supportive feedback that points to specific issues (grammar, spelling, capitalization, sentence structure, organization, evidence, clarity). Never include personal data about the student.`;

function buildUserPrompt(teacherCriteria: string, verbatimText: string): string {
  return `TEACHER_CRITERIA (verbatim):
<<<
${teacherCriteria}
>>>

STUDENT_WORK_VERBATIM:
<<<
${verbatimText}
>>>

CONSTRAINTS:
- Do NOT rewrite the essay.
- Focus on actionable comments tied to lines/sentences (quote short fragments as needed).
- Assign a numeric grade according to the teacher's criteria. If criteria specify weights, apply them.

RETURN JSON ONLY matching this schema:
{
  "overall_grade": number,            // 0-100
  "rubric_scores": [                  // optional category breakdowns
    { "category": string, "score": number, "comments": string }
  ],
  "grammar_findings": string[],       // short bullets
  "spelling_findings": string[],      // short bullets
  "structure_findings": string[],     // short bullets (organization, topic, conclusion)
  "evidence_findings": string[],      // citations/examples if relevant
  "top_3_suggestions": string[],      // most impactful improvements
  "supportive_summary": string        // 3-4 sentences, warm and encouraging
}`;
}

function buildComparisonPrompt(teacherCriteria: string, roughDraft: string, finalDraft: string): string {
  return `TEACHER_CRITERIA (verbatim):
<<<
${teacherCriteria}
>>>

ROUGH DRAFT (First Version):
<<<
${roughDraft}
>>>

FINAL DRAFT (Revised Version):
<<<
${finalDraft}
>>>

TASK: Compare these two drafts and assess the student's improvement and final work quality.

CONSTRAINTS:
- Grade the FINAL DRAFT according to the teacher's criteria
- Identify specific improvements made between drafts
- Note areas that still need work
- Calculate an approximate growth/improvement percentage (0-100)
- Be encouraging about progress while honest about remaining issues
- Do NOT rewrite either essay

RETURN JSON ONLY matching this schema:
{
  "overall_grade": number,                    // 0-100, grade for FINAL draft
  "rubric_scores": [                          // optional category breakdowns for final draft
    { "category": string, "score": number, "comments": string }
  ],
  "grammar_findings": string[],               // issues in FINAL draft
  "spelling_findings": string[],              // issues in FINAL draft
  "structure_findings": string[],             // issues in FINAL draft
  "evidence_findings": string[],              // issues in FINAL draft
  "top_3_suggestions": string[],              // for further improvement
  "supportive_summary": string,               // 3-4 sentences about final draft
  "improvement_summary": string,              // 3-4 sentences about growth between drafts
  "areas_improved": string[],                 // specific improvements made (up to 10)
  "areas_still_need_work": string[],          // areas not yet addressed (up to 10)
  "growth_percentage": number                 // 0-100, estimated improvement
}`;
}

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
    
    // Extract custom prompts if provided
    const customGradingPrompt = body.grading_prompt;
    
    // Validate request
    const validation = GradeRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.issues 
        }),
      };
    }

    const { submission_id } = validation.data;

    // Fetch submission (filtered by tenant via student_id)
    const submission = await sql`
      SELECT s.submission_id, s.verbatim_text, s.rough_draft_text, s.final_draft_text, s.draft_mode, s.teacher_criteria
      FROM grader.submissions s
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

    const { verbatim_text, rough_draft_text, final_draft_text, draft_mode, teacher_criteria } = submission[0];

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Build prompt based on draft mode
    const userPrompt = draft_mode === 'comparison' 
      ? buildComparisonPrompt(teacher_criteria, rough_draft_text, final_draft_text)
      : buildUserPrompt(teacher_criteria, verbatim_text);

    const response = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: customGradingPrompt || SYSTEM_MESSAGE },
        { role: 'user', content: userPrompt }
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

    // Parse and validate AI response
    const aiJson = JSON.parse(content);
    const feedbackValidation = FeedbackSchema.safeParse(aiJson);
    
    if (!feedbackValidation.success) {
      console.error('AI response validation failed:', feedbackValidation.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid AI response format',
          details: feedbackValidation.error.format()
        }),
      };
    }

    const feedback = feedbackValidation.data;

    // Update submission with AI grade and feedback
    await sql`
      UPDATE grader.submissions 
      SET 
        ai_grade = ${feedback.overall_grade},
        ai_feedback = ${JSON.stringify(feedback)}
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
        ${feedback.overall_grade},
        ${JSON.stringify(feedback)},
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
      body: JSON.stringify(feedback),
    };
  } catch (error) {
    console.error('Grade error:', error);
    
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

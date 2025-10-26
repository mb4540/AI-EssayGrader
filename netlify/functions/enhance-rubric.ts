import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RUBRIC_ENHANCEMENT_PROMPT = `You are an expert educator helping teachers create detailed, effective grading rubrics.

Your task: Transform simple grading rules into a clear, comprehensive rubric that:
- Uses a 100-point scale
- Breaks down into specific categories with point values
- Provides clear criteria for each category
- Is concise but thorough (aim for 150-300 words)
- Uses bullet points for easy scanning
- Includes any penalties if relevant

Keep the rubric practical and easy to apply. Focus on clarity over complexity.

Format example:
Scoring (100 pts total):
- Category Name (XX pts): specific criteria
- Another Category (XX pts): what to look for

Penalties (if applicable):
- Issue: -X pts`;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { simple_rules, rubric_prompt } = JSON.parse(event.body || '{}');

    if (!simple_rules || typeof simple_rules !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'simple_rules is required' }),
      };
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: rubric_prompt || RUBRIC_ENHANCEMENT_PROMPT,
        },
        {
          role: 'user',
          content: `Transform these simple grading rules into a detailed rubric:\n\n${simple_rules}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const enhanced_rubric = completion.choices[0]?.message?.content?.trim() || '';

    if (!enhanced_rubric) {
      throw new Error('No rubric generated');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enhanced_rubric }),
    };
  } catch (error) {
    console.error('Rubric enhancement error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to enhance rubric',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

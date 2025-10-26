import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TEXT_ENHANCEMENT_PROMPT = `You are a text cleanup assistant for handwritten essay OCR results.

Your ONLY job is to:
1. Fix spelling errors
2. Fix spacing issues (remove extra spaces, add missing spaces)
3. Remove OCR artifacts (|, ®, ©, random symbols that aren't punctuation)
4. Fix obvious character recognition errors (e.g., "helgE" → "help", "opfibhe" → "of the")

CRITICAL RULES:
- DO NOT change the student's words, ideas, or sentence structure
- DO NOT add or remove sentences
- DO NOT improve grammar or style
- DO NOT change punctuation (except fixing obvious OCR errors)
- Keep the exact same meaning and content
- Preserve line breaks and paragraph structure

Output ONLY the cleaned text, nothing else.`;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text, ocr_prompt } = JSON.parse(event.body || '{}');

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'text is required' }),
      };
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ocr_prompt || TEXT_ENHANCEMENT_PROMPT,
        },
        {
          role: 'user',
          content: `Clean up this OCR text from a handwritten essay:\n\n${text}`,
        },
      ],
      temperature: 0.3, // Low temperature for consistent cleanup
      max_tokens: 2000,
    });

    const enhanced_text = completion.choices[0]?.message?.content?.trim() || '';

    if (!enhanced_text) {
      throw new Error('No enhanced text generated');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enhanced_text }),
    };
  } catch (error) {
    console.error('Text enhancement error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to enhance text',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };

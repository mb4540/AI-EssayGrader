import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * IMPORTANT: This function is LOCKED to Gemini 2.5 Pro for image transcription.
 * Gemini is a multimodal LLM optimized for vision tasks and provides superior
 * handwriting recognition compared to other models.
 * 
 * The LLM provider setting in AI Prompt Settings does NOT affect this function.
 * It will always use Gemini 2.5 Pro regardless of user's global LLM preference.
 */

const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { image } = JSON.parse(event.body || '{}');

    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image is required' }),
      };
    }

    // System prompt for verbatim transcription
    const SYSTEM_PROMPT = "Transcribe the handwritten text in the image exactly as it appears. Do not correct, rephrase, or alter the words. Provide a literal and verbatim transcription. Preserve all spelling errors, punctuation errors, and grammatical mistakes. Do not add any conversational text or markdown formatting like 'Here is the text:'. Return ONLY the raw text.";

    let transcription = '';

    // ALWAYS use Gemini 2.5 Pro (multimodal LLM optimized for vision)
    // Ignore any provider parameter - this function is locked to Gemini
    if (true) {  // Always true - using Gemini
      if (!process.env.GEMINI_API_KEY) {
        console.error('Missing GEMINI_API_KEY');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }),
        };
      }

      // Extract base64 data and mime type
      // Expected format: "data:image/png;base64,iVBOR..."
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid image format. Must be a data URL.' }),
        };
      }
      const mimeType = matches[1];
      const base64Data = matches[2];

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Using gemini-2.5-pro as specified in requirements
      // Fallback to gemini-1.5-pro if 2.5 is not yet active in this region, but assuming 2.5 per plan
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);
      
      transcription = result.response.text();
      
      console.log('[transcribe-image] ✅ Transcription completed with Gemini 2.5 Pro');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: transcription }),
    };

  } catch (error) {
    console.error('Transcription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to transcribe image',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

export { handler };

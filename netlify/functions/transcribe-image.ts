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

    // Performance logging - start
    const startTime = Date.now();
    console.log('[transcribe-image] Starting transcription with Gemini 2.5 Pro (multimodal)');
    
    let transcription = '';

    // ALWAYS use Gemini 2.5 Pro (multimodal LLM optimized for vision)
    // Ignore any provider parameter - this function is locked to Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.error('[transcribe-image] Missing GEMINI_API_KEY');
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
    const imageSizeKB = Math.round((base64Data.length * 0.75) / 1024); // Approximate size in KB

    console.log(`[transcribe-image] Image type: ${mimeType}, size: ~${imageSizeKB}KB`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    
    // Performance logging - end
    const duration = Date.now() - startTime;
    const tokenUsage = result.response.usageMetadata;
    const promptTokens = tokenUsage?.promptTokenCount || 0;
    const completionTokens = tokenUsage?.candidatesTokenCount || 0;
    const totalTokens = promptTokens + completionTokens;
    
    console.log(`[transcribe-image] ✅ Completed in ${duration}ms`);
    console.log(`[transcribe-image] Output text length: ${transcription.length} characters`);
    console.log(`[transcribe-image] Token usage: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total`);
    console.log(`[transcribe-image] Performance: ${(transcription.length / (duration / 1000)).toFixed(0)} chars/sec`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        text: transcription,
        performance: {
          duration_ms: duration,
          provider: 'gemini',
          model: 'gemini-2.5-pro',
          image_size_kb: imageSizeKB,
          image_type: mimeType,
          output_length: transcription.length,
          tokens_used: totalTokens,
        }
      }),
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

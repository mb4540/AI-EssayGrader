import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getLLMProvider, LLMProviderName } from './lib/llm/factory';

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
    const { text, ocr_prompt, llmProvider, llmModel } = JSON.parse(event.body || '{}');

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'text is required' }),
      };
    }

    // Initialize LLM Provider (default to Gemini)
    const providerName = (llmProvider as LLMProviderName) || 'gemini';
    const apiKey = providerName === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(`${providerName.toUpperCase()} API key not configured`);
    }

    const provider = getLLMProvider(providerName, apiKey, llmModel);
    
    // Performance logging - start
    const startTime = Date.now();
    console.log(`[enhance-text] Starting text enhancement with ${providerName} (${llmModel || 'default'})`);
    console.log(`[enhance-text] Input text length: ${text.length} characters`);

    const response = await provider.generate({
      systemMessage: ocr_prompt || TEXT_ENHANCEMENT_PROMPT,
      userMessage: `Clean up this OCR text from a handwritten essay:\n\n${text}`,
      temperature: 0.3, // Low temperature for consistent cleanup
      jsonMode: false,
    });

    const enhanced_text = response.content.trim();
    
    // Performance logging - end
    const duration = Date.now() - startTime;
    console.log(`[enhance-text] ✅ Completed in ${duration}ms`);
    console.log(`[enhance-text] Output text length: ${enhanced_text.length} characters`);
    console.log(`[enhance-text] Token usage: ${response.usage.promptTokens} prompt + ${response.usage.completionTokens} completion = ${response.usage.promptTokens + response.usage.completionTokens} total`);
    console.log(`[enhance-text] Performance: ${(text.length / (duration / 1000)).toFixed(0)} chars/sec`);

    if (!enhanced_text) {
      throw new Error('No enhanced text generated');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        enhanced_text,
        performance: {
          duration_ms: duration,
          provider: providerName,
          model: llmModel || 'default',
          input_length: text.length,
          output_length: enhanced_text.length,
          tokens_used: response.usage.promptTokens + response.usage.completionTokens,
        }
      }),
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

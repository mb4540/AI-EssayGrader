import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.5-pro') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const model = this.client.getGenerativeModel({
            model: this.model,
            generationConfig: {
                responseMimeType: request.jsonMode ? "application/json" : "text/plain",
                temperature: request.temperature,
            }
        });

        // Gemini doesn't have a strict "system" role in the same way as OpenAI for all models,
        // but we can prepend it or use the system instruction if supported.
        // For 1.5 Flash/Pro, system instructions are supported.

        // Note: We need to recreate the model with system instruction if we want to use it properly
        // or just prepend it to the prompt.
        // Let's try using the systemInstruction property which is available in newer SDK versions

        const modelWithSystem = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: request.systemMessage,
            generationConfig: {
                responseMimeType: request.jsonMode ? "application/json" : "text/plain",
                temperature: this.model.includes('gemini-3') ? 1.0 : request.temperature, // Gemini 3 recommends temp 1.0
                // @ts-ignore - thinking_level is not yet in the types but supported by API
                thinking_level: this.model.includes('gemini-3') ? "high" : undefined,
            }
        });

        const result = await modelWithSystem.generateContent(request.userMessage);
        const response = await result.response;
        const content = response.text();

        return {
            content,
            usage: {
                // Gemini usage metadata might vary, providing defaults
                promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
                completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
            }
        };
    }
}

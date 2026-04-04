import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenAI;
    private model: string;

    constructor(model: string = 'gemini-2.5-pro') {
        this.client = new GoogleGenAI({});
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const result = await this.client.models.generateContent({
            model: this.model,
            config: {
                systemInstruction: request.systemMessage,
                responseMimeType: request.jsonMode ? 'application/json' : 'text/plain',
                temperature: request.temperature,
            },
            contents: request.userMessage,
        });

        return {
            content: result.text ?? '',
            usage: {
                promptTokens: result.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: result.usageMetadata?.candidatesTokenCount ?? 0,
            }
        };
    }
}

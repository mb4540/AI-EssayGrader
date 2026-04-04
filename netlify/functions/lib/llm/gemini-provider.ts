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
        const contents: any[] = [];

        if (request.messages) {
            for (const msg of request.messages) {
                if (msg.role !== 'system') {
                    contents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    });
                }
            }
        } else {
            if (request.userMessage) {
                contents.push({ text: request.userMessage });
            }
        }

        if (request.inlineData) {
            for (const item of request.inlineData) {
                contents.push({ inlineData: { data: item.data, mimeType: item.mimeType } });
            }
        }

        const systemInstruction = request.messages
            ? request.messages.find(m => m.role === 'system')?.content || request.systemMessage
            : request.systemMessage;

        const result = await this.client.models.generateContent({
            model: this.model,
            config: {
                systemInstruction,
                responseMimeType: request.jsonMode ? 'application/json' : 'text/plain',
                temperature: request.temperature,
                maxOutputTokens: request.maxOutputTokens,
            },
            contents,
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

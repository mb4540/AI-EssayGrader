import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenAI;
    private model: string;

    constructor(model: string = 'gemini-2.5-pro') {
        this.client = new GoogleGenAI({});
        this.model = model;
    }

    private buildContents(request: LLMRequest): any[] {
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

        return contents;
    }

    private getSystemInstruction(request: LLMRequest): string {
        return request.messages
            ? request.messages.find(m => m.role === 'system')?.content || request.systemMessage
            : request.systemMessage;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const contents = this.buildContents(request);
        const systemInstruction = this.getSystemInstruction(request);

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

    async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
        const contents = this.buildContents(request);
        const systemInstruction = this.getSystemInstruction(request);

        const stream = await this.client.models.generateContentStream({
            model: this.model,
            config: {
                systemInstruction,
                responseMimeType: 'text/plain',
                temperature: request.temperature,
                maxOutputTokens: request.maxOutputTokens,
            },
            contents,
        });

        for await (const chunk of stream) {
            yield { content: chunk.text ?? '', done: false };
        }
        yield { content: '', done: true };
    }
}

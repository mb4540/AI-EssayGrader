import { OpenAI } from 'openai';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';
import { isCompletionTokensModel } from './models';

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(model: string = 'gpt-4o-mini') {
        this.client = new OpenAI();
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        let response_format: any = undefined;
        if (request.jsonSchema) {
            response_format = { type: 'json_schema', json_schema: request.jsonSchema };
        } else if (request.jsonMode) {
            response_format = { type: 'json_object' };
        }

        // GPT-5+, GPT-4.1, O3, O4 use max_completion_tokens; older models use max_tokens
        const tokenParam = isCompletionTokensModel(this.model)
            ? { max_completion_tokens: request.maxOutputTokens ?? 4096 }
            : request.maxOutputTokens
              ? { max_tokens: request.maxOutputTokens }
              : {};

        const messages = request.messages
            ? request.messages.map(m => ({ role: m.role, content: m.content }))
            : [
                { role: 'system' as const, content: request.systemMessage },
                { role: 'user' as const, content: request.userMessage },
              ];

        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format,
            messages,
            temperature: request.temperature,
            ...tokenParam,
        });

        const content = response.choices[0]?.message?.content || '';

        return {
            content,
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
            }
        };
    }

    private buildMessages(request: LLMRequest): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
        return request.messages
            ? request.messages.map(m => ({ role: m.role, content: m.content }))
            : [
                { role: 'system' as const, content: request.systemMessage },
                { role: 'user' as const, content: request.userMessage },
              ];
    }

    private buildTokenParam(): Record<string, number> {
        return isCompletionTokensModel(this.model)
            ? { max_completion_tokens: 4096 }
            : {};
    }

    async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
        const messages = this.buildMessages(request);

        const tokenParam = isCompletionTokensModel(this.model)
            ? { max_completion_tokens: request.maxOutputTokens ?? 4096 }
            : request.maxOutputTokens
              ? { max_tokens: request.maxOutputTokens }
              : {};

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages,
            temperature: request.temperature,
            stream: true,
            ...tokenParam,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            const done = chunk.choices[0]?.finish_reason !== null;
            if (content || done) {
                yield { content, done };
            }
        }
    }
}

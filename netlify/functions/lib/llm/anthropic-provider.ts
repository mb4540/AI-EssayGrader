import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './types';

export class AnthropicProvider implements LLMProvider {
    private client: Anthropic;
    private model: string;

    constructor(model: string = 'claude-sonnet-4-5-20250929') {
        this.client = new Anthropic();
        this.model = model;
    }

    private buildMessages(request: LLMRequest): {
        systemContent: string;
        userMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
    } {
        if (request.messages) {
            const systemMsg = request.messages.find(m => m.role === 'system');
            return {
                systemContent: systemMsg?.content || '',
                userMessages: request.messages
                    .filter(m => m.role !== 'system')
                    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            };
        }
        return {
            systemContent: request.systemMessage,
            userMessages: [{ role: 'user', content: request.userMessage }],
        };
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const { systemContent, userMessages } = this.buildMessages(request);

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: request.maxOutputTokens ?? 4096,
            system: systemContent,
            messages: userMessages,
            temperature: request.temperature,
        });

        const content = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');

        return {
            content,
            usage: {
                promptTokens: response.usage?.input_tokens ?? 0,
                completionTokens: response.usage?.output_tokens ?? 0,
            }
        };
    }

    async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
        const { systemContent, userMessages } = this.buildMessages(request);

        const stream = this.client.messages.stream({
            model: this.model,
            max_tokens: request.maxOutputTokens ?? 4096,
            system: systemContent,
            messages: userMessages,
            temperature: request.temperature,
        });

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield { content: event.delta.text, done: false };
            }
        }
        yield { content: '', done: true };
    }
}

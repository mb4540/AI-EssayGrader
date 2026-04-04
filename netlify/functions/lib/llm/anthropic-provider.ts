import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class AnthropicProvider implements LLMProvider {
    private client: Anthropic;
    private model: string;

    constructor(model: string = 'claude-sonnet-4-5-20250929') {
        this.client = new Anthropic();
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: request.maxOutputTokens ?? 4096,
            system: request.systemMessage,
            messages: [
                { role: 'user', content: request.userMessage }
            ],
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
}

import { OpenAI } from 'openai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format: request.jsonMode ? { type: 'json_object' } : undefined,
            messages: [
                { role: 'system', content: request.systemMessage },
                { role: 'user', content: request.userMessage }
            ],
            temperature: request.temperature,
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
}

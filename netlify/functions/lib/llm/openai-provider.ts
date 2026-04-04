import { OpenAI } from 'openai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

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

        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format,
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

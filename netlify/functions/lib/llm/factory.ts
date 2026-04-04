import { LLMProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { AnthropicProvider } from './anthropic-provider';

export type LLMProviderName = 'openai' | 'gemini' | 'anthropic';

export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
    switch (providerName) {
        case 'openai':
            return new OpenAIProvider(model);
        case 'anthropic':
            return new AnthropicProvider(model);
        case 'gemini':
        default:
            return new GeminiProvider(model);
    }
}

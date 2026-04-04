import { LLMProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';

export type LLMProviderName = 'openai' | 'gemini';

export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
    switch (providerName) {
        case 'openai':
            return new OpenAIProvider(model);
        case 'gemini':
        default:
            return new GeminiProvider(model);
    }
}

import { LLMProvider } from './types';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { AnthropicProvider } from './anthropic-provider';
import { getModelById } from './models';

export type LLMProviderName = 'openai' | 'gemini' | 'anthropic';

export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
    if (model) {
        const modelDef = getModelById(model);
        if (modelDef && modelDef.provider !== providerName) {
            console.warn(
                `[llm-factory] Model "${model}" belongs to "${modelDef.provider}" but provider "${providerName}" was requested`
            );
        }
    }

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

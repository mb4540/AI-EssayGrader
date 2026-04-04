export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  isDefault?: boolean;
  capabilities: {
    streaming: boolean;
    toolCalling: boolean;
    multimodal: boolean;
    jsonMode: boolean;
    jsonSchema: boolean;
  };
  parameterStyle: 'standard' | 'completion_tokens';
  // 'completion_tokens' = uses max_completion_tokens instead of max_tokens (GPT-5+, O3, O4)
}

export const MODEL_REGISTRY: ModelDefinition[] = [
  // OpenAI models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', isDefault: true,
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: true, jsonSchema: true },
    parameterStyle: 'standard' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: true, jsonSchema: true },
    parameterStyle: 'standard' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: true, jsonSchema: true },
    parameterStyle: 'completion_tokens' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: true, jsonSchema: true },
    parameterStyle: 'completion_tokens' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: false, jsonMode: true, jsonSchema: true },
    parameterStyle: 'completion_tokens' },
  { id: 'o3-mini', name: 'O3 Mini', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: false, jsonMode: true, jsonSchema: false },
    parameterStyle: 'completion_tokens' },
  { id: 'o4-mini', name: 'O4 Mini', provider: 'openai',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: true, jsonSchema: false },
    parameterStyle: 'completion_tokens' },

  // Gemini models
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', isDefault: true,
    capabilities: { streaming: true, toolCalling: false, multimodal: true, jsonMode: true, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini',
    capabilities: { streaming: true, toolCalling: false, multimodal: true, jsonMode: true, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini',
    capabilities: { streaming: true, toolCalling: false, multimodal: true, jsonMode: true, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini',
    capabilities: { streaming: true, toolCalling: false, multimodal: true, jsonMode: true, jsonSchema: false },
    parameterStyle: 'standard' },

  // Anthropic models
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic', isDefault: true,
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: false, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic',
    capabilities: { streaming: true, toolCalling: true, multimodal: false, jsonMode: false, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: false, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic',
    capabilities: { streaming: true, toolCalling: true, multimodal: true, jsonMode: false, jsonSchema: false },
    parameterStyle: 'standard' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic',
    capabilities: { streaming: true, toolCalling: true, multimodal: false, jsonMode: false, jsonSchema: false },
    parameterStyle: 'standard' },
];

export function getModelsByProvider(provider: string): ModelDefinition[] {
  return MODEL_REGISTRY.filter(m => m.provider === provider);
}

export function getDefaultModel(provider: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(m => m.provider === provider && m.isDefault);
}

export function getModelById(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(m => m.id === modelId);
}

export function isCompletionTokensModel(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.parameterStyle === 'completion_tokens';
}

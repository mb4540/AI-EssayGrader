export interface ModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  isDefault?: boolean;
  description?: string;
}

export const MODEL_CATALOG: ModelOption[] = [
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', isDefault: true, description: 'Flagship multimodal model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast and affordable' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', description: 'Latest generation' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', description: 'Latest gen, smaller' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', description: 'Ultra-fast, lightweight' },
  { id: 'o3-mini', name: 'O3 Mini', provider: 'openai', description: 'Reasoning model' },
  { id: 'o4-mini', name: 'O4 Mini', provider: 'openai', description: 'Latest reasoning model' },
  // Gemini
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', isDefault: true, description: 'Best quality grading' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', description: 'Fast, high quality' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'gemini', description: 'Ultra-fast, cost effective' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', description: 'Proven, reliable' },
  // Anthropic
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic', isDefault: true, description: 'Nuanced feedback' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', description: 'Fast and concise' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic', description: 'Maximum capability' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', description: 'Strong all-around' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', description: 'Efficient, affordable' },
];

export const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export function getModelsByProvider(provider: string): ModelOption[] {
  return MODEL_CATALOG.filter(m => m.provider === provider);
}

export function getDefaultModel(provider: string): ModelOption | undefined {
  return MODEL_CATALOG.find(m => m.provider === provider && m.isDefault);
}

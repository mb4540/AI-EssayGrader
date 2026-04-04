export interface InlineData {
  data: string;
  mimeType: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  systemMessage: string;
  userMessage: string;
  messages?: LLMMessage[];
  jsonMode?: boolean;
  temperature?: number;
  inlineData?: InlineData[];
  maxOutputTokens?: number;
  jsonSchema?: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}

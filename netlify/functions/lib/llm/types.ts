export interface LLMRequest {
  systemMessage: string;
  userMessage: string;
  jsonMode?: boolean;
  temperature?: number;
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

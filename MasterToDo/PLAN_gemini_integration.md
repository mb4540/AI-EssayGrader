# Plan: Gemini API Integration & LLM Switching

## Goal
Integrate Google Gemini API alongside OpenAI to allow teachers to switch between LLMs. This enables performance evaluation (speed, quality, cost) and provides redundancy.

## User Review Required
> [!IMPORTANT]
> **Gemini API Key**: You will need to obtain a Google Gemini API key and add it to your Netlify environment variables as `GEMINI_API_KEY`.

> [!NOTE]
> **Model Selection**: We will support ANY Gemini model (e.g., `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`). The UI will allow selecting from a list or entering a custom model ID to support future versions like Gemini 3.

## Proposed Changes

### 1. Backend: LLM Abstraction Layer

We need to decouple the grading logic from the direct `openai` library usage.

#### [NEW] `netlify/functions/lib/llm/types.ts`
Define the interface for LLM providers.
```typescript
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
```

#### [NEW] `netlify/functions/lib/llm/openai-provider.ts`
Move existing OpenAI logic here.
```typescript
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
    // ... existing implementation ...
  }
}
```

#### [NEW] `netlify/functions/lib/llm/gemini-provider.ts`
Implement Gemini logic using `@google/generative-ai`.
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    // ... implementation ...
  }
}
```

#### [NEW] `netlify/functions/lib/llm/factory.ts`
Factory to get the correct provider.
```typescript
export function getLLMProvider(providerName: 'openai' | 'gemini', apiKey?: string): LLMProvider {
  // ... logic to return correct provider ...
}
```

### 2. Backend: Update Grading Functions

#### [MODIFY] `netlify/functions/grade-bulletproof-background.ts`
- Remove direct `openai` import.
- Import `getLLMProvider` from factory.
- Read `llmProvider` from `input_data` (passed from trigger).
- Use the provider interface for both Pass 1 and Pass 2.

#### [MODIFY] `netlify/functions/grade-bulletproof-trigger.ts`
- Accept `llmProvider` in the request body.
- Pass it through to the background job payload.

### 3. Frontend: UI Controls

#### [MODIFY] `src/components/SettingsModal.tsx`
- Add a new tab or section for "LLM Provider".
- Add a dropdown to select between "OpenAI" and "Google Gemini".
- **Model Selector**:
  - For Gemini: Show dropdown with defaults (`gemini-1.5-flash`, `gemini-1.5-pro`) + "Custom" option.
  - If "Custom" is selected, show an input field to type any model ID (e.g., `gemini-3.0-pro`).
- Save preferences to `localStorage` (keys: `ai_provider`, `ai_model_gemini`, `ai_model_openai`).

#### [MODIFY] `src/lib/api.ts`
- Update `gradeSubmission` (or equivalent function) to read `ai_provider` from localStorage.
- Include it in the API request payload.

## Verification Plan

### Automated Tests
- Create unit tests for `OpenAIProvider` and `GeminiProvider` (mocking the actual API calls).
- Test the factory logic.

### Manual Verification
1. **Setup**: Add `GEMINI_API_KEY` to `.env`.
2. **Config**: Open Settings Modal, switch to "Google Gemini".
3. **Grading**: Grade an essay. Verify it works and logs show Gemini was used.
4. **Annotations**: Verify inline annotations appear correctly.
5. **Switch Back**: Switch back to OpenAI and verify it still works.

## Dependencies
- `npm install @google/generative-ai`

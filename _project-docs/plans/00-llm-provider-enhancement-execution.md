# LLM Provider Enhancement — Execution Plan

**Date:** 2026-04-04
**Branch:** `feat/llm-provider-enhancement`
**Status:** READY FOR EXECUTION
**Mockup Source:** N/A (backend refactor + Settings UI enhancement, no full-page mockup)
**Template:** Follows `plan-file-constitution.md` structure
**Source:** `_project-docs/RefDocs/netlify-ai-gateway-comparison.md`

---

## Goal

Enhance the AI-EssayGrader LLM provider layer to incorporate the best features from GenAIWidgets while preserving the existing class-based factory architecture and Gateway-managed zero-config approach. This merges GenAIWidgets' strengths (model catalog, tool calling, newer-model parameter handling, streaming, Gateway documentation) into AI-EssayGrader's cleaner abstraction.

Key outcomes:
1. **Expanded model catalog** — Shared model registry with 20+ models across OpenAI, Gemini, and Anthropic, used by both backend and frontend
2. **GPT-5+ parameter handling** — OpenAIProvider correctly uses `max_completion_tokens` for GPT-5, GPT-4.1, O3, and O4 models
3. **Multi-turn conversation support** — `LLMRequest` supports message arrays for conversation history (annotation-chat and future features)
4. **Streaming support** — New `generateStream()` method on `LLMProvider` for real-time grading feedback
5. **AI Gateway rules file** — Comprehensive `.windsurf/rules/ai-gateway.md` adapted from GenAIWidgets for AI-EssayGrader
6. **Enhanced Settings UI** — Model selector with per-provider model dropdown replacing the current 3-option picker

---

## EXECUTION RULES — READ BEFORE ANY WORK

> **STOP-AND-REVIEW PROTOCOL**
>
> 1. Execute **ONE phase at a time**. Do NOT begin the next phase until the current phase is reviewed and approved by the human operator.
> 2. After completing each phase, update the **Phase Checklist** with completion status and the **Implementation Notes** section at the bottom of that phase with what was actually built.
> 3. Each phase is written to be **self-contained** — it includes full repo context so it can be executed in a new chat window with zero carryover context.
> 4. At the start of each phase, read the Implementation Notes from all prior completed phases to understand the as-built state (not just the original plan).
> 5. Do NOT skip steps. Do NOT combine phases. Do NOT start Phase N+1 until Phase N is marked `APPROVED` in the checklist.
> 6. If a phase requires changes to the plan based on what was actually built, note the deviation in the Implementation Notes and adjust subsequent phase instructions accordingly.
> 7. Commit at the end of each phase with the specified commit message. Do NOT push until the human operator approves.

---

## Phase Checklist

Update this checklist after each phase completes. Mark `APPROVED` only after human review.

| Phase | Description | Status | Commit Hash | Approved By | Date |
|---|---|---|---|---|---|
| Phase 1 | Create shared model registry and types | `APPROVED` | 543721c | Mike Berry | 2026-04-04 14:07 CDT |
| Phase 2 | GPT-5+ parameter handling in OpenAIProvider | `APPROVED` | 8bce009 | Mike Berry | 2026-04-04 14:11 CDT |
| Phase 3 | Add multi-turn conversation support to providers | `APPROVED` | 2036d83 | Mike Berry | 2026-04-04 14:17 CDT |
| Phase 4 | Add streaming support (`generateStream`) | `APPROVED` | 259da2b | Mike Berry | 2026-04-04 14:23 CDT |
| Phase 5 | Update Settings UI with model selector dropdown | `IN PROGRESS` | | | |
| Phase 6 | Create AI Gateway rules file | `NOT STARTED` | | | |
| Phase 7 | Update health-check, .env.example, and documentation | `NOT STARTED` | | | |
| Phase 8 | Final verification and regression testing | `NOT STARTED` | | | |

**Status values:** `NOT STARTED` → `IN PROGRESS` → `COMPLETE` → `APPROVED`

---

## Implementation Notes (deviations from plan)

Record deviations here after each phase so subsequent phases can account for them.

**Phase 1:** No deviations. Created `models.ts` with 16 models (7 OpenAI, 4 Gemini, 5 Anthropic) and updated `factory.ts` with model/provider mismatch validation. No barrel `index.ts` exists — callers import directly.

**Phase 2:** No deviations.

**Phase 3:** No deviations. `annotation-chat.ts` uses single-turn only — no migration needed (backward compatible).

**Phase 4:** No deviations. All three providers now have `generateStream()`. Extracted helper methods (`buildContents`/`getSystemInstruction` in Gemini, `buildMessages` in Anthropic, `buildMessages`/`buildTokenParam` in OpenAI) to share logic between `generate()` and `generateStream()`. OpenAI `buildTokenParam` helper was created but `generate()` still uses its inline version — minor duplication, can be cleaned up later.

---

## Repository Context (As-Built Baseline)

### Project Structure

```
AI-EssayGrader/
├── netlify/functions/                  # Netlify serverless functions (backend)
│   ├── lib/llm/                        # LLM provider abstraction layer
│   │   ├── types.ts                    # LLMProvider interface, LLMRequest, LLMResponse, InlineData
│   │   ├── openai-provider.ts          # OpenAI SDK wrapper (zero-config, JSON Schema support)
│   │   ├── gemini-provider.ts          # Gemini SDK wrapper (@google/genai, multimodal)
│   │   ├── anthropic-provider.ts       # Anthropic SDK wrapper (zero-config)
│   │   └── factory.ts                  # getLLMProvider() factory — 3 providers
│   ├── grade-bulletproof-background.ts # Main grading (uses factory)
│   ├── enhance-text.ts                 # OCR text cleanup (uses factory)
│   ├── enhance-rubric.ts              # Rubric enhancement (uses factory)
│   ├── enhance-rubric-background.ts   # Background rubric enhancement (uses factory)
│   ├── annotation-chat.ts             # LLM annotation review (uses factory, single-turn)
│   ├── transcribe-image.ts            # Handwriting transcription (uses factory, multimodal)
│   ├── extract-rubric-from-document.ts # Rubric extraction (uses factory)
│   ├── extract-rubric-background.ts   # Background rubric extraction (uses factory)
│   └── health-check.ts                # Env var status check
├── src/
│   ├── components/
│   │   └── SettingsModal.tsx           # LLM provider selector (gemini|openai|anthropic)
│   └── lib/
│       └── api.ts                      # Frontend API client — reads localStorage ai_provider
├── .windsurf/rules/                    # Project rules (no ai-gateway.md yet)
├── package.json                        # @google/genai, openai, @anthropic-ai/sdk
└── .env.example                        # Gateway documentation
```

### Current LLM Provider State (Post-Gateway Migration)

All 8 active functions route through `getLLMProvider()`. Zero raw SDK usage. All three providers use zero-config constructors reading Gateway-injected env vars.

| File | Lines | Key Features |
|------|-------|-------------|
| `types.ts` | 31 | `LLMProvider` interface with single `generate()` method. `LLMRequest` has: `systemMessage`, `userMessage`, `jsonMode`, `temperature`, `inlineData`, `maxOutputTokens`, `jsonSchema` |
| `factory.ts` | 22 | `getLLMProvider(providerName, model?)` — returns OpenAI, Gemini, or Anthropic |
| `openai-provider.ts` | 42 | `new OpenAI()` zero-config. Supports `json_schema` and `json_object` response formats. **Does NOT handle `max_completion_tokens` for GPT-5+ models** |
| `gemini-provider.ts` | 44 | `new GoogleGenAI({})` zero-config. Supports `inlineData` for multimodal, `responseMimeType` for JSON mode |
| `anthropic-provider.ts` | 38 | `new Anthropic()` zero-config. Extracts text blocks, maps `input_tokens`/`output_tokens` |

### Current Frontend LLM Settings

- `SettingsModal.tsx` line 197: `useState<'gemini' | 'openai' | 'anthropic'>('gemini')`
- `SettingsModal.tsx` lines 331-333: Three `SelectItem` elements — hardcoded 1 model per provider
- `api.ts` lines 71-76: Maps provider to model name: `gemini` → `gemini-2.5-pro`, `anthropic` → `claude-sonnet-4-5-20250929`, `openai` → `gpt-4o`

### Current npm Dependencies (LLM-related)

```json
{
  "@google/genai": "^1.0.0",
  "openai": "^6.1.0",
  "@anthropic-ai/sdk": "^0.39.0"
}
```

---

## Backend Endpoints — Complete Map

### 6.1 Endpoints That Exist and Need Modification

| Endpoint | Route File | LLM Change Needed |
|----------|------------|-------------------|
| `POST grade-bulletproof-background` | `grade-bulletproof-background.ts` | None (Phase 1 model registry used transparently via factory) |
| `POST enhance-text` | `enhance-text.ts` | None |
| `POST enhance-rubric` | `enhance-rubric.ts` | None |
| `POST enhance-rubric-background` | `enhance-rubric-background.ts` | None |
| `POST annotation-chat` | `annotation-chat.ts` | Phase 3: Convert to multi-turn `messages` array |
| `POST transcribe-image` | `transcribe-image.ts` | None |
| `POST extract-rubric-from-document` | `extract-rubric-from-document.ts` | None |
| `POST extract-rubric-background` | `extract-rubric-background.ts` | None |
| `GET health-check` | `health-check.ts` | Phase 7: Add model registry version info |

### 6.2 New Endpoints Needed

None — no new endpoints required for this plan.

### 6.3 New Files Needed

| File | Phase | Purpose |
|------|-------|---------|
| `netlify/functions/lib/llm/models.ts` | 1 | Shared model registry (all providers, all models) |
| `netlify/functions/lib/llm/streaming.ts` | 4 | Streaming response types and helpers |
| `.windsurf/rules/ai-gateway.md` | 6 | AI Gateway rules adapted from GenAIWidgets |

---

## 3. Phase 1: Create Shared Model Registry and Types

**Commit message:** `feat(llm): phase 1 — shared model registry with 20+ models`
**Prerequisite:** None

### 3.0 Context

Both SettingsModal.tsx (frontend) and api.ts hardcode model names. GenAIWidgets has a shared `ModelSelector.tsx` with 23 models across 3 providers. This phase creates a backend-authoritative model registry that both frontend and backend consume, eliminating hardcoded model strings.

### 3.1 Implementation Steps

**Step 1: Create `netlify/functions/lib/llm/models.ts`**

This file defines the canonical model registry. It exports types and data consumed by the factory, providers, and (via an API or direct import in frontend) the Settings UI.

```typescript
// netlify/functions/lib/llm/models.ts

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

// Helper functions
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
```

**Step 2: Export from `netlify/functions/lib/llm/` barrel (optional)**

If a barrel `index.ts` exists, add the export. If not, callers import directly from `models.ts`.

**Step 3: Update `factory.ts` to validate model against registry**

Add an optional validation step in `getLLMProvider()`:

```typescript
import { getModelById } from './models';

export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
    // Validate model belongs to requested provider (warn if mismatch, don't break)
    if (model) {
        const modelDef = getModelById(model);
        if (modelDef && modelDef.provider !== providerName) {
            console.warn(`[llm-factory] Model "${model}" belongs to "${modelDef.provider}" but provider "${providerName}" was requested`);
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
```

### 3.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] `models.ts` exports `MODEL_REGISTRY`, `getModelsByProvider`, `getDefaultModel`, `getModelById`, `isCompletionTokensModel`
- [ ] `ModelDefinition` interface includes `capabilities` and `parameterStyle`
- [ ] Factory logs warning for provider/model mismatch but does not throw

### 3.3 Implementation Notes

**Files created (1):**
- `netlify/functions/lib/llm/models.ts` — 85 lines. `ModelDefinition` interface with `capabilities` and `parameterStyle`. `MODEL_REGISTRY` array with 16 models (7 OpenAI, 4 Gemini, 5 Anthropic). Helper functions: `getModelsByProvider`, `getDefaultModel`, `getModelById`, `isCompletionTokensModel`.

**Files modified (1):**
- `netlify/functions/lib/llm/factory.ts` — Added `import { getModelById } from './models'`. Added 7-line validation block that warns (does not throw) when a model ID belongs to a different provider than requested. 22 → 31 lines.

**Dependencies added:** None.

**Deviations from plan:** None. No barrel `index.ts` exists so Step 2 was skipped (plan noted it as optional).

**Verification:** `npx tsc --noEmit` — zero errors. `npm run build` — succeeds (index.js 1,628 kB). `npm test` — 588 passing, 4 skipped, 2 pre-existing failures (OCR error message mismatch). No regressions.

---

## 4. Phase 2: GPT-5+ Parameter Handling in OpenAIProvider

**Commit message:** `feat(llm): phase 2 — GPT-5+ max_completion_tokens handling`
**Prerequisite:** Phase 1 `APPROVED`

### 4.0 Context

GenAIWidgets correctly uses `max_completion_tokens` instead of `max_tokens` for GPT-5, GPT-4.1, O3, and O4 models. The current `OpenAIProvider` does not pass any max tokens parameter at all, which may cause issues with newer models. This phase adds model-aware parameter selection using the `isCompletionTokensModel()` helper from the Phase 1 registry.

### 4.1 Implementation Steps

**Step 1: Update `netlify/functions/lib/llm/openai-provider.ts`**

Store the model string and use it in `generate()` to select the correct parameter:

```typescript
import { isCompletionTokensModel } from './models';

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

        // GPT-5+, GPT-4.1, O3, O4 use max_completion_tokens; older models use max_tokens
        const tokenParam = isCompletionTokensModel(this.model)
            ? { max_completion_tokens: request.maxOutputTokens ?? 4096 }
            : request.maxOutputTokens
              ? { max_tokens: request.maxOutputTokens }
              : {};

        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format,
            messages: [
                { role: 'system', content: request.systemMessage },
                { role: 'user', content: request.userMessage }
            ],
            temperature: request.temperature,
            ...tokenParam,
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
```

### 4.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] `OpenAIProvider` uses `max_completion_tokens` for models with `parameterStyle: 'completion_tokens'`
- [ ] `OpenAIProvider` uses `max_tokens` (or omits) for standard models
- [ ] Existing grading workflow unchanged (default model is `gpt-4o-mini` → standard)

### 4.3 Implementation Notes

**Files modified (1):**
- `netlify/functions/lib/llm/openai-provider.ts` — Added `import { isCompletionTokensModel } from './models'`. Added 6-line `tokenParam` block that uses `max_completion_tokens` for GPT-5+/GPT-4.1/O3/O4 models and `max_tokens` for older models. Spread `...tokenParam` into the API call. 42 → 51 lines.

**Dependencies added:** None.

**Deviations from plan:** None.

**Verification:** `npx tsc --noEmit` — zero errors. `npm run build` — succeeds (index.js 1,628 kB). `npm test` — 588 passing, 4 skipped, 2 pre-existing failures. No regressions.

---

## 5. Phase 3: Add Multi-Turn Conversation Support

**Commit message:** `feat(llm): phase 3 — multi-turn conversation support in providers`
**Prerequisite:** Phase 2 `APPROVED`

### 5.0 Context

Currently `LLMRequest` is single-turn: one `systemMessage` + one `userMessage`. GenAIWidgets supports full conversation history via a `messages` array. This phase adds an optional `messages` array to `LLMRequest` for multi-turn use cases (annotation-chat, future features) while keeping the existing single-turn API fully backward compatible.

### 5.1 Implementation Steps

**Step 1: Extend `netlify/functions/lib/llm/types.ts`**

Add a `messages` array alongside existing fields. When `messages` is provided, providers use it instead of `systemMessage`/`userMessage`.

```typescript
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  // Single-turn API (existing — fully backward compatible)
  systemMessage: string;
  userMessage: string;
  // Multi-turn API (new — optional)
  messages?: LLMMessage[];
  // Existing fields unchanged
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
```

**Step 2: Update `OpenAIProvider.generate()` to support `messages`**

```typescript
async generate(request: LLMRequest): Promise<LLMResponse> {
    // Build messages array — use request.messages if provided, else single-turn
    const messages = request.messages
        ? request.messages.map(m => ({ role: m.role, content: m.content }))
        : [
            { role: 'system' as const, content: request.systemMessage },
            { role: 'user' as const, content: request.userMessage },
          ];

    // ... rest of method unchanged (response_format, tokenParam, etc.)
    const response = await this.client.chat.completions.create({
        model: this.model,
        response_format,
        messages,
        temperature: request.temperature,
        ...tokenParam,
    });
    // ...
}
```

**Step 3: Update `AnthropicProvider.generate()` to support `messages`**

Anthropic separates system messages from the message array:

```typescript
async generate(request: LLMRequest): Promise<LLMResponse> {
    let systemContent: string;
    let userMessages: Array<{ role: 'user' | 'assistant'; content: string }>;

    if (request.messages) {
        const systemMsg = request.messages.find(m => m.role === 'system');
        systemContent = systemMsg?.content || '';
        userMessages = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    } else {
        systemContent = request.systemMessage;
        userMessages = [{ role: 'user', content: request.userMessage }];
    }

    const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxOutputTokens ?? 4096,
        system: systemContent,
        messages: userMessages,
        temperature: request.temperature,
    });
    // ... rest unchanged
}
```

**Step 4: Update `GeminiProvider.generate()` to support `messages`**

Map the messages array to Gemini's content format:

```typescript
async generate(request: LLMRequest): Promise<LLMResponse> {
    const contents: any[] = [];

    if (request.messages) {
        for (const msg of request.messages) {
            if (msg.role !== 'system') {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                });
            }
        }
    } else {
        if (request.userMessage) {
            contents.push({ text: request.userMessage });
        }
    }

    if (request.inlineData) {
        for (const item of request.inlineData) {
            contents.push({ inlineData: { data: item.data, mimeType: item.mimeType } });
        }
    }

    // System message: use messages[0] if system, or fallback to systemMessage
    const systemInstruction = request.messages
        ? request.messages.find(m => m.role === 'system')?.content || request.systemMessage
        : request.systemMessage;

    const result = await this.client.models.generateContent({
        model: this.model,
        config: {
            systemInstruction,
            responseMimeType: request.jsonMode ? 'application/json' : 'text/plain',
            temperature: request.temperature,
            maxOutputTokens: request.maxOutputTokens,
        },
        contents,
    });
    // ... rest unchanged
}
```

**Step 5: Migrate `annotation-chat.ts` to use multi-turn** (if it builds context)

Review `annotation-chat.ts` — if it constructs a conversation context, refactor to use the new `messages` array. Otherwise, leave as-is (backward compatible).

### 5.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] Existing single-turn calls (`systemMessage` + `userMessage`) still work without `messages`
- [ ] Providing `messages` array is honored by all three providers
- [ ] Anthropic correctly separates system messages from user/assistant messages
- [ ] Gemini correctly maps `assistant` → `model` role

### 5.3 Implementation Notes

**Files modified (4):**
- `netlify/functions/lib/llm/types.ts` — Added `LLMMessage` interface (`role: 'system' | 'user' | 'assistant'`, `content: string`). Added optional `messages?: LLMMessage[]` to `LLMRequest`. 31 → 37 lines.
- `netlify/functions/lib/llm/openai-provider.ts` — `generate()` now builds messages from `request.messages` if provided, else falls back to single-turn `systemMessage`/`userMessage`. 51 → 55 lines.
- `netlify/functions/lib/llm/anthropic-provider.ts` — `generate()` extracts system message from `request.messages` array and separates non-system messages for Anthropic API. 38 → 50 lines.
- `netlify/functions/lib/llm/gemini-provider.ts` — `generate()` maps `request.messages` to Gemini format (`assistant` → `model` role), extracts system instruction from messages array. 44 → 61 lines.

**Dependencies added:** None.

**Deviations from plan:** Step 5 (migrate `annotation-chat.ts`) skipped — it uses single-turn only, no conversation context to migrate. Fully backward compatible.

**Verification:** `npx tsc --noEmit` — zero errors. `npm run build` — succeeds (index.js 1,628 kB). `npm test` — 588 passing, 4 skipped, 2 pre-existing failures. No regressions.

---

## 6. Phase 4: Add Streaming Support

**Commit message:** `feat(llm): phase 4 — streaming support via generateStream()`
**Prerequisite:** Phase 3 `APPROVED`

### 6.0 Context

Neither AI-EssayGrader nor GenAIWidgets supports streaming LLM responses. Streaming provides real-time feedback during grading and annotation, improving perceived performance. This phase adds an optional `generateStream()` method to the `LLMProvider` interface and implements it for all three providers. Existing `generate()` callers are unaffected.

### 6.1 Implementation Steps

**Step 1: Add streaming types to `netlify/functions/lib/llm/types.ts`**

```typescript
export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
  generateStream?(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
}
```

The `generateStream` method is optional (`?`) so existing code compiles without changes.

**Step 2: Implement streaming in `OpenAIProvider`**

```typescript
async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const messages = request.messages
        ? request.messages.map(m => ({ role: m.role, content: m.content }))
        : [
            { role: 'system' as const, content: request.systemMessage },
            { role: 'user' as const, content: request.userMessage },
          ];

    const tokenParam = isCompletionTokensModel(this.model)
        ? { max_completion_tokens: request.maxOutputTokens ?? 4096 }
        : request.maxOutputTokens ? { max_tokens: request.maxOutputTokens } : {};

    const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: request.temperature,
        stream: true,
        ...tokenParam,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;
        if (content || done) {
            yield { content, done };
        }
    }
}
```

**Step 3: Implement streaming in `GeminiProvider`**

The `@google/genai` SDK supports streaming via `generateContentStream`:

```typescript
async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    // Build contents array (same logic as generate())
    const contents = this.buildContents(request);
    const systemInstruction = this.getSystemInstruction(request);

    const stream = await this.client.models.generateContentStream({
        model: this.model,
        config: {
            systemInstruction,
            responseMimeType: 'text/plain',
            temperature: request.temperature,
            maxOutputTokens: request.maxOutputTokens,
        },
        contents,
    });

    for await (const chunk of stream) {
        yield { content: chunk.text ?? '', done: false };
    }
    yield { content: '', done: true };
}
```

Note: Extract `buildContents()` and `getSystemInstruction()` as private helper methods to avoid duplication between `generate()` and `generateStream()`.

**Step 4: Implement streaming in `AnthropicProvider`**

Anthropic SDK supports streaming via `stream`:

```typescript
async *generateStream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const { systemContent, userMessages } = this.buildMessages(request);

    const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: request.maxOutputTokens ?? 4096,
        system: systemContent,
        messages: userMessages,
        temperature: request.temperature,
    });

    for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { content: event.delta.text, done: false };
        }
    }
    yield { content: '', done: true };
}
```

Note: Extract `buildMessages()` as a private helper to share between `generate()` and `generateStream()`.

### 6.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] `LLMProvider.generateStream` is optional — existing callers compile
- [ ] All three providers implement `generateStream()`
- [ ] No duplication between `generate()` and `generateStream()` (shared helper methods)
- [ ] Streaming does NOT work with `jsonMode` or `jsonSchema` (document this limitation)

### 6.3 Implementation Notes

**Files modified (4):**
- `netlify/functions/lib/llm/types.ts` — Added `LLMStreamChunk` interface (`content: string`, `done: boolean`). Added optional `generateStream?()` method to `LLMProvider` interface. 37 → 43 lines.
- `netlify/functions/lib/llm/openai-provider.ts` — Added `LLMStreamChunk` import. Added private `buildMessages()` and `buildTokenParam()` helpers. Added `generateStream()` that uses OpenAI streaming API (`stream: true`). 55 → 96 lines.
- `netlify/functions/lib/llm/gemini-provider.ts` — Added `LLMStreamChunk` import. Extracted `buildContents()` and `getSystemInstruction()` as private helpers (shared by `generate()` and `generateStream()`). Added `generateStream()` using `client.models.generateContentStream()`. 61 → 91 lines.
- `netlify/functions/lib/llm/anthropic-provider.ts` — Added `LLMStreamChunk` import. Extracted `buildMessages()` as private helper (shared by `generate()` and `generateStream()`). Added `generateStream()` using `client.messages.stream()` with `content_block_delta` event handling. 50 → 76 lines.

**Dependencies added:** None.

**Deviations from plan:** The plan mentioned a separate `streaming.ts` file in the New Files Needed table, but streaming types were small enough to add directly to `types.ts` (just `LLMStreamChunk`). No separate file was needed.

**Verification:** `npx tsc --noEmit` — zero errors. `npm run build` — succeeds (index.js 1,628 kB). `npm test` — 588 passing, 4 skipped, 2 pre-existing failures. No regressions.

---

## 7. Phase 5: Update Settings UI with Model Selector Dropdown

**Commit message:** `feat(llm): phase 5 — Settings UI model catalog with per-provider dropdown`
**Prerequisite:** Phase 4 `APPROVED`

### 7.0 Context

The current Settings UI has a single Select with 3 hardcoded options (Gemini 2.5 Pro, OpenAI GPT-4o, Anthropic Claude Sonnet). GenAIWidgets has a two-dropdown approach (provider + model). This phase replaces the hardcoded picker with a provider dropdown and a dependent model dropdown, sourcing models from the Phase 1 registry.

### 7.1 Implementation Steps

**Step 1: Create a frontend-accessible model registry**

The backend `models.ts` cannot be directly imported by the frontend (Netlify Functions vs Vite). Create a shared constants file or duplicate the registry on the frontend side:

Create `src/lib/model-registry.ts`:

```typescript
// Mirror of netlify/functions/lib/llm/models.ts for frontend use
// Keep in sync manually or via build script

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

export function getModelsByProvider(provider: string): ModelOption[] {
  return MODEL_CATALOG.filter(m => m.provider === provider);
}

export function getDefaultModel(provider: string): ModelOption | undefined {
  return MODEL_CATALOG.find(m => m.provider === provider && m.isDefault);
}
```

**Step 2: Update `src/components/SettingsModal.tsx`**

Replace the current single-select with two dropdowns:

1. **Provider dropdown** — Select `gemini`, `openai`, or `anthropic`
2. **Model dropdown** — Populated from `getModelsByProvider(selectedProvider)`, defaults to the provider's `isDefault` model

Update localStorage to store both `ai_provider` and `ai_model`:

```typescript
// State
const [llmProvider, setLlmProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
const [llmModel, setLlmModel] = useState('gemini-2.5-pro');

// On provider change, reset model to default
const handleProviderChange = (provider: 'gemini' | 'openai' | 'anthropic') => {
  setLlmProvider(provider);
  const defaultModel = getDefaultModel(provider);
  setLlmModel(defaultModel?.id || '');
};

// Load from localStorage
const savedProvider = localStorage.getItem('ai_provider');
const savedModel = localStorage.getItem('ai_model');

// Save to localStorage
localStorage.setItem('ai_provider', llmProvider);
localStorage.setItem('ai_model', llmModel);
```

Update the Model Details info box to read from the selected model's `description` instead of hardcoded text.

Replace the Gateway info box text to indicate total model count:
```
"Choose from {n} models across 3 AI providers. Powered by Netlify AI Gateway — no API keys required."
```

**Step 3: Update `src/lib/api.ts`**

Read both `ai_provider` and `ai_model` from localStorage:

```typescript
const llmProvider = localStorage.getItem('ai_provider') || 'gemini';
const llmModel = localStorage.getItem('ai_model') || 'gemini-2.5-pro';
```

Remove the hardcoded model mapping ternary (lines 72-76). The model is now stored directly.

### 7.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] Settings modal shows provider dropdown with 3 options
- [ ] Selecting a provider populates the model dropdown with that provider's models
- [ ] Default model is pre-selected for each provider
- [ ] Both `ai_provider` and `ai_model` stored in localStorage
- [ ] `api.ts` reads `ai_model` directly, no hardcoded mapping
- [ ] Model details info box shows description from registry
- [ ] Dark mode renders correctly
- [ ] Backward compatible: if only `ai_provider` exists in localStorage (no `ai_model`), falls back to provider's default model

### 7.3 Implementation Notes

_(to be filled during execution)_

---

## 8. Phase 6: Create AI Gateway Rules File

**Commit message:** `feat(llm): phase 6 — AI Gateway rules file for AI-EssayGrader`
**Prerequisite:** Phase 5 `APPROVED`

### 8.0 Context

GenAIWidgets has a comprehensive `.windsurf/rules/ai-gateway.md` (338 lines) documenting the Netlify AI Gateway: environment variables, SDK usage, local development, rate limiting, security, limitations, and best practices. AI-EssayGrader has no equivalent. This phase creates an adapted version specific to AI-EssayGrader's architecture.

### 8.1 Implementation Steps

**Step 1: Create `.windsurf/rules/ai-gateway.md`**

Adapt GenAIWidgets' `ai-gateway.md` with these AI-EssayGrader-specific changes:

1. **SDK examples** — Use `@google/genai` (new SDK), not `@google/generative-ai` (GenAIWidgets' old SDK)
2. **Architecture** — Reference the `LLMProvider` factory pattern, not raw SDK calls
3. **Provider examples** — Show `getLLMProvider()` usage, not direct SDK instantiation
4. **Local development** — Reference `netlify-cli` (devDependency), not `@netlify/vite-plugin`
5. **Security** — Reference AI-EssayGrader's FERPA compliance requirements
6. **Rate limiting** — Include the same patterns from GenAIWidgets

Key sections to include:
- Overview and prerequisites
- Auto-injected environment variables table
- Using the provider factory (not raw SDKs)
- Local development with `netlify dev`
- Rate limiting patterns
- Cost management
- Security and FERPA considerations
- Limitations (200k context window, no batch inference, etc.)
- Error handling patterns
- Preferred practices (Do / Don't lists)
- Pre-deployment checklist

**Step 2: Verify no conflicts with existing rules**

Check `.windsurf/rules/` for any overlapping content. The new file should complement, not duplicate, existing `api-design.md`, `security.md`, etc.

### 8.2 Verification

- [ ] `.windsurf/rules/ai-gateway.md` exists and is well-structured
- [ ] SDK examples use `@google/genai` (not the old SDK)
- [ ] References AI-EssayGrader's factory pattern
- [ ] Includes FERPA-specific security guidance
- [ ] Includes auto-injected environment variables table
- [ ] No duplication with existing rules files

### 8.3 Implementation Notes

_(to be filled during execution)_

---

## 9. Phase 7: Update Health-Check, .env.example, and Documentation

**Commit message:** `feat(llm): phase 7 — update docs for model registry and streaming`
**Prerequisite:** Phase 6 `APPROVED`

### 9.0 Context

With the model registry, streaming, multi-turn support, and expanded model catalog in place, this phase updates supporting documentation and diagnostics.

### 9.1 Implementation Steps

**Step 1: Update `netlify/functions/health-check.ts`**

Add model registry info to the health-check response:

```typescript
environment: {
  // existing keys...
  MODEL_REGISTRY_COUNT: MODEL_REGISTRY.length,
  PROVIDERS_AVAILABLE: ['openai', 'gemini', 'anthropic'],
}
```

**Step 2: Update `.env.example`**

Add a note about the expanded model catalog and new localStorage keys:

```
# Frontend Settings (localStorage)
# ai_provider: gemini | openai | anthropic
# ai_model: model ID from the model registry (e.g., gemini-2.5-pro, gpt-4o, claude-sonnet-4-5-20250929)
```

**Step 3: Update `README.md`**

Add a section about the LLM provider layer:
- Model registry with 16+ models
- Three providers: OpenAI, Gemini, Anthropic
- Streaming support
- Multi-turn conversation support
- Powered by Netlify AI Gateway (zero API key management)

### 9.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] Health-check returns model registry count
- [ ] `.env.example` documents new localStorage keys
- [ ] README.md documents LLM provider capabilities

### 9.3 Implementation Notes

_(to be filled during execution)_

---

## 10. Phase 8: Final Verification and Regression Testing

**Commit message:** `feat(llm): phase 8 — final verification and regression testing`
**Prerequisite:** Phase 7 `APPROVED`

### 10.0 Context

All code changes are complete. This phase performs a full regression test to ensure nothing is broken.

### 10.1 Implementation Steps

**Step 1: Full build verification**
- Run `npx tsc --noEmit` — zero errors
- Run `npm run build` — succeeds, note chunk sizes
- Run `npm test` — all tests pass, note test count

**Step 2: Grep audit — verify consistency**
```bash
# Model registry is the single source of truth
grep -r "gpt-4o-mini\|gpt-4o\|gemini-2.5-pro\|claude-sonnet" src/ --include="*.ts" --include="*.tsx"
# Should only appear in model-registry.ts and SettingsModal (as defaults), not hardcoded elsewhere

# No raw SDK instantiation in functions
grep -r "new OpenAI(" netlify/functions/ --include="*.ts" | grep -v "openai-provider" | grep -v ".legacy"
grep -r "new GoogleGenAI(" netlify/functions/ --include="*.ts" | grep -v "gemini-provider"
grep -r "new Anthropic(" netlify/functions/ --include="*.ts" | grep -v "anthropic-provider"
```

**Step 3: Functional verification** (manual, on `netlify dev`)
- [ ] Settings modal: select each provider, verify model dropdown populates correctly
- [ ] Settings modal: change provider, verify model resets to default
- [ ] Grade an essay with Gemini (default) — works
- [ ] Grade an essay with OpenAI — works
- [ ] Grade an essay with Anthropic — works
- [ ] Enhance rubric — works
- [ ] Transcribe handwritten image — works
- [ ] Annotation chat — works

**Step 4: Deploy to preview branch**
- Push `feat/llm-provider-enhancement` branch
- Verify preview deploy succeeds
- Test health-check on preview

### 10.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass, no regressions
- [ ] Grep audit: no hardcoded model names outside registry
- [ ] Grep audit: no raw SDK usage in function files
- [ ] All manual functional tests pass
- [ ] Preview deploy works
- [ ] Dark mode works for updated Settings UI

### 10.3 Implementation Notes

_(to be filled during execution)_

---

## Shared Component Reuse Summary

| Shared Resource | Package | Used By |
|---|---|---|
| `LLMProvider` interface | `netlify/functions/lib/llm/types.ts` | All 8 LLM functions |
| `getLLMProvider()` factory | `netlify/functions/lib/llm/factory.ts` | All 8 LLM functions |
| `MODEL_REGISTRY` | `netlify/functions/lib/llm/models.ts` | Factory (validation), health-check |
| `MODEL_CATALOG` | `src/lib/model-registry.ts` | `SettingsModal.tsx`, `api.ts` |
| `OpenAIProvider` | `netlify/functions/lib/llm/openai-provider.ts` | Factory |
| `GeminiProvider` | `netlify/functions/lib/llm/gemini-provider.ts` | Factory |
| `AnthropicProvider` | `netlify/functions/lib/llm/anthropic-provider.ts` | Factory |
| `Select`, `Button` | `src/components/ui/` | `SettingsModal.tsx` |

**No component is duplicated in the app that already exists in a shared package.**

---

## Follow-Up Items (out of scope for this plan)

1. **Build-time model registry sync** — Create a script that generates `src/lib/model-registry.ts` from `netlify/functions/lib/llm/models.ts` to prevent drift between frontend and backend model lists.
2. **Streaming UI integration** — Build a React hook (`useStreamingLLM`) and update the grading flow to display real-time grading feedback. Phase 4 adds the backend capability; the frontend consumer is a separate plan.
3. **Tool/function calling** — GenAIWidgets has full tool calling support. If annotation-chat or future agent features need it, add `tools` and `tool_calls` to `LLMRequest`/`LLMResponse` and implement in all three providers using GenAIWidgets' `llm-client.ts` as reference.
4. **Token usage dashboard** — Build a teacher-facing usage dashboard showing credits consumed per assignment, aggregated from per-call token counts.
5. **Dynamic model discovery** — Query the Netlify AI Gateway or provider APIs at runtime for available models instead of maintaining a static registry.
6. **Anthropic JSON mode** — When Anthropic adds native JSON mode support, enable `jsonMode` for `AnthropicProvider`.
7. **Tests for model registry** — Add unit tests for `models.ts` helper functions and provider streaming methods.
8. **Remove legacy files** — `grade.ts` and `grade-bulletproof.ts.legacy` can be deleted once confirmed unused.

---

## Timeline Estimate

| Phase | Description | Effort | Cumulative |
|---|---|---|---|
| 1 | Shared model registry and types | 0.5 days | 0.5 days |
| 2 | GPT-5+ parameter handling | 0.5 days | 1 day |
| 3 | Multi-turn conversation support | 1 day | 2 days |
| 4 | Streaming support | 1.5 days | 3.5 days |
| 5 | Settings UI model selector | 1 day | 4.5 days |
| 6 | AI Gateway rules file | 0.5 days | 5 days |
| 7 | Documentation updates | 0.5 days | 5.5 days |
| 8 | Final verification | 0.5 days | 6 days |

---

## Success Criteria

- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] No `any` types in new code (except SDK response mapping where unavoidable)
- [ ] Model registry contains 16+ models across 3 providers
- [ ] Settings UI shows provider + model dual-dropdown selector
- [ ] GPT-5+ models use `max_completion_tokens` parameter
- [ ] All three providers support multi-turn conversation via `messages` array
- [ ] All three providers implement `generateStream()` method
- [ ] `.windsurf/rules/ai-gateway.md` exists with comprehensive Gateway documentation
- [ ] Health-check reports model registry count
- [ ] All existing grading workflows unchanged (backward compatible)
- [ ] Dark mode works for updated Settings UI
- [ ] No hardcoded model names outside the registry files

# Netlify AI Gateway — Implementation Comparison

**AI-EssayGrader vs GenAIWidgets**
**Date:** 2026-04-04
**Purpose:** Compare how each project integrates with the Netlify AI Gateway to inform best practices and identify modernization opportunities.

> **Note:** GenAIWidgets has not been updated in months. Some patterns (especially the Gemini SDK) may be outdated relative to current Netlify AI Gateway recommendations.

---

## Executive Summary

| Aspect | AI-EssayGrader | GenAIWidgets |
|--------|---------------|--------------|
| **Architecture** | Provider abstraction layer (class-based factory) | Flat function-based `callLLM()` dispatcher |
| **Gemini SDK** | `@google/genai` (new SDK, zero-config) | `@google/generative-ai` (old SDK) + raw `fetch()` |
| **OpenAI SDK** | `openai` v6.1.0, zero-config `new OpenAI()` | `openai` v6.16.0, zero-config `new OpenAI()` |
| **Anthropic SDK** | `@anthropic-ai/sdk` v0.39.0, zero-config | `@anthropic-ai/sdk` v0.71.2, zero-config |
| **API Key Handling** | Fully Gateway-managed (no manual keys) | Mixed — OpenAI/Anthropic auto, Gemini manual `process.env` |
| **Tool Calling** | Not supported | Full tool/function calling support |
| **Multimodal** | Supported (inline image data via `inlineData`) | Not supported |
| **Structured Output** | JSON Schema (OpenAI) + JSON Mode (Gemini) | Not supported |
| **Gateway Documentation** | Migration plan only | Comprehensive `.windsurf/rules/ai-gateway.md` |

### Recommendation

**AI-EssayGrader's provider abstraction is the stronger pattern** for maintainability and Gateway alignment. GenAIWidgets has a more comprehensive model catalog and tool-calling support, but its Gemini implementation uses the old SDK and manual `fetch()` calls that bypass Gateway auto-configuration.

**Key action items:**
1. GenAIWidgets should migrate Gemini from `@google/generative-ai` + raw `fetch()` to `@google/genai` (same migration AI-EssayGrader completed)
2. AI-EssayGrader should adopt GenAIWidgets' broader model catalog approach
3. Both projects would benefit from GenAIWidgets' `ai-gateway.md` rules file

---

## 1. Architecture Comparison

### AI-EssayGrader: Class-Based Provider Factory

```
netlify/functions/lib/llm/
├── types.ts              # LLMProvider interface, LLMRequest, LLMResponse
├── factory.ts            # getLLMProvider(name, model) → LLMProvider
├── openai-provider.ts    # OpenAIProvider class
├── gemini-provider.ts    # GeminiProvider class
└── anthropic-provider.ts # AnthropicProvider class
```

**Pattern:** Each provider is an isolated class implementing a shared `LLMProvider` interface. A factory function (`getLLMProvider`) returns the correct instance. All 8+ LLM-consuming functions call the factory — zero raw SDK usage in business logic.

```typescript
// types.ts — Clean interface contract
export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}

// factory.ts — Single entry point
export function getLLMProvider(providerName: LLMProviderName, model?: string): LLMProvider {
    switch (providerName) {
        case 'openai': return new OpenAIProvider(model);
        case 'anthropic': return new AnthropicProvider(model);
        case 'gemini':
        default: return new GeminiProvider(model);
    }
}

// Usage in any function:
const provider = getLLMProvider('gemini', 'gemini-2.5-pro');
const result = await provider.generate({ systemMessage, userMessage, temperature: 0.7 });
```

**Strengths:**
- Single Responsibility — each provider handles its own SDK quirks
- Easy to add new providers (just create a class + register in factory)
- Centralized request/response types eliminate per-function SDK boilerplate
- Supports multimodal (`inlineData`), structured output (`jsonSchema`), and output limits (`maxOutputTokens`)

**Weaknesses:**
- No tool/function calling support
- No streaming support
- No conversation history (single-turn only)
- Model catalog hardcoded in frontend (`SettingsModal.tsx`), not shared

---

### GenAIWidgets: Function-Based Dispatcher

```
netlify/functions/lib/
└── llm-client.ts         # callLLM() + per-provider functions
```

**Pattern:** A single file with a `callLLM()` dispatcher function and three private async functions (`callOpenAI`, `callAnthropic`, `callGemini`). Supports multi-turn conversation history and tool calling.

```typescript
// llm-client.ts — Dispatcher pattern
export async function callLLM(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  options: LLMClientOptions
): Promise<LLMResponse> {
  switch (options.provider) {
    case 'openai': return callOpenAI(messages, tools, options);
    case 'anthropic': return callAnthropic(messages, tools, options);
    case 'gemini': return callGemini(messages, tools, options);
  }
}
```

**Strengths:**
- Full tool/function calling support across all three providers
- Multi-turn conversation history support
- Richer response model (`content`, `tool_calls`, `reasoning`, `finish_reason`)
- Comprehensive model catalog in shared `ModelSelector.tsx` component (10 OpenAI, 6 Anthropic, 7 Gemini models)

**Weaknesses:**
- All providers in one file (311 lines) — harder to maintain
- Gemini uses raw `fetch()` instead of SDK — misses Gateway auto-configuration benefits
- Duplicate provider logic across `llm-client.ts`, `ai-chat-background.ts`, and `ai-chat-single.ts` (3 separate Gemini implementations)
- No multimodal support
- No structured output / JSON schema support

---

## 2. Provider-by-Provider Comparison

### 2.1 OpenAI

| Dimension | AI-EssayGrader | GenAIWidgets |
|-----------|---------------|--------------|
| **SDK Version** | `openai` v6.1.0 | `openai` v6.16.0 |
| **Initialization** | `new OpenAI()` (zero-config) | `new OpenAI()` (zero-config) |
| **Gateway Compatible** | ✅ Yes — reads `OPENAI_API_KEY` + `OPENAI_BASE_URL` | ✅ Yes — same behavior |
| **Structured Output** | ✅ `json_schema` response format | ❌ Not implemented |
| **Tool Calling** | ❌ Not implemented | ✅ Full function calling |
| **Model Awareness** | GPT-5/newer check: ❌ | GPT-5/newer check: ✅ (`max_completion_tokens` vs `max_tokens`) |

**Notable difference:** GenAIWidgets correctly handles the `max_completion_tokens` parameter change for GPT-5+ and O3/O4 models. AI-EssayGrader does not have this check and may need it when targeting newer models.

### 2.2 Anthropic

| Dimension | AI-EssayGrader | GenAIWidgets |
|-----------|---------------|--------------|
| **SDK Version** | `@anthropic-ai/sdk` v0.39.0 | `@anthropic-ai/sdk` v0.71.2 |
| **Initialization** | `new Anthropic()` (zero-config) | `new Anthropic()` (zero-config) |
| **Gateway Compatible** | ✅ Yes — reads `ANTHROPIC_API_KEY` + `ANTHROPIC_BASE_URL` | ✅ Yes — same |
| **Tool Calling** | ❌ Not implemented | ✅ Full `tool_use` / `tool_result` mapping |
| **System Messages** | Passed as `system` parameter | Extracted from message array → `system` parameter |

Both implementations are Gateway-compatible. GenAIWidgets has a more complete Anthropic integration with tool calling.

### 2.3 Gemini ⚠️ Most Significant Difference

| Dimension | AI-EssayGrader | GenAIWidgets |
|-----------|---------------|--------------|
| **SDK** | `@google/genai` v1.0.0 (**new SDK**) | `@google/generative-ai` v0.24.1 (**old SDK**) + raw `fetch()` |
| **Initialization** | `new GoogleGenAI({})` (zero-config) | Manual `process.env.GEMINI_API_KEY` + `process.env.GOOGLE_GEMINI_BASE_URL` |
| **API Call** | `client.models.generateContent({...})` | `fetch(\`\${baseUrl}/v1beta/models/\${model}:generateContent\`)` |
| **Gateway Compatible** | ✅ Full — SDK reads env vars automatically | ⚠️ Partial — works because it manually reads Gateway-injected env vars, but fragile |
| **Multimodal** | ✅ `inlineData` support | ❌ Text only |
| **JSON Mode** | ✅ `responseMimeType: 'application/json'` | ❌ Not implemented |
| **Tool Calling** | ❌ | ✅ Via raw `fetch()` (`functionCall` in response) |

**This is the biggest gap.** GenAIWidgets uses three separate implementations for Gemini:

1. **`llm-client.ts`** (`callGemini`) — Raw `fetch()` with manual API key and base URL. Supports tool calling via function call parsing.
2. **`ai-chat-background.ts`** (`queryGemini`) — Another raw `fetch()` implementation, simpler (no tool calling).
3. **`ai-chat-single.ts`** (`queryGemini`) — Yet another raw `fetch()` copy.

All three manually construct the REST URL (`${baseUrl}/v1beta/models/${model}:generateContent`) and pass the API key via `x-goog-api-key` header. This works with the Gateway because Netlify injects `GOOGLE_GEMINI_BASE_URL` which points to the Gateway proxy, but it's fragile and duplicated.

**AI-EssayGrader's approach is superior here:** The new `@google/genai` SDK automatically reads `GEMINI_API_KEY` and `GOOGLE_GEMINI_BASE_URL` from the environment, just like the OpenAI and Anthropic SDKs do. Zero manual URL construction needed.

---

## 3. Gateway Integration Comparison

### 3.1 Environment Variable Usage

**AI-EssayGrader (post-migration):**

| Variable | Used By | How |
|----------|---------|-----|
| `OPENAI_API_KEY` | OpenAI SDK (auto) | `new OpenAI()` reads automatically |
| `OPENAI_BASE_URL` | OpenAI SDK (auto) | `new OpenAI()` reads automatically |
| `GEMINI_API_KEY` | Google GenAI SDK (auto) | `new GoogleGenAI({})` reads automatically |
| `GOOGLE_GEMINI_BASE_URL` | Google GenAI SDK (auto) | `new GoogleGenAI({})` reads automatically |
| `ANTHROPIC_API_KEY` | Anthropic SDK (auto) | `new Anthropic()` reads automatically |
| `ANTHROPIC_BASE_URL` | Anthropic SDK (auto) | `new Anthropic()` reads automatically |

**GenAIWidgets:**

| Variable | Used By | How |
|----------|---------|-----|
| `OPENAI_API_KEY` | OpenAI SDK (auto) | `new OpenAI()` reads automatically |
| `OPENAI_BASE_URL` | OpenAI SDK (auto) | `new OpenAI()` reads automatically |
| `GEMINI_API_KEY` | Manual `process.env` | Passed as `x-goog-api-key` header in `fetch()` |
| `GOOGLE_GEMINI_BASE_URL` | Manual `process.env` | Used to construct REST URL in `fetch()` |
| `ANTHROPIC_API_KEY` | Anthropic SDK (auto) | `new Anthropic()` reads automatically |
| `ANTHROPIC_BASE_URL` | Anthropic SDK (auto) | `new Anthropic()` reads automatically |

### 3.2 Gateway Configuration

**AI-EssayGrader:**
- No `netlify.toml` AI-specific config — relies entirely on SDK auto-detection
- Health-check endpoint validates all three provider keys + `NETLIFY_AI_GATEWAY_KEY`
- `.env.example` documents Gateway behavior

**GenAIWidgets:**
- No `netlify.toml` AI-specific config
- Has comprehensive `.windsurf/rules/ai-gateway.md` (338 lines) documenting Gateway rules, limitations, rate limiting, security, and error handling
- No health-check endpoint for Gateway status

### 3.3 Local Development

| Aspect | AI-EssayGrader | GenAIWidgets |
|--------|---------------|--------------|
| **Primary method** | `netlify dev` (auto-injects keys) | `netlify dev` or `@netlify/vite-plugin` |
| **Fallback** | Set keys in `.env` | Set keys in `.env` |
| **Vite plugin** | Not used | `@netlify/vite-plugin` v2.7.19 installed |
| **CLI** | `netlify-cli` v23.11.1 (devDep) | Not in `package.json` (global install assumed) |

---

## 4. Comparison Matrix

| Dimension | AI-EssayGrader | GenAIWidgets | Winner |
|-----------|---------------|--------------|--------|
| **Abstraction Quality** | Class-based factory, clean separation | Single-file dispatcher, some duplication | **AI-EssayGrader** |
| **Gateway Alignment** | All 3 providers zero-config via SDK | OpenAI/Anthropic zero-config, Gemini manual | **AI-EssayGrader** |
| **SDK Currency** | `@google/genai` (current) | `@google/generative-ai` (deprecated) | **AI-EssayGrader** |
| **Tool Calling** | Not supported | Full support for all 3 providers | **GenAIWidgets** |
| **Multimodal** | Gemini inline image data | Not supported | **AI-EssayGrader** |
| **Structured Output** | JSON Schema (OpenAI) + JSON Mode (Gemini) | Not supported | **AI-EssayGrader** |
| **Model Catalog** | 3 models (1 per provider, hardcoded) | 23 models across 3 providers, shared component | **GenAIWidgets** |
| **Conversation History** | Single-turn only | Multi-turn with DB persistence | **GenAIWidgets** |
| **Code Duplication** | Zero (all through factory) | High (3 Gemini implementations) | **AI-EssayGrader** |
| **Documentation** | Migration plan only | Full `ai-gateway.md` rules file | **GenAIWidgets** |
| **Error Handling** | Per-function try/catch, generic errors | Per-provider try/catch, provider-specific errors | **Tie** |
| **Newer Model Support** | No GPT-5 `max_completion_tokens` handling | ✅ Handles GPT-5/O3/O4 parameter change | **GenAIWidgets** |

---

## 5. Recommendations

### For AI-EssayGrader

1. **Adopt GenAIWidgets' `ai-gateway.md` rules file** — Port the Gateway rules (environment variables table, rate limiting patterns, security guidelines, limitations) into an AI-EssayGrader-specific version.

2. **Add GPT-5+ model parameter handling** — GenAIWidgets correctly uses `max_completion_tokens` instead of `max_tokens` for newer OpenAI models. Add this to `OpenAIProvider`:
   ```typescript
   const isNewModel = model.startsWith('gpt-5') || model.startsWith('gpt-4.1') || model.startsWith('o3') || model.startsWith('o4');
   // Use max_completion_tokens for newer models, max_tokens for older
   ```

3. **Expand model catalog** — GenAIWidgets offers 23 models vs AI-EssayGrader's 3. Consider adding a model selector with more options in `SettingsModal.tsx`.

4. **Consider tool calling support** — If annotation chat or future features need function calling, GenAIWidgets' `llm-client.ts` provides a reference implementation for all three providers.

### For GenAIWidgets

1. **Migrate Gemini to `@google/genai` SDK** — This is the most critical update. The old `@google/generative-ai` SDK requires manual `fetch()` calls with explicit API key and base URL management. The new SDK (`@google/genai`) handles this automatically, matching OpenAI and Anthropic behavior.

2. **Consolidate Gemini implementations** — Three separate `queryGemini` functions exist across `llm-client.ts`, `ai-chat-background.ts`, and `ai-chat-single.ts`. Adopt AI-EssayGrader's factory pattern to eliminate this duplication.

3. **Add structured output support** — AI-EssayGrader's `jsonSchema` and `jsonMode` request options are valuable for getting reliable structured responses from LLMs.

### Shared Improvements

1. **Streaming** — Neither project supports streaming responses. Both could benefit from a `generateStream()` method for real-time UX.

2. **Unified model registry** — Both projects hardcode model lists. A shared configuration (or dynamic model discovery) would reduce maintenance.

3. **Token usage tracking** — Both track tokens per-call but neither has a dashboard. Consider centralizing usage metrics.

---

## 6. Key Files Reference

### AI-EssayGrader

| File | Purpose |
|------|---------|
| `netlify/functions/lib/llm/types.ts` | `LLMProvider` interface, `LLMRequest`, `LLMResponse`, `InlineData` |
| `netlify/functions/lib/llm/factory.ts` | `getLLMProvider()` factory (OpenAI, Gemini, Anthropic) |
| `netlify/functions/lib/llm/openai-provider.ts` | OpenAI SDK wrapper with JSON Schema support |
| `netlify/functions/lib/llm/gemini-provider.ts` | Google GenAI SDK wrapper with multimodal + JSON mode |
| `netlify/functions/lib/llm/anthropic-provider.ts` | Anthropic SDK wrapper |
| `src/components/SettingsModal.tsx` | Frontend provider selector (3 options) |
| `src/lib/api.ts` | Provider → model name mapping |
| `.env.example` | Gateway documentation |

### GenAIWidgets

| File | Purpose |
|------|---------|
| `netlify/functions/lib/llm-client.ts` | Unified LLM dispatcher with tool calling (311 lines) |
| `netlify/functions/ai-chat-background.ts` | Background multi-provider chat (parallel execution) |
| `netlify/functions/ai-chat-trigger.ts` | Job queue trigger using Netlify Blobs |
| `netlify/functions/ai-chat-single.ts` | Single-provider chat with DB-persisted history |
| `src/pages/ai/AiGatewayChatPage.tsx` | Multi-provider comparison chat UI |
| `src/components/common/ModelSelector.tsx` | Shared model catalog (23 models) |
| `src/types/agent.ts` | `ModelProvider` type definition |
| `.windsurf/rules/ai-gateway.md` | Comprehensive Gateway rules (338 lines) |

---

## 7. SDK Version Summary

| Package | AI-EssayGrader | GenAIWidgets | Notes |
|---------|---------------|--------------|-------|
| `openai` | ^6.1.0 | ^6.16.0 | GenAIWidgets newer |
| `@anthropic-ai/sdk` | ^0.39.0 | ^0.71.2 | GenAIWidgets newer |
| `@google/genai` | ^1.0.0 | ❌ Not installed | AI-EssayGrader uses new SDK |
| `@google/generative-ai` | ❌ Removed | ^0.24.1 | GenAIWidgets uses old SDK |
| `@netlify/functions` | ^4.2.7 | ^5.1.2 | GenAIWidgets newer |
| `@netlify/blobs` | ^10.0.11 | ^10.5.0 | GenAIWidgets newer |
| `@netlify/vite-plugin` | ❌ Not installed | ^2.7.19 | GenAIWidgets has Vite integration |

---

*Generated by solution-compare workflow. Review and update as implementations evolve.*

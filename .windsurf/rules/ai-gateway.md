---
trigger: always
---
# AI Gateway Rules

Guidelines for using the Netlify AI Gateway in AI-EssayGrader. All LLM calls MUST go through the provider factory — never instantiate SDKs directly.

---

## Overview

Netlify AI Gateway provides access to OpenAI, Anthropic, and Google Gemini without managing API keys. Netlify auto-injects credentials and routes requests through its Gateway proxy. AI-EssayGrader uses a class-based provider factory (`netlify/functions/lib/llm/`) that wraps all three SDKs with zero-config constructors.

---

## Prerequisites

- At least one **production deployment** to activate Gateway
- Credit-based Netlify plan (Free, Personal, or Pro)
- AI features only work in Netlify compute contexts (Functions)

---

## Architecture — Provider Factory

**NEVER instantiate SDKs directly in function files.** Always use the factory:

```typescript
import { getLLMProvider } from './lib/llm/factory';

const provider = getLLMProvider('gemini', 'gemini-2.5-pro');
const result = await provider.generate({
  systemMessage: 'You are a grading assistant.',
  userMessage: studentEssay,
  temperature: 0.7,
});
```

### Key Files

| File | Purpose |
|------|---------|
| `netlify/functions/lib/llm/types.ts` | `LLMProvider`, `LLMRequest`, `LLMResponse`, `LLMStreamChunk` interfaces |
| `netlify/functions/lib/llm/factory.ts` | `getLLMProvider(provider, model?)` — returns the correct provider |
| `netlify/functions/lib/llm/models.ts` | `MODEL_REGISTRY` with 16+ models, capability flags, parameter styles |
| `netlify/functions/lib/llm/openai-provider.ts` | OpenAI SDK wrapper (`new OpenAI()` zero-config) |
| `netlify/functions/lib/llm/gemini-provider.ts` | Google GenAI wrapper (`new GoogleGenAI({})` zero-config) |
| `netlify/functions/lib/llm/anthropic-provider.ts` | Anthropic SDK wrapper (`new Anthropic()` zero-config) |

### Provider Capabilities

| Feature | OpenAI | Gemini | Anthropic |
|---------|--------|--------|-----------|
| Streaming | ✅ | ✅ | ✅ |
| Multi-turn | ✅ | ✅ | ✅ |
| Multimodal | ✅ (some) | ✅ | ✅ (some) |
| JSON Mode | ✅ | ✅ | ❌ |
| JSON Schema | ✅ | ❌ | ❌ |

---

## Environment Variables

### Auto-Injected by Gateway

In Netlify compute contexts, these are set automatically:

| Provider | API Key Variable | Base URL Variable |
|----------|------------------|-------------------|
| OpenAI | `OPENAI_API_KEY` | `OPENAI_BASE_URL` |
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_BASE_URL` |
| Google | `GEMINI_API_KEY` | `GOOGLE_GEMINI_BASE_URL` |

**Netlify-specific** (always available):
- `NETLIFY_AI_GATEWAY_KEY`
- `NETLIFY_AI_GATEWAY_BASE_URL`

### Override Behavior

- If you set your own API keys at project/team level, Netlify will **not** override them
- Use your own keys for higher rate limits or specific provider features
- Auto-injected keys use Netlify's credit-based billing

---

## SDK Usage (via Provider Classes)

All SDKs use zero-config constructors — they read env vars automatically:

```typescript
// OpenAI — reads OPENAI_API_KEY + OPENAI_BASE_URL
new OpenAI();

// Gemini — reads GEMINI_API_KEY + GOOGLE_GEMINI_BASE_URL
new GoogleGenAI({});

// Anthropic — reads ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL
new Anthropic();
```

**Do NOT pass explicit API keys.** The Gateway injects them.

### GPT-5+ Model Parameter Handling

Newer OpenAI models (GPT-5, GPT-4.1, O3, O4) require `max_completion_tokens` instead of `max_tokens`. The `OpenAIProvider` handles this automatically using the `isCompletionTokensModel()` helper from the model registry.

---

## Local Development

### Using Netlify CLI (Recommended)

```bash
npx netlify dev
```

Gateway keys are auto-injected during `netlify dev`.

### Without Netlify CLI

Set your own provider API keys in `.env`:

```
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

---

## Model Registry

Models are defined in `netlify/functions/lib/llm/models.ts`. Each model has:

- **`id`** — Model identifier sent to the provider API
- **`provider`** — `openai`, `gemini`, or `anthropic`
- **`capabilities`** — Streaming, tool calling, multimodal, JSON mode, JSON schema
- **`parameterStyle`** — `standard` or `completion_tokens` (for GPT-5+ models)

The frontend mirror is at `src/lib/model-registry.ts`. Keep both in sync.

---

## Rate Limiting

### Netlify Limits

- **Tokens-per-minute (TPM)** limits per account
- Both input and output tokens count
- Limits vary by plan and model

### Cost Management

- Use appropriate model sizes (don't use GPT-4o for simple OCR cleanup)
- Set `maxOutputTokens` in requests to limit response length
- Monitor token usage via `response.usage` in `LLMResponse`
- Use streaming for better UX (same cost, better perceived performance)

---

## Limitations

| Limitation | Details |
|------------|---------|
| Production deploy required | Gateway activates after first production deploy |
| Context window | Limited to 200k tokens |
| Custom headers | Not passed through Gateway |
| Batch inference | Not supported |
| Priority processing | Not supported |

---

## Security & FERPA Compliance

### Data Handling

- Netlify AI Gateway **does not store** prompts or model outputs
- Data passes through to providers — follow provider privacy policies

### FERPA Requirements

- **Never send student names** in prompts — use anonymized identifiers
- **Never log prompts** or LLM responses containing student work
- Follow `security.md` logging restrictions
- Sanitize user input before including in prompts

### Prompt Injection Prevention

```typescript
function sanitizeForPrompt(userInput: string): string {
  return userInput
    .replace(/```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 10000);
}
```

---

## Error Handling

All LLM functions should wrap provider calls in try/catch:

```typescript
try {
  const provider = getLLMProvider(providerName, model);
  const result = await provider.generate({ systemMessage, userMessage });
  return result.content;
} catch (error) {
  console.error('[function-name] LLM error:', error instanceof Error ? error.message : error);
  return { statusCode: 500, body: JSON.stringify({ error: 'AI service unavailable' }) };
}
```

---

## Preferred Practices

### Do

- Use `getLLMProvider()` factory for all LLM calls
- Use models from `MODEL_REGISTRY` — do not hardcode model strings
- Set `maxOutputTokens` to limit response length
- Use `generateStream()` for real-time UX
- Handle loading and error states in the frontend
- Log token usage for cost monitoring (`response.usage`)

### Don't

- Instantiate `new OpenAI()`, `new GoogleGenAI()`, or `new Anthropic()` outside provider classes
- Hardcode API keys or base URLs
- Send student PII in prompts
- Log prompts or LLM responses containing student data
- Assume unlimited rate limits
- Skip error handling for AI calls

---

## Checklist

Before adding or modifying AI features:

- [ ] Uses `getLLMProvider()` factory — no raw SDK instantiation
- [ ] Model is from `MODEL_REGISTRY` or passed from frontend
- [ ] `maxOutputTokens` is set appropriately
- [ ] Error handling wraps the provider call
- [ ] No student PII in prompts (FERPA)
- [ ] No logging of prompts or responses with student data
- [ ] Tested with `netlify dev` locally
- [ ] Production deployment exists (Gateway prerequisite)

---

*All LLM calls route through the factory. The Gateway handles keys. Focus on prompts, not plumbing.*

# LLM Gateway Migration — Solution Compare

**Date:** 2026-03-31
**Author:** Cascade
**Status:** PROPOSAL

---

## Problem Statement

The AI-EssayGrader app currently manages LLM provider connections manually — each Netlify Function reads raw API keys from environment variables, instantiates provider-specific SDK clients, and handles errors individually. This creates several issues:

1. **API key management overhead** — Two separate API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`) must be provisioned, rotated, and stored in Netlify environment variables.
2. **Billing fragmentation** — Usage is billed separately by OpenAI and Google, requiring monitoring across two dashboards.
3. **No centralized observability** — Token usage is logged per-function via `console.log` with no aggregated view.
4. **Tight coupling** — Provider-specific SDK initialization is scattered across 10+ function files, making it hard to add new providers (e.g., Anthropic Claude).
5. **Outdated Gemini SDK** — The codebase uses `@google/generative-ai` (v0.24.1), while the Netlify AI Gateway expects the newer `@google/genai` SDK.

---

## Current Architecture (Solution A: Direct Provider SDKs)

### Provider Abstraction Layer

```
netlify/functions/lib/llm/
├── types.ts              # LLMRequest, LLMResponse, LLMProvider interface
├── openai-provider.ts    # OpenAI SDK wrapper (openai v6.1.0)
├── gemini-provider.ts    # Gemini SDK wrapper (@google/generative-ai v0.24.1)
└── factory.ts            # getLLMProvider() factory function
```

The `LLMProvider` interface defines a simple contract:

```typescript
interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
```

The factory function `getLLMProvider(providerName, apiKey, model)` returns the correct provider instance.

### LLM Call Sites (10 functions)

| Function | Provider Used | How It Connects | Uses Factory? |
|----------|--------------|-----------------|---------------|
| `grade-bulletproof-background.ts` | Gemini (default) or OpenAI | `getLLMProvider()` | Yes |
| `enhance-text.ts` | Gemini (default) or OpenAI | `getLLMProvider()` | Yes |
| `enhance-rubric.ts` | Gemini or OpenAI (structured outputs) | Mixed: factory for Gemini, raw `new OpenAI()` for structured outputs | Partial |
| `enhance-rubric-background.ts` | Gemini or OpenAI (structured outputs) | Same mixed approach | Partial |
| `annotation-chat.ts` | Gemini only (hardcoded) | Raw `new GoogleGenerativeAI()` | No |
| `transcribe-image.ts` | Gemini only (hardcoded, multimodal) | Raw `new GoogleGenerativeAI()` | No |
| `extract-rubric-from-document.ts` | Gemini only (hardcoded) | Raw `new GoogleGenerativeAI()` | No |
| `extract-rubric-background.ts` | Gemini only (hardcoded) | Raw `new GoogleGenerativeAI()` | No |
| `grade.ts` (legacy) | OpenAI only | Raw `new OpenAI()` | No |
| `grade-bulletproof.ts.legacy` | OpenAI only | Raw `new OpenAI()` | No |

### API Key Management

- `OPENAI_API_KEY` — Set manually in Netlify env vars
- `GEMINI_API_KEY` — Set manually in Netlify env vars
- Keys are read via `process.env.*` in each function
- No base URL customization — SDKs hit providers directly

### Frontend Settings

The `SettingsModal.tsx` component lets teachers choose their LLM provider (`openai` | `gemini`) and model. These preferences are stored in `localStorage` and passed to backend functions via the request body (`llmProvider`, `llmModel` fields).

---

## Proposed Architecture (Solution B: Netlify AI Gateway)

### How the AI Gateway Works

Netlify automatically injects environment variables into all Netlify Functions:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Gateway-managed API key for OpenAI |
| `OPENAI_BASE_URL` | Proxy URL routing through AI Gateway |
| `GEMINI_API_KEY` | Gateway-managed API key for Gemini |
| `GOOGLE_GEMINI_BASE_URL` | Proxy URL routing through AI Gateway |
| `ANTHROPIC_API_KEY` | Gateway-managed API key for Anthropic |
| `ANTHROPIC_BASE_URL` | Proxy URL routing through AI Gateway |

The official SDKs (`openai`, `@google/genai`) automatically read these variables — **no code changes needed for basic usage**.

### Key Behavioral Note

> If you have already set an API key at the project or team level, Netlify will **never** override it.

This means we must **remove** our manually-set `OPENAI_API_KEY` and `GEMINI_API_KEY` from Netlify environment variables for the Gateway to take over.

### Migration Steps

#### Phase 1: SDK Upgrade (Gemini)

Replace `@google/generative-ai` (old SDK) with `@google/genai` (new SDK expected by Gateway).

**Old pattern (current):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
const result = await model.generateContent('Hello');
```

**New pattern (AI Gateway compatible):**
```typescript
import { GoogleGenAI } from '@google/genai';
const genAI = new GoogleGenAI({});
// No API key needed - automatically uses process.env.GEMINI_API_KEY
// and process.env.GOOGLE_GEMINI_BASE_URL
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'Hello'
});
```

#### Phase 2: OpenAI Provider Update

The OpenAI SDK already reads `OPENAI_API_KEY` and `OPENAI_BASE_URL` from env automatically.

**Old pattern (current):**
```typescript
import { OpenAI } from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

**New pattern (AI Gateway compatible):**
```typescript
import OpenAI from 'openai';
const openai = new OpenAI();
// No configuration needed - automatically uses
// process.env.OPENAI_API_KEY and process.env.OPENAI_BASE_URL
```

#### Phase 3: Refactor Provider Abstraction

Update `gemini-provider.ts` to use `@google/genai`, update `openai-provider.ts` to omit explicit `apiKey`, and consolidate all raw SDK usages in hardcoded functions (`annotation-chat.ts`, `transcribe-image.ts`, etc.) to use the factory.

#### Phase 4: Add Anthropic as Third Provider (Optional)

With the Gateway providing `ANTHROPIC_API_KEY` automatically, adding Claude support becomes trivial:

```typescript
// netlify/functions/lib/llm/anthropic-provider.ts
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-5-20250929') {
    this.client = new Anthropic(); // Auto-reads env vars
    this.model = model;
  }
  // ...
}
```

Update `factory.ts`:
```typescript
export type LLMProviderName = 'openai' | 'gemini' | 'anthropic';
```

Update `SettingsModal.tsx` to add Anthropic as a third option.

#### Phase 5: Remove Manual API Keys

1. Remove `OPENAI_API_KEY` from Netlify project environment variables
2. Remove `GEMINI_API_KEY` from Netlify project environment variables
3. Let the AI Gateway inject its own keys automatically
4. Update `.env.example` to note that keys are optional when using AI Gateway

---

## Comparison Matrix

| Dimension | Solution A: Direct SDKs (Current) | Solution B: Netlify AI Gateway |
|-----------|-----------------------------------|-------------------------------|
| **Setup Complexity** | Must provision API keys per provider, add to Netlify env vars | Zero-config — Gateway injects keys automatically |
| **Billing** | Separate invoices from OpenAI + Google | Unified on Netlify credit-based billing |
| **Observability** | Manual `console.log` per function | Built-in usage monitoring in Netlify dashboard |
| **Provider Switching** | Supported via factory + Settings UI | Same, but adding new providers is easier |
| **Adding Anthropic** | Requires API key provisioning + account setup | Free — key auto-injected by Gateway |
| **Cost** | Pay providers directly (potentially cheaper at scale) | Netlify credits (markup vs direct, but simplified) |
| **Rate Limiting** | None (relies on provider limits) | Account-level TPM limits + configurable per-function limits |
| **Local Development** | Works with `.env` keys | Requires `netlify dev` CLI or Netlify Vite plugin |
| **Vendor Lock-in** | None — standard SDKs | Moderate — relies on Netlify's Gateway proxy |
| **Security** | Keys stored in Netlify env vars (manual rotation) | Keys managed by Netlify (no manual rotation needed) |
| **SDK Compatibility** | `@google/generative-ai` (old) + `openai` | `@google/genai` (new) + `openai` (same) |
| **Multimodal (Vision)** | Works via Gemini SDK | Works — same SDK, just routed through Gateway |
| **Context Window** | Unlimited (provider limits) | 200k token input limit (Gateway limitation) |
| **Prompt Caching** | Full provider support | Limited (no explicit Gemini caching, limited Anthropic) |
| **Time to Deliver** | N/A (already built) | ~2-3 days (SDK swap + refactor + test) |

---

## Limitations of AI Gateway

1. **200k token input limit** — Should not be an issue for essay grading (essays are short).
2. **No explicit Gemini context caching** — Not currently used, so no impact.
3. **No custom request headers** — Not currently used, so no impact.
4. **No batch inference** — Not currently used.
5. **Requires at least one production deploy** — Already deployed.
6. **Local development** — Must use `netlify dev` instead of `vite dev` for Gateway access, OR keep local `.env` keys as fallback (Gateway won't override them).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini SDK migration breaks multimodal (vision) | Medium | High | Test `transcribe-image` thoroughly with new SDK |
| Gateway rate limits hit during bulk grading | Low | Medium | Configure per-function rate limits; monitor TPM |
| Cost increase vs direct API billing | Low | Low | Monitor credit usage; can always revert to direct keys |
| `netlify dev` required for local dev | Certain | Low | Document in README; keep `.env` fallback option |
| Structured outputs (OpenAI) incompatible | Low | Medium | Test `enhance-rubric` structured output mode first |

---

## Recommendation

**RECOMMENDATION: Solution B — Netlify AI Gateway**

### Rationale

1. **Eliminates API key management** — No more provisioning, rotating, or storing keys for OpenAI and Google separately.
2. **Unified billing** — Single Netlify invoice instead of tracking two provider accounts.
3. **Built-in observability** — Token usage monitoring without custom logging.
4. **Unlocks Anthropic Claude** — Free third provider option with zero additional setup, giving teachers more LLM choices.
5. **Forces SDK modernization** — Upgrading `@google/generative-ai` → `@google/genai` brings the codebase to the latest API surface.

### Trade-offs

**Pros:**
- Zero-config API key management
- Unified billing and monitoring
- Easy to add Anthropic Claude as third provider
- Modern Gemini SDK
- Built-in rate limiting

**Cons:**
- Moderate vendor lock-in to Netlify's proxy
- Potential cost markup vs direct provider billing
- 200k token input limit (unlikely to matter for essays)
- Local dev requires `netlify dev` or fallback `.env` keys
- Migration effort (~2-3 days)

### Alternative

If cost sensitivity becomes a concern at scale, keep Solution A (direct SDKs) but still upgrade the Gemini SDK to `@google/genai`. This gets the SDK modernization benefit without the Gateway dependency.

---

## Next Steps

1. **Review this document** — Approve or adjust the approach
2. **Create execution plan** — `00-llm-gateway-migration-execution.md` with phased rollout
3. **Phase 1** — Upgrade Gemini SDK (`@google/generative-ai` → `@google/genai`)
4. **Phase 2** — Refactor OpenAI provider to omit explicit keys
5. **Phase 3** — Consolidate all raw SDK usages into the factory pattern
6. **Phase 4** — (Optional) Add Anthropic Claude provider
7. **Phase 5** — Remove manual API keys from Netlify env vars, enable Gateway
8. **Phase 6** — Update Settings UI with new provider options
9. **Phase 7** — End-to-end testing of all 8 active LLM functions

---

## Files That Will Be Modified

| File | Change |
|------|--------|
| `package.json` | Replace `@google/generative-ai` with `@google/genai`, optionally add `@anthropic-ai/sdk` |
| `netlify/functions/lib/llm/gemini-provider.ts` | Rewrite for `@google/genai` SDK |
| `netlify/functions/lib/llm/openai-provider.ts` | Remove explicit `apiKey` param |
| `netlify/functions/lib/llm/factory.ts` | Add `anthropic` option, update constructor signatures |
| `netlify/functions/lib/llm/types.ts` | Possibly extend `LLMRequest` for multimodal |
| `netlify/functions/annotation-chat.ts` | Replace raw Gemini SDK with factory |
| `netlify/functions/transcribe-image.ts` | Replace raw Gemini SDK with factory (multimodal) |
| `netlify/functions/extract-rubric-from-document.ts` | Replace raw Gemini SDK with factory |
| `netlify/functions/extract-rubric-background.ts` | Replace raw Gemini SDK with factory |
| `netlify/functions/enhance-rubric.ts` | Consolidate to use factory for both providers |
| `netlify/functions/enhance-rubric-background.ts` | Same consolidation |
| `netlify/functions/grade-bulletproof-background.ts` | Remove explicit key reading |
| `netlify/functions/enhance-text.ts` | Remove explicit key reading |
| `netlify/functions/health-check.ts` | Update env var checks |
| `src/components/SettingsModal.tsx` | Add Anthropic option |
| `.env.example` | Update with Gateway notes |

# LLM Gateway Migration — Execution Plan

**Date:** 2026-03-31
**Branch:** `feat/llm-gateway-migration`
**Status:** READY FOR EXECUTION
**Mockup Source:** N/A (backend refactor, no UI mockup)
**Template:** Follows `plan-file-constitution.md` structure

---

## Goal

Migrate the AI-EssayGrader LLM infrastructure from direct provider SDK connections to the Netlify AI Gateway, eliminating manual API key management, unifying billing, and modernizing the Gemini SDK. This also consolidates all raw SDK call sites into the existing provider abstraction layer.

Key outcomes:
1. **Gemini SDK modernized** — Replace `@google/generative-ai` (v0.24.1) with `@google/genai` across all Netlify Functions
2. **Provider abstraction consolidated** — All 8 active LLM functions route through the `getLLMProvider()` factory; zero raw SDK instantiation remains
3. **API key management eliminated** — No manually-set `OPENAI_API_KEY` or `GEMINI_API_KEY` in Netlify env vars; Gateway auto-injects keys
4. **Anthropic Claude added** — Third LLM provider option available to teachers via Settings UI
5. **OpenAI SDK zero-config** — `OpenAIProvider` no longer requires explicit `apiKey` parameter; reads env automatically

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

| Phase | Description | Status | Commit Hash | Approved By | Date & Time |
|---|---|---|---|---|---|
| Phase 1 | Upgrade Gemini SDK and rewrite GeminiProvider | `APPROVED` | d1172aa | Mike Berry | 2026-04-04 07:32 CDT |
| Phase 2 | Update OpenAI provider to zero-config | `APPROVED` | 361ac11 | Mike Berry | 2026-04-04 07:38 CDT |
| Phase 3 | Consolidate hardcoded Gemini functions into factory | `APPROVED` | 5767019 | Mike Berry | 2026-04-04 07:54 CDT |
| Phase 4 | Consolidate enhance-rubric functions to use factory | `APPROVED` | 4c0eec1 | Mike Berry | 2026-04-04 08:00 CDT |
| Phase 5 | Add Anthropic Claude provider | `APPROVED` | b71cf31 | Mike Berry | 2026-04-04 08:05 CDT |
| Phase 6 | Update frontend Settings UI and API calls | `APPROVED` | 11a2600 | Mike Berry | 2026-04-04 08:11 CDT |
| Phase 7 | Update .env.example, health-check, and documentation | `IN PROGRESS` | | | |
| Phase 8 | Final verification and Gateway activation | `NOT STARTED` | | | |

**Status values:** `NOT STARTED` → `IN PROGRESS` → `COMPLETE` → `APPROVED`

---

## Implementation Notes (deviations from plan)

Record deviations here after each phase so subsequent phases can account for them.

**Phase 1:**
- `OpenAIProvider` constructor `apiKey` was also made optional (not in original plan) to satisfy TypeScript when factory passes `apiKey?: string`. This is a no-op at runtime since callers still pass explicit keys until Phase 2.
- Gemini 3 `thinking_level` / forced `temperature: 1.0` logic was removed with the rewrite. If needed, re-add via new SDK's `thinkingConfig`.

**Phase 2:** No deviations.

**Phase 3:** No deviations. All 4 raw Gemini SDK functions migrated to factory as planned. `netlify dev` should now work since `@google/generative-ai` is no longer imported anywhere.

**Phase 4:** No deviations.

**Phase 5:** No deviations.

**Phase 6:** No deviations.

---

## Repository Context (As-Built Baseline)

### Project Structure

```
AI-EssayGrader/
├── netlify/functions/                  # Netlify serverless functions (backend)
│   ├── lib/llm/                        # LLM provider abstraction layer
│   │   ├── types.ts                    # LLMRequest, LLMResponse, LLMProvider interface
│   │   ├── openai-provider.ts          # OpenAI SDK wrapper (openai v6.1.0)
│   │   ├── gemini-provider.ts          # Gemini SDK wrapper (@google/generative-ai v0.24.1)
│   │   └── factory.ts                  # getLLMProvider() factory — returns OpenAI or Gemini
│   ├── grade-bulletproof-background.ts # Main grading function (uses factory)
│   ├── enhance-text.ts                 # OCR text cleanup (uses factory)
│   ├── enhance-rubric.ts              # Rubric enhancement (mixed: factory + raw OpenAI)
│   ├── enhance-rubric-background.ts   # Background rubric enhancement (mixed)
│   ├── annotation-chat.ts             # LLM annotation review (raw Gemini SDK)
│   ├── transcribe-image.ts            # Handwriting transcription (raw Gemini SDK, multimodal)
│   ├── extract-rubric-from-document.ts # Rubric extraction from PDF/DOCX (raw Gemini SDK)
│   ├── extract-rubric-background.ts   # Background rubric extraction (raw Gemini SDK)
│   ├── health-check.ts                # Env var status check
│   ├── grade.ts                       # LEGACY — OpenAI-only grading (not actively used)
│   └── grade-bulletproof.ts.legacy    # LEGACY — OpenAI-only grading (not actively used)
├── src/
│   ├── components/
│   │   └── SettingsModal.tsx           # LLM provider selector UI (gemini | openai)
│   └── lib/
│       └── api.ts                      # Frontend API client — reads localStorage ai_provider
├── package.json                        # Dependencies: @google/generative-ai, openai
└── .env.example                        # API key documentation
```

### Current LLM Provider State

**Factory pattern (`netlify/functions/lib/llm/`):**

| File | Purpose | Current Behavior |
|------|---------|-----------------|
| `types.ts` | `LLMProvider` interface: `generate(LLMRequest) → LLMResponse` | Stable, no changes needed to interface |
| `factory.ts` | `getLLMProvider(providerName, apiKey, model)` → provider instance | Takes explicit `apiKey` param — must be refactored |
| `openai-provider.ts` | `new OpenAI({ apiKey })` in constructor | Explicit apiKey — must change to zero-config |
| `gemini-provider.ts` | `new GoogleGenerativeAI(apiKey)` from `@google/generative-ai` | Must rewrite for `@google/genai` SDK |

**Functions using factory (3 files):**
- `grade-bulletproof-background.ts` — reads `process.env.GEMINI_API_KEY` or `OPENAI_API_KEY`, passes to factory
- `enhance-text.ts` — same pattern
- `enhance-rubric.ts` / `enhance-rubric-background.ts` — factory for Gemini, raw `new OpenAI({ apiKey })` for structured outputs

**Functions with raw SDK (4 files, hardcoded Gemini):**
- `annotation-chat.ts` — `new GoogleGenerativeAI(apiKey)` directly
- `transcribe-image.ts` — `new GoogleGenerativeAI(process.env.GEMINI_API_KEY)` with multimodal (inline image data)
- `extract-rubric-from-document.ts` — `new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')`
- `extract-rubric-background.ts` — same

### Current npm Dependencies (LLM-related)

```json
{
  "@google/generative-ai": "^0.24.1",
  "openai": "^6.1.0"
}
```

### Frontend LLM Settings Flow

1. `SettingsModal.tsx` — Teacher selects `gemini` or `openai`, saved to `localStorage` key `ai_provider`
2. `api.ts` — Reads `localStorage.getItem('ai_provider')`, maps to model name, sends as `llmProvider` / `llmModel` in request body
3. Backend functions destructure `llmProvider` and `llmModel` from request, pass to factory

---

## Backend Endpoints — Complete Map

### 6.1 Endpoints That Exist and Need Modification

| Endpoint | Route File | LLM Change Needed |
|----------|------------|-------------------|
| `POST grade-bulletproof-background` | `grade-bulletproof-background.ts` | Remove explicit key reading, call factory without apiKey |
| `POST enhance-text` | `enhance-text.ts` | Same — remove explicit key reading |
| `POST enhance-rubric` | `enhance-rubric.ts` | Remove raw `new OpenAI()`, use factory for both providers |
| `POST enhance-rubric-background` | `enhance-rubric-background.ts` | Same |
| `POST annotation-chat` | `annotation-chat.ts` | Replace raw Gemini SDK with factory |
| `POST transcribe-image` | `transcribe-image.ts` | Replace raw Gemini SDK with factory (multimodal) |
| `POST extract-rubric-from-document` | `extract-rubric-from-document.ts` | Replace raw Gemini SDK with factory |
| `POST extract-rubric-background` | `extract-rubric-background.ts` | Replace raw Gemini SDK with factory |
| `GET health-check` | `health-check.ts` | Update env var status checks |

### 6.2 New Endpoints Needed

None — no new endpoints required for this migration.

### 6.3 New Provider File Needed

| File | Purpose |
|------|---------|
| `netlify/functions/lib/llm/anthropic-provider.ts` | New `AnthropicProvider` implementing `LLMProvider` interface |

---

## 3. Phase 1: Upgrade Gemini SDK and Rewrite GeminiProvider

**Commit message:** `feat(llm): phase 1 — upgrade Gemini SDK to @google/genai`
**Prerequisite:** None

### 3.0 Context

The current Gemini SDK (`@google/generative-ai` v0.24.1) is the old SDK. The Netlify AI Gateway auto-injects `GEMINI_API_KEY` and `GOOGLE_GEMINI_BASE_URL`, but the new `@google/genai` SDK is required to read `GOOGLE_GEMINI_BASE_URL` automatically. This phase swaps the SDK and rewrites `GeminiProvider`.

### 3.1 Implementation Steps

**Step 1: Update `package.json`**
- File: `package.json`
- Remove `"@google/generative-ai": "^0.24.1"`
- Add `"@google/genai": "^1.0.0"` (or latest stable)
- Run `npm install`

**Step 2: Rewrite `netlify/functions/lib/llm/gemini-provider.ts`**

Key changes from old SDK:
- Import: `GoogleGenAI` from `@google/genai` (not `GoogleGenerativeAI` from `@google/generative-ai`)
- Constructor: `new GoogleGenAI({})` — no explicit apiKey
- API: `client.models.generateContent({ model, config, contents })` — not `getGenerativeModel().generateContent()`
- Response: `result.text` — not `result.response.text()`
- Usage: `result.usageMetadata` — not `result.response.usageMetadata`

```typescript
import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenAI;
    private model: string;

    constructor(model: string = 'gemini-2.5-pro') {
        this.client = new GoogleGenAI({});
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const result = await this.client.models.generateContent({
            model: this.model,
            config: {
                systemInstruction: request.systemMessage,
                responseMimeType: request.jsonMode ? 'application/json' : 'text/plain',
                temperature: request.temperature,
            },
            contents: request.userMessage,
        });

        return {
            content: result.text ?? '',
            usage: {
                promptTokens: result.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: result.usageMetadata?.candidatesTokenCount ?? 0,
            }
        };
    }
}
```

**Step 3: Update factory — make `apiKey` optional for transition**
- File: `netlify/functions/lib/llm/factory.ts`
- Gemini constructor no longer takes apiKey. OpenAI still does in this phase.

```typescript
export function getLLMProvider(
    providerName: LLMProviderName,
    apiKey?: string,
    model?: string
): LLMProvider {
    switch (providerName) {
        case 'openai':
            return new OpenAIProvider(apiKey, model);
        case 'gemini':
        default:
            return new GeminiProvider(model);
    }
}
```

### 3.2 Verification

- [ ] `npm install` completes without errors
- [ ] `@google/generative-ai` removed from `package.json`
- [ ] `@google/genai` present in `package.json`
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions

### 3.3 Implementation Notes

**Files modified:**
- `package.json` — Swapped `@google/generative-ai` → `@google/genai` (^1.0.0). npm install added 223 packages, removed 2.
- `netlify/functions/lib/llm/gemini-provider.ts` — Full rewrite (55 → 33 lines). New SDK: `GoogleGenAI` from `@google/genai`, zero-config constructor, `client.models.generateContent()` API.
- `netlify/functions/lib/llm/factory.ts` — `apiKey` parameter made optional. Gemini branch no longer passes apiKey.
- `netlify/functions/lib/llm/openai-provider.ts` — Constructor `apiKey` made optional (minor addition, needed for factory compatibility).

**Deviation:** The existing `gemini-provider.ts` had Gemini 3–specific logic (`temperature: 1.0`, `thinking_level: "high"` via `@ts-ignore`). This was removed in the rewrite since the old SDK's `@ts-ignore` hack doesn't apply to the new SDK. If Gemini 3 thinking support is needed later, it should be re-added using the new SDK's `thinkingConfig` API.

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged (9 pre-existing test file failures: 5 integration tests needing DB, 2 OCR error-message mismatches, 3 component/page test issues).

---

## 4. Phase 2: Update OpenAI Provider to Zero-Config

**Commit message:** `feat(llm): phase 2 — OpenAI provider zero-config for AI Gateway`
**Prerequisite:** Phase 1 `APPROVED`

### 4.0 Context

The OpenAI SDK already reads `OPENAI_API_KEY` and `OPENAI_BASE_URL` from env automatically when constructed with `new OpenAI()`. This phase removes the explicit `apiKey` parameter from `OpenAIProvider` and updates all factory callers to stop passing it.

### 4.1 Implementation Steps

**Step 1: Update `netlify/functions/lib/llm/openai-provider.ts`**

```typescript
import OpenAI from 'openai';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(model: string = 'gpt-4o-mini') {
        this.client = new OpenAI();
        this.model = model;
    }
    // generate() method unchanged
}
```

**Step 2: Update factory — remove `apiKey` entirely**
- File: `netlify/functions/lib/llm/factory.ts`

```typescript
export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
    switch (providerName) {
        case 'openai':
            return new OpenAIProvider(model);
        case 'gemini':
        default:
            return new GeminiProvider(model);
    }
}
```

**Step 3: Update callers — remove apiKey lookups**

Three files currently call `getLLMProvider(providerName, apiKey, llmModel)`:

- `netlify/functions/grade-bulletproof-background.ts` — Remove the `process.env.GEMINI_API_KEY` / `OPENAI_API_KEY` lookup block (~lines 153-162). Change call to `getLLMProvider(providerName, llmModel)`.
- `netlify/functions/enhance-text.ts` — Remove apiKey lookup (~lines 42-48). Change call to `getLLMProvider(providerName, llmModel)`.
- `netlify/functions/enhance-rubric.ts` — Remove apiKey lookup in Gemini branch (~line 194). Change to `getLLMProvider('gemini', llmModel)`. (OpenAI branch fixed in Phase 4.)
- `netlify/functions/enhance-rubric-background.ts` — Same change as enhance-rubric.ts.

### 4.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] `getLLMProvider` signature no longer takes `apiKey`
- [ ] Grep: `process.env.GEMINI_API_KEY` and `process.env.OPENAI_API_KEY` only remain in health-check, legacy files, raw-SDK functions (Phase 3), and enhance-rubric OpenAI branch (Phase 4)

### 4.3 Implementation Notes

**Files modified:**
- `netlify/functions/lib/llm/openai-provider.ts` — Constructor changed from `apiKey?: string` to no `apiKey` param. `new OpenAI()` reads env automatically.
- `netlify/functions/lib/llm/factory.ts` — `getLLMProvider(providerName, model?)` — `apiKey` param removed entirely.
- `netlify/functions/grade-bulletproof-background.ts` — Removed 10-line apiKey lookup block (including DEBUG env key logging). Now single line: `getLLMProvider(providerName, llmModel)`.
- `netlify/functions/enhance-text.ts` — Removed 7-line apiKey lookup block. Now single line.
- `netlify/functions/enhance-rubric.ts` — Removed Gemini apiKey lookup (4 lines). OpenAI raw branch untouched (Phase 4).
- `netlify/functions/enhance-rubric-background.ts` — Same as enhance-rubric.ts.

**Grep audit confirmed:** `process.env.GEMINI_API_KEY` / `process.env.OPENAI_API_KEY` only remain in raw-SDK functions (Phase 3), enhance-rubric OpenAI branch (Phase 4), health-check, and legacy files.

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged.

---

## 5. Phase 3: Consolidate Hardcoded Gemini Functions into Factory

**Commit message:** `feat(llm): phase 3 — consolidate raw Gemini SDK calls into factory`
**Prerequisite:** Phase 2 `APPROVED`

### 5.0 Context

Four functions instantiate `GoogleGenerativeAI` directly. This phase migrates them to use the factory. The most complex case is `transcribe-image.ts` which uses multimodal (inline image data) — this requires extending `LLMRequest`.

### 5.1 Implementation Steps

**Step 1: Extend `LLMRequest` for multimodal and output control**
- File: `netlify/functions/lib/llm/types.ts`

```typescript
export interface InlineData {
  data: string;
  mimeType: string;
}

export interface LLMRequest {
  systemMessage: string;
  userMessage: string;
  jsonMode?: boolean;
  temperature?: number;
  inlineData?: InlineData[];
  maxOutputTokens?: number;
}
```

**Step 2: Update `GeminiProvider` for multimodal**
- File: `netlify/functions/lib/llm/gemini-provider.ts`
- In `generate()`, build a contents array that includes text + inline data if present:

```typescript
async generate(request: LLMRequest): Promise<LLMResponse> {
    const contents: any[] = [];
    if (request.userMessage) {
        contents.push({ text: request.userMessage });
    }
    if (request.inlineData) {
        for (const item of request.inlineData) {
            contents.push({ inlineData: { data: item.data, mimeType: item.mimeType } });
        }
    }

    const result = await this.client.models.generateContent({
        model: this.model,
        config: {
            systemInstruction: request.systemMessage,
            responseMimeType: request.jsonMode ? 'application/json' : 'text/plain',
            temperature: request.temperature,
            maxOutputTokens: request.maxOutputTokens,
        },
        contents,
    });
    // ... response mapping unchanged
}
```

**Step 3: Migrate `annotation-chat.ts`**
- File: `netlify/functions/annotation-chat.ts`
- Remove: `import { GoogleGenerativeAI } from '@google/generative-ai';`
- Add: `import { getLLMProvider } from './lib/llm/factory';`
- Replace raw Gemini block (~lines 161-182) with factory call:

```typescript
const provider = getLLMProvider('gemini', 'gemini-2.5-pro');
const result = await provider.generate({
    systemMessage: systemPrompt,
    userMessage: userMessage,
    temperature: 0.7,
    maxOutputTokens: 1024,
});
const response = result.content;
```

**Step 4: Migrate `transcribe-image.ts`**
- File: `netlify/functions/transcribe-image.ts`
- Remove: `import { GoogleGenerativeAI } from '@google/generative-ai';`
- Remove: `import OpenAI from 'openai';` (if unused after)
- Add: `import { getLLMProvider } from './lib/llm/factory';`
- Replace raw multimodal block (~lines 87-100):

```typescript
const provider = getLLMProvider('gemini', 'gemini-2.5-pro');
const result = await provider.generate({
    systemMessage: SYSTEM_PROMPT,
    userMessage: '',
    inlineData: [{ data: base64Data, mimeType }],
});
transcription = result.content;
```

- Remove `process.env.GEMINI_API_KEY` check. Update token usage logging to use `result.usage`.

**Step 5: Migrate `extract-rubric-from-document.ts`**
- File: `netlify/functions/extract-rubric-from-document.ts`
- Remove: `import { GoogleGenerativeAI } from '@google/generative-ai';`
- Remove: `const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');` (top-level)
- Add: `import { getLLMProvider } from './lib/llm/factory';`
- Replace `genAI.getGenerativeModel(...).generateContent(...)` calls with `getLLMProvider('gemini').generate({...})`

**Step 6: Migrate `extract-rubric-background.ts`**
- File: `netlify/functions/extract-rubric-background.ts`
- Same changes as Step 5.

### 5.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] Grep `@google/generative-ai` in active `.ts` files — ZERO matches
- [ ] Grep `new GoogleGenerativeAI` in active code — ZERO matches
- [ ] All 4 migrated functions use `getLLMProvider()` from factory
- [ ] `transcribe-image.ts` passes `inlineData` for multimodal

### 5.3 Implementation Notes

**Files modified (6):**
- `netlify/functions/lib/llm/types.ts` — Added `InlineData` interface and `inlineData?: InlineData[]`, `maxOutputTokens?: number` to `LLMRequest`.
- `netlify/functions/lib/llm/gemini-provider.ts` — `generate()` now builds a contents array with text + inline data parts. Added `maxOutputTokens` to config.
- `netlify/functions/annotation-chat.ts` — Replaced `GoogleGenerativeAI` import + raw SDK block (20 lines) with `getLLMProvider('gemini', 'gemini-2.5-pro')` factory call (6 lines).
- `netlify/functions/transcribe-image.ts` — Removed `GoogleGenerativeAI` and `OpenAI` imports. Replaced `GEMINI_API_KEY` check + raw multimodal block with factory call using `inlineData`. Token usage now reads from `result.usage`.
- `netlify/functions/extract-rubric-from-document.ts` — Removed top-level `const genAI = new GoogleGenerativeAI(...)`. Replaced `getGenerativeModel()` + `generateContent(promptParts)` with factory call using `systemMessage`, `userMessage` (joined text parts), `jsonMode: true`, and `inlineData` for PDF.
- `netlify/functions/extract-rubric-background.ts` — Same changes as extract-rubric-from-document.ts.

**Grep audit:** Zero `@google/generative-ai` imports and zero `new GoogleGenerativeAI` in active files.

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged.

**Important for Phase 4:** `extract-rubric-*` functions now demonstrate the pattern for multimodal + JSON mode via factory. The `enhance-rubric` OpenAI structured output branch is the last remaining raw SDK usage.

---

## 6. Phase 4: Consolidate enhance-rubric Functions to Use Factory

**Commit message:** `feat(llm): phase 4 — consolidate enhance-rubric OpenAI structured outputs`
**Prerequisite:** Phase 3 `APPROVED`

### 6.0 Context

`enhance-rubric.ts` and `enhance-rubric-background.ts` use raw `new OpenAI({ apiKey })` for structured outputs (`json_schema`). This phase adds `jsonSchema` support to `LLMRequest` / `OpenAIProvider` and consolidates both paths through the factory.

### 6.1 Implementation Steps

**Step 1: Add `jsonSchema` to `LLMRequest`**
- File: `netlify/functions/lib/llm/types.ts`

```typescript
export interface LLMRequest {
  systemMessage: string;
  userMessage: string;
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

**Step 2: Update `OpenAIProvider` for `json_schema` format**
- File: `netlify/functions/lib/llm/openai-provider.ts`

```typescript
async generate(request: LLMRequest): Promise<LLMResponse> {
    let response_format: any = undefined;
    if (request.jsonSchema) {
        response_format = { type: 'json_schema', json_schema: request.jsonSchema };
    } else if (request.jsonMode) {
        response_format = { type: 'json_object' };
    }

    const response = await this.client.chat.completions.create({
        model: this.model,
        response_format,
        messages: [
            { role: 'system', content: request.systemMessage },
            { role: 'user', content: request.userMessage }
        ],
        temperature: request.temperature,
    });
    // ... rest unchanged
}
```

**Step 3: Refactor `enhance-rubric.ts`**
- File: `netlify/functions/enhance-rubric.ts`
- Remove: `import { OpenAI } from 'openai';`
- Remove the entire Gemini/OpenAI branching block. Replace with a unified factory call:

```typescript
const providerName = (llmProvider as LLMProviderName) || 'gemini';
const model = llmModel || (providerName === 'gemini' ? 'gemini-2.5-pro' : 'gpt-4o-2024-08-06');
const provider = getLLMProvider(providerName, model);

const response = await provider.generate({
    systemMessage: systemPrompt,
    userMessage: `Simple grading rules:\n\n${simple_rules}`,
    temperature: 0.7,
    jsonMode: providerName === 'gemini',
    jsonSchema: providerName === 'openai' ? { name: 'rubric', strict: true, schema: RUBRIC_SCHEMA } : undefined,
});

content = response.content.trim();
tokensUsed = (response.usage?.promptTokens ?? 0) + (response.usage?.completionTokens ?? 0);
```

**Step 4: Same refactor for `enhance-rubric-background.ts`**

### 6.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing tests pass
- [ ] Grep `new OpenAI(` in active function files — ZERO matches (only in legacy)
- [ ] Both enhance-rubric functions use factory for all providers

### 6.3 Implementation Notes

**Files modified (4):**
- `netlify/functions/lib/llm/types.ts` — Added `jsonSchema?: { name, strict, schema }` to `LLMRequest`.
- `netlify/functions/lib/llm/openai-provider.ts` — `generate()` now builds `response_format` from `jsonSchema` (priority) or `jsonMode`. Replaced inline ternary with explicit if/else block.
- `netlify/functions/enhance-rubric.ts` — Removed `import OpenAI` and `ChatCompletionCreateParamsNonStreaming`. Replaced 50-line Gemini/OpenAI branching block with unified 10-line factory call. Both providers now route through `getLLMProvider()`. OpenAI uses `jsonSchema`, Gemini uses `jsonMode`.
- `netlify/functions/enhance-rubric-background.ts` — Same refactor as enhance-rubric.ts.

**Net code reduction:** -49 lines across both enhance-rubric files.

**Grep audit:** `new OpenAI(` only in `grade.ts` (legacy) and `openai-provider.ts` (the provider class itself).

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged.

---

## 7. Phase 5: Add Anthropic Claude Provider

**Commit message:** `feat(llm): phase 5 — add Anthropic Claude provider`
**Prerequisite:** Phase 4 `APPROVED`

### 7.0 Context

With the Netlify AI Gateway auto-injecting `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL`, adding a third LLM provider requires only creating a new provider class and registering it in the factory. The `@anthropic-ai/sdk` package reads these env vars automatically.

### 7.1 Implementation Steps

**Step 1: Install Anthropic SDK**
- File: `package.json`
- Add `"@anthropic-ai/sdk": "^0.39.0"` (or latest stable)
- Run `npm install`

**Step 2: Create `netlify/functions/lib/llm/anthropic-provider.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from './types';

export class AnthropicProvider implements LLMProvider {
    private client: Anthropic;
    private model: string;

    constructor(model: string = 'claude-sonnet-4-5-20250929') {
        this.client = new Anthropic();
        this.model = model;
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: request.maxOutputTokens ?? 4096,
            system: request.systemMessage,
            messages: [
                { role: 'user', content: request.userMessage }
            ],
            temperature: request.temperature,
        });

        const content = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');

        return {
            content,
            usage: {
                promptTokens: response.usage?.input_tokens ?? 0,
                completionTokens: response.usage?.output_tokens ?? 0,
            }
        };
    }
}
```

**Step 3: Register in factory**
- File: `netlify/functions/lib/llm/factory.ts`

```typescript
import { AnthropicProvider } from './anthropic-provider';

export type LLMProviderName = 'openai' | 'gemini' | 'anthropic';

export function getLLMProvider(
    providerName: LLMProviderName,
    model?: string
): LLMProvider {
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

### 7.2 Verification

- [ ] `npm install` completes without errors
- [ ] `@anthropic-ai/sdk` is in `package.json`
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass, no regressions
- [ ] `getLLMProvider('anthropic')` returns an `AnthropicProvider`

### 7.3 Implementation Notes

**Files created/modified (3):**
- `package.json` — Added `@anthropic-ai/sdk` (^0.39.0). npm install added 9 packages.
- `netlify/functions/lib/llm/anthropic-provider.ts` — **New file** (37 lines). Implements `LLMProvider` interface using `@anthropic-ai/sdk`. Zero-config constructor (`new Anthropic()` reads env automatically). Default model: `claude-sonnet-4-5-20250929`. Extracts text blocks from response, maps `input_tokens`/`output_tokens` to unified usage format.
- `netlify/functions/lib/llm/factory.ts` — Added `'anthropic'` to `LLMProviderName` union. Added `AnthropicProvider` import and case in switch.

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged.

---

## 8. Phase 6: Update Frontend Settings UI and API Calls

**Commit message:** `feat(llm): phase 6 — add Anthropic to Settings UI and update API calls`
**Prerequisite:** Phase 5 `APPROVED`

### 8.0 Context

`SettingsModal.tsx` currently offers two LLM choices (`gemini` | `openai`). This phase adds `anthropic` as a third option, removes the "API Key Requirement" warning (keys are now Gateway-managed), and updates `api.ts` to map the new provider to a model name.

### 8.1 Implementation Steps

**Step 1: Update `src/components/SettingsModal.tsx`**

Update type union (~line 197):
```typescript
const [llmProvider, setLlmProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
```

Update `Select` component (~line 326-334):
```typescript
<Select value={llmProvider} onValueChange={(v: 'gemini' | 'openai' | 'anthropic') => setLlmProvider(v)}>
  <SelectContent>
    <SelectItem value="gemini">Gemini 2.5 Pro (Default)</SelectItem>
    <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
    <SelectItem value="anthropic">Anthropic Claude Sonnet</SelectItem>
  </SelectContent>
</Select>
```

Update model details info box (~lines 342-355) to add Anthropic case:
```typescript
{llmProvider === 'anthropic' && (
  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
    <p><strong>Model:</strong> claude-sonnet-4-5-20250929</p>
    <p><strong>Best for:</strong> Nuanced feedback and contextual understanding</p>
  </div>
)}
```

Replace the yellow "API Key Requirement" warning box (~lines 357-363) with:
```typescript
<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Powered by Netlify AI Gateway</h4>
  <p className="text-sm text-green-700 dark:text-green-300">
    API keys are managed automatically. No manual configuration required.
  </p>
</div>
```

Update localStorage loader (~line 219) to include `'anthropic'`:
```typescript
if (savedProvider === 'openai' || savedProvider === 'gemini' || savedProvider === 'anthropic') {
  setLlmProvider(savedProvider);
}
```

**Step 2: Update `src/lib/api.ts`**
- File: `src/lib/api.ts`
- Update model mapping (~line 71-72):

```typescript
const llmProvider = localStorage.getItem('ai_provider') || 'gemini';
const llmModel = llmProvider === 'gemini'
  ? 'gemini-2.5-pro'
  : llmProvider === 'anthropic'
    ? 'claude-sonnet-4-5-20250929'
    : 'gpt-4o';
```

### 8.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass, no regressions
- [ ] Settings modal shows three provider options
- [ ] Selecting Anthropic stores `'anthropic'` in localStorage
- [ ] Model details box shows correct info for all three providers
- [ ] API key warning replaced with Gateway info message
- [ ] Dark mode renders correctly for Settings modal

### 8.3 Implementation Notes

**Files modified (2):**
- `src/components/SettingsModal.tsx` — Added `'anthropic'` to provider type union, Select options, localStorage loader, and model details. Replaced yellow "API Key Requirement" warning with green "Powered by Netlify AI Gateway" info box. Removed API key references from model details for all providers.
- `src/lib/api.ts` — Updated model mapping to include Anthropic: `gemini` → `gemini-2.5-pro`, `anthropic` → `claude-sonnet-4-5-20250929`, default → `gpt-4o`.

**Verification:** `tsc` zero errors, build succeeds, 588/588 passing tests unchanged.

---

## 9. Phase 7: Update .env.example, Health-Check, and Documentation

**Commit message:** `feat(llm): phase 7 — update env docs and health-check for AI Gateway`
**Prerequisite:** Phase 6 `APPROVED`

### 9.0 Context

All code is migrated to zero-config providers. This phase updates `.env.example` and `health-check.ts` to reflect the Gateway-managed key model, and annotates legacy files.

### 9.1 Implementation Steps

**Step 1: Update `.env.example`**
- File: `.env.example`
- Replace the LLM configuration section (lines 1-8):

```
# ============================================================================
# LLM Configuration (Netlify AI Gateway)
# ============================================================================
# In production, the Netlify AI Gateway automatically injects:
#   OPENAI_API_KEY, OPENAI_BASE_URL
#   GEMINI_API_KEY, GOOGLE_GEMINI_BASE_URL
#   ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL
#
# For local development with `netlify dev`, these are also auto-injected.
# For local development WITHOUT `netlify dev`, set your own keys below:
# GEMINI_API_KEY=your-gemini-api-key-here
# OPENAI_API_KEY=sk-your-openai-api-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Step 2: Update `netlify/functions/health-check.ts`**
- File: `netlify/functions/health-check.ts`
- Add `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, and `NETLIFY_AI_GATEWAY_KEY` checks alongside existing `OPENAI_API_KEY`:

```typescript
environment: {
  DATABASE_URL: 'SET (hidden)',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
  NETLIFY_AI_GATEWAY_KEY: process.env.NETLIFY_AI_GATEWAY_KEY ? 'SET' : 'NOT SET',
  NODE_VERSION: process.version,
}
```

**Step 3: Annotate legacy files**
- File: `netlify/functions/grade.ts` — Add comment at top: `// LEGACY: Uses direct OpenAI SDK. Use grade-bulletproof-background.ts instead.`

**Step 4: Verify `@google/generative-ai` fully removed**
- File: `package.json` — Confirm `@google/generative-ai` is absent; `@google/genai` is present

### 9.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass, no regressions
- [ ] `.env.example` documents AI Gateway and all three provider keys
- [ ] `health-check` reports status for all three API keys plus Gateway key
- [ ] No remaining imports of `@google/generative-ai` in any active `.ts` file

### 9.3 Implementation Notes

_(to be filled during execution)_

---

## 10. Phase 8: Final Verification and Gateway Activation

**Commit message:** `feat(llm): phase 8 — final verification and Gateway activation`
**Prerequisite:** Phase 7 `APPROVED`

### 10.0 Context

All code changes are complete. This phase performs a full end-to-end verification, deploys to Netlify, removes manual API keys from the Netlify dashboard, and confirms the AI Gateway is active.

### 10.1 Implementation Steps

**Step 1: Full local verification**
- Run `npx tsc --noEmit` — zero errors
- Run `npm run build` — succeeds, note chunk sizes
- Run `npm test` — all tests pass, note test count

**Step 2: Grep audit — confirm no raw SDK usage**
```bash
# All should return ZERO in active files:
grep -r "new GoogleGenerativeAI" netlify/functions/ --include="*.ts" | grep -v ".legacy"
grep -r "new OpenAI(" netlify/functions/ --include="*.ts" | grep -v ".legacy"
grep -r "@google/generative-ai" netlify/functions/ --include="*.ts"
grep -r "process.env.GEMINI_API_KEY" netlify/functions/ --include="*.ts" | grep -v "health-check" | grep -v ".legacy"
grep -r "process.env.OPENAI_API_KEY" netlify/functions/ --include="*.ts" | grep -v "health-check" | grep -v ".legacy"
```

**Step 3: Deploy to Netlify**
- Push `feat/llm-gateway-migration` branch
- Deploy to preview URL
- Test health-check endpoint on preview deploy

**Step 4: Remove manual API keys from Netlify dashboard**
- Netlify → Site Settings → Environment Variables
- Remove `OPENAI_API_KEY` (if set manually)
- Remove `GEMINI_API_KEY` (if set manually)
- **Do NOT remove** `DATABASE_URL`, `JWT_SECRET`, or other non-LLM keys

**Step 5: Test Gateway-managed keys**
- health-check endpoint — all three provider keys show `SET`
- Grade an essay (tests `grade-bulletproof-background.ts`)
- Enhance a rubric (tests `enhance-rubric.ts`)
- Upload handwritten image (tests `transcribe-image.ts`)
- Extract rubric from document (tests `extract-rubric-from-document.ts`)
- Annotate a submission (tests `annotation-chat.ts`)
- Enhance OCR text (tests `enhance-text.ts`)

**Step 6: Merge to main**

### 10.2 Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass, no regressions
- [ ] Grep audit: zero raw SDK usage in active files
- [ ] Preview deploy works
- [ ] Health-check shows all three API keys as `SET`
- [ ] Grading works with Gemini (default)
- [ ] Grading works with OpenAI (switch in Settings)
- [ ] Rubric enhancement works
- [ ] Image transcription works
- [ ] Rubric extraction from document works
- [ ] Annotation chat works
- [ ] Settings UI shows all three providers

### 10.3 Implementation Notes

_(to be filled during execution)_

---

## Shared Component Reuse Summary

| Shared Resource | Package | Used By |
|---|---|---|
| `LLMProvider` interface | `netlify/functions/lib/llm/types.ts` | All 8 LLM functions |
| `getLLMProvider()` factory | `netlify/functions/lib/llm/factory.ts` | All 8 LLM functions |
| `OpenAIProvider` | `netlify/functions/lib/llm/openai-provider.ts` | Factory |
| `GeminiProvider` | `netlify/functions/lib/llm/gemini-provider.ts` | Factory |
| `AnthropicProvider` (new) | `netlify/functions/lib/llm/anthropic-provider.ts` | Factory |
| `Select`, `Button`, `Textarea` | `src/components/ui/` | `SettingsModal.tsx` |

**No component is duplicated in the app that already exists in a shared package.**

---

## Follow-Up Items (out of scope for this plan)

1. **Streaming responses** — The AI Gateway supports streaming but `LLMProvider` returns full responses. Future plan could add `generateStream()` for real-time grading feedback.
2. **PDF/DOCX multimodal extraction** — `extract-rubric-from-document.ts` uses `mammoth` and `pdf-lib` for text extraction. Future plan could use Gemini multimodal to process document images directly.
3. **Rate limiting configuration** — Set up per-function rate limits in Netlify dashboard for AI Gateway calls.
4. **Token usage dashboard** — Build teacher-facing usage dashboard showing credits consumed per assignment.
5. **Remove legacy files** — `grade.ts` and `grade-bulletproof.ts.legacy` can be deleted once confirmed unused.
6. **SettingsModal test updates** — Update `SettingsModal.test.tsx` to include Anthropic option in assertions.

---

## Timeline Estimate

| Phase | Description | Effort | Cumulative |
|---|---|---|---|
| 1 | Upgrade Gemini SDK and rewrite GeminiProvider | 0.5 days | 0.5 days |
| 2 | Update OpenAI provider to zero-config | 0.5 days | 1 day |
| 3 | Consolidate hardcoded Gemini functions into factory | 1 day | 2 days |
| 4 | Consolidate enhance-rubric functions to use factory | 0.5 days | 2.5 days |
| 5 | Add Anthropic Claude provider | 0.5 days | 3 days |
| 6 | Update frontend Settings UI and API calls | 0.5 days | 3.5 days |
| 7 | Update .env.example, health-check, documentation | 0.5 days | 4 days |
| 8 | Final verification and Gateway activation | 0.5 days | 4.5 days |

---

## Success Criteria

- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` — all existing tests pass, no regressions
- [ ] No `any` types in new code (except SDK response mapping where unavoidable)
- [ ] Zero imports of `@google/generative-ai` in active code
- [ ] Zero raw `new OpenAI(` or `new GoogleGenerativeAI(` in active function files
- [ ] All 8 LLM functions route through `getLLMProvider()` factory
- [ ] Three providers available in Settings UI: Gemini, OpenAI, Anthropic
- [ ] Health-check reports all three API keys as `SET` when using AI Gateway
- [ ] Manual API keys removed from Netlify env vars
- [ ] Dark mode works for updated Settings UI
- [ ] `.env.example` documents AI Gateway configuration

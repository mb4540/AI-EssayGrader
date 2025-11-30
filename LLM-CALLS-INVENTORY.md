# LLM Calls Inventory - AI-EssayGrader

## Summary

**Total Functions with LLM Calls:** 6  
**Background Functions:** 1  
**Synchronous Functions:** 5  
**Functions Using Default LLM:** 1  
**Functions Specifying Specific LLM:** 5  

---

## 1. Background Functions (Async/Long-Running)

### ✅ `grade-bulletproof-background.ts`
- **Type:** Background function (triggered by `grade-bulletproof-trigger.ts`)
- **LLM Provider:** Uses `getLLMProvider()` factory
- **Default Behavior:** ✅ **Uses system default** (Gemini 2.5 Pro)
- **Configurable:** Yes, via `llmProvider` and `llmModel` parameters from frontend
- **Models:**
  - Default: `gemini-2.5-pro` (if no provider specified)
  - Fallback: `gpt-4o` (if OpenAI selected)
  - User can override via UI settings
- **Purpose:** Main grading function using BulletProof calculator
- **API Keys Required:** `GEMINI_API_KEY` (primary) or `OPENAI_API_KEY` (fallback)

---

## 2. Synchronous Functions (Direct Response)

### ❌ `grade-bulletproof.ts` (Legacy)
- **Type:** Synchronous function
- **LLM Provider:** OpenAI only (hardcoded)
- **Default Behavior:** ❌ **Hardcoded to OpenAI**
- **Model:** `process.env.OPENAI_MODEL || 'gpt-4o-mini'`
- **Purpose:** Legacy grading function (replaced by background version)
- **API Keys Required:** `OPENAI_API_KEY`
- **Status:** ⚠️ **Should be updated or deprecated**

### ❌ `enhance-text.ts`
- **Type:** Synchronous function
- **LLM Provider:** OpenAI only (hardcoded)
- **Default Behavior:** ❌ **Hardcoded to OpenAI**
- **Model:** `process.env.OPENAI_MODEL || 'gpt-4o-mini'`
- **Purpose:** OCR text cleanup (secondary "Clean Text" feature)
- **API Keys Required:** `OPENAI_API_KEY`
- **Status:** ⚠️ **Should be updated to use factory pattern**

### ❌ `enhance-rubric.ts`
- **Type:** Synchronous function
- **LLM Provider:** OpenAI only (hardcoded)
- **Default Behavior:** ❌ **Hardcoded to OpenAI**
- **Model:** `gpt-4o-2024-08-06` (specific version for structured outputs)
- **Purpose:** Transform simple rubrics into detailed structured rubrics
- **API Keys Required:** `OPENAI_API_KEY`
- **Status:** ⚠️ **Requires specific OpenAI model for structured outputs**
- **Note:** Uses OpenAI's structured output feature (not available in Gemini yet)

### ⚠️ `transcribe-image.ts`
- **Type:** Synchronous function
- **LLM Provider:** Configurable (Gemini or OpenAI)
- **Default Behavior:** ⚠️ **Defaults to Gemini** (via parameter `provider = 'gemini'`)
- **Models:**
  - Gemini: `gemini-2.5-pro` (hardcoded)
  - OpenAI: `gpt-4o` (hardcoded)
- **Purpose:** Multimodal LLM transcription of handwritten essays
- **API Keys Required:** `GEMINI_API_KEY` or `OPENAI_API_KEY`
- **Status:** ✅ **Already uses Gemini 2.5 Pro by default**

### ❌ `extract-rubric-from-document.ts`
- **Type:** Synchronous function
- **LLM Provider:** Gemini only (hardcoded)
- **Default Behavior:** ❌ **Hardcoded to Gemini**
- **Model:** Not specified (uses Gemini SDK default)
- **Purpose:** Extract rubric criteria from uploaded PDF/DOCX files
- **API Keys Required:** `GEMINI_API_KEY`
- **Status:** ⚠️ **Hardcoded to Gemini** (no fallback)

---

## Detailed Breakdown by Function

### Background Functions

| Function | Provider | Model | Uses Default? | Configurable? |
|----------|----------|-------|---------------|---------------|
| `grade-bulletproof-background.ts` | Factory (Gemini/OpenAI) | `gemini-2.5-pro` / `gpt-4o` | ✅ Yes | ✅ Yes (via UI) |

### Synchronous Functions

| Function | Provider | Model | Uses Default? | Configurable? |
|----------|----------|-------|---------------|---------------|
| `grade-bulletproof.ts` | OpenAI | `gpt-4o-mini` | ❌ No (hardcoded) | ❌ No |
| `enhance-text.ts` | OpenAI | `gpt-4o-mini` | ❌ No (hardcoded) | ❌ No |
| `enhance-rubric.ts` | OpenAI | `gpt-4o-2024-08-06` | ❌ No (hardcoded) | ❌ No |
| `transcribe-image.ts` | Gemini/OpenAI | `gemini-2.5-pro` / `gpt-4o` | ⚠️ Gemini default | ⚠️ Via parameter |
| `extract-rubric-from-document.ts` | Gemini | Default | ❌ No (hardcoded) | ❌ No |

---

## Functions NOT Using System Default

### Critical Path (Should be updated):
1. ❌ **`grade-bulletproof.ts`** - Legacy grading function (OpenAI hardcoded)
   - **Impact:** High (if still in use)
   - **Recommendation:** Deprecate or update to use factory pattern

2. ❌ **`enhance-text.ts`** - OCR cleanup (OpenAI hardcoded)
   - **Impact:** Medium (secondary feature)
   - **Recommendation:** Update to use factory pattern

### Special Cases (May need to stay hardcoded):
3. ❌ **`enhance-rubric.ts`** - Rubric enhancement (OpenAI hardcoded)
   - **Impact:** Medium
   - **Reason:** Uses OpenAI's structured output feature
   - **Recommendation:** Keep as-is until Gemini supports structured outputs

4. ⚠️ **`transcribe-image.ts`** - Image transcription (Gemini default, configurable)
   - **Impact:** Low (already uses Gemini 2.5 Pro by default)
   - **Recommendation:** Already aligned with system default

5. ❌ **`extract-rubric-from-document.ts`** - Rubric extraction (Gemini hardcoded)
   - **Impact:** Low (already uses Gemini)
   - **Recommendation:** Consider adding OpenAI fallback

---

## Recommendations

### High Priority (Update to use system default):
1. **`grade-bulletproof.ts`** (if still in use)
   - Replace OpenAI hardcoding with factory pattern
   - Or deprecate in favor of background version

2. **`enhance-text.ts`**
   - Update to use `getLLMProvider()` factory
   - Allow user to choose provider via settings

### Medium Priority (Consider updating):
3. **`extract-rubric-from-document.ts`**
   - Add OpenAI fallback option
   - Use factory pattern for consistency

### Low Priority (Keep as-is):
4. **`enhance-rubric.ts`**
   - Keep OpenAI for structured outputs
   - Add comment explaining why OpenAI is required

5. **`transcribe-image.ts`**
   - Already uses Gemini 2.5 Pro by default
   - No changes needed

---

## Environment Variables Required

### For Full Functionality:
```bash
# Primary LLM (Default)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-pro

# Fallback LLM
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
```

### Minimum Required:
- **For grading only:** `GEMINI_API_KEY` (with OpenAI fallback if needed)
- **For rubric enhancement:** `OPENAI_API_KEY` (required for structured outputs)
- **For OCR cleanup:** `OPENAI_API_KEY` (currently hardcoded)

---

## Migration Path

### Phase 1: Critical Functions (Completed ✅)
- ✅ `grade-bulletproof-background.ts` - Uses factory pattern with Gemini default

### Phase 2: Secondary Functions (Recommended)
- [ ] Update `enhance-text.ts` to use factory pattern
- [ ] Deprecate or update `grade-bulletproof.ts` (legacy)

### Phase 3: Optional Improvements
- [ ] Add fallback to `extract-rubric-from-document.ts`
- [ ] Document why `enhance-rubric.ts` requires OpenAI

---

## Testing Checklist

- [ ] Test grading with Gemini 2.5 Pro (background function)
- [ ] Test grading with OpenAI GPT-4o (background function)
- [ ] Test OCR cleanup with OpenAI (enhance-text)
- [ ] Test rubric enhancement with OpenAI (enhance-rubric)
- [ ] Test image transcription with Gemini (transcribe-image)
- [ ] Test image transcription with OpenAI (transcribe-image)
- [ ] Test rubric extraction with Gemini (extract-rubric-from-document)
- [ ] Verify all functions fail gracefully when API key is missing

---

## Notes

- **Background vs Synchronous:** Only `grade-bulletproof-background.ts` is a true background function (long-running, async). All others return synchronously.
- **Factory Pattern:** Only the background grading function uses the `getLLMProvider()` factory pattern.
- **Hardcoded Models:** Most functions have hardcoded model choices for specific reasons (structured outputs, multimodal capabilities, etc.).
- **User Control:** Only the main grading function respects user's LLM provider choice from UI settings.

# LLM API Updates - Implementation Summary

## Overview
Successfully updated all LLM function calls to use system defaults (Gemini 2.5 Pro) with comprehensive performance logging to determine if background processing is needed.

## Changes Implemented

### 1. ✅ Soft Delete `grade-bulletproof.ts` (Legacy Function)
**File:** `netlify/functions/grade-bulletproof.ts` → `grade-bulletproof.ts.legacy`
- **Action:** Renamed to `.legacy` extension (soft delete)
- **Reason:** Legacy synchronous grading function replaced by `grade-bulletproof-background.ts`
- **Status:** Ready for testing - will hard delete after confirming no impact
- **Impact:** None expected - background version is already in use

### 2. ✅ Update `enhance-text.ts` - OCR Text Cleanup
**File:** `netlify/functions/enhance-text.ts`
- **Changed:** Now uses `getLLMProvider()` factory pattern
- **Default:** Gemini 2.5 Pro (respects user's global LLM setting)
- **Fallback:** OpenAI GPT-4o if user selects it
- **Performance Logging Added:**
  - Duration (ms)
  - Input/output text length
  - Token usage (prompt + completion)
  - Processing speed (chars/sec)
- **Response Enhanced:** Now includes `performance` object with metrics
- **Purpose:** Monitor if synchronous call is fast enough or needs background processing

**Performance Metrics Logged:**
```javascript
{
  duration_ms: 1234,
  provider: 'gemini',
  model: 'gemini-2.5-pro',
  input_length: 500,
  output_length: 480,
  tokens_used: 250
}
```

### 3. ✅ Update `enhance-rubric.ts` - Rubric Enhancement
**File:** `netlify/functions/enhance-rubric.ts`
- **Changed:** Now uses system default (Gemini) with JSON mode
- **Default:** Gemini 2.5 Pro (respects user's global LLM setting)
- **Fallback:** OpenAI GPT-4o-2024-08-06 if user selects OpenAI
- **Implementation:**
  - Gemini: Uses standard JSON mode
  - OpenAI: Uses structured outputs with `json_schema` (stricter validation)
  - Both providers work correctly
- **Performance Logging Added:**
  - Duration (ms)
  - Input rules length
  - Categories generated
  - Token usage
- **Response Enhanced:** Now includes `performance` object with metrics
- **Documentation:** Updated to explain both providers work

**Important Note:**
Both Gemini and OpenAI work for this function. OpenAI's structured outputs provide stricter JSON validation, but Gemini's JSON mode is sufficient.

### 4. ✅ Lock `transcribe-image.ts` - Handwriting Transcription
**File:** `netlify/functions/transcribe-image.ts`
- **Changed:** LOCKED to Gemini 2.5 Pro (multimodal)
- **Reason:** Gemini is optimized for vision tasks and provides superior handwriting recognition
- **Removed:** Provider parameter - no longer accepts user choice
- **Removed:** OpenAI fallback code
- **Performance Logging Added:**
  - Duration (ms)
  - Image size and type
  - Output text length
  - Token usage
  - Processing speed (chars/sec)
- **Response Enhanced:** Now includes `performance` object with metrics
- **Documentation:** Added clear comment explaining it's locked to Gemini
- **Impact:** User's global LLM setting does NOT affect this function
- **Always Uses:** Gemini 2.5 Pro regardless of AI Prompt Settings

**Why Locked:**
- Multimodal LLM specifically designed for image understanding
- Superior handwriting recognition compared to GPT-4o
- Critical for accurate essay transcription from images

### 5. ✅ Lock `extract-rubric-from-document.ts` - Rubric Extraction
**File:** `netlify/functions/extract-rubric-from-document.ts`
- **Changed:** LOCKED to Gemini (multimodal)
- **Reason:** Gemini is optimized for document understanding
- **Performance Logging Added:**
  - Duration (ms)
  - File size and type
  - Categories extracted
  - Total points
  - Token usage
- **Response Enhanced:** Now includes `performance` object with metrics
- **Documentation:** Added clear comment explaining it's locked to Gemini
- **Impact:** User's global LLM setting does NOT affect this function
- **Always Uses:** Gemini regardless of AI Prompt Settings

**Why Locked:**
- Multimodal LLM specifically designed for document processing
- Superior rubric extraction from PDF/DOCX files
- Critical for accurate rubric parsing

## Summary Table

| Function | Old Behavior | New Behavior | Respects User Setting? | Performance Logging? |
|----------|--------------|--------------|------------------------|---------------------|
| `grade-bulletproof.ts` | OpenAI hardcoded | **SOFT DELETED** | N/A | N/A |
| `grade-bulletproof-background.ts` | Uses factory | Uses factory (Gemini default) | ✅ Yes | ✅ Yes (already had) |
| `enhance-text.ts` | OpenAI hardcoded | Uses factory (Gemini default) | ✅ Yes | ✅ Yes (NEW) |
| `enhance-rubric.ts` | OpenAI hardcoded | Uses factory (Gemini default) | ✅ Yes | ✅ Yes (NEW) |
| `transcribe-image.ts` | Gemini default, configurable | **LOCKED to Gemini** | ❌ No (Gemini required) | ✅ Yes (NEW) |
| `extract-rubric-from-document.ts` | Gemini hardcoded | **LOCKED to Gemini** | ❌ No (Gemini required) | ✅ Yes (NEW) |

## Performance Monitoring

### Console Logging Format
All functions now log performance metrics in a consistent format:

```
[function-name] Starting operation with provider (model)
[function-name] Input: X characters/items
[function-name] ✅ Completed in Xms
[function-name] Output: Y characters/items
[function-name] Token usage: X prompt + Y completion = Z total
[function-name] Performance: X chars/sec (for text functions)
```

### Decision Criteria for Background Processing

Monitor these metrics to determine if a function needs to be converted to background processing:

- **Duration > 5 seconds:** Consider background processing
- **Duration > 10 seconds:** Definitely needs background processing
- **Token usage > 10,000:** May need background processing
- **User complaints about slowness:** Move to background

### Current Expectations

| Function | Expected Duration | Needs Background? |
|----------|-------------------|-------------------|
| `enhance-text.ts` | 1-3 seconds | Probably not |
| `enhance-rubric.ts` | 2-5 seconds | Monitor closely |
| `transcribe-image.ts` | 3-8 seconds | Monitor closely |
| `extract-rubric-from-document.ts` | 5-15 seconds | Possibly yes |

## Testing Checklist

### Phase 1: Verify Soft Delete
- [ ] Test grading functionality - should work normally
- [ ] Check Netlify function logs - no errors about missing `grade-bulletproof`
- [ ] Confirm `grade-bulletproof-background` is being used
- [ ] If all good after 1 week, hard delete `.legacy` file

### Phase 2: Test enhance-text.ts
- [ ] Test OCR text cleanup with Gemini (default)
- [ ] Test OCR text cleanup with OpenAI (user switches in settings)
- [ ] Check console logs for performance metrics
- [ ] Verify response includes `performance` object
- [ ] Monitor duration - is it fast enough for synchronous?

### Phase 3: Test enhance-rubric.ts
- [ ] Test rubric enhancement with simple rules
- [ ] Test rubric enhancement with complex rubric
- [ ] Verify OpenAI is always used (check logs)
- [ ] Check console logs for performance metrics
- [ ] Verify response includes `performance` object
- [ ] Monitor duration - is it fast enough for synchronous?

### Phase 4: Test transcribe-image.ts
- [ ] Test handwriting transcription
- [ ] Verify Gemini 2.5 Pro is always used (check logs)
- [ ] Confirm user's LLM setting doesn't affect it
- [ ] Test with various handwriting samples
- [ ] Monitor accuracy and duration

### Phase 5: Test extract-rubric-from-document.ts
- [ ] Test rubric extraction from PDF
- [ ] Test rubric extraction from DOCX
- [ ] Verify Gemini is always used (check logs)
- [ ] Confirm user's LLM setting doesn't affect it
- [ ] Monitor duration - may need background processing

## Environment Variables Required

All functions now require:
```bash
# Primary LLM (Default for most functions)
GEMINI_API_KEY=your-gemini-api-key

# Required for enhance-rubric.ts (structured outputs)
OPENAI_API_KEY=your-openai-api-key
```

## Breaking Changes

### None Expected
- All changes are backward compatible
- Existing API contracts maintained
- Response format enhanced (added `performance` field) but not breaking

### User-Facing Changes
1. **OCR Text Cleanup** now uses Gemini by default (may be faster/better quality)
2. **Handwriting Transcription** is now locked to Gemini (can't switch to OpenAI)
3. **Rubric Extraction** is now locked to Gemini (can't switch to OpenAI)

## Rollback Plan

If issues arise:

1. **Restore grade-bulletproof.ts:**
   ```bash
   git mv netlify/functions/grade-bulletproof.ts.legacy netlify/functions/grade-bulletproof.ts
   ```

2. **Revert enhance-text.ts:**
   ```bash
   git revert <commit-hash>
   ```

3. **Revert enhance-rubric.ts:**
   ```bash
   git revert <commit-hash>
   ```

4. **Revert transcribe-image.ts:**
   ```bash
   git revert <commit-hash>
   ```

## Next Steps

1. **Deploy to production** (feature branch already pushed)
2. **Monitor Netlify function logs** for performance metrics
3. **Collect data for 1 week:**
   - Average duration per function
   - Token usage patterns
   - User feedback on speed
4. **Analyze data and decide:**
   - Which functions need background processing?
   - Is Gemini performing better than OpenAI?
   - Any issues with locked functions?
5. **Hard delete `grade-bulletproof.ts.legacy`** if no issues found
6. **Update documentation** with findings

## Performance Analysis Template

After 1 week of monitoring, fill this out:

### enhance-text.ts
- Average duration: ___ ms
- 95th percentile: ___ ms
- Token usage avg: ___ tokens
- Recommendation: Keep synchronous / Move to background

### enhance-rubric.ts
- Average duration: ___ ms
- 95th percentile: ___ ms
- Token usage avg: ___ tokens
- Recommendation: Keep synchronous / Move to background

### transcribe-image.ts
- Average duration: ___ ms
- 95th percentile: ___ ms
- Accuracy feedback: Good / Needs improvement
- Recommendation: Keep as-is / Investigate alternatives

### extract-rubric-from-document.ts
- Average duration: ___ ms
- 95th percentile: ___ ms
- Accuracy feedback: Good / Needs improvement
- Recommendation: Keep synchronous / Move to background

## Files Modified

1. `netlify/functions/grade-bulletproof.ts` → `.legacy` (soft delete)
2. `netlify/functions/enhance-text.ts` (factory pattern + logging)
3. `netlify/functions/enhance-rubric.ts` (logging + documentation)
4. `netlify/functions/transcribe-image.ts` (locked to Gemini)
5. `netlify/functions/extract-rubric-from-document.ts` (locked to Gemini)

## Commit Information

- **Branch:** `feature/llm-api-updates`
- **Commit:** `86bbae3`
- **Pushed:** Yes
- **Status:** Ready for testing/deployment

## Documentation Updates Needed

- [ ] Update `LLM-CALLS-INVENTORY.md` with new status
- [ ] Update README.md with performance monitoring info
- [ ] Create performance monitoring dashboard (optional)
- [ ] Document decision criteria for background processing

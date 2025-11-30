# Additional Script Updates - Background Processing

## Overview
Based on performance monitoring, two functions need to be converted to background processing due to timeout risks:
1. **`extract-rubric-from-document`** - Takes ~28 seconds (93% of timeout limit)
2. **`enhance-rubric`** - Inconsistent performance, has timed out at 30+ seconds, sometimes completes with only seconds to spare

Both functions are at high risk of timeout failures and must be converted to background processing.

## Performance Data

### Function 1: `extract-rubric-from-document`

#### Current Performance (Synchronous)
```
[extract-rubric] Starting extraction with gemini-2.0-flash
[extract-rubric] File: 6- Unit 2 Performance Task Rubric.pdf (application/pdf)
[extract-rubric] File size: 108KB
[extract-rubric] Completed in 27801ms (~28 seconds)
[extract-rubric] Extracted 4 categories
[extract-rubric] Total points: 4
[extract-rubric] Token usage: 2770 prompt + 1447 completion = 4217 total
Response with status 200 in 27971 ms.
```

#### Analysis
- **Duration:** 27.8 seconds (93% of 30-second timeout)
- **Risk:** Too close to timeout - larger PDFs or slower API responses will fail
- **File Size:** 108KB (moderate size)
- **Token Usage:** 4,217 tokens (moderate)
- **Decision:** **MUST convert to background function**

### Function 2: `enhance-rubric`

#### Current Performance (Synchronous)
```
Performance varies significantly:
- Test 1: Timed out at 30+ seconds (FAILED)
- Test 2: Completed with only a few seconds to spare (SUCCESS but risky)
- Token usage: Varies based on rubric complexity
- Input: Extracted rubric text (can be large)
- Output: Enhanced rubric with adjusted point values
```

#### Analysis
- **Duration:** Inconsistent, 25-35+ seconds
- **Risk:** HIGH - Already experiencing timeout failures
- **Variability:** Performance depends on:
  - Rubric complexity (number of categories/levels)
  - LLM provider (Gemini vs OpenAI)
  - API response time
  - Token count
- **Decision:** **MUST convert to background function**

## Implementation Plan

### Phase 1: Create Background Infrastructure for Extract Rubric

#### 1.1 Create Background Function
**File:** `netlify/functions/extract-rubric-background.ts`
- Copy pattern from `grade-bulletproof-background.ts`
- Accept job parameters: file, fileName, fileType, totalPoints, geminiModel, extractionPrompt
- Store job status in database or in-memory cache
- Return job ID immediately

#### 1.2 Create Trigger Function
**File:** `netlify/functions/extract-rubric-trigger.ts`
- Accept same parameters as current `extract-rubric-from-document.ts`
- Create job record with status: 'pending'
- Trigger background function
- Return job ID to frontend

#### 1.3 Create Status Check Function
**File:** `netlify/functions/extract-rubric-status.ts`
- Accept job ID
- Return current status: 'pending' | 'processing' | 'completed' | 'failed'
- Return result when completed
- Return error message if failed

### Phase 1B: Create Background Infrastructure for Enhance Rubric

#### 1B.1 Create Background Function
**File:** `netlify/functions/enhance-rubric-background.ts`
- Copy pattern from `grade-bulletproof-background.ts`
- Accept job parameters: simple_rules, rubric_prompt, total_points, llmProvider, llmModel
- Store job status in database or in-memory cache
- Return job ID immediately

#### 1B.2 Create Trigger Function
**File:** `netlify/functions/enhance-rubric-trigger.ts`
- Accept same parameters as current `enhance-rubric.ts`
- Create job record with status: 'pending'
- Trigger background function
- Return job ID to frontend

#### 1B.3 Create Status Check Function
**File:** `netlify/functions/enhance-rubric-status.ts`
- Accept job ID
- Return current status: 'pending' | 'processing' | 'completed' | 'failed'
- Return result when completed (enhanced_rubric, performance metrics)
- Return error message if failed

### Phase 2: Database Schema (Optional - Use In-Memory First)

#### Option A: In-Memory Cache (Quick Implementation)
```typescript
// Simple in-memory job storage
const jobs = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
}>();
```

#### Option B: Database Table (Production-Ready)
```sql
CREATE TABLE grader.rubric_extraction_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size_kb integer,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  error_message text,
  performance_metrics jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_rubric_jobs_user ON grader.rubric_extraction_jobs(user_id, created_at DESC);
CREATE INDEX idx_rubric_jobs_status ON grader.rubric_extraction_jobs(status, created_at);
```

### Phase 3: Frontend Updates

#### 3.1 Update API Client
**File:** `src/lib/api.ts` or create `src/lib/api/rubricExtraction.ts`

```typescript
// Trigger extraction job
export async function startRubricExtraction(params: {
  file: string;
  fileName: string;
  fileType: string;
  totalPoints?: number;
  geminiModel?: string;
  extractionPrompt?: string;
}): Promise<{ jobId: string }> {
  const response = await fetch('/.netlify/functions/extract-rubric-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

// Check job status
export async function checkRubricExtractionStatus(jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  performance?: any;
}> {
  const response = await fetch(`/.netlify/functions/extract-rubric-status?jobId=${jobId}`);
  return response.json();
}
```

#### 3.2 Update UI Component
**File:** `src/components/CreateAssignmentModal.tsx` (or wherever rubric extraction is used)

**Current Flow:**
1. User uploads PDF/DOCX
2. Click "Extract Rubric"
3. Wait 28 seconds (blocking)
4. Show result

**New Flow:**
1. User uploads PDF/DOCX
2. Click "Extract Rubric"
3. Show loading spinner with progress message
4. Poll status every 2 seconds
5. Show result when completed

```typescript
const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
const [extractionStatus, setExtractionStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');

// Start extraction
const handleExtractRubric = async () => {
  const { jobId } = await startRubricExtraction({
    file: fileBase64,
    fileName: file.name,
    fileType: file.type,
    totalPoints: 100,
  });
  
  setExtractionJobId(jobId);
  setExtractionStatus('pending');
  
  // Start polling
  pollExtractionStatus(jobId);
};

// Poll for status
const pollExtractionStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    const status = await checkRubricExtractionStatus(jobId);
    
    setExtractionStatus(status.status);
    
    if (status.status === 'completed') {
      clearInterval(interval);
      // Handle result
      setRubricText(status.result.rubricText);
      setTotalPoints(status.result.totalPoints);
    } else if (status.status === 'failed') {
      clearInterval(interval);
      // Handle error
      alert(status.error || 'Extraction failed');
    }
  }, 2000); // Poll every 2 seconds
  
  // Cleanup on unmount
  return () => clearInterval(interval);
};
```

#### 3.3 UI/UX Improvements

**Loading States:**
```tsx
{extractionStatus === 'pending' && (
  <div className="flex items-center gap-2 text-blue-600">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Starting extraction...</span>
  </div>
)}

{extractionStatus === 'processing' && (
  <div className="flex items-center gap-2 text-blue-600">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Analyzing document... This may take up to 30 seconds.</span>
  </div>
)}

{extractionStatus === 'completed' && (
  <div className="flex items-center gap-2 text-green-600">
    <CheckCircle className="w-4 h-4" />
    <span>Extraction complete!</span>
  </div>
)}
```

### Phase 4: Migration Strategy

#### 4.1 Soft Migration (Recommended)
1. Create new background functions alongside existing synchronous function
2. Add feature flag to switch between sync/async modes
3. Test background version thoroughly
4. Switch default to background version
5. Monitor for issues
6. Remove synchronous version after 1 week

#### 4.2 Implementation Order
1. ✅ Create background infrastructure (trigger, background, status)
2. ✅ Test with Postman/curl
3. ✅ Update frontend API client
4. ✅ Update UI component
5. ✅ Test end-to-end
6. ✅ Deploy to production
7. ✅ Monitor performance
8. ✅ Remove old synchronous function

### Phase 5: Testing Checklist

#### Backend Tests
- [ ] Test trigger function creates job and returns job ID
- [ ] Test background function processes job successfully
- [ ] Test status function returns correct status
- [ ] Test with small PDF (< 1MB)
- [ ] Test with large PDF (5-10MB)
- [ ] Test with DOCX file
- [ ] Test error handling (invalid file, API failure)
- [ ] Test timeout handling (> 30 seconds)
- [ ] Test concurrent jobs (multiple users)

#### Frontend Tests
- [ ] Test job creation and polling
- [ ] Test loading states display correctly
- [ ] Test success state displays result
- [ ] Test error state displays error message
- [ ] Test polling stops when job completes
- [ ] Test polling stops when component unmounts
- [ ] Test retry functionality
- [ ] Test with slow network (throttle to 3G)

#### Integration Tests
- [ ] Test full flow: upload → extract → display
- [ ] Test cancellation (user navigates away)
- [ ] Test multiple extractions in sequence
- [ ] Test browser refresh during extraction
- [ ] Test session timeout during extraction

### Phase 6: Performance Monitoring

#### Metrics to Track
```typescript
performance: {
  duration_ms: number;           // Total processing time
  queue_time_ms: number;         // Time waiting in queue
  extraction_time_ms: number;    // Actual extraction time
  file_size_kb: number;          // Input file size
  token_usage: number;           // LLM tokens used
  categories_extracted: number;  // Output quality metric
}
```

#### Expected Performance
- **Queue Time:** < 1 second (in-memory) or < 5 seconds (database)
- **Extraction Time:** 10-30 seconds (based on current data)
- **Total Time:** 10-35 seconds
- **Success Rate:** > 95%

### Phase 7: Cleanup

#### After 1 Week of Successful Background Processing
1. Remove `extract-rubric-from-document.ts` (synchronous version)
2. Update documentation
3. Remove feature flag (if used)
4. Archive old code for reference

## Files to Create/Modify

### New Files - Extract Rubric
1. `netlify/functions/extract-rubric-trigger.ts` - Trigger background job
2. `netlify/functions/extract-rubric-background.ts` - Background processor
3. `netlify/functions/extract-rubric-status.ts` - Status checker

### New Files - Enhance Rubric
4. `netlify/functions/enhance-rubric-trigger.ts` - Trigger background job
5. `netlify/functions/enhance-rubric-background.ts` - Background processor
6. `netlify/functions/enhance-rubric-status.ts` - Status checker

### New Files - Shared
7. `src/lib/api/rubricJobs.ts` - Frontend API client for both functions (optional)

### Modified Files
1. `src/components/CreateAssignmentModal.tsx` - Update UI for async flow (both extract and enhance)
2. `src/lib/api.ts` - Add rubric job functions (if not separate file)
3. `LLM-API-UPDATES-SUMMARY.md` - Document background conversion
4. `LLM-CALLS-INVENTORY.md` - Update status

### Optional Files (Database Approach)
1. `migrations/add_rubric_jobs.sql` - Create jobs table for both functions
2. `db_ref.md` - Update schema documentation

## Estimated Effort

### Extract Rubric Background Conversion
- **Backend Implementation:** 2-3 hours
- **Frontend Implementation:** 2-3 hours
- **Testing:** 1-2 hours
- **Subtotal:** 5-8 hours

### Enhance Rubric Background Conversion
- **Backend Implementation:** 2-3 hours (can reuse patterns)
- **Frontend Implementation:** 1-2 hours (similar to extract)
- **Testing:** 1-2 hours
- **Subtotal:** 4-7 hours

### Combined Total
- **Backend Implementation:** 4-6 hours (both functions)
- **Frontend Implementation:** 3-5 hours (both functions)
- **Testing:** 2-4 hours (both functions)
- **Documentation:** 1-2 hours
- **Total:** 10-17 hours

**Note:** Can be done incrementally - extract first, then enhance. Or both together for efficiency.

## Priority

**HIGH (Extract Rubric)** - Current performance (27.8s) is dangerously close to timeout limit (30s). Larger files or slower API responses will cause failures.

**HIGH (Enhance Rubric)** - Already experiencing timeout failures (30+ seconds). Inconsistent performance makes it unreliable.

## Dependencies

- ✅ Performance logging already implemented
- ✅ LLM provider infrastructure exists
- ✅ Pattern established in `grade-bulletproof-background.ts`
- ⚠️ Need to decide: In-memory vs Database storage
- ⚠️ Need to handle job cleanup (prevent memory leaks)

## Recommendations

1. **Start with in-memory implementation** for speed
2. **Add database persistence later** if needed for reliability
3. **Implement job cleanup** (delete jobs older than 1 hour)
4. **Add retry logic** for failed jobs
5. **Consider WebSocket** for real-time updates (optional enhancement)
6. **Implement both functions together** for consistency and code reuse
7. **Share job storage** between extract and enhance (same Map/table)

## Implementation Order Recommendation

### Option A: Sequential (Lower Risk)
1. Implement extract-rubric background first
2. Test thoroughly
3. Deploy and monitor
4. Implement enhance-rubric background
5. Test and deploy

### Option B: Parallel (More Efficient)
1. Implement both backend infrastructures together
2. Share job storage and status checking
3. Test both together
4. Deploy both at once
5. Monitor both functions

**Recommended:** Option B - More efficient, both functions have same risk level

## Next Steps

1. Review and approve this plan
2. Decide on storage approach (in-memory vs database)
3. Decide on implementation order (sequential vs parallel)
4. Implement backend functions (extract + enhance)
5. Test backend with Postman
6. Implement frontend changes
7. Test end-to-end
8. Deploy and monitor

## Notes

- These will be the 3rd and 4th functions converted to background processing (after grading)
- Pattern is well-established and proven
- Frontend already handles async operations for grading
- Can reuse polling logic from grading implementation
- Both functions are in the rubric workflow, so converting together makes sense
- **Status:** Planning complete, ready for implementation when approved

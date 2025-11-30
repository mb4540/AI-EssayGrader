# Background Processing Fix - Persistent Storage

## Problem Identified

The initial implementation used **in-memory Map storage** for job tracking:

```typescript
const jobs = new Map<string, RubricJob>();
```

### Why This Failed

**Serverless functions don't share memory!** Each function invocation runs in its own isolated instance:

1. **Trigger function** (instance A) creates job → stores in Map A
2. **Background function** (instance B) tries to find job → looks in Map B → **NOT FOUND** ❌
3. **Status function** (instance C) tries to check job → looks in Map C → **404 ERROR** ❌

### Error Logs

```
[rubric-jobs] Created extract job: job_1764522982914_e4qwo1m06vu
[rubric-jobs] Job not found: job_1764522982914_e4qwo1m06vu  ← Different instance!
Response with status 404 in 1 ms.
```

## Solution: Netlify Blobs

Replaced in-memory storage with **Netlify Blobs** - a persistent key-value store that works across all function instances.

### Changes Made

#### 1. Updated `rubric-job-storage.ts`

**Before:**
```typescript
const jobs = new Map<string, RubricJob>();

export function createJob(type: 'extract' | 'enhance'): RubricJob {
  const job = { ... };
  jobs.set(jobId, job);  // ❌ Only in this instance's memory
  return job;
}
```

**After:**
```typescript
import { getStore } from '@netlify/blobs';

function getJobStore() {
  return getStore('rubric-jobs');  // ✅ Persistent across all instances
}

export async function createJob(type: 'extract' | 'enhance'): Promise<RubricJob> {
  const job = { ... };
  const store = getJobStore();
  await store.set(jobId, JSON.stringify(job));  // ✅ Persisted to blob storage
  return job;
}
```

#### 2. Made All Functions Async

All job storage functions now return `Promise`:
- `createJob()` → `Promise<RubricJob>`
- `getJob()` → `Promise<RubricJob | null>`
- `updateJob()` → `Promise<RubricJob | null>`
- `deleteJob()` → `Promise<boolean>`

#### 3. Added `await` to All Calls

Updated all 6 functions to use `await`:
- ✅ `extract-rubric-trigger.ts`
- ✅ `extract-rubric-background.ts`
- ✅ `extract-rubric-status.ts`
- ✅ `enhance-rubric-trigger.ts`
- ✅ `enhance-rubric-background.ts`
- ✅ `enhance-rubric-status.ts`

## How It Works Now

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Blobs Storage                     │
│                   (rubric-jobs store)                        │
│                                                              │
│  job_123: { status: 'pending', ... }                        │
│  job_456: { status: 'processing', ... }                     │
│  job_789: { status: 'completed', result: {...} }            │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐         ┌────┴────┐
    │ Trigger │          │Background│         │ Status  │
    │Instance │          │Instance  │         │Instance │
    │    A    │          │    B     │         │    C    │
    └─────────┘          └──────────┘         └─────────┘
```

All instances read/write to the **same persistent storage**.

## Benefits

✅ **Works across function instances** - Jobs are truly shared
✅ **Survives cold starts** - Jobs persist even when functions scale to zero
✅ **Production-ready** - Netlify Blobs is designed for this use case
✅ **Automatic cleanup** - Can implement TTL or manual cleanup as needed

## Testing

The fix should resolve:
- ❌ "Job not found" errors
- ❌ 404 responses from status checks
- ❌ Background jobs not finding their job data

Expected behavior:
- ✅ Trigger creates job → returns jobId
- ✅ Background finds job → processes it
- ✅ Status checks find job → returns current status
- ✅ Frontend polls successfully → gets result

## Local Development

For local testing with Netlify CLI, blobs work automatically. No additional configuration needed.

For production, Netlify automatically provisions blob storage for your site.

## Next Steps

1. Test rubric extraction with a PDF file
2. Test rubric enhancement with AI
3. Verify no more 404 errors in logs
4. Monitor performance and job completion rates

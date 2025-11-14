# Background Grading Implementation

## Problem
The `grade-bulletproof` function was timing out after 30 seconds due to Netlify's function timeout limit. This occurred when grading complex submissions with many criteria or long essays.

## Solution
Converted the grading function to use a **background processing pattern** with three separate functions:

1. **Trigger Function** - Starts the job and returns immediately
2. **Background Function** - Performs the actual grading (no timeout)
3. **Status Function** - Checks job progress

## Architecture

```
Frontend (React)
    ↓
grade-bulletproof-trigger.ts (returns task_id in <1 second)
    ↓ (fire-and-forget)
grade-bulletproof-background.ts (runs without timeout)
    ↓ (updates DB)
background_tasks table (tracks status)
    ↑ (polls every 2 seconds)
grade-bulletproof-status.ts (returns current status)
    ↑
Frontend (React) - polls until completed
```

## Files Created

### 1. Database Migration
**File:** `migrations/add_background_tasks.sql`
- Creates `grader.background_tasks` table
- Tracks job status: pending → processing → completed/failed
- Stores input/output data and error messages

### 2. Background Function
**File:** `netlify/functions/grade-bulletproof-background.ts`
- Contains the actual grading logic (moved from grade-bulletproof.ts)
- No timeout limit
- Updates background_tasks table with status
- Saves results to submissions table

### 3. Trigger Function
**File:** `netlify/functions/grade-bulletproof-trigger.ts`
- Validates request and authentication
- Generates unique task_id (UUID)
- Starts background function via fire-and-forget fetch
- Returns immediately with 202 status and task_id

### 4. Status Function
**File:** `netlify/functions/grade-bulletproof-status.ts`
- Checks background_tasks table for job status
- Returns current status and result data
- Handles completed, failed, and in-progress states

### 5. Frontend API Updates
**File:** `src/lib/api.ts`
- Added `startGradingJob()` - calls trigger function
- Added `checkGradingStatus()` - polls status function
- Updated `gradeSubmission()` - now uses background pattern with polling
- **Backward compatible** - existing code continues to work

## How It Works

### Step 1: User Clicks "Grade"
```typescript
// Frontend calls gradeSubmission() as before
const feedback = await gradeSubmission({ submission_id: '123' });
```

### Step 2: Trigger Starts Job
```typescript
// Trigger function generates task_id and starts background job
POST /grade-bulletproof-trigger
→ Returns: { task_id: 'abc-123', status: 'processing' }
```

### Step 3: Background Processing
```typescript
// Background function runs without timeout
- Fetches submission data
- Calls OpenAI API
- Computes scores
- Saves results
- Updates background_tasks status to 'completed'
```

### Step 4: Frontend Polls for Status
```typescript
// Frontend polls every 2 seconds (max 60 attempts = 2 minutes)
GET /grade-bulletproof-status?jobId=abc-123
→ Returns: { status: 'processing' }
→ Returns: { status: 'processing' }
→ Returns: { status: 'completed', result: {...} }
```

### Step 5: Results Returned
```typescript
// Once completed, fetch full submission data
const submission = await getSubmission(submission_id);
return submission.ai_feedback; // Full feedback object
```

## Benefits

1. **No More Timeouts** - Background function can run as long as needed
2. **Better UX** - User sees "Grading in progress..." instead of timeout error
3. **Backward Compatible** - Existing code works without changes
4. **Scalable** - Can handle multiple concurrent grading jobs
5. **Resilient** - Failed jobs are tracked with error messages
6. **Auditable** - All jobs logged in background_tasks table

## Testing Steps

1. **Run Migration**
   ```bash
   psql "$NEON_DATABASE_URL" -f migrations/add_background_tasks.sql
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Test Grading**
   - Upload a submission
   - Click "Grade with AI"
   - Should see "Grading in progress..." message
   - Results appear when completed (2-30 seconds typically)

4. **Verify Database**
   ```sql
   SELECT * FROM grader.background_tasks ORDER BY created_at DESC LIMIT 10;
   ```

## Monitoring

### Check Job Status
```sql
-- Recent jobs
SELECT task_id, task_type, status, created_at, completed_at
FROM grader.background_tasks
ORDER BY created_at DESC
LIMIT 20;

-- Failed jobs
SELECT task_id, error_message, input_data, created_at
FROM grader.background_tasks
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Average completion time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM grader.background_tasks
WHERE status = 'completed' AND task_type = 'grading';
```

## Troubleshooting

### Job Stuck in "Processing"
- Check Netlify function logs for errors
- Verify OpenAI API key is set
- Check if background function crashed

### Job Failed
```sql
SELECT error_message, input_data 
FROM grader.background_tasks 
WHERE task_id = 'your-task-id';
```

### Frontend Timeout
- Default: 60 attempts × 2 seconds = 2 minutes max
- Increase `maxAttempts` in `api.ts` if needed
- Or reduce `pollInterval` for faster checks

## Future Enhancements

1. **WebSocket Updates** - Real-time status instead of polling
2. **Progress Tracking** - Show percentage complete
3. **Job Queue** - Prioritize jobs, rate limiting
4. **Retry Logic** - Auto-retry failed jobs
5. **Job Cancellation** - Allow users to cancel long-running jobs

## Reference Implementation

This pattern was adapted from the `gift-of-time-assistant` project which successfully uses background functions for:
- Assessment generation
- Lesson plan generation
- Text extraction
- Document processing

All following the same trigger → background → status pattern.

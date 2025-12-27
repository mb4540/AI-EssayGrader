# Troubleshooting Background Jobs

## Overview
This document explains how to troubleshoot the rubric extraction and enhancement background jobs in production.

## Recent Changes (Nov 30, 2025)

### Added Comprehensive Logging
All background functions now have detailed logging to help diagnose issues:

1. **Function lifecycle markers**
   - `========== FUNCTION STARTED ==========`
   - `========== FUNCTION COMPLETED ==========`
   - `========== ERROR OCCURRED ==========`

2. **Request tracking**
   - Job ID, file name, file type, file size
   - Model selection
   - Timestamp of execution

3. **Performance metrics**
   - Gemini API call duration
   - Total function execution time
   - Token usage

4. **Job status updates**
   - When job moves to 'processing'
   - When job completes
   - Error details with stack traces

### Increased Polling Timeout
- **Old**: 2 minutes (60 attempts × 2s)
- **New**: 5 minutes (150 attempts × 2s)
- **Reason**: PDF extraction with Gemini can take longer than 2 minutes in production

## How to View Logs

### Method 1: Netlify Dashboard (Recommended)
1. Go to: https://app.netlify.com/sites/ai-essaygrader/logs/functions
2. Click on the function you want to inspect:
   - `extract-rubric-trigger` - Initial job creation
   - `extract-rubric-background` - Actual PDF processing (note: background logs may be limited)
   - `extract-rubric-status` - Status polling
3. Look for the log markers and timestamps

### Method 2: Real-time Logs (CLI)
```bash
netlify logs:function extract-rubric-trigger --live
```

## Common Issues

### Issue 1: "Job polling timeout - max attempts reached"

**Symptoms:**
- Frontend shows timeout error after 5 minutes
- Job status stuck at 'pending' or 'processing'

**Diagnosis:**
1. Check `extract-rubric-trigger` logs:
   - Look for "Background function triggered successfully"
   - If missing, the background function wasn't called

2. Check `extract-rubric-background` logs:
   - Look for "FUNCTION STARTED" marker
   - If missing, the function never executed
   - If present, check for "Calling Gemini API..." and duration

**Possible Causes:**
- Background function not triggered (fetch failed)
- Gemini API timeout (>5 minutes)
- Function crashed before updating job status
- Netlify function timeout (10 minutes max)

**Solutions:**
- Check Netlify function logs for errors
- Verify Gemini API key is valid
- Check if PDF is too large or complex
- Consider splitting into smaller chunks

### Issue 2: "Failed to create background job"

**Symptoms:**
- Error immediately when clicking "Extract Rubric"
- Error message includes "Netlify Blobs is not configured"

**Diagnosis:**
Check environment variables in Netlify dashboard:
- `NETLIFY_SITE_ID` - Must be set
- `NETLIFY_AUTH_TOKEN` - Must be set

**Solution:**
See `NETLIFY-BLOBS-SETUP.md` for configuration instructions.

### Issue 3: Background function never starts

**Symptoms:**
- Trigger logs show "Background function triggered successfully"
- But background function logs are empty
- Job stays in 'pending' status forever

**Possible Causes:**
- Background function deployment failed
- Function name mismatch
- Network issue between Netlify functions

**Diagnosis:**
1. Check if function exists:
   - Go to: https://app.netlify.com/sites/ai-essaygrader/functions
   - Look for `extract-rubric-background`

2. Check function endpoint:
   - Trigger logs show the URL being called
   - Verify it matches the deployed function

**Solution:**
- Redeploy the site
- Check for deployment errors
- Verify all functions deployed successfully

### Issue 4: Gemini API taking too long

**Symptoms:**
- Logs show "Calling Gemini API..."
- But no "Gemini API responded" log
- Function times out after 10 minutes

**Diagnosis:**
Check the logs for:
- PDF size (should be logged)
- Model being used
- Any Gemini API errors

**Possible Causes:**
- PDF too large (>10MB)
- Complex document with many images
- Gemini API rate limiting
- Network issues

**Solutions:**
1. **Reduce PDF size:**
   - Compress images
   - Remove unnecessary pages
   - Convert to lower resolution

2. **Try different model:**
   - Switch from `gemini-2.0-flash-exp` to `gemini-1.5-flash`
   - Faster but potentially less accurate

3. **Split document:**
   - Extract rubric pages only
   - Process in smaller chunks

## Log Examples

### Successful Extraction
```
[extract-rubric-trigger] Creating job...
[rubric-jobs] Using explicit Netlify credentials
[rubric-jobs] Created extract job: job_1764520973084_f31cfej3bq
[extract-rubric-trigger] Created job job_1764520973084_f31cfej3bq for file: rubric.pdf
[extract-rubric-trigger] Triggering background function at: https://...
[extract-rubric-trigger] Background function triggered successfully for job job_1764520973084_f31cfej3bq

[extract-rubric-background] ========== FUNCTION STARTED ==========
[extract-rubric-background] Timestamp: 2025-11-30T18:22:53.084Z
[extract-rubric-background] Request params: { jobId: 'job_1764520973084_f31cfej3bq', fileName: 'rubric.pdf', fileType: 'application/pdf', fileSize: '245KB' }
[extract-rubric-background] Updating job job_1764520973084_f31cfej3bq to 'processing'...
[extract-rubric-background] Job job_1764520973084_f31cfej3bq status updated to 'processing'
[extract-rubric-background] Preparing Gemini request...
[extract-rubric-background] Model: gemini-2.0-flash-exp
[extract-rubric-background] PDF size: 245KB
[extract-rubric-background] Calling Gemini API...
[extract-rubric-background] Gemini API responded in 45230ms
[extract-rubric-background] Response length: 3456 chars
[extract-rubric-background] ✅ Job job_1764520973084_f31cfej3bq completed in 46120ms
[extract-rubric-background] Extracted 4 categories
[extract-rubric-background] Total points: 100
[extract-rubric-background] Updating job job_1764520973084_f31cfej3bq to 'completed'...
[extract-rubric-background] Job job_1764520973084_f31cfej3bq marked as completed
[extract-rubric-background] ========== FUNCTION COMPLETED ==========
```

### Failed Extraction
```
[extract-rubric-background] ========== FUNCTION STARTED ==========
[extract-rubric-background] Calling Gemini API...
[extract-rubric-background] ========== ERROR OCCURRED ==========
[extract-rubric-background] Error type: GoogleGenerativeAIError
[extract-rubric-background] Error message: Request timeout
[extract-rubric-background] Error stack: ...
```

## Performance Benchmarks

Based on production logs:

| PDF Size | Complexity | Avg Time | Max Time |
|----------|-----------|----------|----------|
| < 100KB  | Simple    | 15-30s   | 45s      |
| 100-500KB| Medium    | 30-60s   | 90s      |
| 500KB-1MB| Complex   | 60-120s  | 180s     |
| > 1MB    | Very Complex | 120-240s | 300s+ |

**Note:** Times can vary significantly based on:
- Document complexity (images, tables, formatting)
- Gemini API load
- Network conditions

## Need More Help?

If you're still experiencing issues:

1. **Check all logs** in sequence:
   - Trigger → Background → Status

2. **Note the exact error message** and when it occurs

3. **Check timing**:
   - How long until error?
   - Does it happen immediately or after delay?

4. **Try with different file**:
   - Does a simple 1-page PDF work?
   - Is it specific to certain documents?

5. **Check environment**:
   - Are all environment variables set?
   - Is Netlify Blobs working? (check Blobs dashboard)

## Related Documents
- `NETLIFY-BLOBS-SETUP.md` - Blob storage configuration
- `BACKGROUND-PROCESSING-FIX.md` - Original implementation notes

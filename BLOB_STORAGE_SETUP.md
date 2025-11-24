# Netlify Blobs Storage Setup Guide

## Overview

The AI-EssayGrader uses Netlify Blobs for file storage (essay files and source texts). This guide explains how to configure blob storage for both local development and production.

## Production (Automatic)

In production on Netlify, blob storage is **automatically configured** - no setup needed! Netlify provides the credentials automatically.

## Local Development Options

You have **two options** for local development:

### Option 1: Disable Blob Storage (Simplest)

**Best for:** UI development, testing non-file features

**Setup:**
1. In your `.env` file, keep blob storage disabled:
   ```bash
   ALLOW_BLOB_STORAGE=false
   ```

**Result:**
- File upload UI will work
- Upload attempts will show a friendly error message
- No files will be stored
- Database operations still work
- Perfect for testing UI/UX without file storage

**Error you'll see:**
```
File storage disabled
The environment has not been configured to use Netlify Blobs.
```

This is **expected and safe** - it just means files aren't being stored locally.

---

### Option 2: Enable Real Blob Storage (Full Testing)

**Best for:** Testing complete file upload/download workflows

**Setup Steps:**

#### 1. Get Netlify Credentials

Go to your Netlify dashboard:
1. Navigate to: **Site Settings → Site Details**
2. Copy your **Site ID** (looks like: `abc123-def456-ghi789`)
3. Go to: **User Settings → Applications → Personal Access Tokens**
4. Create a new token with "Read/Write" permissions
5. Copy the token (starts with `nfp_`)

#### 2. Add to `.env` File

```bash
# Enable blob storage
ALLOW_BLOB_STORAGE=true

# Add your Netlify credentials
NETLIFY_SITE_ID=your-site-id-here
NETLIFY_AUTH_TOKEN=nfp_your-token-here
```

#### 3. Restart Dev Server

```bash
# Stop your current server (Ctrl+C)
# Restart it
npm run dev
```

**Result:**
- Full file upload/download functionality
- Files stored in your production Netlify Blobs
- ⚠️ **Warning:** Files uploaded locally will appear in production!

---

## Which Option Should You Use?

| Scenario | Recommended Option |
|----------|-------------------|
| Building UI components | Option 1 (Disabled) |
| Testing form validation | Option 1 (Disabled) |
| Testing file upload flow | Option 2 (Enabled) |
| Testing file download | Option 2 (Enabled) |
| Testing grading with source texts | Option 2 (Enabled) |
| General development | Option 1 (Disabled) |

## Current Implementation

### Files Using Blob Storage

1. **`upload-file.ts`** - Essay file uploads (PDF, DOCX, images)
   - Store: `essay-files`
   - Check: `ALLOW_BLOB_STORAGE`

2. **`upload-source-text.ts`** - Source text uploads (PDF, DOCX, TXT)
   - Store: `source-texts`
   - Check: `ALLOW_BLOB_STORAGE`

3. **`get-blob-file.ts`** - Retrieve essay files
   - Store: `essay-files`

4. **`get-source-text.ts`** - Retrieve source texts
   - Store: `source-texts`

5. **`grade-bulletproof.ts`** - Fetches source text for grading context
   - Store: `source-texts`

### Error Handling

All functions gracefully handle missing credentials:
- Clear error messages
- HTTP 403 status
- Helpful instructions for setup

## Testing Checklist

### Without Blob Storage (Option 1)
- [ ] Assignment creation form works
- [ ] Source text selector displays
- [ ] Upload button shows error message
- [ ] Error message is user-friendly
- [ ] Can select "No source text"
- [ ] Assignment saves without source text

### With Blob Storage (Option 2)
- [ ] Can upload TXT files
- [ ] Can upload PDF files
- [ ] Can upload DOCX files
- [ ] File size validation works (10MB max)
- [ ] File type validation works
- [ ] Files appear in source text list
- [ ] Can download uploaded files
- [ ] Grading includes source text context
- [ ] Can delete source texts

## Troubleshooting

### Error: "File storage disabled"
**Cause:** `ALLOW_BLOB_STORAGE=false` or not set  
**Fix:** Set `ALLOW_BLOB_STORAGE=true` in `.env`

### Error: "The environment has not been configured to use Netlify Blobs"
**Cause:** Missing `NETLIFY_SITE_ID` or `NETLIFY_AUTH_TOKEN`  
**Fix:** Add credentials to `.env` (see Option 2 above)

### Error: "Invalid credentials"
**Cause:** Wrong Site ID or expired token  
**Fix:** 
1. Verify Site ID in Netlify dashboard
2. Generate new Personal Access Token
3. Update `.env` file

### Files not appearing after upload
**Check:**
1. Is `ALLOW_BLOB_STORAGE=true`?
2. Are credentials correct?
3. Check browser console for errors
4. Check Netlify function logs

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to Git
- Keep your Personal Access Token secret
- Tokens have full access to your Netlify account
- Rotate tokens regularly
- Use different tokens for dev/production if possible

## Production Deployment

When deploying to Netlify:
1. **Do NOT** set `ALLOW_BLOB_STORAGE` in Netlify UI
2. **Do NOT** set `NETLIFY_SITE_ID` or `NETLIFY_AUTH_TOKEN`
3. Netlify provides these automatically
4. Just deploy and it works! ✨

## Additional Resources

- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [Personal Access Tokens](https://docs.netlify.com/cli/get-started/#obtain-a-token-via-the-command-line)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

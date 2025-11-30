# Netlify Blobs Setup for Production

## Issue
Getting 500 error when trying to extract rubric in production. The error indicates Netlify Blobs is not configured.

## Solution

### Option 1: Netlify Blobs Should Auto-Enable (Recommended)
Netlify Blobs should be automatically available on all sites. If you're getting an error, try:

1. **Redeploy the site** - Sometimes a fresh deploy is needed
   - Go to: https://app.netlify.com/sites/ai-essaygrader/deploys
   - Click "Trigger deploy" → "Deploy site"

2. **Check Netlify CLI version** - Ensure your site was deployed with a recent Netlify CLI
   - Blobs support was added in Netlify CLI v12.0.0+

### Option 2: Manual Configuration (If Auto-Enable Fails)
If Netlify Blobs still doesn't work, you can manually add environment variables:

1. **Get your Site ID**:
   - Go to: https://app.netlify.com/sites/ai-essaygrader/configuration/general
   - Copy the "Site ID" (looks like: `abc123de-4567-89fg-hijk-lmnopqrstuv`)

2. **Create a Personal Access Token**:
   - Go to: https://app.netlify.com/user/applications
   - Scroll to "Personal access tokens"
   - Click "New access token"
   - Name it: "Production Blobs Access"
   - Copy the token (starts with `nfp_`)

3. **Add to Netlify Environment Variables**:
   - Go to: https://app.netlify.com/sites/ai-essaygrader/configuration/env
   - Add two new variables:
     ```
     NETLIFY_SITE_ID = <your-site-id>
     NETLIFY_AUTH_TOKEN = <your-personal-access-token>
     ```
   - Set scope: "All scopes"
   - Click "Save"

4. **Redeploy**:
   - Go to: https://app.netlify.com/sites/ai-essaygrader/deploys
   - Click "Trigger deploy" → "Clear cache and deploy site"

## Verification

After deploying, test the extract rubric feature:
1. Go to your production site
2. Create a new assignment
3. Upload a PDF rubric
4. Click "Extract Rubric"
5. Should work without 500 error

## Troubleshooting

If still getting errors, check the function logs:
1. Go to: https://app.netlify.com/sites/ai-essaygrader/logs/functions
2. Look for `extract-rubric-trigger` function
3. Check for error messages about Blobs configuration

## Alternative: Check Netlify Blobs Dashboard

Netlify Blobs has a dashboard where you can see your stores:
1. Go to: https://app.netlify.com/sites/ai-essaygrader/blobs
2. You should see a `rubric-jobs` store (or it will be created on first use)

## Notes

- Netlify Blobs is free for up to 100GB storage and 1M requests/month
- No additional configuration should be needed in most cases
- The `rubric-jobs` store will be created automatically on first job creation

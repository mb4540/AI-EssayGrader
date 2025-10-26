Review: Blob Storage Configuration for Localhost
Based on my review of your codebase, here's what you need to save documents to Netlify Blob storage while running on localhost:

Required Environment Variables
To use Netlify Blobs on localhost, you need two critical environment variables that are NOT currently in your 
.env.example
 file:

bash
NETLIFY_SITE_ID=your_site_id_here
NETLIFY_AUTH_TOKEN=your_auth_token_here
How to Get These Values:
NETLIFY_SITE_ID:
Find this in your Netlify dashboard
Go to Site Settings → General → Site details → Site ID
Or run netlify link in your project and it will show the site ID
NETLIFY_AUTH_TOKEN:
Go to Netlify User Settings → Applications → Personal access tokens
Create a new access token
Give it appropriate scopes (at minimum: read/write blobs)
Key Code Patterns Found
Your codebase has two patterns for blob storage:

Pattern 1: Simple Usage (Most Functions)
javascript
import { getStore } from "@netlify/blobs";

const store = getStore({ name: "uploads", consistency: "strong" });
await store.set(key, data);
Pattern 2: Localhost-Aware Usage (Admin Functions)
Found in 
admin-blobs.js
 (lines 31-41):

javascript
const storeConfig = { name: "uploads", consistency: "strong" };

// Add siteID and token for local development
if (process.env.NETLIFY_SITE_ID) {
  storeConfig.siteID = process.env.NETLIFY_SITE_ID;
}
if (process.env.NETLIFY_AUTH_TOKEN) {
  storeConfig.token = process.env.NETLIFY_AUTH_TOKEN;
}

const store = getStore(storeConfig);
The Problem
Most of your functions use Pattern 1 (simple usage), which works fine in production (Netlify auto-provides credentials) but fails on localhost because getStore() can't authenticate without explicit credentials.

Only 
admin-blobs.js
 uses Pattern 2 with conditional credential passing, which works on localhost.

Functions That Need Updating for Localhost
These functions use blob storage but don't include localhost credentials:

upload.js
 (line 34) - Main file upload
read-book.js
 (line 283) - Reading uploaded files
delete-document.js
 (line 133) - Deleting blobs
text-extract-background.js
 (lines 11, 107) - Text extraction
text-extract-upload.js
 (lines 28, 33) - Upload for extraction
ingest-background.js
 (line 40) - Document ingestion
generate-assessment-background-v2.js
 (line 14) - Assessment generation
generate-lesson-plan-background.js
 (line 9) - Lesson plan generation
generate-lesson-plan.js
 (line 31) - Lesson plan creation
admin-openai-test-background.js
 (line 12) - OpenAI testing
tenant-preferences.js
 (lines 16, 33) - Tenant preferences
Recommended Actions
1. Update 
.env.example
Add these two variables:

bash
# Netlify Blob Storage (required for localhost development)
NETLIFY_SITE_ID=your_site_id
NETLIFY_AUTH_TOKEN=your_auth_token
2. Create a Reusable Utility
Create apps/backend/utils/blobs.js:

javascript
import { getStore } from "@netlify/blobs";

/**
 * Gets a Netlify Blob store with automatic localhost credential injection
 * @param {string} name - Store name (e.g., "uploads", "outputs")
 * @param {string} consistency - "strong" or "eventual"
 * @returns {object} Netlify Blob store instance
 */
export function getBlobStore(name, consistency = "strong") {
  const config = { name, consistency };
  
  // Add credentials for localhost development
  if (process.env.NETLIFY_SITE_ID) {
    config.siteID = process.env.NETLIFY_SITE_ID;
  }
  if (process.env.NETLIFY_AUTH_TOKEN) {
    config.token = process.env.NETLIFY_AUTH_TOKEN;
  }
  
  return getStore(config);
}
3. Update All Functions
Replace:

javascript
const store = getStore({ name: "uploads", consistency: "strong" });
With:

javascript
import { getBlobStore } from "../utils/blobs.js";
const store = getBlobStore("uploads");
Alternative: Quick Fix for Testing
If you just want to test one function, add these lines before getStore():

javascript
const storeConfig = { name: "uploads", consistency: "strong" };
if (process.env.NETLIFY_SITE_ID) storeConfig.siteID = process.env.NETLIFY_SITE_ID;
if (process.env.NETLIFY_AUTH_TOKEN) storeConfig.token = process.env.NETLIFY_AUTH_TOKEN;
const store = getStore(storeConfig);
Summary
To save documents to blob storage on localhost:

✅ Add NETLIFY_SITE_ID to your 
.env
✅ Add NETLIFY_AUTH_TOKEN to your 
.env
✅ Update blob storage calls to include these credentials (either per-function or via utility)
Your production deployment will continue to work since Netlify auto-injects these in the cloud environment. The credentials are only needed for local development.

Feedback submitted



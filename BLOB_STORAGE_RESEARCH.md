# Netlify Blobs Storage Research

**Date:** November 14, 2025  
**Source:** gift-of-time-assistant project (REFERENCE ONLY)  
**Purpose:** Understand blob storage pattern for large rubrics in AI-EssayGrader

---

## 📚 Overview

Netlify Blobs is a key-value store for storing large files/data outside the database. The gift-of-time-assistant project uses it extensively for PDF uploads and document processing.

---

## 🔑 Key Concepts

### 1. Store Configuration
```javascript
import { getStore } from "@netlify/blobs";

const store = getStore({ 
  name: "uploads",           // Store name (like a bucket)
  consistency: "strong"      // Ensures immediate read-after-write
});
```

**Store Names:**
- `"uploads"` - For file uploads
- `"outputs"` - For job results/metadata
- Can create multiple stores for different purposes

**Consistency Levels:**
- `"strong"` - Guaranteed immediate consistency (recommended)
- `"eventual"` - Faster but may have slight delay

---

## 📤 Upload Pattern (from upload.js)

### Backend Function
```javascript
export default async (req) => {
  // 1. Get file from FormData
  const form = await req.formData();
  const file = form.get("file");
  const tenantId = form.get("tenantId");
  
  // 2. Generate unique key
  const key = `uploads/${tenantId}/${crypto.randomUUID()}-${file.name}`;
  
  // 3. Store in Netlify Blobs
  const store = getStore({ name: "uploads", consistency: "strong" });
  await store.set(key, file); // Accepts Blob/File/ArrayBuffer
  
  // 4. Return the key for later retrieval
  return new Response(JSON.stringify({ ok: true, blobKey: key }), {
    status: 202,
    headers: { "content-type": "application/json" }
  });
};
```

### Frontend Upload
```javascript
export async function uploadFile({ tenantId, file }) {
  const fd = new FormData();
  fd.append('tenantId', tenantId);
  fd.append('file', file);
  
  const r = await fetch('/.netlify/functions/upload', { 
    method: 'POST', 
    body: fd 
  });
  
  const result = await r.json();
  return result; // { ok: true, blobKey: "uploads/..." }
}
```

---

## 📥 Retrieval Pattern

### Get Blob as ArrayBuffer
```javascript
const store = getStore({ name: "uploads", consistency: "strong" });
const fileBuf = await store.get(blobKey, { type: "arrayBuffer" });

if (!fileBuf) {
  throw new Error("Blob not found");
}
```

### Get Blob as Blob Object
```javascript
const store = getStore({ name: "uploads", consistency: "strong" });
const fileBlob = await store.get(blobKey); // Returns Blob

if (!fileBlob) {
  throw new Error("Blob not found");
}
```

---

## 🗑️ Deletion Pattern

```javascript
const store = getStore({ name: "uploads", consistency: "strong" });
await store.delete(blobKey);
```

---

## 🔐 Key Naming Convention

**Pattern:** `{category}/{identifier}/{uuid}-{filename}`

**Examples:**
- `uploads/user123/abc-123-def-456-document.pdf`
- `uploads/text-extract/xyz-789-ghi-012-essay.docx`
- `jobs/text-extract/job-id-123.json`

**Benefits:**
- Organized by category
- Scoped to user/tenant
- Unique UUID prevents collisions
- Original filename preserved for debugging

---

## 📊 Metadata Storage Pattern

Store metadata in a separate blob (JSON):

```javascript
const jobs = getStore({ name: "outputs", consistency: "strong" });
const jobKey = `jobs/text-extract/${jobId}.json`;

await jobs.set(jobKey, JSON.stringify({
  id: jobId,
  status: "queued",
  createdAt: new Date().toISOString(),
  filename: "essay.pdf",
  blobKey: "uploads/..."
}), { 
  contentType: "application/json" 
});
```

---

## 🎯 Application to AI-EssayGrader

### Use Case: Large Rubrics (>5000 characters)

**Current Problem:**
- Large rubrics (7+ pages) stored in database `text` column
- Slow to save/retrieve
- May cause timeout issues

**Proposed Solution:**

### 1. Database Schema
```sql
ALTER TABLE grader.assignments
ADD COLUMN rubric_blob_key text;

-- rubric_blob_key stores the blob key if rubric is large
-- grading_criteria stores small rubrics or "[See blob]" for large ones
```

### 2. Upload Large Rubric (Backend)
```javascript
// netlify/functions/assignments.ts
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const { title, criteria, userId } = await req.json();
  
  let rubricBlobKey = null;
  let storedCriteria = criteria;
  
  // If rubric is large, store in blob
  if (criteria.length > 5000) {
    const key = `rubrics/${userId}/${crypto.randomUUID()}.txt`;
    const store = getStore({ name: "rubrics", consistency: "strong" });
    await store.set(key, criteria, { contentType: "text/plain" });
    
    rubricBlobKey = key;
    storedCriteria = "[Large rubric stored in blob]";
  }
  
  // Save to database
  await sql`
    INSERT INTO grader.assignments (title, grading_criteria, rubric_blob_key, user_id)
    VALUES (${title}, ${storedCriteria}, ${rubricBlobKey}, ${userId})
  `;
  
  return { ok: true };
};
```

### 3. Retrieve Rubric (Backend)
```javascript
// netlify/functions/get-assignment.ts
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const assignment = await sql`
    SELECT * FROM grader.assignments WHERE assignment_id = ${id}
  `;
  
  // If rubric is in blob, fetch it
  if (assignment.rubric_blob_key) {
    const store = getStore({ name: "rubrics", consistency: "strong" });
    const rubricText = await store.get(assignment.rubric_blob_key, { 
      type: "text" 
    });
    assignment.grading_criteria = rubricText;
  }
  
  return assignment;
};
```

### 4. Delete Assignment (Cleanup)
```javascript
// netlify/functions/delete-assignment.ts
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const assignment = await sql`
    SELECT rubric_blob_key FROM grader.assignments 
    WHERE assignment_id = ${id}
  `;
  
  // Delete blob if exists
  if (assignment.rubric_blob_key) {
    const store = getStore({ name: "rubrics", consistency: "strong" });
    await store.delete(assignment.rubric_blob_key);
  }
  
  // Delete from database
  await sql`DELETE FROM grader.assignments WHERE assignment_id = ${id}`;
  
  return { ok: true };
};
```

---

## 📋 Implementation Checklist for AI-EssayGrader

### Phase 1: Setup
- [ ] Install `@netlify/blobs` package (may already be installed)
- [ ] Add `rubric_blob_key` column to `assignments` table
- [ ] Decide threshold (recommend 5000 characters)

### Phase 2: Upload
- [ ] Modify `assignments.ts` to detect large rubrics
- [ ] Store large rubrics in blob with key pattern: `rubrics/{userId}/{uuid}.txt`
- [ ] Save blob key in database
- [ ] Keep small rubrics in database as-is

### Phase 3: Retrieval
- [ ] Modify `get-submission.ts` to check for `rubric_blob_key`
- [ ] Fetch from blob if key exists
- [ ] Return rubric text to frontend

### Phase 4: Deletion
- [ ] Modify delete assignment function to cleanup blob
- [ ] Prevent orphaned blobs

### Phase 5: Migration
- [ ] Create script to find existing large rubrics
- [ ] Move them to blob storage
- [ ] Update database records

---

## 🎯 Benefits

### For AI-EssayGrader:
1. **Faster Database Queries** - Large text not in every query
2. **No Timeout Issues** - Blob storage handles large files efficiently
3. **Better Performance** - Database stays lean
4. **Scalability** - Can handle rubrics of any size
5. **Cost Effective** - Blob storage cheaper than database storage

### Netlify Blobs Features:
- ✅ Automatic CDN distribution
- ✅ No size limits (within reason)
- ✅ Fast read/write
- ✅ Strong consistency option
- ✅ Simple API

---

## 💡 Recommendations

### When to Use Blob Storage:
- ✅ Rubrics > 5000 characters (~1.5 pages)
- ✅ File uploads (PDFs, DOCX, images)
- ✅ Large JSON data
- ✅ Generated reports

### When to Use Database:
- ✅ Rubrics < 5000 characters
- ✅ Structured data
- ✅ Data that needs to be queried/filtered
- ✅ Metadata

### Threshold Decision:
**Recommended:** 5000 characters
- Small rubrics: Fast, stay in database
- Medium rubrics (1-3 pages): Database is fine
- Large rubrics (7+ pages): Use blob storage
- Very large rubrics (10+ pages): Definitely use blob storage

---

## 🔗 References

**gift-of-time-assistant Files (REFERENCE ONLY):**
- `apps/backend/functions/upload.js` - Upload pattern
- `apps/backend/functions/ingest-background.js` - Retrieval pattern
- `apps/backend/functions/text-extract-upload.js` - Job metadata pattern
- `apps/frontend/src/lib/api/books.ts` - Frontend upload

**Netlify Blobs Documentation:**
- https://docs.netlify.com/blobs/overview/

---

## ⚠️ Important Notes

1. **Environment Variables:**
   - Netlify Blobs works automatically in Netlify Functions
   - No special configuration needed
   - Uses site's blob storage quota

2. **Consistency:**
   - Always use `consistency: "strong"` for critical data
   - Ensures immediate read-after-write

3. **Error Handling:**
   - Always check if blob exists before using
   - Handle missing blobs gracefully
   - Log errors for debugging

4. **Cleanup:**
   - Delete blobs when deleting assignments
   - Prevent orphaned blobs
   - Consider periodic cleanup script

---

## 🚀 Next Steps for Assignment Modal Fix

1. **Phase 1 (Required):** Add confirmation toast - 1-2 hours
2. **Phase 2 (Optional):** Implement blob storage - 2-3 hours
3. **Decision:** Test with current implementation first
4. **If timeouts persist:** Implement blob storage

**Start with Phase 1, evaluate if Phase 2 is needed based on user feedback.**

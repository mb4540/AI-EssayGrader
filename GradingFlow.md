# Grading Flow Documentation

## Overview
This document describes the complete flow that occurs when a user clicks the "Run Grade" button on the Grade Submissions page (Submission.tsx).

**Last Updated:** November 30, 2025

---

## High-Level Architecture

The grading system uses a **background processing pattern** to avoid Netlify's 30-second function timeout:

1. **Trigger Function** - Validates request, creates job, returns immediately
2. **Background Function** - Performs actual grading without time limits
3. **Status Polling** - Frontend polls for completion
4. **Database Storage** - Job tracking in `background_tasks` table

---

## Detailed Flow

### Phase 1: User Interaction (Frontend)

**File:** `src/pages/Submission.tsx`

1. User clicks **"Run Grade"** button in `GradePanel` component
2. Button calls `onRunGrade` handler from `useSubmissionActions` hook
3. Button is disabled if `canGrade` is false (missing student, criteria, or essay text)

**Validation Checks:**
- ✅ Student selected (`selectedStudentUuid`)
- ✅ Grading criteria provided (`criteria`)
- ✅ Essay text provided:
  - Single mode: `verbatimText` required
  - Comparison mode: `roughDraftText` AND `finalDraftText` required

---

### Phase 2: Ingestion (If New Submission)

**File:** `src/pages/Submission/hooks/useSubmissionActions.ts` (lines 190-254)

If `submissionId` doesn't exist yet, the system first ingests the submission:

#### 2.1 Call Ingest API
```typescript
const result = await ingestMutation.mutateAsync({
  student_id: selectedStudentUuid,  // FERPA: Only UUID sent to cloud
  assignment_id: assignmentId || undefined,
  teacher_criteria: criteria,
  source_type: sourceType,
  draft_mode: draftMode,
  verbatim_text: draftMode === 'single' ? verbatimText : undefined,
  rough_draft_text: draftMode === 'comparison' ? roughDraftText : undefined,
  final_draft_text: draftMode === 'comparison' ? finalDraftText : undefined,
});
```

**Backend:** `netlify/functions/ingest.ts`
- Creates record in `grader.submissions` table
- Returns `submission_id`

#### 2.2 Upload Supporting Files

**Image Upload (if `sourceType === 'image'`):**
- Calls `/.netlify/functions/upload-image`
- Stores image in Netlify Blobs (`submission-images` store)
- Updates `storedImageUrl` state

**Document Upload (if PDF/DOCX):**
- Calls `uploadFile()` from `src/lib/api.ts`
- Stores original file in Netlify Blobs (`submission-files` store)
- Updates `originalFileUrl` state
- Enables "Annotate" tab in UI

---

### Phase 3: Start Background Grading

**File:** `src/pages/Submission/hooks/useSubmissionActions.ts` (line 246-253)

```typescript
await gradeMutation.mutateAsync({
  submission_id: result.submission_id,
});
```

#### 3.1 Frontend API Call

**File:** `src/lib/api.ts` (lines 121-151)

```typescript
export async function gradeSubmission(data: GradeRequest): Promise<Feedback> {
  // 1. Start the background job
  const { task_id } = await startGradingJob(data);
  
  // 2. Poll for completion (60 attempts × 2 seconds = 2 minutes max)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await checkGradingStatus(task_id);
    
    if (status.status === 'completed') {
      // Fetch updated submission with feedback
      const submission = await getSubmission(data.submission_id);
      return submission.ai_feedback;
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error || 'Grading failed');
    }
  }
  
  throw new Error('Grading timeout - job is still processing');
}
```

#### 3.2 Start Grading Job

**File:** `src/lib/api.ts` (lines 67-91)

```typescript
export async function startGradingJob(data: GradeRequest) {
  const customPrompts = getCustomPrompts();
  const llmProvider = localStorage.getItem('ai_provider') || 'gemini';
  const llmModel = llmProvider === 'gemini' ? 'gemini-2.5-pro' : 'gpt-4o';
  
  const response = await fetch('/.netlify/functions/grade-bulletproof-trigger', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      ...customPrompts,
      llmProvider,
      llmModel
    }),
  });
  
  return { task_id, status, message };
}
```

---

### Phase 4: Trigger Function

**File:** `netlify/functions/grade-bulletproof-trigger.ts`

#### 4.1 Authentication
- Extracts JWT token from `Authorization` header
- Validates token and extracts `tenant_id`
- Returns 401 if invalid/expired

#### 4.2 Validation
- Validates request body using `GradeRequestSchema` (Zod)
- Checks for required `submission_id`

#### 4.3 Generate Job ID
```typescript
const jobId = uuidv4();
console.log(`📝 Starting grading job: ${jobId} for submission: ${submission_id}`);
```

#### 4.4 Trigger Background Function
```typescript
// Build background URL using Netlify environment variables
const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';
const backgroundUrl = new URL('/.netlify/functions/grade-bulletproof-background', base);

// Fire-and-forget with 6-second timeout
const ac = new AbortController();
const timeout = setTimeout(() => ac.abort(), 6000);

const backgroundResponse = await fetch(backgroundUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobId,
    tenant_id,
    submission_id,
    grading_prompt,
    llmProvider,
    llmModel,
  }),
  signal: ac.signal
});
```

#### 4.5 Return Immediately
```typescript
return {
  statusCode: 202,  // Accepted
  body: JSON.stringify({
    ok: true,
    task_id: jobId,
    status: 'processing',
    message: 'Grading started in background'
  }),
};
```

**Key Point:** Trigger returns immediately (< 1 second), doesn't wait for grading to complete.

---

### Phase 5: Background Grading Function

**File:** `netlify/functions/grade-bulletproof-background.ts`

This function runs without time limits and performs the actual grading.

#### 5.1 Create Job Record
```sql
INSERT INTO grader.background_tasks (
  task_id, tenant_id, task_type, status, input_data, created_at, updated_at
) VALUES (
  ${jobId}, ${tenant_id}, 'grading', 'processing', ${JSON.stringify(body)}, NOW(), NOW()
)
ON CONFLICT (task_id) DO UPDATE 
SET status='processing', updated_at=NOW(), input_data=${JSON.stringify(body)}
```

#### 5.2 Fetch Submission Data
```sql
SELECT 
  s.submission_id, 
  s.verbatim_text, 
  s.rough_draft_text, 
  s.final_draft_text, 
  s.draft_mode, 
  s.teacher_criteria,
  s.assignment_id,
  a.rubric_json,
  a.scale_mode,
  a.total_points,
  a.rounding_mode,
  a.rounding_decimals,
  a.document_type,
  st.source_text_id,
  st.title AS source_text_title,
  st.writing_prompt AS source_text_prompt,
  st.blob_key AS source_text_blob_key
FROM grader.submissions s
LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
LEFT JOIN grader.source_texts st ON a.source_text_id = st.source_text_id
JOIN grader.students stud ON s.student_id = stud.student_id
WHERE s.submission_id = ${submission_id}
AND stud.tenant_id = ${tenant_id}
```

#### 5.3 Get or Create Rubric

**Option A: Use Assignment Rubric**
- If `rubric_json` exists and is valid, use it
- Apply scale settings from assignment

**Option B: Parse Teacher Criteria**
- Use `parseTeacherRubric()` to convert text criteria into structured rubric
- Validates parsed rubric
- Falls back to default rubric if parsing fails

**Option C: Default Rubric**
- Uses `createDefaultRubric()` if no criteria provided
- Throws error if no criteria at all

#### 5.4 Fetch Source Text (if applicable)

If assignment has a source text (book report, article analysis):
```typescript
if (source_text_blob_key) {
  const sourceTextStore = getStore('source-texts');
  const sourceTextContent = await sourceTextStore.get(source_text_blob_key, { type: 'text' });
  
  sourceTextContext = {
    title: source_text_title,
    writing_prompt: source_text_prompt,
    full_text: sourceTextContent
  };
}
```

#### 5.5 Initialize LLM Provider
```typescript
const providerName = llmProvider || 'gemini';
const apiKey = providerName === 'gemini' 
  ? process.env.GEMINI_API_KEY 
  : process.env.OPENAI_API_KEY;

const provider = getLLMProvider(providerName, apiKey, llmModel);
console.log(`Using LLM Provider: ${providerName} (${llmModel || 'default'})`);
```

#### 5.6 Build Extractor Prompt

**Single Draft Mode:**
```typescript
const extractorPrompt = buildExtractorPrompt(
  rubric,
  verbatimText,
  submission_id,
  grading_prompt,
  document_type,
  sourceTextContext  // Optional: book/article context
);
```

**Comparison Mode:**
```typescript
const extractorPrompt = buildComparisonExtractorPrompt(
  rubric,
  rough_draft_text,
  final_draft_text,
  submission_id,
  grading_prompt,
  document_type,
  sourceTextContext  // Optional: book/article context
);
```

**Prompt includes:**
- Rubric with criteria, levels, and point values
- Essay text
- Custom grading instructions (if any)
- Document type (narrative, argumentative, etc.)
- Source text context (if book report)

#### 5.7 Call LLM for Grading
```typescript
console.log('Calling LLM for grading...');
const response = await provider.generate({
  systemMessage: EXTRACTOR_SYSTEM_MESSAGE,
  userMessage: extractorPrompt,
  jsonMode: true,
  temperature: 0.2,  // Low temperature for consistent grading
});

const content = response.content;
const extractedJSON: ExtractedScoresJSON = JSON.parse(content);
```

**LLM Returns:**
```json
{
  "scores": [
    {
      "criterion_id": "org",
      "points_awarded": "8.5",
      "rationale": "Strong organization with clear transitions..."
    },
    ...
  ],
  "notes": "Overall strong essay with excellent evidence...",
  "feedback": {
    "inline_annotations": [
      {
        "quote": "The author argues that...",
        "category": "evidence",
        "suggestion": "Consider adding a counterargument here",
        "severity": "medium"
      },
      ...
    ]
  }
}
```

#### 5.8 Process Inline Annotations (Pass 1)

**Normalization:**
- Matches AI's quoted text to actual essay text
- Calculates line numbers and character offsets
- Handles fuzzy matching for slight variations

**Database Insert:**
```sql
INSERT INTO grader.annotations (
  submission_id,
  line_number,
  start_offset,
  end_offset,
  quote,
  category,
  suggestion,
  severity,
  status,
  criterion_id,
  ai_payload
) VALUES (...)
```

**Stats Tracking:**
- `saved`: Successfully matched and saved
- `unresolved`: Could not match to essay text

#### 5.9 Generate Criterion-Specific Annotations (Pass 2)

**Purpose:** Get targeted feedback for each rubric criterion

```typescript
const criteriaPrompt = buildCriteriaAnnotationsPrompt(
  rubric,
  essayText,
  extractedJSON.scores,
  submission_id
);

const criteriaResponse = await provider.generate({
  systemMessage: 'You are a detailed evaluator providing specific, actionable feedback for each rubric criterion.',
  userMessage: criteriaPrompt,
  jsonMode: true,
  temperature: 0.4,  // Slightly higher for more natural feedback
});
```

**Result:** Additional annotations tied to specific rubric criteria

#### 5.10 Compute Final Scores

**BulletProof Calculator:**
```typescript
const extracted = extractedScoresFromJSON(extractedJSON);
const computed = computeScores(rubricObj, extracted);
```

**Calculations:**
- Converts points to percentages
- Applies scale mode (points, percentage, letter grade)
- Applies rounding rules (HALF_UP, HALF_EVEN, HALF_DOWN)
- Handles weighted criteria

**Output:**
```typescript
{
  points: "85.5",
  percent: "85.50",
  letter: "B",
  gpa: "3.0"
}
```

#### 5.11 Create Legacy Feedback Format
```typescript
const legacyFeedback = {
  overall_grade: parseFloat(computed.percent),
  rubric_scores: extracted.scores.map(s => ({
    category: s.criterion_id,
    score: parseFloat(s.points_awarded.toString()),
    comments: s.rationale,
  })),
  grammar_findings: [],
  spelling_findings: [],
  structure_findings: [],
  evidence_findings: [],
  top_3_suggestions: [],
  supportive_summary: extracted.notes || 'Graded using bulletproof calculator',
  computed_scores: computed,
  calculator_version: CALCULATOR_VERSION,
  bulletproof: {
    rubric: rubric,
    extracted_scores: extractedJSON,
    computed_scores: computed,
    calculator_version: CALCULATOR_VERSION,
  },
};
```

#### 5.12 Update Submission Record
```sql
UPDATE grader.submissions 
SET 
  ai_grade = ${legacyGrade},
  ai_feedback = ${JSON.stringify(legacyFeedback)},
  extracted_scores = ${JSON.stringify(extractedJSON)},
  computed_scores = ${JSON.stringify(computed)},
  calculator_version = ${CALCULATOR_VERSION}
WHERE submission_id = ${submission_id}
```

#### 5.13 Create Version Snapshot
```sql
INSERT INTO grader.submission_versions (
  submission_id,
  ai_grade,
  ai_feedback,
  draft_mode,
  rough_draft_text,
  final_draft_text
) VALUES (...)
```

**Purpose:** Audit trail of all grading attempts

#### 5.14 Mark Job Complete
```sql
UPDATE grader.background_tasks
SET 
  status='completed', 
  output_data=${JSON.stringify({
    submission_id,
    ai_grade: legacyGrade,
    annotation_stats: annotationStats,
    computed_scores: computed,
  })}, 
  updated_at=NOW(), 
  completed_at=NOW()
WHERE task_id=${jobId}
```

---

### Phase 6: Status Polling (Frontend)

**File:** `src/lib/api.ts` (lines 126-150)

While background function runs, frontend polls for status:

```typescript
const maxAttempts = 60;  // 60 attempts
const pollInterval = 2000;  // 2 seconds = 2 minutes max

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await new Promise(resolve => setTimeout(resolve, pollInterval));
  
  const status = await checkGradingStatus(task_id);
  
  if (status.status === 'completed') {
    // Success! Fetch full submission data
    const submission = await getSubmission(data.submission_id);
    return submission.ai_feedback;
  }
  
  if (status.status === 'failed') {
    throw new Error(status.error || 'Grading failed');
  }
  
  // Continue polling if 'pending' or 'processing'
}

throw new Error('Grading timeout - job is still processing');
```

**Status Check API:**
```typescript
GET /.netlify/functions/grade-bulletproof-status?jobId=${taskId}
```

**Returns:**
```json
{
  "ok": true,
  "id": "job-uuid",
  "status": "completed",
  "updatedAt": "2025-11-30T18:45:00Z",
  "completedAt": "2025-11-30T18:45:00Z",
  "result": {
    "submission_id": "sub-uuid",
    "ai_grade": 85.5,
    "annotation_stats": { "saved": 12, "unresolved": 2 },
    "computed_scores": { ... }
  }
}
```

---

### Phase 7: Update UI with Results

**File:** `src/pages/Submission/hooks/useSubmissionActions.ts` (lines 50-108)

When grading completes, `gradeMutation.onSuccess` fires:

#### 7.1 Set AI Feedback
```typescript
setAiFeedback(data);  // Updates GradePanel with scores and feedback
```

#### 7.2 Fetch Annotations (with retries)

**Immediate Fetch (1 second delay):**
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
const annotationsData = await getInlineAnnotations(submissionId);
setAnnotations([...annotationsData.annotations]);
```

**Retry Fetch (2 seconds later):**
```typescript
setTimeout(async () => {
  const retryData = await getInlineAnnotations(submissionId);
  if (retryAnnotations.length > newAnnotations.length) {
    console.log(`✓ Retry found ${retryAnnotations.length - newAnnotations.length} more annotations`);
    setAnnotations([...retryAnnotations]);
  }
}, 2000);
```

**Pass 2 Fetch (5 seconds later):**
```typescript
setTimeout(async () => {
  const pass2Data = await getInlineAnnotations(submissionId);
  if (pass2Annotations.length > currentCount) {
    console.log(`✓ Pass 2 fetch found ${pass2Annotations.length - currentCount} more annotations`);
    setAnnotations([...pass2Annotations]);
    setAnnotationsRefreshKey(prev => prev + 1);  // Trigger VerbatimViewer refresh
  }
}, 5000);
```

**Why Multiple Fetches?**
- Background function saves annotations asynchronously
- Pass 2 criterion-specific annotations complete ~5 seconds after main grading
- Multiple fetches ensure UI shows all annotations

#### 7.3 Invalidate Query Cache
```typescript
queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
```

**Effect:** Triggers refetch of submission data, ensuring all components have latest data

---

### Phase 8: Display Results

**File:** `src/components/GradePanel.tsx`

#### 8.1 Overall Grade Display
```tsx
<div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600">
  {aiFeedback.overall_grade}
</div>
<span className="text-2xl text-gray-400">/100</span>
```

#### 8.2 BulletProof Breakdown
```tsx
{aiFeedback.bulletproof?.extracted_scores && (
  <div>
    {extractedScores.scores.map((score, idx) => {
      const criterion = rubric.criteria.find(c => c.id === score.criterion_id);
      return (
        <div key={idx}>
          <span>{criterion.name}</span>
          <span>{score.points_awarded} / {criterion.max_points}</span>
          <span>{score.rationale}</span>
        </div>
      );
    })}
  </div>
)}
```

#### 8.3 Annotations Display

**In VerbatimViewer:**
- Highlights annotated text with colored underlines
- Shows annotation suggestions on hover/click

**In AnnotationViewer (PDF/DOCX only):**
- Side-by-side view of original document and annotations
- Grouped by category (grammar, evidence, structure, etc.)

---

## Database Schema

### background_tasks Table
```sql
CREATE TABLE grader.background_tasks (
  task_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES grader.tenants(tenant_id),
  task_type text NOT NULL,  -- 'grading', 'assessment_generation', etc.
  status text NOT NULL,  -- 'pending', 'processing', 'completed', 'failed'
  input_data jsonb,  -- Original request parameters
  output_data jsonb,  -- Result data when completed
  error_message text,  -- Error details if failed
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);
```

**Indexes:**
- `idx_background_tasks_tenant` - (tenant_id)
- `idx_background_tasks_status` - (status)
- `idx_background_tasks_type` - (task_type)
- `idx_background_tasks_created` - (created_at DESC)
- `idx_background_tasks_tenant_status` - (tenant_id, status)

### submissions Table (Relevant Columns)
```sql
CREATE TABLE grader.submissions (
  submission_id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  assignment_id uuid,
  verbatim_text text,
  rough_draft_text text,
  final_draft_text text,
  draft_mode text,
  teacher_criteria text,
  ai_grade numeric(5,2),
  ai_feedback jsonb,
  extracted_scores jsonb,  -- Raw LLM output
  computed_scores jsonb,  -- Calculator output
  calculator_version text,
  teacher_grade numeric(5,2),
  teacher_feedback text,
  created_at timestamptz,
  updated_at timestamptz
);
```

### annotations Table
```sql
CREATE TABLE grader.annotations (
  annotation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES grader.submissions(submission_id),
  line_number integer NOT NULL,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  quote text NOT NULL,
  category text NOT NULL,  -- 'grammar', 'evidence', 'structure', etc.
  suggestion text NOT NULL,
  severity text,  -- 'low', 'medium', 'high'
  status text DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  criterion_id text,  -- Links to rubric criterion
  ai_payload jsonb,  -- Original AI response
  created_at timestamptz DEFAULT NOW()
);
```

---

## Error Handling

### Frontend Errors
- **Validation Errors:** Alert user before API call
- **Network Errors:** Caught by React Query, shows error message
- **Timeout Errors:** After 2 minutes, shows "Grading timeout" error
- **Authentication Errors:** Redirects to login page

### Backend Errors
- **Database Errors:** Logged, job marked as 'failed'
- **LLM Errors:** Logged, job marked as 'failed' with error message
- **Parsing Errors:** Falls back to default rubric
- **Annotation Errors:** Logged but doesn't fail grading

### Job Status Tracking
```sql
-- Failed job example
UPDATE grader.background_tasks
SET 
  status='failed', 
  error_message='OpenAI API key not configured', 
  updated_at=NOW()
WHERE task_id=${jobId}
```

---

## Performance Characteristics

### Typical Timing
- **Trigger Function:** < 1 second
- **Background Grading:** 15-45 seconds (depends on essay length and LLM)
- **Pass 2 Annotations:** Additional 5-10 seconds
- **Total User Wait:** 20-55 seconds

### Timeout Limits
- **Trigger Function:** 10 seconds (Netlify limit)
- **Background Function:** 10 minutes (Netlify limit)
- **Frontend Polling:** 2 minutes (configurable)

### Scalability
- Background processing allows concurrent grading jobs
- Each job is isolated (no shared state)
- Database handles job queue automatically

---

## Key Design Decisions

### Why Background Processing?
- **Netlify Timeout:** Functions have 10-second limit (30s for Pro)
- **LLM Latency:** Grading can take 30-60 seconds
- **User Experience:** Immediate feedback that job started

### Why Polling Instead of Webhooks?
- **Simplicity:** No webhook endpoint setup required
- **Reliability:** Works in all environments (local, staging, prod)
- **Debugging:** Easy to see status in database

### Why Two-Pass Annotation System?
- **Pass 1:** General annotations from main grading prompt
- **Pass 2:** Criterion-specific annotations for detailed feedback
- **Result:** More comprehensive and actionable feedback

### Why Multiple Annotation Fetches?
- **Async Saves:** Annotations saved while background function continues
- **Pass 2 Delay:** Criterion annotations complete after main grading
- **User Experience:** Annotations appear progressively, not all at once

---

## Related Files

### Frontend
- `src/pages/Submission.tsx` - Main page component
- `src/pages/Submission/hooks/useSubmissionState.ts` - State management
- `src/pages/Submission/hooks/useSubmissionActions.ts` - Action handlers
- `src/components/GradePanel.tsx` - Grade display component
- `src/lib/api.ts` - API client functions
- `src/lib/schema.ts` - TypeScript types and Zod schemas

### Backend
- `netlify/functions/grade-bulletproof-trigger.ts` - Trigger function
- `netlify/functions/grade-bulletproof-background.ts` - Background grading
- `netlify/functions/grade-bulletproof-status.ts` - Status check
- `netlify/functions/ingest.ts` - Submission creation
- `netlify/functions/lib/llm/factory.ts` - LLM provider abstraction
- `netlify/functions/lib/auth.ts` - JWT authentication

### Utilities
- `src/lib/calculator/calculator.ts` - Score computation
- `src/lib/calculator/rubricParser.ts` - Text-to-rubric parsing
- `src/lib/calculator/rubricBuilder.ts` - Default rubric creation
- `src/lib/prompts/extractor.ts` - LLM prompt templates
- `src/lib/annotations/normalizer.ts` - Annotation text matching

### Database
- `migrations/add_background_tasks.sql` - Background tasks table
- `db_ref.md` - Complete schema documentation

---

## Troubleshooting

### "Grading timeout - job is still processing"
- Check `background_tasks` table for job status
- Look at background function logs in Netlify
- Verify LLM API keys are configured
- Check if essay is extremely long (>10,000 words)

### "No response from OpenAI/Gemini"
- Verify API key in Netlify environment variables
- Check API rate limits
- Look for network errors in logs

### Annotations not appearing
- Check annotation fetch timing (may need to wait 5+ seconds)
- Verify `getInlineAnnotations` API is working
- Check browser console for errors
- Look at `annotations` table in database

### Grade seems incorrect
- Check rubric configuration in assignment
- Verify scale mode (points vs percentage)
- Check rounding settings
- Review `extracted_scores` and `computed_scores` in database

---

## Future Enhancements

### Potential Improvements
- [ ] Real-time progress updates (WebSockets)
- [ ] Batch grading (multiple submissions at once)
- [ ] Grading history comparison
- [ ] Custom annotation categories
- [ ] Teacher annotation override/editing
- [ ] Export annotations to PDF
- [ ] Annotation analytics (common issues across class)

---

## Changelog

**November 30, 2025**
- Initial documentation created
- Documented complete grading flow from button click to UI update
- Included database schema, error handling, and performance characteristics

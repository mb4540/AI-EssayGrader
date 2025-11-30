# Update Grading: Assignment Prompt Feature

## Overview
Add an "Assignment Prompt" field that contains instructions given to students. This is NOT an LLM prompt, but rather the assignment instructions/requirements that students must follow. This prompt becomes part of the rubric context when grading.

**Created:** November 30, 2025

---

## Feature Requirements

### What is an Assignment Prompt?
- **Student-facing instructions** for the assignment
- **General requirements** the essay must comply with
- **Not a grading criterion** but contextual information for evaluation
- Examples:
  - "Write a 5-paragraph persuasive essay arguing for or against school uniforms"
  - "Analyze the theme of courage in To Kill a Mockingbird using at least 3 textual examples"
  - "Compare and contrast the causes of WWI and WWII in 3-4 pages"

### Where It Should Appear

#### 1. New Assignment Modal
- **Location:** `src/components/CreateAssignmentModal.tsx`
- **Field:** Textarea input labeled "Assignment Prompt" or "Student Instructions"
- **Position:** Between "Description" and "Grading Criteria"
- **Behavior:**
  - Optional field (can be blank)
  - Multi-line textarea (similar to Description)
  - Saved to `assignments` table

#### 2. Grade Submissions Page
- **Location:** `src/pages/Submission.tsx` → `CriteriaInput` component
- **Field:** Editable textarea for assignment prompt
- **Position:** Above or within the grading criteria section
- **Behavior:**
  - Editable for ad-hoc assignments (no assignment_id)
  - Read-only or editable for saved assignments (TBD)
  - Passed to grading function

---

## Implementation Plan

### Phase 1: Database Schema

**File:** `migrations/add_assignment_prompt.sql`

```sql
-- Add assignment_prompt column to assignments table
ALTER TABLE grader.assignments 
ADD COLUMN assignment_prompt text;

COMMENT ON COLUMN grader.assignments.assignment_prompt 
IS 'Student-facing instructions and requirements for the assignment';
```

**Update:** `db_ref.md` with new column documentation

---

### Phase 2: Backend Updates

#### 2.1 Update Assignment Creation
**File:** `netlify/functions/create-assignment.ts`

Add `assignment_prompt` to request validation and INSERT statement:
```typescript
const AssignmentSchema = z.object({
  // ... existing fields
  assignment_prompt: z.string().optional(),
});

// In INSERT
assignment_prompt: ${assignment_prompt || null}
```

#### 2.2 Update Assignment Retrieval
**File:** `netlify/functions/get-assignment.ts`

Include `assignment_prompt` in SELECT:
```sql
SELECT 
  assignment_id,
  title,
  description,
  assignment_prompt,  -- NEW
  teacher_criteria,
  ...
```

#### 2.3 Update Grading Functions

**Files to modify:**
- `netlify/functions/grade-bulletproof-background.ts`
- `src/lib/prompts/extractor.ts`

**Changes:**
1. Fetch `assignment_prompt` from assignment or submission
2. Pass to prompt builder functions
3. Include in LLM context

**Example in `buildExtractorPrompt()`:**
```typescript
export function buildExtractorPrompt(
  rubric: RubricJSON,
  essayText: string,
  submissionId: string,
  customGradingPrompt?: string,
  documentType?: string,
  sourceTextContext?: SourceTextContext,
  assignmentPrompt?: string  // NEW
): string {
  let prompt = `# GRADING TASK\n\n`;
  
  // Add assignment prompt if provided
  if (assignmentPrompt) {
    prompt += `## ASSIGNMENT INSTRUCTIONS\n`;
    prompt += `The student was given the following instructions:\n\n`;
    prompt += `"${assignmentPrompt}"\n\n`;
    prompt += `Evaluate whether the student followed these instructions.\n\n`;
  }
  
  // ... rest of prompt
}
```

---

### Phase 3: Frontend Updates

#### 3.1 Update TypeScript Types
**File:** `src/lib/schema.ts`

```typescript
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_prompt?: string;  // NEW
  teacher_criteria: string;
  total_points: number;
  // ... other fields
}

export const AssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignment_prompt: z.string().optional(),  // NEW
  teacher_criteria: z.string().min(1),
  // ... other fields
});
```

#### 3.2 Update CreateAssignmentModal
**File:** `src/components/CreateAssignmentModal.tsx`

**Add state:**
```typescript
const [assignmentPrompt, setAssignmentPrompt] = useState('');
```

**Add UI field (after Description, before Grading Criteria):**
```tsx
<div className="space-y-2">
  <Label htmlFor="assignment-prompt">
    Assignment Prompt
    <span className="text-gray-500 text-sm ml-2">(optional)</span>
  </Label>
  <Textarea
    id="assignment-prompt"
    value={assignmentPrompt}
    onChange={(e) => setAssignmentPrompt(e.target.value)}
    placeholder="Enter the instructions given to students for this assignment..."
    className="min-h-[100px]"
  />
  <p className="text-sm text-gray-500">
    Student-facing instructions (e.g., "Write a 5-paragraph essay arguing for or against...")
  </p>
</div>
```

**Update handleSubmit:**
```typescript
const handleSubmit = async () => {
  // ... validation
  
  const assignmentData = {
    title,
    description,
    assignment_prompt: assignmentPrompt,  // NEW
    teacher_criteria: criteria,
    // ... other fields
  };
  
  // ... API call
};
```

#### 3.3 Update CriteriaInput Component
**File:** `src/components/CriteriaInput.tsx`

**Add props:**
```typescript
interface CriteriaInputProps {
  value: string;
  onChange: (value: string) => void;
  totalPoints: number;
  onTotalPointsChange: (points: number) => void;
  assignmentPrompt?: string;  // NEW
  onAssignmentPromptChange?: (prompt: string) => void;  // NEW
  readOnlyPrompt?: boolean;  // NEW - for saved assignments
}
```

**Add UI field (above or at top of criteria):**
```tsx
{(assignmentPrompt !== undefined || onAssignmentPromptChange) && (
  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
    <Label className="text-sm font-semibold text-blue-800 dark:text-blue-200">
      Assignment Instructions
    </Label>
    {readOnlyPrompt ? (
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
        {assignmentPrompt}
      </p>
    ) : (
      <Textarea
        value={assignmentPrompt}
        onChange={(e) => onAssignmentPromptChange?.(e.target.value)}
        placeholder="Enter assignment instructions for students..."
        className="mt-2 min-h-[80px]"
      />
    )}
  </div>
)}
```

#### 3.4 Update Submission Page
**File:** `src/pages/Submission.tsx`

**Add state in useSubmissionState:**
```typescript
const [assignmentPrompt, setAssignmentPrompt] = useState('');
```

**Load from assignment:**
```typescript
useEffect(() => {
  if (assignmentId && assignmentsData) {
    const assignment = assignmentsData.find(a => a.id === assignmentId);
    if (assignment) {
      setCriteria(assignment.teacher_criteria);
      setTotalPoints(assignment.total_points);
      setAssignmentPrompt(assignment.assignment_prompt || '');  // NEW
    }
  }
}, [assignmentId, assignmentsData]);
```

**Pass to CriteriaInput:**
```tsx
<CriteriaInput
  value={criteria}
  onChange={setCriteria}
  totalPoints={totalPoints}
  onTotalPointsChange={setTotalPoints}
  assignmentPrompt={assignmentPrompt}  // NEW
  onAssignmentPromptChange={setAssignmentPrompt}  // NEW
  readOnlyPrompt={!!assignmentId}  // NEW - read-only if from saved assignment
/>
```

**Pass to grading function:**
```typescript
// In handleRunGrade
const result = await ingestMutation.mutateAsync({
  student_id: selectedStudentUuid,
  assignment_id: assignmentId || undefined,
  teacher_criteria: criteria,
  assignment_prompt: assignmentPrompt,  // NEW
  // ... other fields
});
```

---

### Phase 4: Update Grading Logic

#### 4.1 Store in Submissions Table
**File:** `netlify/functions/ingest.ts`

```sql
INSERT INTO grader.submissions (
  submission_id,
  student_id,
  assignment_id,
  teacher_criteria,
  assignment_prompt,  -- NEW
  -- ... other fields
) VALUES (...)
```

#### 4.2 Fetch in Background Grading
**File:** `netlify/functions/grade-bulletproof-background.ts`

```sql
SELECT 
  s.submission_id,
  s.verbatim_text,
  s.teacher_criteria,
  s.assignment_prompt,  -- NEW from submission
  a.assignment_prompt AS assignment_assignment_prompt,  -- NEW from assignment
  -- ... other fields
FROM grader.submissions s
LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
```

**Prioritize:**
```typescript
// Use submission's prompt if set, otherwise use assignment's prompt
const assignmentPrompt = submission[0].assignment_prompt || 
                        submission[0].assignment_assignment_prompt;
```

#### 4.3 Include in LLM Prompt
**File:** `src/lib/prompts/extractor.ts`

Update both `buildExtractorPrompt()` and `buildComparisonExtractorPrompt()`:

```typescript
export function buildExtractorPrompt(
  rubric: RubricJSON,
  essayText: string,
  submissionId: string,
  customGradingPrompt?: string,
  documentType?: string,
  sourceTextContext?: SourceTextContext,
  assignmentPrompt?: string  // NEW
): string {
  let prompt = `# GRADING TASK\n\n`;
  
  // Add assignment prompt context
  if (assignmentPrompt) {
    prompt += `## ASSIGNMENT INSTRUCTIONS\n`;
    prompt += `The student was given these instructions:\n\n`;
    prompt += `"${assignmentPrompt}"\n\n`;
    prompt += `When grading, consider whether the student:\n`;
    prompt += `- Followed the assignment instructions\n`;
    prompt += `- Addressed the prompt requirements\n`;
    prompt += `- Met the specified format/length/structure\n\n`;
  }
  
  // ... rest of existing prompt
}
```

---

### Phase 5: Testing

#### 5.1 Manual Testing Checklist
- [ ] Create new assignment with assignment prompt
- [ ] Create new assignment without assignment prompt (optional)
- [ ] Edit existing assignment to add prompt
- [ ] Grade submission with assignment prompt
- [ ] Verify prompt appears in LLM context
- [ ] Grade ad-hoc submission with custom prompt
- [ ] Verify prompt stored in submissions table
- [ ] Check that grading considers the prompt

#### 5.2 Test Cases
1. **New Assignment with Prompt**
   - Create assignment with prompt
   - Verify saved to database
   - Load assignment in Grade Submissions
   - Verify prompt appears in CriteriaInput

2. **Grading with Prompt**
   - Grade submission with assignment prompt
   - Check LLM receives prompt in context
   - Verify feedback references prompt requirements

3. **Ad-hoc Grading**
   - Grade without assignment_id
   - Add custom prompt in CriteriaInput
   - Verify prompt saved to submission
   - Verify prompt used in grading

---

## UI/UX Considerations

### Visual Design
- **Color:** Light blue background to distinguish from criteria
- **Icon:** 📝 or 📋 to indicate instructions
- **Label:** "Assignment Instructions" or "Student Prompt"
- **Helper Text:** "Instructions given to students for this assignment"

### Behavior
- **Optional field** - not required
- **Saved assignments** - prompt is read-only on Grade Submissions page
- **Ad-hoc grading** - prompt is editable
- **Character limit** - Consider 2000-5000 character limit

### Example Prompts
```
Write a 5-paragraph persuasive essay (500-700 words) arguing for or against 
the use of social media in schools. Include:
- Clear thesis statement
- At least 3 supporting arguments with evidence
- One counterargument with rebuttal
- Proper MLA citations
```

```
Analyze the theme of identity in "The Namesake" by Jhumpa Lahiri. Your essay 
should be 3-4 pages, double-spaced, and include:
- Introduction with thesis
- At least 3 textual examples with analysis
- Discussion of cultural conflict
- Conclusion connecting to broader themes
```

---

## Database Schema Changes

### Migration File
**File:** `migrations/add_assignment_prompt.sql`

```sql
-- Migration: Add assignment_prompt to assignments and submissions
-- Created: November 30, 2025
-- Purpose: Store student-facing assignment instructions

-- Add to assignments table
ALTER TABLE grader.assignments 
ADD COLUMN assignment_prompt text;

COMMENT ON COLUMN grader.assignments.assignment_prompt 
IS 'Student-facing instructions and requirements for the assignment';

-- Add to submissions table (for ad-hoc grading)
ALTER TABLE grader.submissions 
ADD COLUMN assignment_prompt text;

COMMENT ON COLUMN grader.submissions.assignment_prompt 
IS 'Assignment instructions (from assignment or entered during grading)';
```

### Update db_ref.md
Add to assignments table documentation:
- `assignment_prompt` (text, nullable) - Student-facing assignment instructions

Add to submissions table documentation:
- `assignment_prompt` (text, nullable) - Assignment instructions used for this submission

---

## Files to Modify

### Backend
- [ ] `migrations/add_assignment_prompt.sql` - NEW
- [ ] `db_ref.md` - Update schema docs
- [ ] `netlify/functions/create-assignment.ts` - Add field
- [ ] `netlify/functions/update-assignment.ts` - Add field
- [ ] `netlify/functions/get-assignment.ts` - Include in SELECT
- [ ] `netlify/functions/list-assignments.ts` - Include in SELECT
- [ ] `netlify/functions/ingest.ts` - Add to submissions INSERT
- [ ] `netlify/functions/grade-bulletproof-background.ts` - Fetch and use
- [ ] `src/lib/prompts/extractor.ts` - Add to prompt builders

### Frontend
- [ ] `src/lib/schema.ts` - Add to types
- [ ] `src/components/CreateAssignmentModal.tsx` - Add UI field
- [ ] `src/components/CriteriaInput.tsx` - Add display/edit field
- [ ] `src/pages/Submission.tsx` - Add state and pass to components
- [ ] `src/pages/Submission/hooks/useSubmissionState.ts` - Add state
- [ ] `src/pages/Submission/hooks/useSubmissionActions.ts` - Pass to API

---

## Future Enhancements

### Potential Additions
- [ ] Template library of common assignment prompts
- [ ] Prompt suggestions based on document type
- [ ] Prompt validation (check for required elements)
- [ ] Prompt preview in student view
- [ ] Rubric auto-generation from prompt (AI-powered)
- [ ] Prompt versioning (track changes over time)

---

## Notes

- Assignment prompt is **contextual information**, not a grading criterion
- Should be included in LLM context but not as a scored item
- Helps AI understand what students were asked to do
- Particularly useful for:
  - Specific format requirements (5 paragraphs, MLA format, etc.)
  - Length requirements (500-700 words, 3-4 pages)
  - Required elements (thesis, evidence, counterargument)
  - Topic constraints (argue for/against, compare/contrast)

---

## Implementation Priority

**Phase 1 (High Priority):**
- Database migration
- Backend API updates
- CreateAssignmentModal UI

**Phase 2 (Medium Priority):**
- CriteriaInput component updates
- Submission page integration
- Grading function updates

**Phase 3 (Low Priority):**
- Testing and refinement
- Documentation updates
- Future enhancements

---

## Questions to Resolve

1. **Editability:** Should assignment prompt be editable on Grade Submissions page for saved assignments?
   - **Recommendation:** Read-only for saved assignments, editable for ad-hoc

2. **Character Limit:** What's the maximum length for assignment prompts?
   - **Recommendation:** 5000 characters (roughly 1 page)

3. **Required Field:** Should assignment prompt be required or optional?
   - **Recommendation:** Optional (not all assignments need detailed instructions)

4. **Display Location:** Where exactly in CriteriaInput should it appear?
   - **Recommendation:** Top of the card, before grading criteria, with blue background

5. **LLM Weight:** How much should the LLM consider the prompt vs. rubric criteria?
   - **Recommendation:** Rubric criteria are primary, prompt is context only

---

## CRITICAL BUG FIX: Annotation Category Inconsistency

### Core Principle: Rubric as Source of Truth

**Every rubric is different.** Teachers create rubrics with their own criteria names, point values, and performance levels. The system must work with ANY rubric, not just a specific ELAR rubric.

**The rubric defines:**
- What criteria exist (e.g., "IDEAS & DEVELOPMENT", "PROBLEM UNDERSTANDING", "THESIS STATEMENT")
- What the criterion IDs are (e.g., `ideas_development`, `problem_understanding`, `thesis`)
- What point values are possible (e.g., 0-25 points, 0-10 points)

**The system must:**
- Use the rubric's criterion IDs for ALL annotations
- Never use hardcoded generic categories (`Content`, `Mechanics`, etc.)
- Always look up display names from the rubric object
- Work identically for ELAR, math, science, history, or any other subject

### Problem Identified (from OverallOutputs.md)

**Current State - INCONSISTENT HEADERS:**

**IMPORTANT:** The rubric headers shown below are from ONE specific rubric. Every rubric will have different criterion names, but the SAME consistency problem exists across all rubrics.

**Example from ELAR Informational Writing Rubric:**
- **Rubric Headers** (SOURCE OF TRUTH - varies per rubric): `IDEAS & DEVELOPMENT | FOCUS & ORGANIZATION | AUTHOR'S CRAFT | CONVENTIONS`
- **Detailed Breakdown** (✅ CORRECT): `ideas_development | focus_organization | authors_craft | conventions`
- **Specific Corrections** (❌ WRONG): `Mechanics | AUTHOR'S CRAFT | CONVENTIONS | IDEAS & DEVELOPMENT | FOCUS & ORGANIZATION | Content | Organization`
- **Inline Annotations** (❌ WRONG): `Mechanics | Clarity | Content | Organization`

**The Problem:** Annotations are using a mix of:
1. Generic categories (`Mechanics`, `Content`, `Clarity`, `Organization`) - NOT from rubric
2. Rubric display names (`AUTHOR'S CRAFT`, `IDEAS & DEVELOPMENT`) - Should be IDs
3. Correct criterion IDs (`ideas_development`, `focus_organization`) - Only in Detailed Breakdown

### Root Cause Analysis

**File:** `src/lib/prompts/extractor.ts`

The LLM is being instructed to use **generic categories** for annotations:
```typescript
const annotationCategories = 'Content|Evidence|Organization|Clarity|Mechanics';
```

However, the LLM is **mixing** these generic categories with **actual rubric criterion names**, causing:
1. Annotations tagged with `AUTHOR'S CRAFT` (rubric name) instead of `Content` (generic category)
2. Annotations tagged with `IDEAS & DEVELOPMENT` (rubric name) instead of `Content` (generic category)
3. Annotations tagged with `Clarity` (generic category) which doesn't map to any rubric criterion

### Why This Happens

**Pass 1 Annotations** (`buildExtractorPrompt`):
- Prompt says: "Tag each annotation with the most relevant category: Content | Evidence | Organization | Clarity | Mechanics"
- LLM sees rubric criteria like "IDEAS & DEVELOPMENT" and "AUTHOR'S CRAFT"
- LLM gets confused and uses rubric names instead of generic categories

**Pass 2 Annotations** (`buildCriteriaAnnotationsPrompt`):
- Prompt says: "Map each annotation to the appropriate generic category"
- Includes `criterion_id` field to link back to rubric
- Still uses generic categories, but LLM may still mix them

### The Solution: Use Rubric Criterion IDs as Categories

Instead of generic categories that don't match the rubric, **use the actual rubric criterion IDs** as annotation categories.

**Key Principle:** The rubric is the **single source of truth**. Every rubric defines its own criteria with:
- **Display Name** (e.g., "IDEAS & DEVELOPMENT") - What teachers see
- **Criterion ID** (e.g., "ideas_development") - Internal identifier used in code/annotations
- **Max Points** (e.g., 25) - Point value for the criterion

**Benefits:**
1. ✅ **Consistency**: Annotations always match rubric criteria
2. ✅ **Clarity**: No confusion between generic categories and rubric names
3. ✅ **Traceability**: Direct link from annotation to rubric criterion
4. ✅ **Flexibility**: Works with ANY rubric (ELAR, math, science, history, etc.)
5. ✅ **Rubric-Driven**: The rubric defines what categories exist, not hardcoded generic categories

---

## Implementation: Fix Annotation Categories

### Phase 6: Fix Annotation Category System

#### 6.1 Update Extractor Prompt
**File:** `src/lib/prompts/extractor.ts`

**Current (Lines 59-60):**
```typescript
// Use generic annotation categories that work for any subject
const annotationCategories = 'Content|Evidence|Organization|Clarity|Mechanics';
```

**Change to:**
```typescript
// Use rubric criterion IDs as annotation categories for consistency
const annotationCategories = rubric.criteria.map(c => c.id).join('|');
// Example output: "ideas_development|focus_organization|authors_craft|conventions"
```

#### 6.2 Update Annotation Instructions (Pass 1)
**File:** `src/lib/prompts/extractor.ts` (Lines 92-99)

**Current:**
```typescript
2. Inline Annotations (Based on Generic Categories):
   - Create annotations for issues that affect the rubric criteria
   - Tag each annotation with the most relevant category:
     * Content: Issues with ideas, arguments, reasoning, accuracy
     * Evidence: Issues with supporting details, examples, sources, citations
     * Organization: Issues with structure, flow, transitions, coherence
     * Clarity: Issues with unclear writing, explanations, or communication
     * Mechanics: Grammar, spelling, punctuation, formatting (if relevant to rubric)
```

**Change to:**
```typescript
2. Inline Annotations (Based on Rubric Criteria):
   - Create annotations for issues that affect the rubric criteria
   - Tag each annotation with the rubric criterion ID it relates to:
${rubric.criteria.map(c => `     * ${c.id}: Issues related to "${c.name}"`).join('\n')}
   - Choose the criterion that BEST matches the issue
   - If an issue affects multiple criteria, pick the PRIMARY one
```

**Example output:**
```
     * ideas_development: Issues related to "IDEAS & DEVELOPMENT"
     * focus_organization: Issues related to "FOCUS & ORGANIZATION"
     * authors_craft: Issues related to "AUTHOR'S CRAFT"
     * conventions: Issues related to "CONVENTIONS"
```

#### 6.3 Update JSON Schema Documentation
**File:** `src/lib/prompts/extractor.ts` (Lines 146-154)

**Current:**
```typescript
"inline_annotations": [
  {
    "line": 5,
    "quote": "the exact text with the issue",
    "category": "${annotationCategories}",
    "suggestion": "Specific correction or improvement",
    "severity": "info|warning|error"
  }
]
```

**Change to:**
```typescript
"inline_annotations": [
  {
    "line": 5,
    "quote": "the exact text with the issue",
    "category": "${annotationCategories}",  // Must be one of the rubric criterion IDs
    "suggestion": "Specific correction or improvement",
    "severity": "info|warning|error",
    "criterion_id": "${annotationCategories}"  // Same as category for consistency
  }
]
```

#### 6.4 Update Category Rules
**File:** `src/lib/prompts/extractor.ts` (Lines 165-173)

**Current:**
```typescript
- Category must be one of: ${annotationCategories}
- Choose the category that best matches the issue type:
  * Content = problems with ideas, arguments, reasoning, accuracy
  * Evidence = missing/weak supporting details, examples, sources
  * Organization = structure, flow, transitions issues
  * Clarity = unclear writing or explanations
  * Mechanics = grammar, spelling, punctuation
```

**Change to:**
```typescript
- Category must be one of: ${annotationCategories}
- Choose the rubric criterion that this issue MOST affects:
${rubric.criteria.map(c => `  * ${c.id} = issues affecting "${c.name}"`).join('\n')}
- If an issue affects multiple criteria, choose the PRIMARY one
- Every annotation MUST map to a rubric criterion
```

#### 6.5 Update Pass 2 Criteria Annotations
**File:** `src/lib/prompts/extractor.ts` (Lines 232-237)

**Current:**
```typescript
3. Map each annotation to the appropriate generic category:
   - Content: Issues with ideas, arguments, reasoning, accuracy
   - Evidence: Missing/weak supporting details, examples, sources
   - Organization: Structure, flow, transitions issues
   - Clarity: Unclear writing or explanations
   - Mechanics: Grammar, spelling, punctuation
```

**Change to:**
```typescript
3. Tag each annotation with the rubric criterion ID it addresses:
   - Use the criterion_id from the list above
   - This links the annotation directly to the rubric criterion
   - Example: If addressing "IDEAS & DEVELOPMENT", use "ideas_development"
```

**And update the JSON schema (Lines 249):**
```typescript
"category": "Content|Evidence|Organization|Clarity|Mechanics",  // OLD
```

**Change to:**
```typescript
"category": "${criterion.id}",  // Use the actual criterion ID
```

#### 6.6 Update Comparison Mode Prompt
**File:** `src/lib/prompts/extractor.ts` (Lines 340-348)

Apply the same changes to `buildComparisonExtractorPrompt()`:
- Use rubric criterion IDs instead of generic categories
- Update annotation instructions
- Update category rules

---

## Expected Results After Fix

### Consistent Headers Across All Sections

**IMPORTANT:** The example below uses an ELAR rubric. Your rubric will have different criterion names and IDs, but the same consistency pattern will apply.

**Example: ELAR Informational Writing Rubric**

**Rubric Headers** (Display Names - SOURCE OF TRUTH, varies per rubric):
```
IDEAS & DEVELOPMENT | FOCUS & ORGANIZATION | AUTHOR'S CRAFT | CONVENTIONS
```

**Detailed Breakdown** (Criterion IDs - ✅ Already Correct):
```
ideas_development | focus_organization | authors_craft | conventions
```

**Specific Corrections** (Criterion IDs - ✅ Will Be Fixed):
```
ideas_development | focus_organization | authors_craft | conventions
```

**Inline Annotations** (Criterion IDs - ✅ Will Be Fixed):
```
ideas_development | focus_organization | authors_craft | conventions
```

**Example: Math Problem-Solving Rubric (Different Rubric)**

If your rubric has different criteria like:
- Display Names: `PROBLEM UNDERSTANDING | MATHEMATICAL REASONING | CALCULATION ACCURACY | COMMUNICATION`
- Criterion IDs: `problem_understanding | math_reasoning | calculation | communication`

Then ALL sections would use: `problem_understanding | math_reasoning | calculation | communication`

**The Pattern:** Whatever criteria are defined in the rubric, those criterion IDs are used consistently across all output sections.

### Display Mapping

When displaying annotations in the UI, **always look up the display name from the rubric** (the source of truth):

```typescript
// ✅ CORRECT: Look up from rubric (works for ANY rubric)
const criterion = rubric.criteria.find(c => c.id === annotation.category);
const displayName = criterion?.name || annotation.category;

// ❌ WRONG: Hardcoded mapping (only works for one specific rubric)
const criterionDisplayName = {
  'ideas_development': 'IDEAS & DEVELOPMENT',
  'focus_organization': 'FOCUS & ORGANIZATION',
  'authors_craft': 'AUTHOR\'S CRAFT',
  'conventions': 'CONVENTIONS'
};
```

**Why?** The rubric is the source of truth. Different rubrics have different criteria. Always look up display names dynamically from the rubric object.

---

## Files to Modify for Bug Fix

### Backend
- [ ] `src/lib/prompts/extractor.ts` - Update annotation category system
  - Change `annotationCategories` to use rubric criterion IDs
  - Update Pass 1 annotation instructions
  - Update Pass 2 annotation instructions
  - Update JSON schema documentation
  - Update category rules
  - Apply to both `buildExtractorPrompt()` and `buildComparisonExtractorPrompt()`

### Frontend (Display Only)
- [ ] `src/components/GradePanel.tsx` - Map criterion IDs to display names
- [ ] `src/components/AnnotationViewer.tsx` - Map criterion IDs to display names
- [ ] `src/components/VerbatimViewer.tsx` - Map criterion IDs to display names

---

## Testing the Fix

### Test Cases
1. **Grade with Standard Rubric**
   - Verify all annotations use criterion IDs (e.g., `ideas_development`)
   - Verify no generic categories (e.g., `Content`, `Clarity`)
   - Verify no rubric display names (e.g., `IDEAS & DEVELOPMENT`)

2. **Grade with Custom Rubric**
   - Create rubric with different criteria
   - Verify annotations use those criterion IDs
   - Verify system adapts to any rubric

3. **Display in UI**
   - Verify annotations show rubric display names (e.g., "IDEAS & DEVELOPMENT")
   - Verify grouping by criterion works correctly
   - Verify filtering by criterion works

### Validation
```typescript
// In backend after LLM response
const validCategories = rubric.criteria.map(c => c.id);
const invalidAnnotations = annotations.filter(
  a => !validCategories.includes(a.category)
);

if (invalidAnnotations.length > 0) {
  console.warn('Invalid annotation categories:', invalidAnnotations);
  // Filter out or remap invalid annotations
}
```

---

## Benefits of This Fix

1. **Consistency**: All sections use the same criterion IDs
2. **Flexibility**: Works with ANY rubric (ELAR, math, science, history, etc.)
3. **Traceability**: Direct link from annotation to rubric criterion
4. **Clarity**: No confusion between generic categories and rubric names
5. **Maintainability**: Single source of truth (the rubric)
6. **Accuracy**: LLM can't invent categories that don't exist in the rubric
7. **Rubric-Driven**: The rubric defines what's possible, not hardcoded generic categories
8. **Teacher-Friendly**: Teachers see their own rubric criteria, not generic terms

---

## Priority

**CRITICAL - Should be fixed BEFORE implementing Assignment Prompt feature**

This bug affects the core grading output and causes confusion for teachers. Fix this first, then implement the Assignment Prompt feature.

# Update Grading: Multi-Phase Enhancement Plan

## Overview
This document outlines a comprehensive plan to enhance the grading system with multiple features:
1. **Assignment Prompt** - Student-facing instructions
2. **Annotation Category Fix** - Consistent rubric-based categories
3. **Non-Graded Annotations** - Spelling/grammar feedback without grade impact
4. **Color-Coded Highlighting** - Visual distinction between annotation types
5. **Manual Annotations** - Teacher-added feedback

**Created:** November 30, 2025
**Last Updated:** November 30, 2025

---

## Implementation Strategy

### Phased Approach
Each phase is designed to be:
- ✅ **Independently testable** - Can be verified without other phases
- ✅ **Incrementally deployable** - Can go to production separately
- ✅ **Backwards compatible** - Won't break existing functionality
- ✅ **Clearly scoped** - Well-defined start and end points

### Testing Requirements
Each phase includes:
- Database migration verification
- Backend API testing
- Frontend UI testing
- Integration testing
- Production smoke testing

---

## Phase Overview & Dependencies

```
✅ Phase 0: Annotation Category Fix (CRITICAL - BLOCKING) - DEPLOYED
   ↓
✅ Phase 1: Assignment Prompt (Database + Backend) - COMPLETE
   ↓
✅ Phase 2: Assignment Prompt (Frontend + Integration) - COMPLETE
   ↓
✅ Phase 3: Non-Graded Annotations (Backend) - COMPLETE
   ↓
✅ Phase 4: Non-Graded Annotations (Frontend) - COMPLETE
   ↓
⏳ Phase 5: Color-Coded Highlighting (Print System)
   ↓
⏳ Phase 6: Manual Annotations (Backend + Database)
   ↓
⏳ Phase 7: Manual Annotations (Frontend + UI)
```

**Estimated Timeline:**
- Phase 0: 2-3 hours (CRITICAL)
- Phases 1-2: 4-6 hours
- Phases 3-4: 4-6 hours
- Phase 5: 3-4 hours
- Phases 6-7: 6-8 hours
- **Total: 19-27 hours**

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

---

## Additional Feature Requests

### Phase 7: Non-Graded Annotations (ELAR Issues)

#### Overview
Add ability to identify general ELAR issues (spelling, grammar, punctuation) that are called out to students but **do NOT affect the grade** unless specifically included in the rubric.

#### Requirements

**1. Enable/Disable Non-Graded Annotations**
- **Location**: Settings Modal → New "Annotation Settings" tab
- **Control**: Checkbox labeled "Identify spelling, grammar, and punctuation errors"
- **Behavior**:
  - When enabled: LLM identifies these issues as separate annotations
  - When disabled: LLM only identifies issues related to rubric criteria
  - Default: Enabled (most teachers want to see these)

**Storage:**
```typescript
localStorage.setItem('enable_non_graded_annotations', 'true');
```

**2. Non-Graded Annotation Properties**
- **Category**: Use special category `non_graded` (not a rubric criterion)
- **Subcategory**: `spelling`, `grammar`, `punctuation`, `mechanics`
- **Severity**: Always `info` (not `warning` or `error`)
- **Points Impact**: 0 (does not affect grade)

**Example Annotation:**
```json
{
  "line": 3,
  "quote": "characrasteics",
  "category": "non_graded",
  "subcategory": "spelling",
  "suggestion": "The correct spelling is 'characteristics'.",
  "severity": "info",
  "affects_grade": false
}
```

**3. LLM Prompt Updates**

**File:** `src/lib/prompts/extractor.ts`

Add to annotation instructions:
```typescript
const enableNonGradedAnnotations = localStorage.getItem('enable_non_graded_annotations') === 'true';

if (enableNonGradedAnnotations) {
  prompt += `
ADDITIONAL ANNOTATIONS (DO NOT AFFECT GRADE):
- Identify spelling errors (category: "non_graded", subcategory: "spelling")
- Identify grammar errors (category: "non_graded", subcategory: "grammar")
- Identify punctuation errors (category: "non_graded", subcategory: "punctuation")
- These are for STUDENT LEARNING ONLY - they do NOT reduce the grade
- Mark all non-graded annotations with "affects_grade": false
`;
}
```

**4. Display in UI**

**VerbatimViewer (Interactive View):**
- Non-graded annotations: Light blue underline (vs. yellow/orange/red for graded)
- Tooltip shows: "ℹ️ Spelling - Does not affect grade"

**Print View:**
- Non-graded annotations: Light blue highlight
- Graded annotations: Color-coded by category (see Phase 8)

---

### Phase 8: Color-Coded Annotation Highlighting

#### Overview
Use different colors for different types of annotations in the print view, with a color key legend.

#### Color Scheme

**Graded Annotations (Rubric Criteria):**
Each rubric criterion gets a distinct color. Use a color palette that works for up to 8 criteria.

**Suggested Palette:**
1. **Criterion 1**: Yellow (`#FEF3C7` background, `#92400E` text)
2. **Criterion 2**: Green (`#D1FAE5` background, `#065F46` text)
3. **Criterion 3**: Blue (`#DBEAFE` background, `#1E40AF` text)
4. **Criterion 4**: Purple (`#E9D5FF` background, `#6B21A8` text)
5. **Criterion 5**: Pink (`#FCE7F3` background, `#9F1239` text)
6. **Criterion 6**: Orange (`#FED7AA` background, `#9A3412` text)
7. **Criterion 7**: Teal (`#CCFBF1` background, `#115E59` text)
8. **Criterion 8**: Indigo (`#E0E7FF` background, `#3730A3` text)

**Non-Graded Annotations:**
- **Light Blue**: `#BFDBFE` background, `#1E3A8A` text
- **Label**: "ℹ️ For Learning Only - Does Not Affect Grade"

#### Color Assignment

**Dynamic Assignment Based on Rubric:**
```typescript
// Assign colors to rubric criteria dynamically
const colorPalette = [
  { bg: '#FEF3C7', text: '#92400E', name: 'Yellow' },
  { bg: '#D1FAE5', text: '#065F46', name: 'Green' },
  { bg: '#DBEAFE', text: '#1E40AF', name: 'Blue' },
  { bg: '#E9D5FF', text: '#6B21A8', name: 'Purple' },
  { bg: '#FCE7F3', text: '#9F1239', name: 'Pink' },
  { bg: '#FED7AA', text: '#9A3412', name: 'Orange' },
  { bg: '#CCFBF1', text: '#115E59', name: 'Teal' },
  { bg: '#E0E7FF', text: '#3730A3', name: 'Indigo' },
];

const criterionColors = rubric.criteria.reduce((acc, criterion, index) => {
  acc[criterion.id] = colorPalette[index % colorPalette.length];
  return acc;
}, {});

// Non-graded annotations always use light blue
criterionColors['non_graded'] = { bg: '#BFDBFE', text: '#1E3A8A', name: 'Light Blue' };
```

#### Color Key Legend

**Location**: Top of print page, below student/assignment info

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ ANNOTATION KEY                                               │
├─────────────────────────────────────────────────────────────┤
│ [Yellow] IDEAS & DEVELOPMENT                                 │
│ [Green]  FOCUS & ORGANIZATION                                │
│ [Blue]   AUTHOR'S CRAFT                                      │
│ [Purple] CONVENTIONS                                         │
│ [Light Blue] ℹ️ Spelling/Grammar - Does Not Affect Grade    │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// In print utilities
function generateColorKey(rubric: RubricJSON, hasNonGradedAnnotations: boolean) {
  let html = '<div class="annotation-key">';
  html += '<h3>Annotation Key</h3>';
  
  // Graded annotations
  rubric.criteria.forEach((criterion, index) => {
    const color = criterionColors[criterion.id];
    html += `
      <div class="key-item">
        <span class="color-box" style="background-color: ${color.bg}; color: ${color.text};">
          ${color.name}
        </span>
        <span class="criterion-name">${criterion.name}</span>
      </div>
    `;
  });
  
  // Non-graded annotations
  if (hasNonGradedAnnotations) {
    html += `
      <div class="key-item">
        <span class="color-box" style="background-color: #BFDBFE; color: #1E3A8A;">
          Light Blue
        </span>
        <span class="criterion-name">ℹ️ Spelling/Grammar - Does Not Affect Grade</span>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}
```

---

### Phase 9: Manual Annotation Addition

#### Overview
Allow teachers to manually add annotations to student submissions, specifying the line number and feedback.

#### UI Location

**1. Annotation Panel (New Component)**
- **Location**: Below VerbatimViewer on Grade Submissions page
- **Trigger**: "Add Annotation" button
- **Modal/Inline**: Inline form that appears when clicked

**2. Add Annotation Form**

**Fields:**
- **Line Number** (required): Dropdown or input (1 to max line count)
- **Category** (required): Dropdown of rubric criteria + "Non-Graded"
- **Quote** (optional): Auto-filled from selected line, editable
- **Suggestion** (required): Textarea for teacher's feedback
- **Severity** (optional): Dropdown (info/warning/error) - defaults based on category

**Design:**
```tsx
<div className="add-annotation-form">
  <h4>Add Manual Annotation</h4>
  
  <div className="form-field">
    <Label>Line Number *</Label>
    <Select value={lineNumber} onChange={setLineNumber}>
      {Array.from({ length: totalLines }, (_, i) => (
        <SelectItem key={i + 1} value={i + 1}>
          Line {i + 1}: {getLinePreview(i + 1)}
        </SelectItem>
      ))}
    </Select>
  </div>
  
  <div className="form-field">
    <Label>Category *</Label>
    <Select value={category} onChange={setCategory}>
      {rubric.criteria.map(c => (
        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
      ))}
      <SelectItem value="non_graded">Non-Graded (Spelling/Grammar)</SelectItem>
    </Select>
  </div>
  
  <div className="form-field">
    <Label>Quote (optional)</Label>
    <Input 
      value={quote} 
      onChange={setQuote}
      placeholder="Specific text with the issue..."
    />
  </div>
  
  <div className="form-field">
    <Label>Feedback *</Label>
    <Textarea 
      value={suggestion} 
      onChange={setSuggestion}
      placeholder="Explain the issue and how to improve..."
      className="min-h-[100px]"
    />
  </div>
  
  <div className="form-actions">
    <Button onClick={handleCancel} variant="outline">Cancel</Button>
    <Button onClick={handleSave}>Add Annotation</Button>
  </div>
</div>
```

#### Backend Storage

**Database:**
Manual annotations are stored in the same `grader.annotations` table with an additional field:

```sql
ALTER TABLE grader.annotations 
ADD COLUMN source text DEFAULT 'ai';

COMMENT ON COLUMN grader.annotations.source 
IS 'Source of annotation: ai (LLM-generated) or manual (teacher-added)';
```

**API Endpoint:**
```typescript
// POST /.netlify/functions/add-manual-annotation
{
  submission_id: string;
  line_number: number;
  category: string;  // rubric criterion ID or 'non_graded'
  quote?: string;
  suggestion: string;
  severity?: 'info' | 'warning' | 'error';
  source: 'manual';
}
```

#### Display in UI

**VerbatimViewer:**
- Manual annotations appear alongside AI annotations
- Badge shows "👤 Teacher" vs "🤖 AI"
- Manual annotations can be edited/deleted by teacher

**Print View:**
- Manual annotations use the same color scheme
- No distinction between AI and manual (both are feedback)

#### Edit/Delete Manual Annotations

**Edit:**
- Click on manual annotation in VerbatimViewer
- Form pre-fills with existing data
- Save updates the annotation

**Delete:**
- Trash icon next to manual annotations
- Confirmation dialog: "Delete this annotation?"
- Only manual annotations can be deleted (AI annotations are read-only)

---

## Implementation Priority (Updated)

**Phase 1 (CRITICAL - Fix First):**
- Phase 6: Fix annotation category inconsistency

**Phase 2 (High Priority):**
- Phase 1-5: Assignment Prompt feature
- Phase 7: Non-graded annotations

**Phase 3 (Medium Priority):**
- Phase 8: Color-coded highlighting
- Phase 9: Manual annotation addition

**Phase 4 (Low Priority):**
- Testing and refinement
- Documentation updates

---

## Files to Modify (Updated)

### Phase 7: Non-Graded Annotations
- [ ] `src/components/SettingsModal.tsx` - Add "Annotation Settings" tab
- [ ] `src/lib/prompts/extractor.ts` - Add non-graded annotation instructions
- [ ] `src/lib/annotations/types.ts` - Add `affects_grade` and `subcategory` fields
- [ ] `src/components/VerbatimViewer.tsx` - Different styling for non-graded
- [ ] `src/lib/print/printUtils.ts` - Light blue highlight for non-graded

### Phase 8: Color-Coded Highlighting
- [ ] `src/lib/print/printUtils.ts` - Implement color palette and key legend
- [ ] `src/lib/print/printStyles.ts` - Add color styles
- [ ] `src/components/VerbatimViewer.tsx` - Apply colors in interactive view

### Phase 9: Manual Annotations
- [ ] `migrations/add_annotation_source.sql` - Add `source` column
- [ ] `netlify/functions/add-manual-annotation.ts` - NEW endpoint
- [ ] `netlify/functions/update-annotation.ts` - NEW endpoint
- [ ] `netlify/functions/delete-annotation.ts` - NEW endpoint
- [ ] `src/lib/api/annotations.ts` - NEW API client
- [ ] `src/components/AddAnnotationForm.tsx` - NEW component
- [ ] `src/components/VerbatimViewer.tsx` - Show manual annotations with badge
- [ ] `src/pages/Submission.tsx` - Integrate AddAnnotationForm

---

## Questions to Resolve (New)

### Phase 7: Non-Graded Annotations

1. **Setting Location**: Should the enable/disable toggle be:
   - **Option A**: Global setting in Settings Modal (applies to all grading)
   - **Option B**: Per-assignment setting in CreateAssignmentModal
   - **Option C**: Per-submission toggle on Grade Submissions page
   - **Recommendation**: Option A (global setting) - most teachers want consistent behavior

2. **Annotation Count**: Should non-graded annotations:
   - Count toward total annotation count?
   - Be shown in annotation stats (e.g., "15 annotations, 3 non-graded")?
   - **Recommendation**: Show separately: "12 graded, 3 informational"

3. **Filtering**: Should teachers be able to:
   - Hide non-graded annotations in the UI?
   - Toggle them on/off in print view?
   - **Recommendation**: Yes, add filter toggle

### Phase 8: Color-Coded Highlighting

1. **Color Assignment**: Should colors be:
   - **Option A**: Automatically assigned in order (criterion 1 = yellow, criterion 2 = green, etc.)
   - **Option B**: Teacher-customizable per rubric
   - **Recommendation**: Option A (automatic) for simplicity

2. **Rubrics with >8 Criteria**: What if a rubric has more than 8 criteria?
   - Repeat colors (criterion 9 uses yellow again)?
   - Use shades/variations?
   - **Recommendation**: Repeat colors with pattern indicator

3. **Accessibility**: Should we:
   - Add patterns (stripes, dots) in addition to colors for colorblind users?
   - Provide high-contrast mode?
   - **Recommendation**: Yes, add optional patterns

### Phase 9: Manual Annotations

1. **Timing**: Can teachers add manual annotations:
   - **Option A**: Only after AI grading completes
   - **Option B**: Before or after AI grading
   - **Recommendation**: Option B (more flexible)

2. **Grade Impact**: Should manual annotations:
   - Affect the grade if they're in a graded category?
   - Always be informational only?
   - **Recommendation**: Always informational (grade is AI + teacher override, not annotation-based)

3. **Bulk Operations**: Should teachers be able to:
   - Add multiple annotations at once?
   - Import annotations from a template?
   - **Recommendation**: Future enhancement, not MVP

---

# DETAILED PHASE BREAKDOWN

## Phase 0: Fix Annotation Category Inconsistency (CRITICAL)

**Status:** ✅ COMPLETE - Deployed November 30, 2025

**Duration:** 2-3 hours (Actual: 2 hours)

**Priority:** CRITICAL - Fixes core bug affecting all grading output

### Scope
Fix the inconsistency where annotations use mixed categories (generic categories + rubric names) instead of consistent rubric criterion IDs.

### Files to Modify
1. `src/lib/prompts/extractor.ts` - Update annotation category system (3 locations)

### Changes Required

#### Change 1: Update `buildExtractorPrompt()` (Lines 59-60)
```typescript
// OLD
const annotationCategories = 'Content|Evidence|Organization|Clarity|Mechanics';

// NEW
const annotationCategories = rubric.criteria.map(c => c.id).join('|');
```

#### Change 2: Update annotation instructions (Lines 92-99)
```typescript
// OLD
2. Inline Annotations (Based on Generic Categories):
   - Tag each annotation with the most relevant category:
     * Content: Issues with ideas, arguments, reasoning, accuracy
     * Evidence: Issues with supporting details, examples, sources, citations
     * Organization: Issues with structure, flow, transitions, coherence
     * Clarity: Issues with unclear writing, explanations, or communication
     * Mechanics: Grammar, spelling, punctuation, formatting

// NEW
2. Inline Annotations (Based on Rubric Criteria):
   - Tag each annotation with the rubric criterion ID it relates to:
${rubric.criteria.map(c => `     * ${c.id}: Issues related to "${c.name}"`).join('\n')}
   - Choose the criterion that BEST matches the issue
   - If an issue affects multiple criteria, pick the PRIMARY one
```

#### Change 3: Update category rules (Lines 165-173)
```typescript
// OLD
- Category must be one of: ${annotationCategories}
- Choose the category that best matches the issue type:
  * Content = problems with ideas, arguments, reasoning, accuracy
  * Evidence = missing/weak supporting details, examples, sources
  * Organization = structure, flow, transitions issues
  * Clarity = unclear writing or explanations
  * Mechanics = grammar, spelling, punctuation

// NEW
- Category must be one of: ${annotationCategories}
- Choose the rubric criterion that this issue MOST affects:
${rubric.criteria.map(c => `  * ${c.id} = issues affecting "${c.name}"`).join('\n')}
- If an issue affects multiple criteria, choose the PRIMARY one
- Every annotation MUST map to a rubric criterion
```

#### Change 4: Update `buildCriteriaAnnotationsPrompt()` (Lines 232-237, 249)
Apply same pattern to Pass 2 annotations.

#### Change 5: Update `buildComparisonExtractorPrompt()` (Lines 340+)
Apply same pattern to comparison mode.

### Testing Checklist

**Database:**
- [x] No database changes required

**Backend:**
- [x] Grade submission with standard rubric
- [x] Verify all annotations use criterion IDs (e.g., `ideas_development`)
- [x] Verify NO generic categories (e.g., `Content`, `Clarity`)
- [x] Verify NO rubric display names (e.g., `IDEAS & DEVELOPMENT`)
- [x] Check Pass 1 annotations
- [x] Check Pass 2 annotations
- [x] Test comparison mode

**Frontend:**
- [x] Annotations display correctly in VerbatimViewer
- [x] Annotations display correctly in AnnotationViewer
- [x] Annotations display correctly in print view
- [x] Grouping by criterion works

**Integration:**
- [x] Grade with ELAR rubric - verify categories
- [x] Grade with different rubric (math/science) - verify categories adapt
- [x] Verify Detailed Breakdown matches Specific Corrections matches Inline Annotations

**Production Smoke Test:**
- [ ] Deploy to production (pending)
- [ ] Grade 1 submission (pending)
- [ ] Verify consistent headers across all sections (pending)
- [ ] Check Netlify function logs for errors (pending)

### Success Criteria
✅ All annotation categories match rubric criterion IDs
✅ No generic categories appear in output
✅ Consistent headers across Detailed Breakdown, Specific Corrections, and Inline Annotations
✅ Works with any rubric (not just ELAR)

### Rollback Plan
If issues occur, revert `src/lib/prompts/extractor.ts` to previous version.

---

## Phase 1: Assignment Prompt - Database & Backend

**Status:** ✅ COMPLETE - November 30, 2025

**Duration:** 2-3 hours (Actual: 1 hour)

**Dependencies:** ✅ Phase 0 complete

### Scope
Add database schema and backend API support for assignment prompts.

### Files to Modify
1. `migrations/add_assignment_prompt.sql` - NEW
2. `db_ref.md` - Update schema docs
3. `netlify/functions/create-assignment.ts` - Add field
4. `netlify/functions/update-assignment.ts` - Add field
5. `netlify/functions/get-assignment.ts` - Include in SELECT
6. `netlify/functions/list-assignments.ts` - Include in SELECT
7. `netlify/functions/ingest.ts` - Add to submissions INSERT
8. `src/lib/schema.ts` - Add to TypeScript types

### Changes Required

#### Database Migration
```sql
-- migrations/add_assignment_prompt.sql
ALTER TABLE grader.assignments 
ADD COLUMN assignment_prompt text;

ALTER TABLE grader.submissions 
ADD COLUMN assignment_prompt text;

COMMENT ON COLUMN grader.assignments.assignment_prompt 
IS 'Student-facing instructions and requirements for the assignment';

COMMENT ON COLUMN grader.submissions.assignment_prompt 
IS 'Assignment instructions (from assignment or entered during grading)';
```

#### Backend API Updates
- Add `assignment_prompt` to request schemas
- Include in INSERT/UPDATE statements
- Include in SELECT queries

### Testing Checklist

**Database:**
- [ ] Run migration on local database
- [ ] Verify columns added to both tables
- [ ] Verify comments added
- [ ] Test rollback script
- [ ] Update `db_ref.md`

**Backend:**
- [ ] Create assignment with prompt - verify saved
- [ ] Create assignment without prompt - verify NULL
- [ ] Update assignment to add prompt - verify updated
- [ ] Get assignment - verify prompt returned
- [ ] List assignments - verify prompt included
- [ ] Ingest submission with prompt - verify saved

**API Testing:**
```bash
# Test create assignment with prompt
curl -X POST http://localhost:8888/.netlify/functions/create-assignment \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Assignment",
    "assignment_prompt": "Write a 5-paragraph essay...",
    "teacher_criteria": "Ideas: 25pts\nOrganization: 25pts"
  }'

# Test get assignment
curl http://localhost:8888/.netlify/functions/get-assignment?id=$ASSIGNMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Production:**
- [ ] Deploy migration to production
- [ ] Verify no errors in Netlify logs
- [ ] Test create assignment in production
- [ ] Verify backward compatibility (old assignments still work)

### Success Criteria
✅ Database columns added successfully
✅ API accepts and returns assignment_prompt
✅ Backward compatible (NULL prompts work)
✅ No breaking changes to existing functionality

### Rollback Plan
```sql
ALTER TABLE grader.assignments DROP COLUMN assignment_prompt;
ALTER TABLE grader.submissions DROP COLUMN assignment_prompt;
```

---

## Phase 2: Assignment Prompt - Frontend & Integration

**Status:** ✅ COMPLETE - November 30, 2025

**Duration:** 2-3 hours (Actual: 1 hour)

**Dependencies:** ✅ Phase 1 complete

### Scope
Add UI for assignment prompts in CreateAssignmentModal and Grade Submissions page.

### Files to Modify
1. `src/components/CreateAssignmentModal.tsx` - Add UI field
2. `src/components/CriteriaInput.tsx` - Add display/edit field
3. `src/pages/Submission.tsx` - Add state and pass to components
4. `src/pages/Submission/hooks/useSubmissionState.ts` - Add state
5. `src/pages/Submission/hooks/useSubmissionActions.ts` - Pass to API
6. `netlify/functions/grade-bulletproof-background.ts` - Fetch and use
7. `src/lib/prompts/extractor.ts` - Add to prompt builders

### Changes Required

#### CreateAssignmentModal
Add textarea field between Description and Grading Criteria:
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
    placeholder="Enter the instructions given to students..."
    className="min-h-[100px]"
  />
</div>
```

#### CriteriaInput
Add display at top of card with blue background.

#### Grading Integration
Update `buildExtractorPrompt()` to include assignment prompt in LLM context.

### Testing Checklist

**Frontend:**
- [ ] CreateAssignmentModal shows new field
- [ ] Can create assignment with prompt
- [ ] Can create assignment without prompt
- [ ] Prompt saves correctly
- [ ] CriteriaInput shows prompt (read-only for saved assignments)
- [ ] CriteriaInput allows editing for ad-hoc grading
- [ ] State management works correctly

**Integration:**
- [ ] Create assignment with prompt
- [ ] Load assignment in Grade Submissions
- [ ] Verify prompt appears in CriteriaInput
- [ ] Grade submission
- [ ] Verify prompt included in LLM context (check logs)
- [ ] Verify grading considers prompt

**User Flow:**
1. Create new assignment with prompt
2. Navigate to Grade Submissions
3. Select the assignment
4. Verify prompt displays
5. Grade a submission
6. Verify feedback references prompt requirements

**Production:**
- [ ] Deploy to production
- [ ] Create test assignment with prompt
- [ ] Grade test submission
- [ ] Verify prompt appears in grading context

### Success Criteria
✅ UI fields work correctly
✅ Assignment prompt saves and loads
✅ Prompt included in LLM grading context
✅ Grading considers assignment instructions
✅ No UI/UX issues

### Rollback Plan
Revert frontend files to previous versions. Backend remains compatible.

---

## Phase 3: Non-Graded Annotations - Backend

**Status:** ✅ COMPLETE - November 30, 2025

**Duration:** 2-3 hours (Actual: 1 hour)

**Dependencies:** ✅ Phase 0 complete

### Scope
Add backend support for non-graded annotations (spelling, grammar, punctuation) that don't affect grade.

### Files to Modify
1. `src/lib/prompts/extractor.ts` - Add non-graded annotation instructions
2. `src/lib/annotations/types.ts` - Add `affects_grade` and `subcategory` fields
3. `netlify/functions/grade-bulletproof-background.ts` - Handle non-graded annotations

### Changes Required

#### Update Annotation Types
```typescript
export interface RawAnnotation {
  line: number;
  quote: string;
  category: string;
  subcategory?: string;  // NEW: 'spelling', 'grammar', 'punctuation'
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  affects_grade?: boolean;  // NEW: false for non-graded
}
```

#### Update LLM Prompt
```typescript
// Check if non-graded annotations are enabled
const enableNonGraded = localStorage.getItem('enable_non_graded_annotations') === 'true';

if (enableNonGraded) {
  prompt += `
ADDITIONAL ANNOTATIONS (DO NOT AFFECT GRADE):
- Identify spelling errors (category: "non_graded", subcategory: "spelling")
- Identify grammar errors (category: "non_graded", subcategory: "grammar")
- Identify punctuation errors (category: "non_graded", subcategory: "punctuation")
- Mark with "affects_grade": false
- These are for STUDENT LEARNING ONLY
`;
}
```

### Testing Checklist

**Backend:**
- [ ] Enable non-graded annotations setting
- [ ] Grade submission with spelling errors
- [ ] Verify non-graded annotations created
- [ ] Verify `category: "non_graded"`
- [ ] Verify `affects_grade: false`
- [ ] Verify subcategory set correctly
- [ ] Disable setting and verify no non-graded annotations

**Database:**
- [ ] Non-graded annotations save to database
- [ ] Can query by category = 'non_graded'
- [ ] Annotation count includes non-graded

**API Testing:**
```bash
# Grade with non-graded enabled
curl -X POST http://localhost:8888/.netlify/functions/grade-bulletproof-trigger \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"submission_id": "$ID"}'

# Check annotations
curl http://localhost:8888/.netlify/functions/get-inline-annotations?submission_id=$ID \
  -H "Authorization: Bearer $TOKEN"
```

### Success Criteria
✅ Non-graded annotations generated when enabled
✅ Correctly marked with `affects_grade: false`
✅ Subcategories set correctly
✅ Can be disabled via setting
✅ Saved to database correctly

### Rollback Plan
Remove non-graded annotation logic from prompts. Existing annotations remain but no new ones created.

---

## Phase 4: Non-Graded Annotations - Frontend

**Status:** ✅ COMPLETE - November 30, 2025

**Duration:** 2-3 hours (Actual: 1 hour)

**Dependencies:** ✅ Phase 3 complete

### Scope
Add UI for enabling/disabling non-graded annotations and displaying them differently.

### Files to Modify
1. `src/components/SettingsModal.tsx` - Add "Annotation Settings" tab
2. `src/components/VerbatimViewer.tsx` - Different styling for non-graded
3. `src/lib/print/printUtils.ts` - Light blue highlight for non-graded

### Changes Required

#### Settings Modal
Add new tab "Annotation Settings" with checkbox:
```tsx
<Checkbox
  checked={enableNonGraded}
  onCheckedChange={setEnableNonGraded}
  label="Identify spelling, grammar, and punctuation errors"
  description="These annotations help students learn but do not affect the grade"
/>
```

#### VerbatimViewer Styling
```tsx
// Different underline color for non-graded
const annotationStyle = annotation.category === 'non_graded'
  ? 'border-b-2 border-blue-300'  // Light blue
  : 'border-b-2 border-yellow-400';  // Yellow for graded
```

#### Tooltip
```tsx
{annotation.category === 'non_graded' && (
  <span className="text-blue-600">ℹ️ Does not affect grade</span>
)}
```

### Testing Checklist

**Frontend:**
- [ ] Settings Modal shows new tab
- [ ] Checkbox works correctly
- [ ] Setting persists in localStorage
- [ ] VerbatimViewer shows different colors
- [ ] Tooltip indicates "Does not affect grade"
- [ ] Print view uses light blue highlight

**User Flow:**
1. Enable non-graded annotations in Settings
2. Grade a submission with errors
3. Verify light blue underlines for spelling/grammar
4. Hover to see "Does not affect grade" tooltip
5. Print and verify light blue highlights
6. Disable setting and verify no non-graded annotations on next grade

**Production:**
- [ ] Deploy to production
- [ ] Enable setting
- [ ] Grade submission
- [ ] Verify visual distinction

### Success Criteria
✅ Setting UI works correctly
✅ Visual distinction between graded and non-graded
✅ Tooltips show correct information
✅ Print view uses correct colors
✅ Setting persists across sessions

### Rollback Plan
Revert frontend files. Backend continues to work.

---

## Phase 5: Color-Coded Highlighting

**Status:** ⚪ Not Started

**Duration:** 3-4 hours

**Dependencies:** Phase 4 must be complete

### Scope
Implement color-coded highlighting for annotations with color key legend.

### Files to Modify
1. `src/lib/print/printUtils.ts` - Implement color palette and key legend
2. `src/lib/print/printStyles.ts` - Add color styles
3. `src/components/VerbatimViewer.tsx` - Apply colors in interactive view

### Changes Required

#### Color Palette
```typescript
const colorPalette = [
  { bg: '#FEF3C7', text: '#92400E', name: 'Yellow' },
  { bg: '#D1FAE5', text: '#065F46', name: 'Green' },
  { bg: '#DBEAFE', text: '#1E40AF', name: 'Blue' },
  { bg: '#E9D5FF', text: '#6B21A8', name: 'Purple' },
  { bg: '#FCE7F3', text: '#9F1239', name: 'Pink' },
  { bg: '#FED7AA', text: '#9A3412', name: 'Orange' },
  { bg: '#CCFBF1', text: '#115E59', name: 'Teal' },
  { bg: '#E0E7FF', text: '#3730A3', name: 'Indigo' },
];

// Non-graded always light blue
const nonGradedColor = { bg: '#BFDBFE', text: '#1E3A8A', name: 'Light Blue' };
```

#### Color Key Legend
Generate HTML for color key at top of print page.

### Testing Checklist

**Print View:**
- [ ] Each rubric criterion has distinct color
- [ ] Non-graded annotations use light blue
- [ ] Color key legend appears at top
- [ ] Legend shows all criteria + non-graded
- [ ] Colors are readable (good contrast)
- [ ] Works with 4-criterion rubric
- [ ] Works with 8-criterion rubric
- [ ] Works with >8 criteria (colors repeat)

**Interactive View:**
- [ ] VerbatimViewer uses same colors
- [ ] Hover shows criterion name
- [ ] Colors match print view

**Accessibility:**
- [ ] Test with colorblind simulator
- [ ] Verify text contrast meets WCAG AA
- [ ] Consider adding patterns (future)

**Production:**
- [ ] Deploy to production
- [ ] Print graded submission
- [ ] Verify colors and legend
- [ ] Test with different rubrics

### Success Criteria
✅ Each criterion has distinct color
✅ Color key legend displays correctly
✅ Colors are accessible and readable
✅ Works with any rubric size
✅ Consistent between interactive and print views

### Rollback Plan
Revert print utilities to single-color highlighting.

---

## Phase 6: Manual Annotations - Backend & Database

**Status:** ⚪ Not Started

**Duration:** 3-4 hours

**Dependencies:** Phase 5 must be complete

### Scope
Add database schema and backend APIs for teacher-added manual annotations.

### Files to Modify
1. `migrations/add_annotation_source.sql` - NEW
2. `netlify/functions/add-manual-annotation.ts` - NEW
3. `netlify/functions/update-annotation.ts` - NEW
4. `netlify/functions/delete-annotation.ts` - NEW
5. `src/lib/api/annotations.ts` - NEW API client

### Changes Required

#### Database Migration
```sql
ALTER TABLE grader.annotations 
ADD COLUMN source text DEFAULT 'ai';

COMMENT ON COLUMN grader.annotations.source 
IS 'Source of annotation: ai (LLM-generated) or manual (teacher-added)';

CREATE INDEX idx_annotations_source ON grader.annotations(source);
```

#### API Endpoints
- POST `/add-manual-annotation` - Create manual annotation
- PUT `/update-annotation` - Update manual annotation (manual only)
- DELETE `/delete-annotation` - Delete manual annotation (manual only)

### Testing Checklist

**Database:**
- [ ] Run migration
- [ ] Verify `source` column added
- [ ] Verify default value is 'ai'
- [ ] Verify index created
- [ ] Test rollback

**Backend:**
- [ ] Add manual annotation - verify saved with source='manual'
- [ ] Update manual annotation - verify updated
- [ ] Try to update AI annotation - verify rejected
- [ ] Delete manual annotation - verify deleted
- [ ] Try to delete AI annotation - verify rejected
- [ ] Get annotations - verify source field included

**API Testing:**
```bash
# Add manual annotation
curl -X POST http://localhost:8888/.netlify/functions/add-manual-annotation \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "submission_id": "$ID",
    "line_number": 5,
    "category": "ideas_development",
    "suggestion": "Consider adding more evidence here"
  }'

# Update annotation
curl -X PUT http://localhost:8888/.netlify/functions/update-annotation \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "annotation_id": "$ANNOTATION_ID",
    "suggestion": "Updated feedback"
  }'

# Delete annotation
curl -X DELETE http://localhost:8888/.netlify/functions/delete-annotation?id=$ANNOTATION_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Production:**
- [ ] Deploy migration and functions
- [ ] Test add/update/delete in production
- [ ] Verify permissions work correctly

### Success Criteria
✅ Database schema updated
✅ API endpoints work correctly
✅ Permissions enforced (can't edit/delete AI annotations)
✅ Source field tracked correctly

### Rollback Plan
```sql
ALTER TABLE grader.annotations DROP COLUMN source;
DROP INDEX idx_annotations_source;
```

---

## Phase 7: Manual Annotations - Frontend & UI

**Status:** ⚪ Not Started

**Duration:** 3-4 hours

**Dependencies:** Phase 6 must be complete

### Scope
Add UI for teachers to add, edit, and delete manual annotations.

### Files to Modify
1. `src/components/AddAnnotationForm.tsx` - NEW component
2. `src/components/VerbatimViewer.tsx` - Show manual annotations with badge
3. `src/pages/Submission.tsx` - Integrate AddAnnotationForm

### Changes Required

#### AddAnnotationForm Component
Form with fields:
- Line Number (dropdown with preview)
- Category (rubric criteria + non-graded)
- Quote (optional, auto-filled)
- Feedback (required)

#### VerbatimViewer Updates
- Show badge: "👤 Teacher" vs "🤖 AI"
- Edit button for manual annotations
- Delete button for manual annotations

### Testing Checklist

**Frontend:**
- [ ] "Add Annotation" button appears
- [ ] Form opens correctly
- [ ] Line number dropdown works
- [ ] Category dropdown shows rubric criteria
- [ ] Can add annotation
- [ ] Annotation appears immediately
- [ ] Badge shows "👤 Teacher"
- [ ] Can edit manual annotation
- [ ] Can delete manual annotation
- [ ] Cannot edit/delete AI annotations

**User Flow:**
1. Grade a submission (AI annotations appear)
2. Click "Add Annotation"
3. Select line 5
4. Select category "ideas_development"
5. Enter feedback
6. Save
7. Verify annotation appears with teacher badge
8. Edit the annotation
9. Verify changes save
10. Delete the annotation
11. Verify it's removed

**Print View:**
- [ ] Manual annotations appear in print
- [ ] No visual distinction from AI (both are feedback)
- [ ] Use same color scheme

**Production:**
- [ ] Deploy to production
- [ ] Add manual annotation
- [ ] Verify it saves and displays
- [ ] Print and verify it appears

### Success Criteria
✅ UI is intuitive and easy to use
✅ Manual annotations work correctly
✅ Edit/delete only for manual annotations
✅ Visual distinction in interactive view
✅ No distinction in print view

### Rollback Plan
Revert frontend files. Backend and database remain functional.

---

## Testing Strategy

### Unit Testing
Each phase should have unit tests for:
- Database migrations (up and down)
- API endpoints (success and error cases)
- Frontend components (render and interaction)
- Utility functions (color assignment, validation)

### Integration Testing
Test complete workflows:
- Create assignment → Grade submission → View annotations
- Enable setting → Grade → Verify behavior
- Add manual annotation → Edit → Delete

### Regression Testing
After each phase:
- [ ] Existing assignments still work
- [ ] Existing submissions still load
- [ ] Grading still works
- [ ] Print still works
- [ ] No console errors

### Performance Testing
- [ ] Grading time doesn't increase significantly
- [ ] Annotation rendering is fast (<100ms)
- [ ] Print generation is fast (<2s)
- [ ] Database queries are optimized

### Production Smoke Testing
After each deployment:
1. Create test assignment
2. Grade test submission
3. View annotations
4. Print submission
5. Check Netlify logs for errors

---

## Deployment Strategy

### Incremental Deployment
Deploy each phase independently:
1. Deploy to development branch
2. Test thoroughly
3. Deploy to staging (if available)
4. Deploy to production
5. Monitor for 24 hours
6. Proceed to next phase

### Feature Flags (Optional)
Consider adding feature flags for:
- Non-graded annotations
- Color-coded highlighting
- Manual annotations

This allows enabling/disabling features without redeployment.

### Rollback Procedures
Each phase has a documented rollback plan. If issues occur:
1. Identify the problematic phase
2. Execute rollback plan
3. Investigate issue
4. Fix and redeploy

---

## Success Metrics

### Phase 0: Annotation Category Fix
- ✅ 100% of annotations use rubric criterion IDs
- ✅ 0 generic categories in output
- ✅ Consistent headers across all sections

### Phases 1-2: Assignment Prompt
- ✅ 80%+ of new assignments include prompt
- ✅ Grading feedback references prompt requirements
- ✅ No increase in grading errors

### Phases 3-4: Non-Graded Annotations
- ✅ 70%+ of teachers enable the feature
- ✅ Average 5-10 non-graded annotations per submission
- ✅ Clear visual distinction from graded annotations

### Phase 5: Color-Coded Highlighting
- ✅ 90%+ of print views show color key
- ✅ Teachers report easier annotation review
- ✅ No accessibility complaints

### Phases 6-7: Manual Annotations
- ✅ 50%+ of teachers add at least 1 manual annotation
- ✅ Average 2-3 manual annotations per submission
- ✅ No issues with edit/delete functionality

---

## Risk Assessment

### High Risk
- **Phase 0**: Changes core grading logic - extensive testing required
- **Phase 3**: Non-graded annotations may confuse LLM - monitor quality

### Medium Risk
- **Phase 5**: Color palette may not work for all rubrics - need flexibility
- **Phase 6**: Manual annotations add complexity - need good UX

### Low Risk
- **Phase 1-2**: Assignment prompt is additive - low impact
- **Phase 4**: Frontend changes are isolated - easy to rollback
- **Phase 7**: Manual annotation UI is optional feature

---

## Communication Plan

### Stakeholders
- Teachers (end users)
- Development team
- QA team
- Product owner

### Updates
- **Before each phase**: Announce upcoming changes
- **During development**: Daily standup updates
- **After deployment**: Release notes and demo
- **Issues**: Immediate communication and status updates

### Documentation
- Update user guide after each phase
- Create video tutorials for new features
- Update API documentation
- Maintain changelog

---

## Conclusion

This phased approach ensures:
- ✅ Each feature is independently testable
- ✅ Incremental value delivery
- ✅ Reduced risk of major issues
- ✅ Clear rollback procedures
- ✅ Manageable scope per phase

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 0 (Annotation Category Fix)
3. Test thoroughly before proceeding
4. Deploy incrementally to production
5. Monitor and iterate

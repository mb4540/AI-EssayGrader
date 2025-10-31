# Grading Plan - Rubric Integration Fix

**Created:** October 31, 2025  
**Priority:** CRITICAL - Bulletproof grading not using actual rubric  
**Status:** Planning

---

## 🔴 Problem Identified

### Current Behavior (WRONG)
1. Teacher enters detailed rubric in "Grading Criteria" field:
   ```
   **Scoring (100 pts total):**
   - Focus and Content (30 pts)
   - Conflict and Resolution (20 pts)
   - Character Development (15 pts)
   - Narrative Techniques (15 pts)
   - Structure (20 pts)
   - Language Conventions (10 pts)
   ```

2. Bulletproof grading **ignores this rubric** and creates default:
   - organization: 25.0 pts (Exemplary)
   - grammar: 20.0 pts (Proficient)
   - Result: 45.00/50.00 = 90.00%

3. **The actual rubric is never used!**

### Root Cause
Looking at `grade-bulletproof.ts` line ~125:
```typescript
} else {
  // Create default rubric from teacher criteria
  rubric = createDefaultRubric(assignment_id || 'default', teacher_criteria);
}
```

The `createDefaultRubric()` function does **keyword matching** instead of **parsing the actual rubric structure**.

---

## 🎯 Solution Overview

### Phase 1: Parse Teacher's Rubric Text (IMMEDIATE)
**Goal:** Extract rubric structure from the "Grading Criteria" text field

**Steps:**
1. Create `rubricParser.ts` to parse text rubrics
2. Support multiple formats:
   - Point-based: "Category (XX pts):"
   - Percentage-based: "Category (XX%):"
   - Mixed formats
3. Extract:
   - Category names
   - Point values
   - Level descriptions (if provided)
4. Generate structured `RubricJSON`

### Phase 2: Connect AI Prompts to Rubric (CRITICAL)
**Goal:** Ensure LLM grades according to the parsed rubric

**Current Prompt Issues:**
- "Essay Grading System Prompt" (localStorage) is generic
- Doesn't reference specific rubric categories
- Doesn't enforce point allocations

**New Prompt Strategy:**
1. Build dynamic prompt that includes rubric structure
2. Instruct LLM to score each category explicitly
3. Enforce point ranges per category
4. Use "Rubric Enhancement Prompt" to expand simple rules

### Phase 3: Prompt Storage & Management
**Goal:** Centralize prompt management

**Current State:**
- Prompts stored in localStorage (browser-specific)
- `getCustomPrompts()` in `api.ts` retrieves them
- Not synced across devices
- Not stored in database

**Proposed:**
1. Move prompts to database (per-tenant)
2. Create `prompts` table
3. Sync with localStorage for offline use
4. Allow per-assignment prompt overrides

---

## 📋 Detailed Implementation Plan

### Task 1: Create Rubric Parser

**File:** `src/lib/calculator/rubricParser.ts`

**Function:** `parseTeacherRubric(criteriaText: string, totalPoints?: number): RubricJSON`

**Logic:**
```typescript
1. Detect format:
   - Look for "XX pts" or "XX points" → point-based
   - Look for "XX%" → percentage-based
   - Look for "Total: XX" → extract total

2. Extract categories:
   - Regex: /[-*]\s*\*\*(.+?)\s*\((\d+)\s*pts?\)/gi
   - Example: "**Focus and Content (30 pts):**" → { name: "Focus and Content", points: 30 }

3. Extract level descriptions (if present):
   - Look for indented bullet points under each category
   - Parse point ranges: "25-30 pts: Clear focus..."
   - Create Level objects

4. Generate default levels if not specified:
   - Exemplary: 90-100% of max points
   - Proficient: 75-89%
   - Developing: 60-74%
   - Beginning: 0-59%

5. Build RubricJSON:
   - Set scale.mode based on format
   - Set total_points if specified
   - Default rounding: HALF_UP, 2 decimals
```

**Example Input:**
```
**Scoring (100 pts total):**
- **Focus and Content (30 pts):**
  - 25-30 pts: Clear focus on specific event
  - 20-24 pts: Good focus but lacks depth
  - 15-19 pts: Vague focus
  - 0-14 pts: No clear focus

- **Conflict and Resolution (20 pts):**
  - 16-20 pts: Engaging conflict with resolution
  - 11-15 pts: Present conflict, weak resolution
```

**Example Output:**
```json
{
  "rubric_id": "parsed-assignment-123",
  "title": "Personal Narrative Rubric",
  "criteria": [
    {
      "id": "focus_and_content",
      "name": "Focus and Content",
      "max_points": "30.0",
      "weight": "1.0",
      "levels": [
        { "label": "Exemplary", "points": "27.5", "descriptor": "Clear focus on specific event" },
        { "label": "Proficient", "points": "22.0", "descriptor": "Good focus but lacks depth" },
        { "label": "Developing", "points": "17.0", "descriptor": "Vague focus" },
        { "label": "Beginning", "points": "7.0", "descriptor": "No clear focus" }
      ]
    }
  ],
  "scale": {
    "mode": "points",
    "total_points": "100.0",
    "rounding": { "mode": "HALF_UP", "decimals": 2 }
  }
}
```

---

### Task 2: Update Extractor Prompt

**File:** `src/lib/prompts/extractor.ts`

**Current Issue:**
```typescript
// Current prompt is generic
export function buildExtractorPrompt(rubric: RubricJSON, essayText: string) {
  // Lists criteria but doesn't emphasize scoring rules
}
```

**New Approach:**
```typescript
export function buildExtractorPrompt(
  rubric: RubricJSON, 
  essayText: string,
  customGradingPrompt?: string  // From AI Prompt Settings
): string {
  
  // 1. Include custom grading philosophy if provided
  const gradingPhilosophy = customGradingPrompt || DEFAULT_GRADING_PHILOSOPHY;
  
  // 2. Build detailed criterion descriptions with point ranges
  const criteriaDescriptions = rubric.criteria.map(c => {
    const levelsDesc = c.levels.map(l => 
      `    ${l.label} (${l.points} pts): ${l.descriptor}`
    ).join('\n');
    
    return `
  ${c.name} (${c.id}) - MAX: ${c.max_points} points
  ${levelsDesc}
  
  IMPORTANT: You must award between 0 and ${c.max_points} points for this criterion.
  Choose the level that best matches the essay quality.`;
  }).join('\n\n');
  
  // 3. Emphasize total points constraint
  const totalPoints = rubric.scale.total_points || 
    rubric.criteria.reduce((sum, c) => sum + parseFloat(c.max_points), 0);
  
  return `
${gradingPhilosophy}

RUBRIC: "${rubric.title}"
TOTAL POINTS POSSIBLE: ${totalPoints}

CRITERIA TO EVALUATE:
${criteriaDescriptions}

STUDENT ESSAY:
<<<
${essayText}
>>>

TASK:
Evaluate the essay against EACH criterion above. For each criterion:
1. Read the level descriptions carefully
2. Choose the level that BEST matches the essay
3. Award the EXACT points for that level
4. Provide specific rationale citing evidence from the essay

CRITICAL RULES:
- Award points ONLY from the levels defined above
- Do NOT calculate totals or percentages (calculator will do this)
- Do NOT award points outside the defined ranges
- Be consistent with the level descriptions
- Cite specific examples from the essay in your rationale

OUTPUT ONLY THIS JSON:
{
  "submission_id": "${submissionId}",
  "scores": [
    {
      "criterion_id": "string",
      "level": "string",
      "points_awarded": "string",
      "rationale": "string"
    }
  ],
  "notes": "string or null"
}`;
}
```

---

### Task 3: Integrate Parser with Grading Workflow

**File:** `netlify/functions/grade-bulletproof.ts`

**Current Code (lines ~115-130):**
```typescript
// Get or create rubric
let rubric: RubricJSON;

if (rubric_json && isValidRubric(rubric_json)) {
  rubric = rubric_json as RubricJSON;
} else {
  // ❌ PROBLEM: Uses keyword matching instead of parsing
  rubric = createDefaultRubric(assignment_id || 'default', teacher_criteria);
}
```

**New Code:**
```typescript
import { parseTeacherRubric } from '../../src/lib/calculator/rubricParser';

// Get or create rubric
let rubric: RubricJSON;

if (rubric_json && isValidRubric(rubric_json)) {
  // Use existing structured rubric from assignment
  rubric = rubric_json as RubricJSON;
} else if (teacher_criteria && teacher_criteria.trim().length > 0) {
  // ✅ SOLUTION: Parse the teacher's rubric text
  try {
    rubric = parseTeacherRubric(teacher_criteria, total_points);
    
    // Override scale settings if provided in assignment
    if (scale_mode) rubric.scale.mode = scale_mode;
    if (total_points) rubric.scale.total_points = total_points.toString();
    if (rounding_mode) rubric.scale.rounding.mode = rounding_mode;
    if (rounding_decimals !== null) rubric.scale.rounding.decimals = rounding_decimals;
    
  } catch (parseError) {
    console.warn('Failed to parse teacher rubric, using default:', parseError);
    rubric = createDefaultRubric(assignment_id || 'default', teacher_criteria);
  }
} else {
  // Fallback: No criteria provided
  throw new Error('No grading criteria provided. Please add criteria to grade this submission.');
}
```

---

### Task 4: Connect AI Prompt Settings to Grading

**Current Flow:**
1. User edits prompts in AI Prompt Settings modal
2. Prompts saved to localStorage via `setCustomPrompts()`
3. `gradeSubmission()` retrieves via `getCustomPrompts()`
4. Sent to backend as `customGradingPrompt`

**Problem:**
- `grade-bulletproof.ts` doesn't use `customGradingPrompt` parameter
- Extractor prompt is hardcoded

**Solution:**

**File:** `netlify/functions/grade-bulletproof.ts` (line ~165)

**Current:**
```typescript
const extractorPrompt = draft_mode === 'comparison'
  ? buildComparisonExtractorPrompt(rubric, rough_draft_text, final_draft_text, submission_id)
  : buildExtractorPrompt(rubric, essayText, submission_id);
```

**New:**
```typescript
// Get custom grading prompt from request body
const customGradingPrompt = body.grading_prompt;

// Build extractor prompt with custom grading philosophy
const extractorPrompt = draft_mode === 'comparison'
  ? buildComparisonExtractorPrompt(
      rubric, 
      rough_draft_text, 
      final_draft_text, 
      submission_id,
      customGradingPrompt  // ✅ Pass custom prompt
    )
  : buildExtractorPrompt(
      rubric, 
      essayText, 
      submission_id,
      customGradingPrompt  // ✅ Pass custom prompt
    );
```

**Update extractor.ts signatures:**
```typescript
export function buildExtractorPrompt(
  rubric: RubricJSON,
  essayText: string,
  submissionId: string,
  customGradingPrompt?: string  // ✅ Add parameter
): string {
  const gradingPhilosophy = customGradingPrompt || EXTRACTOR_SYSTEM_MESSAGE;
  // ... rest of prompt
}
```

---

### Task 5: Improve Rubric Enhancement Prompt

**Current "Rubric Enhancement Prompt":**
```
You are an expert educator helping teachers create detailed, effective grading rubrics.

Your task: Transform simple grading rules into a clear, comprehensive rubric that:
- Uses a 100-point scale
- Breaks down into specific categories with point values
- Provides clear criteria for each category
- Is concise but thorough (aim for 150-300 words)
- Uses bullet points for easy scanning
- Includes any penalties if relevant
```

**Problem:**
- This is for **creating** rubrics, not **grading** with them
- Not connected to actual grading workflow

**Proposed Use:**
1. **Rubric Enhancement** = Help teacher expand simple rules into detailed rubric
2. **Essay Grading Prompt** = Philosophy for how to grade (tone, fairness, etc.)
3. **Extractor Prompt** = Technical instructions for LLM (built dynamically)

**Keep separate:**
- Rubric Enhancement: UI feature to help create rubrics
- Essay Grading: Grading philosophy/tone
- Extractor: Technical scoring instructions (auto-generated)

---

## 🔧 Implementation Order

### Sprint 1: Critical Path (2-3 hours)
1. ✅ Create `rubricParser.ts` with text parsing logic
2. ✅ Update `buildExtractorPrompt()` to include custom grading prompt
3. ✅ Integrate parser into `grade-bulletproof.ts`
4. ✅ Test with actual rubric from screenshot

### Sprint 2: Testing & Refinement (1-2 hours)
1. Test with various rubric formats
2. Handle edge cases (missing points, malformed text)
3. Add validation and error messages
4. Update frontend to show parsed rubric preview

### Sprint 3: Prompt Management (Future)
1. Move prompts to database
2. Add per-assignment prompt overrides
3. Sync across devices
4. Version control for prompts

---

## 🧪 Test Cases

### Test 1: Point-Based Rubric (Screenshot Example)
**Input:**
```
**Scoring (100 pts total):**
- **Focus and Content (30 pts):**
  - 25-30 pts: Clear focus
  - 20-24 pts: Good focus
- **Conflict and Resolution (20 pts):**
  - 16-20 pts: Engaging conflict
```

**Expected:**
- Parse 6 categories with correct point values
- Total = 100 points
- Generate levels for each category
- LLM awards points within defined ranges

### Test 2: Percentage-Based Rubric
**Input:**
```
Grading:
- Grammar (40%)
- Content (60%)
Total: 50 points
```

**Expected:**
- Convert percentages to points (20 pts, 30 pts)
- Total = 50 points
- Generate default levels

### Test 3: Simple Rules (Fallback)
**Input:**
```
Check grammar, organization, and evidence. Total 100 points.
```

**Expected:**
- Use keyword matching (current behavior)
- Create default 4-category rubric
- Total = 100 points

---

## 📊 Success Metrics

- [ ] Parsed rubric matches teacher's intent
- [ ] LLM awards points within defined ranges
- [ ] Final grade matches rubric structure
- [ ] Breakdown shows correct categories and points
- [ ] Custom grading prompt affects LLM tone/approach
- [ ] Works with multiple rubric formats

---

## 🚀 Next Steps

1. **IMMEDIATE:** Create `rubricParser.ts`
2. **IMMEDIATE:** Update `buildExtractorPrompt()` 
3. **IMMEDIATE:** Integrate parser into `grade-bulletproof.ts`
4. **TEST:** Grade essay from screenshot with actual rubric
5. **VERIFY:** Breakdown shows correct categories (Focus, Conflict, etc.)
6. **DEPLOY:** Push to production for beta testing

---

## 📝 Notes

- The bulletproof calculator is working correctly (45/50 = 90%)
- The problem is **input** (wrong rubric), not **calculation**
- Parser must be robust to handle various text formats
- Custom prompts should affect **tone**, not **structure**
- Extractor prompt should be **generated**, not customizable

# Plan: Make Grading & Annotations Rubric-Driven (Not ELAR-Specific)

**Created:** November 14, 2025  
**Status:** Planning  
**Priority:** HIGH - Affects all non-ELAR teachers

---

## 🎯 Problem Statement

### Current Issue
The Essay Grading System Prompt is hardcoded with ELAR-specific criteria:
```
Focus on: grammar, spelling, punctuation, capitalization, sentence structure, 
organization, evidence quality, and clarity.
```

**Problems:**
1. ❌ Assumes all assignments are writing/essays
2. ❌ Hardcoded ELAR criteria (grammar, spelling, etc.)
3. ❌ Doesn't work for math, science, history, or other subjects
4. ❌ Annotations are also ELAR-focused
5. ❌ Ignores the actual rubric criteria provided by the teacher

### Impact
- Math teachers can't use this for problem-solving rubrics
- Science teachers can't use this for lab reports with different criteria
- History teachers can't use this for analysis papers
- ANY teacher with custom rubric criteria is limited

---

## 💡 Proposed Solution

### Core Principle
**Grade ONLY based on the provided rubric. Let the rubric define what matters.**

### New Approach
1. **Rubric-First Grading** - AI focuses on rubric criteria, not hardcoded ELAR items
2. **Subject-Agnostic** - Works for ANY subject or assignment type
3. **Flexible Annotations** - Annotations based on rubric categories, not just grammar
4. **Teacher Control** - Teacher's rubric defines what gets graded and annotated

---

## 📋 Implementation Plan

### PHASE 1: Update Grading Prompt (30 min)

**File:** `src/components/SettingsModal.tsx`

**Current Prompt:**
```
Focus on: grammar, spelling, punctuation, capitalization, sentence structure, 
organization, evidence quality, and clarity.
```

**New Prompt:**
```
Grade STRICTLY according to the provided rubric criteria. The rubric defines what 
matters for this assignment. Focus your evaluation on the specific categories and 
criteria outlined in the rubric.

For each rubric category:
- Evaluate the student's work against the stated criteria
- Provide specific examples from the student's work
- Explain why points were awarded or deducted
- Reference the rubric's performance levels

If the rubric includes writing mechanics (grammar, spelling, etc.), evaluate those.
If the rubric focuses on content, analysis, or problem-solving, evaluate those instead.
Let the RUBRIC guide your focus, not assumptions about the assignment type.
```

**Changes:**
- Remove hardcoded ELAR criteria list
- Emphasize rubric-driven evaluation
- Make it clear the rubric defines what matters
- Support any subject/assignment type

---

### PHASE 2: Update Annotation Logic (1 hour)

**Current State:**
Annotations are likely hardcoded to look for:
- Grammar errors
- Spelling mistakes
- Punctuation issues
- Sentence structure problems

**New Approach:**
Annotations should be based on rubric categories:

**Example Rubric Categories → Annotation Types:**
- **"Ideas & Development"** → Annotate weak thesis, unsupported claims
- **"Mathematical Reasoning"** → Annotate incorrect steps, missing work
- **"Evidence & Analysis"** → Annotate missing citations, weak analysis
- **"Lab Procedure"** → Annotate safety issues, missing steps
- **"Grammar & Mechanics"** → Annotate grammar/spelling (if in rubric)

**Implementation:**
1. Parse rubric categories from `rubric_json`
2. Pass category names to annotation prompt
3. AI creates annotations relevant to those categories
4. Display annotations grouped by rubric category

**Files to Update:**
- `netlify/functions/grade-bulletproof-background.ts` - Update grading prompt
- `netlify/functions/get-inline-annotations.ts` - Update annotation prompt
- `src/components/AnnotationViewer.tsx` - Group annotations by rubric category

---

### PHASE 3: Update Default Grading Prompt (15 min)

**File:** `src/components/SettingsModal.tsx`

**New DEFAULT_GRADING_PROMPT:**
```typescript
const DEFAULT_GRADING_PROMPT = `You are a professional evaluator. Grade strictly according to the provided rubric and teacher's criteria.

CRITICAL RULES:
1. Evaluate ONLY the criteria specified in the rubric
2. The rubric defines what matters - not assumptions about assignment type
3. Preserve the student's original words; do not rewrite their work
4. Provide clear, direct, constructive feedback with concrete examples
5. Reference specific rubric criteria in your feedback
6. Be honest about weaknesses while acknowledging strengths
7. Use professional language appropriate for educational feedback
8. Never include personal data about the student

GRADING APPROACH:
- For each rubric category, evaluate against the stated criteria
- Provide specific examples from the student's work
- Explain why points were awarded or deducted
- Reference the rubric's performance levels
- If the rubric emphasizes content, focus on content
- If the rubric emphasizes mechanics, focus on mechanics
- Let the RUBRIC guide your evaluation, not the assignment type`;
```

---

### PHASE 4: Update Annotation Prompt (30 min)

**File:** `netlify/functions/get-inline-annotations.ts`

**Current Approach:**
Likely hardcoded to find grammar/spelling errors

**New Approach:**
```typescript
const annotationPrompt = `Create inline annotations for this student work based on the rubric criteria.

RUBRIC CATEGORIES:
${rubricCategories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n')}

ANNOTATION RULES:
1. Focus on issues related to the rubric categories above
2. Annotate specific problems that affect the grade
3. Provide constructive suggestions for improvement
4. Tag each annotation with the relevant rubric category
5. Be specific and actionable

For each annotation:
- Identify the issue
- Explain why it matters (reference rubric criteria)
- Suggest how to improve
- Tag with rubric category name

Create 5-15 annotations focusing on the most impactful issues.`;
```

**Changes:**
- Pass rubric categories to annotation function
- AI creates annotations relevant to those categories
- Each annotation tagged with rubric category
- No hardcoded ELAR assumptions

---

### PHASE 5: Update Annotation Display (45 min)

**File:** `src/components/AnnotationViewer.tsx`

**New Features:**
1. **Group annotations by rubric category**
   ```
   Ideas & Development (3 annotations)
   ├─ Weak thesis statement
   ├─ Unsupported claim
   └─ Missing conclusion
   
   Evidence & Analysis (2 annotations)
   ├─ Missing citation
   └─ Weak analysis
   ```

2. **Category-based filtering**
   - Filter annotations by rubric category
   - Show/hide categories
   - Color-code by category

3. **Category-specific icons**
   - Different icons for different rubric categories
   - Visual distinction between annotation types

---

## 🧪 Testing Strategy

### Test Cases

**Test 1: ELAR Essay (Current Use Case)**
- Rubric: Grammar, Organization, Evidence, Clarity
- Expected: Works as before, annotations on grammar/organization
- Verify: No regression

**Test 2: Math Problem Set**
- Rubric: Correct Answer, Work Shown, Mathematical Reasoning, Explanation
- Expected: Annotations on incorrect steps, missing work, reasoning errors
- Verify: NO grammar annotations (unless in rubric)

**Test 3: Science Lab Report**
- Rubric: Hypothesis, Procedure, Data Analysis, Conclusion, Safety
- Expected: Annotations on missing steps, weak analysis, safety issues
- Verify: Focus on scientific method, not writing mechanics

**Test 4: History Analysis**
- Rubric: Thesis, Historical Evidence, Analysis, Contextualization
- Expected: Annotations on weak thesis, missing evidence, poor analysis
- Verify: Focus on historical thinking, not grammar

**Test 5: Custom Rubric (Any Subject)**
- Rubric: Teacher's custom categories
- Expected: Annotations match those categories
- Verify: AI adapts to any rubric structure

---

## 📊 Benefits

### For Teachers
- ✅ Works for ANY subject, not just ELAR
- ✅ Rubric defines what matters
- ✅ Consistent grading based on their criteria
- ✅ Annotations relevant to their rubric
- ✅ More control over grading focus

### For Students
- ✅ Feedback aligned with rubric
- ✅ Clear connection between feedback and grade
- ✅ Annotations help improve on rubric criteria
- ✅ Fair grading based on stated expectations

### For Product
- ✅ Expands to ALL subjects
- ✅ More flexible and powerful
- ✅ Better alignment with educational best practices
- ✅ Competitive advantage

---

## 🚨 Risks & Mitigation

### Risk 1: Rubric Quality
**Problem:** If rubric is vague, AI might struggle  
**Mitigation:** 
- Provide rubric best practices in UI
- "Enhance with AI" creates detailed rubrics
- Show examples of good rubrics

### Risk 2: Backward Compatibility
**Problem:** Existing users expect ELAR focus  
**Mitigation:**
- ELAR rubrics will still work (they'll include grammar/mechanics)
- Default rubrics include writing mechanics
- Settings allow customization

### Risk 3: Annotation Quality
**Problem:** AI might create irrelevant annotations  
**Mitigation:**
- Test with diverse rubrics
- Limit to 5-15 most impactful annotations
- Allow teachers to review/edit annotations

---

## 📝 Implementation Checklist

### Phase 1: Grading Prompt
- [ ] Update DEFAULT_GRADING_PROMPT in SettingsModal.tsx
- [ ] Remove hardcoded ELAR criteria
- [ ] Add rubric-first language
- [ ] Test with ELAR rubric (verify no regression)
- [ ] Test with math rubric (verify it works)

### Phase 2: Annotation Logic
- [ ] Update get-inline-annotations.ts
- [ ] Parse rubric categories from rubric_json
- [ ] Pass categories to AI prompt
- [ ] Tag annotations with category
- [ ] Return category metadata with annotations

### Phase 3: Annotation Display
- [ ] Update AnnotationViewer.tsx
- [ ] Group annotations by category
- [ ] Add category filtering
- [ ] Add category-specific icons
- [ ] Test UI with different rubrics

### Phase 4: Testing
- [ ] Test ELAR essay (regression test)
- [ ] Test math problem set
- [ ] Test science lab report
- [ ] Test history analysis
- [ ] Test custom rubric

### Phase 5: Documentation
- [ ] Update Help documentation
- [ ] Add rubric best practices guide
- [ ] Update Settings modal help text
- [ ] Create example rubrics for different subjects

---

## 🎯 Success Criteria

**Definition of Done:**
1. ✅ Grading prompt is rubric-driven, not ELAR-specific
2. ✅ Annotations based on rubric categories
3. ✅ Works for math, science, history, and other subjects
4. ✅ No regression for ELAR teachers
5. ✅ All test cases pass
6. ✅ Documentation updated
7. ✅ Deployed to production
8. ✅ User feedback confirms it works for non-ELAR subjects

---

## 📅 Timeline

**Estimated Time:** 3-4 hours total

- Phase 1: Grading Prompt (30 min)
- Phase 2: Annotation Logic (1 hour)
- Phase 3: Annotation Display (45 min)
- Phase 4: Testing (1 hour)
- Phase 5: Documentation (30 min)

**Recommended Approach:**
1. Start with Phase 1 (quick win, immediate impact)
2. Deploy and test with real users
3. Gather feedback
4. Implement Phases 2-3 based on feedback
5. Full testing and deployment

---

## 💭 Future Enhancements (Optional)

### Smart Annotation Suggestions
- AI suggests annotation types based on rubric
- "Your rubric includes 'Mathematical Reasoning' - would you like annotations on calculation errors?"

### Rubric Templates by Subject
- Pre-built rubrics for common assignment types
- Math: Problem Sets, Proofs, Projects
- Science: Lab Reports, Research Papers, Presentations
- History: Essays, Document Analysis, Timelines

### Category-Specific Feedback Styles
- Math: Step-by-step error identification
- Science: Hypothesis-driven feedback
- History: Evidence-based critique
- ELAR: Writing mechanics and organization

---

## 📚 Related Files

**Files to Modify:**
- `src/components/SettingsModal.tsx` - Update DEFAULT_GRADING_PROMPT
- `netlify/functions/grade-bulletproof-background.ts` - Update grading logic
- `netlify/functions/get-inline-annotations.ts` - Update annotation logic
- `src/components/AnnotationViewer.tsx` - Update annotation display

**Files to Reference:**
- `src/lib/calculator/rubricParser.ts` - Parse rubric categories
- `src/lib/calculator/types.ts` - RubricJSON structure
- `netlify/functions/enhance-rubric.ts` - Rubric enhancement

---

## 🎓 Example Transformations

### Before (ELAR-Specific)
```
Focus on: grammar, spelling, punctuation, capitalization, sentence structure, 
organization, evidence quality, and clarity.
```

**Annotations:**
- Grammar error on line 5
- Spelling mistake: "recieve"
- Missing comma after introductory phrase

### After (Rubric-Driven)

**Math Rubric:** Correct Answer (25%), Work Shown (25%), Reasoning (25%), Explanation (25%)

**Annotations:**
- [Correct Answer] Final answer is incorrect - check step 3
- [Work Shown] Missing intermediate steps between lines 2-3
- [Reasoning] Incorrect application of quadratic formula
- [Explanation] Need to explain why you chose this method

**Science Rubric:** Hypothesis (20%), Procedure (20%), Data (20%), Analysis (20%), Conclusion (20%)

**Annotations:**
- [Hypothesis] Hypothesis is not testable - needs measurable outcome
- [Procedure] Missing safety precautions for chemical handling
- [Data Analysis] Graph needs labeled axes and units
- [Conclusion] Conclusion doesn't address original hypothesis

---

## ✅ Next Steps

1. **Review this plan** - Get user approval
2. **Start with Phase 1** - Quick win, immediate impact
3. **Test with real rubrics** - Verify it works across subjects
4. **Iterate based on feedback** - Refine prompts and logic
5. **Full implementation** - Complete all phases
6. **Deploy and monitor** - Gather user feedback

---

**Questions for User:**
1. Should we start with Phase 1 (grading prompt update) immediately?
2. Do you have example rubrics from math/science teachers we can test with?
3. Should annotations be grouped by rubric category in the UI?
4. Any other subjects/use cases we should consider?

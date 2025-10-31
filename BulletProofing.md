# BulletProofing Plan: Deterministic Grading with Python Calculator

**Created:** October 31, 2025  
**Branch:** `feature/bulletproof-grading`  
**Status:** Ready for Implementation  
**Priority:** 🔥 CRITICAL

---

## 🎯 Mission

Make essay grading **numerically bulletproof** by separating LLM reasoning from mathematical calculations. The LLM chooses levels and provides rationales; a deterministic Python tool handles all math.

## Core Philosophy

> **"LLM for language, tools for math."**

- LLM **never** sums points or calculates totals
- LLM **only** selects per-criterion levels and rationales
- Python calculator **always** handles: totals, scaling, rounding, validation
- Use **Decimal** everywhere (Python + Postgres) to eliminate float drift

---

## 🏗️ Architecture (No LangGraph)

### Sequential Controller Pattern

```
1. Load Rubric (from DB or assignment)
   ↓
2. LLM Extractor → Structured JSON (per-criterion scores + rationales)
   ↓
3. Validate/Repair → Schema enforcement, range checks
   ↓
4. Python Calculator Tool → Deterministic math (Decimal-based)
   ↓
5. LLM Feedback Generator → Teacher/student comments
   ↓
6. Save Artifacts → Audit trail (rubric + scores + computed + metadata)
```

**Implementation:** Single synchronous Netlify Function (FastAPI or similar)

---

## 📊 Data Contracts

### Rubric Schema (store in `assignments` table)

```json
{
  "rubric_id": "UUID",
  "title": "6th Grade Personal Narrative",
  "scale": {
    "mode": "percent|points",
    "total_points": 100,
    "rounding": { "mode": "HALF_UP", "decimals": 2 }
  },
  "criteria": [
    {
      "id": "organization",
      "name": "Organization",
      "max_points": "25.0",
      "weight": "1.00",
      "levels": [
        {"label":"Exemplary","points":"25.0","descriptor":"Clear structure..."},
        {"label":"Proficient","points":"20.0","descriptor":"Mostly organized..."},
        {"label":"Developing","points":"15.0","descriptor":"Some organization..."},
        {"label":"Beginning","points":"10.0","descriptor":"Limited organization..."},
        {"label":"No Evidence","points":"0.0","descriptor":"Not present"}
      ]
    }
  ]
}
```

### LLM Extractor Output (Structured JSON)

```json
{
  "submission_id": "UUID",
  "scores": [
    {
      "criterion_id": "organization",
      "level": "Proficient",
      "points_awarded": "20.0",
      "rationale": "Essay has clear introduction and conclusion..."
    }
  ],
  "notes": "Optional global comments"
}
```

### Calculator Output

```json
{
  "raw_points": "75.0",
  "max_points": "100.0",
  "percent": "75.00",
  "final_points": "37.5"
}
```

---

## 🔧 Implementation Tasks

### Phase 1: Python Calculator Tool (Week 1)

#### Task 1.1: Create Python Calculator Module
- [ ] Create `netlify/functions/python/calculator.py`
- [ ] Implement Decimal-based math (no float operations)
- [ ] Support percent mode: `(raw / max) * 100`
- [ ] Support points mode: `(raw / max) * total_points`
- [ ] Implement rounding modes: HALF_UP, HALF_EVEN, HALF_DOWN
- [ ] Add weight support for weighted criteria
- [ ] Range validation: `0 <= points_awarded <= max_points`

**Files:**
- New: `netlify/functions/python/calculator.py`
- New: `netlify/functions/python/models.py` (Pydantic schemas)
- New: `netlify/functions/python/requirements.txt`

**Time:** 4-6 hours

#### Task 1.2: Unit Tests for Calculator
- [ ] Test full points scenario
- [ ] Test zero points scenario  
- [ ] Test mixed weights
- [ ] Test rounding modes (HALF_UP, HALF_EVEN)
- [ ] Test large total_points (e.g., 500)
- [ ] Test small total_points (e.g., 5)
- [ ] Test invalid inputs (negative, over max)

**Files:**
- New: `netlify/functions/python/test_calculator.py`

**Time:** 2-3 hours

---

### Phase 2: LLM Integration (Week 2)

#### Task 2.1: Create Structured Extractor Prompt
- [ ] Design system prompt that outputs strict JSON
- [ ] Include rubric schema in prompt context
- [ ] Enforce: LLM only chooses levels, no math
- [ ] Add examples of valid ExtractedScores JSON
- [ ] Test with various essay types

**Prompt Template:**
```
You are a rubric scorer. Output valid JSON matching ExtractedScores schema.
Do NOT sum or average. Choose a level and points for EACH criterion.
Points must be within [0, max_points].

Rubric:
{{RUBRIC_JSON}}

Essay:
{{ESSAY_TEXT}}

Output only JSON:
{
  "submission_id": "...",
  "scores": [ ... ],
  "notes": "..."
}
```

**Files:**
- Update: `netlify/functions/grade.ts`
- New: `src/lib/prompts/extractor.ts`

**Time:** 3-4 hours

#### Task 2.2: JSON Validation & Repair
- [ ] Implement Pydantic validation in Python
- [ ] Add schema enforcement before calculator
- [ ] Implement retry logic (max 2 attempts)
- [ ] Add repair prompt for schema violations
- [ ] Log validation failures

**Files:**
- Update: `netlify/functions/python/calculator.py`
- New: `netlify/functions/python/validator.py`

**Time:** 2-3 hours

---

### Phase 3: Integration & Testing (Week 2-3)

#### Task 3.1: Update Grade Function
- [ ] Modify `grade.ts` to call Python calculator
- [ ] Pass rubric + extracted scores to calculator
- [ ] Handle calculator responses
- [ ] Store calculator version in audit trail
- [ ] Add error handling for calculator failures

**Files:**
- Update: `netlify/functions/grade.ts`

**Time:** 3-4 hours

#### Task 3.2: Database Schema Updates
- [ ] Add `rubric_json` column to assignments table
- [ ] Add `scale_mode` (percent/points) to assignments
- [ ] Add `total_points` to assignments
- [ ] Add `rounding_mode` and `rounding_decimals`
- [ ] Add `computed_scores` jsonb column to submissions
- [ ] Add `calculator_version` to submissions

**Migration:**
```sql
ALTER TABLE grader.assignments
ADD COLUMN rubric_json jsonb,
ADD COLUMN scale_mode text CHECK (scale_mode IN ('percent', 'points')) DEFAULT 'percent',
ADD COLUMN total_points numeric(10,4),
ADD COLUMN rounding_mode text DEFAULT 'HALF_UP',
ADD COLUMN rounding_decimals integer DEFAULT 2;

ALTER TABLE grader.submissions
ADD COLUMN computed_scores jsonb,
ADD COLUMN calculator_version text;
```

**Files:**
- New: `migrations/add_bulletproof_grading.sql`
- Update: `db_ref.md`

**Time:** 2 hours

#### Task 3.3: Frontend Display Updates
- [ ] Display raw points, max points, percent
- [ ] Display final points (if points mode)
- [ ] Show per-criterion breakdown with rationales
- [ ] Add "Explain the math" section
- [ ] Show rounding mode used

**UI Example:**
```
Organization: 20/25 pts (Proficient)
Rationale: Essay has clear introduction...

RAW SCORE: 75.0 / 100.0 points
PERCENT: 75.00%
FINAL SCORE: 37.5 / 50 points (HALF_UP, 2 decimals)
```

**Files:**
- Update: `src/pages/Submission.tsx`

**Time:** 3-4 hours

---

### Phase 4: Audit Trail & Observability (Week 3)

#### Task 4.1: Store Audit Artifacts
- [ ] Save rubric JSON with submission
- [ ] Save extracted scores JSON
- [ ] Save computed scores JSON
- [ ] Save calculator version/hash
- [ ] Save LLM model version
- [ ] Add timestamps for each step

**Files:**
- Update: `netlify/functions/grade.ts`
- New: `netlify/functions/save-audit.ts`

**Time:** 2 hours

#### Task 4.2: Logging & Monitoring
- [ ] Log validation failures
- [ ] Log calculator errors
- [ ] Log retry attempts
- [ ] Track success/failure rates
- [ ] Alert on repeated failures

**Files:**
- Update: `netlify/functions/grade.ts`

**Time:** 1-2 hours

---

## 🔒 Guardrails for Accuracy

### LLM Guardrails
1. **Structured Output:** JSON schema enforcement with Pydantic
2. **Range Checks:** Reject points outside `[0, max_points]`
3. **Schema Validation:** Retry with repair prompt on violations (max 2 attempts)
4. **Level Consistency:** Validate level label matches points_awarded

### Calculator Guardrails
1. **Decimal Math:** No float operations (use Python Decimal)
2. **Unit Tests:** Comprehensive test coverage
3. **Deterministic:** Same inputs always produce same outputs
4. **Auditable:** Log all inputs and outputs

### Database Guardrails
1. **numeric(10,4):** Use Postgres numeric type (not float)
2. **CHECK Constraints:** Validate scale_mode, rounding_mode
3. **Foreign Keys:** Enforce referential integrity

---

## 📦 Dependencies

### Python (New)
```txt
pydantic==2.5.0
decimal
fastapi==0.104.0
```

### TypeScript (Existing)
```json
{
  "decimal.js-light": "^2.5.1"
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Calculator math (all scenarios)
- [ ] Validator schema enforcement
- [ ] Rounding modes
- [ ] Edge cases (0 points, full points, over max)

### Integration Tests
- [ ] Full grade workflow (essay → extracted → computed → saved)
- [ ] Percent mode vs points mode
- [ ] Validation retry logic
- [ ] Error handling

### Manual Testing
- [ ] Grade sample essays with known correct scores
- [ ] Verify audit trail
- [ ] Test with beta tester Shana
- [ ] Compare to manual teacher grading

---

## 📈 Success Metrics

- [ ] **Zero float errors:** No 0.30000000000000004 issues
- [ ] **100% audit trail:** Every grade has full artifact history
- [ ] **Deterministic:** Same essay + rubric = same score every time
- [ ] **Fast:** < 5 seconds per essay
- [ ] **Accurate:** Matches teacher manual grading within 2%

---

## 🚀 Deployment Checklist

- [ ] Python calculator unit tests pass
- [ ] Integration tests pass
- [ ] Database migration applied
- [ ] Audit trail verified
- [ ] Beta test with Shana
- [ ] Documentation updated
- [ ] Deploy to production

---

## 📚 Resources

- Python Decimal docs: https://docs.python.org/3/library/decimal.html
- Pydantic: https://docs.pydantic.dev/
- Original ChatGPT dialogue: `/BulletProofGrading`
- Related: `.windsurf/rules/code-style.md`
- Related: `MasterToDo.md` (Point-Based Scoring integration)

---

## 🔗 Integration with Point-Based Scoring

This plan complements **MasterToDo Item #1: Point-Based Scoring System**:

- Point-Based Scoring provides the **UI toggle** and **user workflow**
- BulletProofing provides the **backend calculator** and **mathematical accuracy**
- Both share the same `scale_mode` and `total_points` database fields
- Calculator handles both percent and points modes transparently

**Implementation Order:**
1. Implement BulletProofing calculator first (foundation)
2. Then add Point-Based Scoring UI (uses calculator)

---

**Total Estimated Time:** 20-26 hours

**Recommended Sprint:** 2-3 weeks (Phase 1 → Phase 2 → Phase 3 → Phase 4)

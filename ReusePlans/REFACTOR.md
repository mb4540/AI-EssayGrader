# REFACTOR.md — Code Refactoring, Testing, and Quality Following .windsurf Rules

**⚠️ THIS IS A REFERENCE TEMPLATE - DO NOT MODIFY FOR SPECIFIC EXECUTIONS**

For specific refactoring tasks, create a new file like `REFACTOR_EXECUTION_YYYY-MM-DD.md` based on this template.

---

**Goal:** Improve code quality, maintainability, and test coverage without breaking shipping software. All refactors are backed up first.

**Last Updated:** November 1, 2025  
**Follows:** All `.windsurf/rules/*.md` standards

**Prerequisites:** CLEANUP.md Sections 0-4.5 must be completed first

---

## 🎯 Core Principles

### Code Quality Standards
**Following:** `.windsurf/rules/code-style.md`
- ✅ TypeScript with explicit types (no `any`)
- ✅ Naming: camelCase, PascalCase, UPPER_SNAKE_CASE, kebab-case
- ✅ Imports organized (external, internal, relative, CSS)
- ✅ Functions < 50 lines, modular design
- ✅ Comments explain WHY, not WHAT

### Testing Strategy
**Following:** `.windsurf/rules/testing.md`
- ✅ 75%+ overall coverage target
- ✅ 90%+ for critical functions
- ✅ Test pyramid: 80% unit, 15% integration, 5% E2E
- ✅ Vitest for unit/integration
- ✅ Playwright for E2E (future)

### API Design
**Following:** `.windsurf/rules/api-design.md`
- ✅ RESTful conventions
- ✅ Zod validation for all inputs
- ✅ Comprehensive error handling
- ✅ CORS configured properly
- ✅ Rate limiting considered

### Frontend Components
**Following:** `.windsurf/rules/frontend-components.md`
- ✅ Functional components with hooks
- ✅ PropTypes via TypeScript interfaces
- ✅ React Query for data fetching
- ✅ TailwindCSS for styling
- ✅ Accessibility (ARIA labels, keyboard nav)

### Database Changes
**Following:** `.windsurf/rules/database-design.md`
- ⚠️ ALWAYS backup schema before changes
- ⚠️ Check `db_ref.md` BEFORE changes
- ⚠️ Update `db_ref.md` AFTER changes
- ⚠️ Use Neon branching for testing

### Security
**Following:** `.windsurf/rules/security.md`
- ⚠️ Never commit secrets
- ⚠️ Validate all input (Zod schemas)
- ⚠️ Use parameterized SQL only
- ⚠️ Sanitize output for XSS prevention

---

## 📋 Table of Contents

**Safety First:**
- [Section 0: Create Dedicated Refactor Branch](#0-safety-first--create-dedicated-refactor-branch)

**Analysis:**
- [Section 1: Comprehensive Codebase Review](#1-comprehensive-codebase-review--analysis)

**Code Cleanup:**
- [Section 2: Remove Unused Code & Files](#2-remove-unused-code--files-soft-delete-only)

**Quality Improvements:**
- [Section 3: Ensure Reusable Common Components](#3-ensure-reusable-common-components)
- [Section 4: Refactor Large Files Safely](#4-refactor-large-files-safely-backup--edit--test)
- [Section 5: Enhance Code Documentation](#5-enhance-code-documentation)

**Testing:**
- [Section 6: Testing & Quality Gates](#6-testing--quality-gates-run-every-time)

**Finalization:**
- [Section 7: Commit Strategy & PR](#7-commit-strategy--pr)

---

## 0) Safety First — Create Dedicated Refactor Branch

**Following:** `.windsurf/rules/git-workflow.md`

```bash
set -euo pipefail

echo "🔍 Verifying prerequisites..."

# 0.1 Verify cleanup is complete
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ ! "$CURRENT_BRANCH" =~ ^cleanup/ ]]; then
  echo "⚠️  WARNING: Not on a cleanup branch"
  echo "   Expected: cleanup/YYYYMMDD-HHMMSS"
  echo "   Current: $CURRENT_BRANCH"
  read -p "   Continue anyway? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: You have uncommitted changes. Commit them first."
  git status --short
  exit 1
fi

# Verify we're in AI-EssayGrader (not gift-of-time-assistant)
CURRENT_DIR="$(pwd)"
if [[ "$CURRENT_DIR" != *"/AI-EssayGrader/AI-EssayGrader"* ]]; then
  echo "❌ ERROR: Not in AI-EssayGrader project directory!"
  echo "   Per .windsurf/rules/multi-project-workspace.md:"
  echo "   - AI-EssayGrader: Active project (changes allowed)"
  echo "   - gift-of-time-assistant: Reference only (NO changes)"
  exit 1
fi

echo "✅ Prerequisites verified"
echo ""

# 0.2 Create refactor branch
TS="$(date +%Y%m%d-%H%M%S)"
git fetch --all --prune
git switch -c refactor/${TS}
git tag -a "pre-refactor-${TS}" -m "Checkpoint before refactoring ${TS}"

echo "✅ Created refactor branch: refactor/${TS}"
echo "✅ Created safety tag: pre-refactor-${TS}"
echo ""

# 0.3 Set up refactor archive
REFACTOR_ARCHIVE=".archive/${TS}/refactor_backups"
mkdir -p "${REFACTOR_ARCHIVE}"

# Backup helper
backup_for_refactor() {
  local src="$1"
  local dest="${REFACTOR_ARCHIVE}/${src}"
  mkdir -p "$(dirname "${dest}")"
  cp -a "${src}" "${dest}"
  git add -A "${REFACTOR_ARCHIVE}"
  echo "🧰 Backed up: ${src} -> ${dest}"
}

echo "✅ Refactor environment ready"
echo ""
```

---

## 1) Comprehensive Codebase Review & Analysis

**Objective:** Generate comprehensive analysis of codebase for refactoring targets.

### 1.1 Code Style Analysis

**Following:** `.windsurf/rules/code-style.md`

```bash
echo "📊 Generating Code Style Report..."
echo ""

# Create analysis report
REPORT_FILE="REFACTOR_REVIEW.md"
echo "# Refactor Review - $(date)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Code Style Compliance" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check file naming
echo "### File Naming Issues" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*test*" | while read file; do
  basename_only=$(basename "$file" | sed 's/\.[^.]*$//')
  if [[ ! "$basename_only" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] && [[ ! "$basename_only" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
    echo "- [ ] \`$file\` - Should be kebab-case or PascalCase" >> "$REPORT_FILE"
  fi
done

# Check for 'any' types
echo "" >> "$REPORT_FILE"
echo "### TypeScript Type Issues" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Files using \`any\` type:" >> "$REPORT_FILE"
grep -r "any" src --include="*.ts" --include="*.tsx" -l | while read file; do
  count=$(grep -c "any" "$file")
  echo "- [ ] \`$file\` - $count occurrences" >> "$REPORT_FILE"
done

# Check for console.logs
echo "" >> "$REPORT_FILE"
echo "### Console.log Statements (Remove)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
grep -rn "console.log" src --include="*.ts" --include="*.tsx" | grep -v "console.error" | while read line; do
  echo "- [ ] $line" >> "$REPORT_FILE"
done

echo "✅ Code style analysis complete"
echo ""
```

### 1.2 Component Analysis

**Following:** `.windsurf/rules/frontend-components.md`

```bash
echo "🎨 Analyzing React Components..."
echo ""

echo "" >> "$REPORT_FILE"
echo "## Component Quality" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find large components (>300 lines)
echo "### Large Components (>300 lines)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find src/components src/pages -name "*.tsx" -type f | while read component; do
  lines=$(wc -l < "$component")
  if [ "$lines" -gt 300 ]; then
    echo "- [ ] \`$component\` - $lines lines (refactor to smaller components)" >> "$REPORT_FILE"
  fi
done

# Check for PropTypes (should use TypeScript interfaces)
echo "" >> "$REPORT_FILE"
echo "### Component Best Practices" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
grep -r "React.FC" src --include="*.tsx" -l | while read file; do
  echo "✅ \`$file\` - Uses functional component pattern" >> "$REPORT_FILE"
done

echo "✅ Component analysis complete"
echo ""
```

### 1.3 API Endpoint Analysis

**Following:** `.windsurf/rules/api-design.md`

```bash
echo "🔌 Analyzing API Endpoints..."
echo ""

echo "" >> "$REPORT_FILE"
echo "## API Design Quality" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for Zod validation
echo "### Input Validation (Zod)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find netlify/functions -name "*.ts" -type f | while read endpoint; do
  if grep -q "import.*zod" "$endpoint"; then
    echo "✅ \`$endpoint\` - Uses Zod validation" >> "$REPORT_FILE"
  else
    echo "- [ ] \`$endpoint\` - Add Zod validation" >> "$REPORT_FILE"
  fi
done

# Check for CORS headers
echo "" >> "$REPORT_FILE"
echo "### CORS Configuration" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
grep -r "Access-Control-Allow-Origin" netlify/functions --include="*.ts" -l | while read file; do
  echo "✅ \`$file\` - Has CORS headers" >> "$REPORT_FILE"
done

# Check error handling
echo "" >> "$REPORT_FILE"
echo "### Error Handling" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find netlify/functions -name "*.ts" -type f | while read endpoint; do
  if grep -q "try.*catch" "$endpoint"; then
    echo "✅ \`$endpoint\` - Has error handling" >> "$REPORT_FILE"
  else
    echo "- [ ] \`$endpoint\` - Add error handling" >> "$REPORT_FILE"
  fi
done

echo "✅ API analysis complete"
echo ""
```

### 1.4 Security Analysis

**Following:** `.windsurf/rules/security.md`

```bash
echo "🔒 Security Audit..."
echo ""

echo "" >> "$REPORT_FILE"
echo "## Security Issues" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for hardcoded secrets
echo "### Potential Hardcoded Secrets" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
grep -ri "api.key\|password\|secret\|token" src netlify/functions --include="*.ts" --include="*.tsx" | \
  grep -v "process.env" | \
  grep -v "interface " | \
  grep -v "type " | \
  head -n 10 | while read match; do
  echo "- [ ] REVIEW: $match" >> "$REPORT_FILE"
done

# Check for SQL injection risks
echo "" >> "$REPORT_FILE"
echo "### SQL Query Safety" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
grep -r "sql\`" netlify/functions --include="*.ts" -B 2 -A 2 | \
  grep -c "\${" > /dev/null && \
  echo "⚠️  Review all SQL queries use parameterized syntax" >> "$REPORT_FILE" || \
  echo "✅ All SQL queries use parameterized syntax" >> "$REPORT_FILE"

# Check input validation
echo "" >> "$REPORT_FILE"
echo "### Input Validation Coverage" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find netlify/functions -name "*.ts" -type f | while read endpoint; do
  if grep -q "\.safeParse\|\.parse" "$endpoint"; then
    echo "✅ \`$endpoint\` - Validates input" >> "$REPORT_FILE"
  else
    echo "- [ ] \`$endpoint\` - Add input validation" >> "$REPORT_FILE"
  fi
done

echo "✅ Security audit complete"
echo ""
```

### 1.5 Testing Coverage Analysis

**Following:** `.windsurf/rules/testing.md`

```bash
echo "🧪 Testing Coverage Analysis..."
echo ""

echo "" >> "$REPORT_FILE"
echo "## Testing Coverage" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count test files
TEST_COUNT=$(find src netlify/functions -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l)
SOURCE_COUNT=$(find src netlify/functions -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v ".spec." | wc -l)
COVERAGE_PERCENT=$((TEST_COUNT * 100 / SOURCE_COUNT))

echo "**Current Coverage:** ~${COVERAGE_PERCENT}% test files" >> "$REPORT_FILE"
echo "**Target:** 75%+ (per .windsurf/rules/testing.md)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$COVERAGE_PERCENT" -lt 75 ]; then
  echo "⚠️  Coverage below target!" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Missing Tests (Priority Order)" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "See TEST_PLAN.md for full implementation guide" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
fi

# List files without tests
echo "### Files Without Tests" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
find src/lib -name "*.ts" ! -name "*.test.ts" ! -name "types.ts" ! -name "utils.ts" | while read srcfile; do
  testfile="${srcfile%.ts}.test.ts"
  if [ ! -f "$testfile" ]; then
    echo "- [ ] \`$srcfile\` - Create \`$testfile\`" >> "$REPORT_FILE"
  fi
done

echo "✅ Testing analysis complete"
echo ""

# Save report
git add "$REPORT_FILE"
git commit -m "docs(refactor): generate comprehensive refactor review report

Analysis includes:
- Code style compliance
- Component quality
- API design
- Security issues
- Testing coverage

See $REPORT_FILE for details"

echo "✅ Review report saved to: $REPORT_FILE"
echo ""
```

---

## 2) Remove Unused Code & Files (Soft-Delete Only)

**Objective:** Identify and safely remove dead code.

```bash
echo "🗑️  Identifying unused code..."
echo ""

# Use ts-prune to find unused exports
echo "Running ts-prune to find unused exports..."
npx ts-prune --error | tee unused-exports.txt

echo ""
echo "Review unused-exports.txt and archive dead code:"
echo ""

# Archive helper
archive_unused() {
  local file="$1"
  backup_for_refactor "$file"
  git mv "$file" "${REFACTOR_ARCHIVE}/unused/"
  echo "📦 Archived unused: $file"
}

echo "Manual review required - mark files for archiving"
echo ""

# Commit archived files
git add -A
git commit -m "refactor: archive unused code (soft-delete)

Can be restored from ${REFACTOR_ARCHIVE}/unused/ if needed"

echo "✅ Unused code archived"
echo ""
```

---

## 3) Ensure Reusable Common Components

**Following:** `.windsurf/rules/frontend-components.md`

**Objective:** Create shared components following React best practices.

```bash
echo "🎨 Creating reusable components..."
echo ""

# Identify duplicate patterns
echo "Searching for duplicate component patterns..."
grep -r "const \[.*loading.*setLoading\]" src/components src/pages --include="*.tsx" -l | \
  tee duplicate-loading-states.txt

echo ""
echo "Consider creating shared hooks:"
echo "  - useLoadingState() for loading states"
echo "  - useApiMutation() for API calls"
echo "  - useFormValidation() for forms"
echo ""

# Create hooks directory if needed
mkdir -p src/hooks

echo "Follow .windsurf/rules/frontend-components.md:"
echo "  ✅ Functional components with hooks"
echo "  ✅ TypeScript interfaces for props"
echo "  ✅ React Query for data fetching"
echo "  ✅ Proper error boundaries"
echo ""
```

---

## 4) Refactor Large Files Safely (Backup → Edit → Test)

**Following:** `.windsurf/rules/code-style.md` (functions < 50 lines)

```bash
echo "📂 Identifying large files for refactoring..."
echo ""

# Find files > 350 lines
echo "Large files (>350 lines):" | tee large-files.txt
find src netlify/functions -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -exec wc -l {} + | awk '$1>350 {print $2 " (" $1 " lines)"}' | \
  tee -a large-files.txt

echo ""
echo "For each large file:"
echo "  1. backup_for_refactor <file>"
echo "  2. Split into smaller modules"
echo "  3. Run tests: npm run test:run"
echo "  4. Commit with detailed message"
echo ""

# Refactor checklist
echo "Refactor checklist per .windsurf/rules/code-style.md:"
echo "  ✅ Functions < 50 lines"
echo "  ✅ Single responsibility principle"
echo "  ✅ Clear naming (no abbreviations)"
echo "  ✅ Extract utilities to lib/"
echo "  ✅ Extract types to types.ts"
echo ""
```

---

## 5) Enhance Code Documentation

**Following:** `.windsurf/rules/code-style.md` (comments explain WHY)

```bash
echo "📝 Enhancing documentation..."
echo ""

# Find functions without JSDoc
echo "Functions needing documentation:"
grep -rn "export function\|export const.*=" src/lib --include="*.ts" | \
  grep -v "^.*//.*" | \
  head -n 20

echo ""
echo "Add JSDoc comments explaining:"
echo "  - What the function does (brief)"
echo "  - Parameters and return values"
echo "  - Why (business logic, not obvious code)"
echo "  - Edge cases and assumptions"
echo ""

echo "Example:"
cat << 'EOF'
/**
 * Calculate final grade using BulletProof algorithm
 * 
 * Uses Decimal.js for precise math to avoid float errors.
 * Follows teacher rubric weighting exactly as specified.
 * 
 * @param scores - Per-criterion raw scores
 * @param rubric - Teacher-defined rubric with weights
 * @returns Final grade (0-100 or 0-totalPoints)
 */
export function calculateFinalGrade(
  scores: ExtractedScores,
  rubric: Rubric
): number {
  // Implementation...
}
EOF

echo ""
```

---

## 6) Testing & Quality Gates (Run Every Time)

**Following:** `.windsurf/rules/testing.md`

**Critical:** Run before ANY commit!

```bash
set -euo pipefail

echo "🧪 Running Quality Gates..."
echo ""

# 6.1 Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo "✅ Dependencies installed"
echo ""

# 6.2 Lint & Format
echo "🔍 Running linter..."
npm run lint
echo "✅ Lint passed"
echo ""

# 6.3 Type Check
echo "📘 Type checking..."
npx tsc --noEmit
echo "✅ Type check passed"
echo ""

# 6.4 Unit & Integration Tests
echo "🧪 Running tests..."
npm run test:run
echo "✅ Tests passed"
echo ""

# 6.5 Coverage Check
echo "📊 Generating coverage..."
npm run test:coverage

COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*' | \
  awk -F':' '{print int($4/$3*100)}' || echo "0")

echo "Coverage: ${COVERAGE}%"

if [ "$COVERAGE" -lt 75 ]; then
  echo "⚠️  WARNING: Coverage below 75% target"
  echo "   See TEST_PLAN.md for improvement guide"
else
  echo "✅ Coverage meets target (75%+)"
fi

echo ""

# 6.6 Build Test
echo "🏗️  Testing build..."
npm run build
echo "✅ Build successful"
echo ""

echo "✅ All quality gates passed!"
echo ""
```

---

## 7) Commit Strategy & PR

**Following:** `.windsurf/rules/git-workflow.md`

```bash
echo "📝 Commit Strategy..."
echo ""

echo "Commit message format:"
cat << 'EOF'
<type>(<scope>): <subject>

<body>

<footer>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code change that neither fixes nor adds
- test: Adding tests
- docs: Documentation only
- style: Formatting, semicolons, etc
- chore: Maintenance

Example:
refactor(components): extract common loading state hook

Created useLoadingState() hook to reduce duplication across
GradePanel, AnnotationViewer, and FileDrop components.

Following .windsurf/rules/frontend-components.md

- Reduced code duplication by 150 lines
- Added tests for hook (100% coverage)
- Updated components to use shared hook
EOF

echo ""
echo "Before creating PR:"
echo "  1. ✅ All tests pass"
echo "  2. ✅ Coverage meets targets"
echo "  3. ✅ No linting errors"
echo "  4. ✅ Build succeeds"
echo "  5. ✅ REFACTOR_REVIEW.md checklist complete"
echo ""

# Push and create PR
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"

echo "Create PR with:"
echo "  Title: refactor: [brief description]"
echo "  Body: Link to REFACTOR_REVIEW.md checklist"
echo "  Reviewers: Assign appropriate reviewers"
echo ""
```

---

## ✅ REFACTOR COMPLETE

**Completed Actions:**
- ✅ Safety checkpoint created
- ✅ Comprehensive codebase analysis
- ✅ Unused code archived
- ✅ Components refactored following .windsurf rules
- ✅ Large files split (< 350 lines)
- ✅ Documentation enhanced
- ✅ All quality gates passed
- ✅ Test coverage improved toward 75%

**Standards Applied:**
- ✅ `.windsurf/rules/code-style.md` - TypeScript conventions
- ✅ `.windsurf/rules/frontend-components.md` - React patterns
- ✅ `.windsurf/rules/api-design.md` - Endpoint standards
- ✅ `.windsurf/rules/testing.md` - Test coverage goals
- ✅ `.windsurf/rules/security.md` - Input validation, secrets
- ✅ `.windsurf/rules/database-design.md` - Schema safety
- ✅ `.windsurf/rules/git-workflow.md` - Commit conventions

**Next Steps:**
1. Merge PR after review
2. Deploy to staging
3. Monitor for issues
4. Update TEST_PLAN.md with new test implementations

---

## Rollback

If issues arise:

```bash
# Full rollback
git reset --hard pre-refactor-${TS}

# Restore individual files
cp -a ${REFACTOR_ARCHIVE}/<file> <original-path>
git add <original-path>
git commit -m "Revert refactor of <file>"
```

---

**End of REFACTOR.md (Updated for .windsurf rules compliance)**

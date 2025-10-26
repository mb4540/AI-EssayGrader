REFACTOR.md — Code Refactoring, Testing, and Quality Improvement Plan

Goal: Improve code quality, maintainability, and test coverage without breaking shipping software. All refactors are backed up first. This plan picks up after CLEANUP.md (Sections 0-4.5) have been completed.

Prerequisites: CLEANUP.md Sections 0-4.5 must be completed first, which includes:
- Git checkpoint and archive folders created
- Root planning docs moved to OldPlans/
- Root scripts and data files archived
- Helper functions (move_to_removed, backup_for_refactor) defined

---

## 📋 Table of Contents

**Safety First:**
- [Section 0: Create Dedicated Refactor Branch](#0-safety-first--create-dedicated-refactor-branch)
  - Verify cleanup completion
  - Create refactor branch
  - Tag current state

**Codebase Analysis:**
- [Section 1: Comprehensive Codebase Review](#1-comprehensive-codebase-review--analysis)
  - Scan all frontend files
  - Map all routes and components
  - Analyze function calls and dependencies
  - Generate REFACTOR_REVIEW.md report
  - Identify safe deletion candidates

**Code Cleanup:**
- [Section 2: Remove Unused Code & Files](#2-remove-unused-code--files-soft-delete-only)
  - Soft-delete unused files
  - Restore procedures

**Code Quality:**
- [Section 3: Ensure Reusable Common Components](#3-ensure-reusable-common-components)
  - Identify duplications
  - Create shared components
  - DRY refactoring

**Refactoring:**
- [Section 4: Refactor Large Files Safely](#4-refactor-large-files-safely-backup--edit--test)
  - Backup procedures
  - Split large modules
  - Rollback on failure

**Documentation:**
- [Section 5: Enhance Code Documentation](#5-enhance-code-documentation)
  - Add comments
  - Module headers
  - JSDoc/TSDoc

**Testing:**
- [Section 6: Testing & Quality Gates](#6-testing--quality-gates-run-every-time)
  - 6.1 Install dependencies
  - 6.2 Lint & format
  - 6.3 Type check
  - 6.4 Unit tests
  - 6.5 E2E tests
  - 6.6 Test rollback mechanism
  - Pass/Fail gates

**Finalization:**
- [Section 7: Commit Strategy & PR](#7-commit-strategy--pr)
- [Section 8: Post-Merge Hygiene](#8-post-merge-hygiene)

**Reference:**
- [Section 9: Appendix - Quick Commands](#9-appendix--quick-commands-youll-reuse)
- [Section 10: What This Plan Covers](#10-what-this-plan-covers)
- [Windsurf / Agent Execution Notes](#windsurf--agent-execution-notes)

---

0) Safety First — Create Dedicated Refactor Branch

Run from repo root in bash/zsh. Requires git.

Objective: Create a new branch specifically for refactoring work, separate from cleanup, with a safety checkpoint.

set -euo pipefail

# 0.1 Verify cleanup is complete
echo "🔍 Verifying CLEANUP.md was completed..."

# Check if we're on a cleanup branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ ! "$CURRENT_BRANCH" =~ ^cleanup/ ]]; then
  echo "⚠️  WARNING: Not on a cleanup branch. Expected cleanup/YYYYMMDD-HHMMSS"
  echo "   Current branch: $CURRENT_BRANCH"
  read -p "   Continue anyway? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "❌ Aborted. Complete CLEANUP.md first."
    exit 1
  fi
fi

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: You have uncommitted changes. Commit them first."
  git status --short
  exit 1
fi

echo "✅ Cleanup verification passed"
echo ""

# 0.2 Create refactor branch from current state
REFACTOR_TS="$(date +%Y%m%d-%H%M%S)"
REFACTOR_BRANCH="refactor/${REFACTOR_TS}"

echo "🌿 Creating dedicated refactor branch..."
git switch -c "${REFACTOR_BRANCH}"

# 0.3 Tag the starting point (post-cleanup, pre-refactor)
TAG_NAME="pre-refactor-${REFACTOR_TS}"
git tag -a "${TAG_NAME}" -m "Checkpoint before refactoring ${REFACTOR_TS}"

echo "✅ Created refactor branch: ${REFACTOR_BRANCH}"
echo "✅ Created safety tag: ${TAG_NAME}"
echo ""

# 0.4 Set up refactor environment variables
echo "📝 Setting up refactor environment..."
echo "REFACTOR_TS=${REFACTOR_TS}" > /tmp/refactor_env.sh
echo "REFACTOR_BRANCH=${REFACTOR_BRANCH}" >> /tmp/refactor_env.sh
echo "TAG_NAME=${TAG_NAME}" >> /tmp/refactor_env.sh

# Reuse archive from cleanup if it exists
if [ -f "/tmp/cleanup_ts.env" ]; then
  source /tmp/cleanup_ts.env
  echo "TS=${TS}" >> /tmp/refactor_env.sh
  echo "ARCHIVE=.archive/${TS}" >> /tmp/refactor_env.sh
  echo "✅ Reusing cleanup archive: .archive/${TS}"
else
  # Create new archive for refactor
  TS="${REFACTOR_TS}"
  ARCHIVE=".archive/${TS}"
  mkdir -p "${ARCHIVE}/removed" "${ARCHIVE}/refactor_backups"
  echo "TS=${TS}" >> /tmp/refactor_env.sh
  echo "ARCHIVE=${ARCHIVE}" >> /tmp/refactor_env.sh
  echo "✅ Created new archive: ${ARCHIVE}"
fi

echo ""
echo "🎯 Refactor environment ready!"
echo ""
echo "📋 Summary:"
echo "   Branch: ${REFACTOR_BRANCH}"
echo "   Safety tag: ${TAG_NAME}"
echo "   Archive: ${ARCHIVE}"
echo ""
echo "🔄 Rollback commands:"
echo "   Full rollback: git reset --hard ${TAG_NAME}"
echo "   Switch back: git switch ${CURRENT_BRANCH}"
echo ""

# 0.5 Redefine helper functions for refactor phase
move_to_removed() {
  local src="$1"
  local dest="${ARCHIVE}/removed/${src}"
  mkdir -p "$(dirname "${dest}")"
  if git ls-files --error-unmatch "${src}" >/dev/null 2>&1; then
    git mv "${src}" "${dest}"
  else
    mv "${src}" "${dest}"
    git add -A "${ARCHIVE}/removed"
  fi
  echo "📦 Soft-deleted -> ${dest}"
}

backup_for_refactor() {
  local src="$1"
  local dest="${ARCHIVE}/refactor_backups/${src}"
  mkdir -p "$(dirname "${dest}")"
  cp -a "${src}" "${dest}"
  git add -A "${ARCHIVE}/refactor_backups"
  echo "🧰 Backed up for refactor -> ${dest}"
}

echo "✅ Helper functions defined"
echo ""
echo "▶️  Ready to proceed with refactoring!"

---

1) Comprehensive Codebase Review & Analysis

Objective: Perform a thorough analysis of the entire codebase to identify unused code, duplication, and refactoring opportunities. Generate a detailed report for human review and approval.

This section will create: **REFACTOR_REVIEW.md** - A comprehensive report with deletion candidates and findings.

Procedure:

# 1.1 Scan Frontend Application Structure
echo "🔍 Scanning frontend application structure..."

# List all pages/routes
echo "📄 Pages and Routes:"
find src/pages -type f \( -name "*.tsx" -o -name "*.ts" \) -exec echo "  {}" \;

# List all components
echo ""
echo "🧩 Components:"
find src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec echo "  {}" \;

# List all hooks
echo ""
echo "🪝 Custom Hooks:"
find src/hooks -type f \( -name "*.ts" -o -name "*.tsx" \) -exec echo "  {}" \;

# List all utilities/libraries
echo ""
echo "🛠️  Utilities and Libraries:"
find src/lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec echo "  {}" \;

# 1.2 Scan Backend Functions
echo ""
echo "⚙️  Backend Functions:"
find netlify/functions -type f -name "*.mts" -exec echo "  {}" \;

# 1.3 Analyze Routes and Navigation
echo ""
echo "🗺️  Analyzing routes and navigation..."

# Find all route definitions
grep -r "path=" src/pages/ src/ --include="*.tsx" --include="*.ts" | head -20

# Find all Link/navigate usage
grep -r "to=" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Total navigation links:"

# 1.4 Analyze Component Dependencies
echo ""
echo "🔗 Analyzing component dependencies..."

# Find all imports
echo "  Generating import graph..."
grep -r "^import" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Total imports:"

# Find unused exports (basic check)
echo "  Checking for potential unused exports..."
# This is a placeholder - full analysis done by agent

# 1.4.1 Check for dead code patterns
echo ""
echo "🔍 Checking for dead code patterns..."

# Find TODO/FIXME comments
grep -r "TODO\|FIXME\|HACK\|XXX" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Technical debt markers:"

# Find commented-out code blocks
grep -r "^[[:space:]]*//.*function\|^[[:space:]]*//.*const\|^[[:space:]]*//.*export" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Commented code blocks:"

# Find .disabled files
find src/ netlify/functions/ -name "*.disabled" | wc -l | xargs echo "  Disabled files:"

# 1.4.2 Analyze code complexity
echo ""
echo "📊 Analyzing code complexity..."

# Find files with high line count
echo "  Large files (>500 lines):"
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + | awk '$1>500 {print "    " $2 " (" $1 " lines)"}' | head -10

# Find long functions (basic heuristic)
echo "  Checking for long functions..."
grep -r "function\|const.*=.*=>.*{" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Total functions:"

# 1.4.3 Check for duplicate code
echo ""
echo "🔄 Checking for duplicate code..."

# Find files with similar names (potential duplicates)
echo "  Files with similar names:"
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -printf "%f\n" | sort | uniq -d | head -10

# Find duplicate utility functions (common patterns)
echo "  Checking for duplicate utility patterns..."
grep -r "formatCurrency\|formatDate\|formatPercent" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Format function occurrences:"

# 1.4.4 Analyze test coverage
echo ""
echo "🧪 Analyzing test coverage..."

# Find test files
find src/ -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) | wc -l | xargs echo "  Test files:"

# Find files without corresponding tests
echo "  Checking for untested files..."
# This is a placeholder - full analysis done by agent

# 1.4.5 Check for security issues
echo ""
echo "🔒 Checking for potential security issues..."

# Find hardcoded secrets patterns
grep -r "password\|secret\|api_key\|apiKey\|token" src/ --include="*.tsx" --include="*.ts" | grep -v "import\|type\|interface\|//" | wc -l | xargs echo "  Potential hardcoded secrets:"

# Find eval usage
grep -r "eval(" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Eval usage (dangerous):"

# Find dangerouslySetInnerHTML
grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" | wc -l | xargs echo "  dangerouslySetInnerHTML usage:"

# 1.4.6 Analyze bundle size contributors
echo ""
echo "📦 Analyzing bundle size contributors..."

# Find large dependencies
echo "  Checking for heavy imports..."
grep -r "import.*from.*'react'\|import.*from.*'lodash'\|import.*from.*'moment'" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Heavy library imports:"

# Find barrel imports (performance issue)
grep -r "import.*from.*'/index'" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Barrel imports:"

# 1.5 Generate REFACTOR_REVIEW.md Report
echo ""
echo "📝 Generating REFACTOR_REVIEW.md report..."
echo "   This will be created by the AI agent with:"
echo "   - Safe deletion candidates (top section)"
echo "   - Detailed findings and evidence"
echo "   - Component dependency map"
echo "   - Route usage analysis"
echo "   - Function call analysis"
echo "   - Duplication detection"
echo ""
echo "⏸️  PAUSE: Agent will now generate comprehensive report"
echo "   Review REFACTOR_REVIEW.md and approve items before proceeding"
echo ""

# Agent Instructions:
# ====================
# The AI agent should now:
#
# 1. Read all files in src/ directory
# 2. Read all files in netlify/functions/ directory
# 3. Analyze:
#    - All React components and their usage
#    - All custom hooks and their usage
#    - All utility functions and their usage
#    - All routes and navigation paths
#    - All API endpoints and their callers
#    - All imports and exports
#
# 4. Generate REFACTOR_REVIEW.md with structure:
#
#    # REFACTOR_REVIEW.md
#    
#    ## 🗑️ Safe Deletion Candidates
#    
#    ### High Confidence (Unused)
#    - [ ] file/path/component.tsx - Reason: No imports found
#    - [ ] file/path/util.ts - Reason: Replaced by common/util.ts
#    
#    ### Medium Confidence (Likely Unused)
#    - [ ] file/path/old-feature.tsx - Reason: No route references
#    
#    ### Low Confidence (Needs Review)
#    - [ ] file/path/maybe-unused.ts - Reason: Only 1 import, may be legacy
#    
#    ---
#    
#    ## 📊 Codebase Analysis
#    
#    ### Application Structure
#    - Total Pages: X
#    - Total Components: Y
#    - Total Hooks: Z
#    - Total Functions: N
#    
#    ### Route Map
#    [List all routes and their components]
#    
#    ### Component Dependency Graph
#    [Show which components use which]
#    
#    ### API Endpoints
#    [List all backend functions and their frontend callers]
#    
#    ### Duplication Analysis
#    [Identify duplicate code patterns]
#    
#    ### Large Files (>350 lines)
#    [List files that need refactoring]
#    
#    ### Dead Code Patterns
#    - Technical debt markers (TODO/FIXME/HACK)
#    - Commented-out code blocks
#    - Disabled files
#    
#    ### Code Complexity Issues
#    - Large files (>500 lines)
#    - Long functions
#    - Deep nesting
#    
#    ### Test Coverage Gaps
#    - Files without tests
#    - Low coverage areas
#    
#    ### Security Concerns
#    - Potential hardcoded secrets
#    - Dangerous patterns (eval, dangerouslySetInnerHTML)
#    - Input validation issues
#    
#    ### Performance Issues
#    - Heavy library imports
#    - Barrel imports
#    - Unnecessary re-renders
#    
#    ---
#    
#    ## 🔍 Detailed Findings
#    
#    ### For Each Deletion Candidate:
#    - File path and size
#    - Last modified date
#    - Import analysis (who imports this?)
#    - Export analysis (what does it export?)
#    - Usage count across codebase
#    - Replacement suggestions (if applicable)
#    - Risk assessment
#    
#    ### For Each Duplication:
#    - Pattern description
#    - Locations (file paths and line numbers)
#    - Suggested common component/utility
#    - Refactoring effort estimate
#    
#    ### For Each Large File:
#    - Current size and complexity
#    - Suggested split strategy
#    - Proposed new file structure
#    - Dependencies to consider
#
# 5. Wait for human approval before proceeding to Section 2
#
# 6. Provide summary statistics:
#    - Total files analyzed
#    - Deletion candidates by confidence level
#    - Estimated space savings
#    - Estimated complexity reduction

---

2) Remove Unused Code & Files (Soft-Delete Only)

Objective: Streamline without risk.

Procedure:

Enumerate files slated for removal in CLEANUP_NOTES.md.

For each, soft-delete (rename/move) into .archive/${TS}/removed/... using move_to_removed.

Example batch (edit list as needed):

# Example: replace with your actual list
TO_REMOVE=(
  "legacy/old-util.ts"
  "public/unused-asset.png"
  "scripts/tmp/migrate-old.sh"
)

for f in "${TO_REMOVE[@]}"; do
  if [ -e "$f" ]; then
    move_to_removed "$f"
  fi
done

git add -A
git commit -m "chore(cleanup): soft-delete unused files (restorable) [archive=${ARCHIVE}]"


Restore later?

# Example restore one file
git mv ".archive/${TS}/removed/legacy/old-util.ts" "legacy/old-util.ts"
git commit -m "revert(cleanup): restore legacy/old-util.ts from archive ${TS}"

3) Ensure Reusable Common Components

Objective: DRY the code with shared, well-named components (no behavior change).

Tasks:

Identify repeated patterns (formatting, HTTP, logging, error handling, UI atoms).

Create/extend a common/ (or packages/common/) with:

No side effects, clear APIs, strong types.

Unit tests per exported function/component.

Process (high level):

For each duplication:

Create a shared function/component in common/.

Update call sites to use it.

Commit in small, testable chunks.

4) Refactor Large Files Safely (Backup → Edit → Test)

Objective: Improve maintainability by splitting big modules.

Procedure for each target file:

Backup first:

backup_for_refactor "apps/frontend/src/big-module.tsx"   # example path


Refactor: Split into smaller, single-purpose modules (cohesive responsibilities, strong types, clear names).

Run tests (see §5). If anything fails, restore quickly:

cp -a "${ARCHIVE}/refactor_backups/apps/frontend/src/big-module.tsx" \
      "apps/frontend/src/big-module.tsx"
git add -A
git commit -m "revert(refactor): restore big-module.tsx from backup ${TS}"


Keep commits small: 1 file or 1 theme per commit.

5) Enhance Code Documentation

Objective: Make intent obvious for any developer.

Tasks:

Add concise comments to non-obvious logic.

Module headers: purpose, inputs/outputs, invariants.

Update README/architecture notes where structure changed.

JSDoc/TSDoc for public APIs in shared packages.

6) Testing & Quality Gates (Run Every Time)

Objective: Prove we didn't break behavior.

The snippets below try pnpm, then yarn, then npm. Adjust for your monorepo (workspaces).

PM=""
if command -v pnpm >/dev/null 2>&1; then PM="pnpm"
elif command -v yarn >/dev/null 2>&1; then PM="yarn"
else PM="npm"
fi

# 6.1 Install
$PM install

# 6.2 Lint & format
if [ "$PM" = "npm" ]; then
  npm run lint || true
  npm run format || true
else
  $PM lint || true
  $PM format || true
fi

# 6.3 Type check
if [ "$PM" = "npm" ]; then
  npm run typecheck || npm run ts:check || true
else
  $PM typecheck || $PM run ts:check || true
fi

# 6.4 Unit tests (prefer vitest/jest)
if [ "$PM" = "npm" ]; then
  npm test -- --coverage || npm run test || true
else
  $PM test --coverage || $PM test || true
fi

# 6.5 E2E (playwright/cypress) if present
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  npx playwright install --with-deps || true
  npx playwright test || true
fi
if [ -d "cypress" ]; then
  $PM cypress run || true
fi

# 6.6 Test Rollback Mechanism
echo "🔄 Testing rollback capability..."

# Verify backup branch exists
if git rev-parse --verify "pre-cleanup-${TS}" >/dev/null 2>&1; then
  echo "✅ Backup tag 'pre-cleanup-${TS}' exists"
else
  echo "❌ ERROR: Backup tag not found!"
  exit 1
fi

# Verify archive folder exists
if [ -d "${ARCHIVE}" ]; then
  echo "✅ Archive folder exists: ${ARCHIVE}"
  echo "   Files archived: $(find ${ARCHIVE} -type f | wc -l)"
else
  echo "⚠️  WARNING: Archive folder not found"
fi

echo "📝 Rollback commands available:"
echo "   Full rollback: git reset --hard pre-cleanup-${TS}"
echo "   Restore file: git mv ${ARCHIVE}/removed/[file] [original-path]"


Pass/Fail Gates (tune to your standards):

Lint errors: fail (warnings allowed).

Type errors: fail.

Unit tests: ≥ 90% pass (or your project threshold).

E2E: critical flows must pass.

If tests fail:

For refactors: restore from backup (see §3).

For removals: restore from .archive/.../removed/ (see §1).

If many changes: git reset --hard HEAD~1 (last commit) or git revert the offending commit(s).

7) Commit Strategy & PR

Objective: Keep history clear and reviewable.

Use conventional commits:

chore(cleanup): ... for moves/removals

refactor(...): ... for internal changes

docs(...): ... for doc updates

Squash small fixups.

Open PR: title "Cleanup & Refactor (safe-archive: ${TS})"; include:

Summary of what moved/archived/refactored.

Link to .archive/${TS}.

Test results summary.

8) Post-Merge Hygiene

Objective: Keep repo tidy after approval.

Tag release or merge checkpoint: post-cleanup-${TS}.

Optionally, keep .archive/${TS} for 2–4 weeks; then prune in a future cleanup once confidence is high.

9) Appendix — Quick Commands You'll Reuse

Mark files for soft-delete (edit paths first):

TO_REMOVE=( "path/to/fileA.ts" "path/to/dirB/old.js" )
for f in "${TO_REMOVE[@]}"; do [ -e "$f" ] && move_to_removed "$f"; done
git commit -m "chore(cleanup): soft-delete batch [${TS}]"


Backup then refactor a file (edit path):

TARGET="apps/backend/src/controllers/huge-controller.ts"
backup_for_refactor "${TARGET}"
# ...perform refactor edits...


List candidate duplicates by filename (quick & dirty heuristic):

# Same base names in different dirs (possible duplication)
find . -type f -not -path "*/node_modules/*" -printf "%f\n" | sort | uniq -d

10) What This Plan Covers

Code removal and archiving (soft-delete only).

DRY refactoring with common components.

Large file splitting for maintainability.

Documentation improvements.

Comprehensive testing gates.

Safe rollback mechanisms.

Windsurf / Agent Execution Notes

Prerequisites: Run CLEANUP.md Sections 0-4.5 first to set up:
- ${TS} variable (timestamp)
- ${ARCHIVE} variable (archive path)
- Helper functions (move_to_removed, backup_for_refactor)

Then open this file and run sections in order.

For each section:

Execute the code block.

Verify console output.

Stage & commit changes as indicated.

After §5 passes, open a PR with the template in §6.

End of REFACTOR.md

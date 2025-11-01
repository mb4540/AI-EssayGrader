# CLEANUP.md — Safe Cleanup Following .windsurf Rules

**⚠️ THIS IS A REFERENCE TEMPLATE - DO NOT MODIFY FOR SPECIFIC EXECUTIONS**

For specific cleanup tasks, create a new file like `CLEANUP_EXECUTION_YYYY-MM-DD.md` based on this template.

**Last Updated:** November 1, 2025  
**Follows:** All `.windsurf/rules/*.md` standards

---

## 🎯 Goal

Tidy the codebase without breaking shipping software. All removals are soft-deleted (renamed/moved) so they can be restored. Any file slated for refactor is backed up first.

## 🔑 Key Principles

### Code Quality Standards
**Following:** `.windsurf/rules/code-style.md`
- ✅ TypeScript with explicit types
- ✅ camelCase for variables/functions
- ✅ PascalCase for types/interfaces
- ✅ UPPER_SNAKE_CASE for constants
- ✅ kebab-case for files

### Git Workflow
**Following:** `.windsurf/rules/git-workflow.md`
- ✅ Feature branches only (never work on `main`)
- ✅ Descriptive commit messages
- ✅ One logical change per commit
- ✅ Tag checkpoints before major changes

### Database Safety
**Following:** `.windsurf/rules/database-design.md` & `neon-database.md`
- ⚠️ ALWAYS backup schema before ANY database changes
- ⚠️ Check `db_ref.md` BEFORE making changes
- ⚠️ Update `db_ref.md` AFTER making changes
- ⚠️ Use Neon branching for testing migrations

### Security
**Following:** `.windsurf/rules/security.md`
- ⚠️ Never commit `.env` files
- ⚠️ Never log secrets or API keys
- ⚠️ Validate all user input
- ⚠️ Use parameterized SQL queries only

### Multi-Project Workspace
**Following:** `.windsurf/rules/multi-project-workspace.md`
- ✅ **AI-EssayGrader:** Active project (ALL changes allowed)
- ❌ **gift-of-time-assistant:** Reference only (READ ONLY)
- ⚠️ NEVER make changes to gift-of-time-assistant directory

---

## 📋 Table of Contents

**Pre-Cleanup:**
- [Section 0: Pre-Cleanup - Remove All Prior Soft-Deleted Files](#0-pre-cleanup-remove-all-prior-soft-deleted-files)

**Safety & Setup:**
- [Section 1: Safety First - Git Checkpoint & Utilities](#1-safety-first--git-checkpoint--utilities)
  - 1.0 Pre-Flight Safety Checks
  - 1.1 Create Checkpoint Branch & Tag
  - 1.2 Create Archive Folders
  - 1.3 Helper Functions

**Codebase Review:**
- [Section 2: Review the Current Codebase](#2-review-the-current-codebase-senior-dev-pass)
  - 2.1 Code Style Compliance Check
  - 2.2 Security Audit
  - 2.3 Database Schema Verification
  - 2.4 Testing Coverage Check
  - 2.5 Verify .gitignore

**File Organization:**
- [Section 3: Move Root Planning Markdown Files](#3-move-root-planning-markdown-files-to-oldplans)
- [Section 3.5: Backup Database Schema](#35-backup-database-schema-safety-net)
- [Section 4: Clean Up Migrations and SQL Scripts](#4-clean-up-migrations-and-sql-scripts)
- [Section 4.5: Clean Up Root-Level Scripts and Data Files](#45-clean-up-root-level-scripts-and-data-files)

**Completion:**
- [Cleanup Complete Summary](#-cleanup-complete)
- [Rollback Instructions](#rollback)

**Next Phase:**
- For code refactoring, testing, and quality improvements, see **ReusePlans/REFACTOR.md**

---

## 0) Pre-Cleanup: Remove All Prior Soft-Deleted Files

Run from repo root in bash/zsh. Requires git.

**Objective:** Permanently delete all files from previous cleanup runs that are in .archive/ folders.

```bash
set -euo pipefail

# 0.0.1 Check if .archive directory exists
if [ -d ".archive" ]; then
  echo "🔍 Found .archive directory with previous cleanup runs"
  
  # 0.0.2 List all archive folders and their sizes
  echo "📊 Archive folders:"
  du -sh .archive/*/ 2>/dev/null || echo "  (no subdirectories found)"
  
  # 0.0.3 Count total files to be deleted
  TOTAL_FILES=$(find .archive -type f | wc -l)
  TOTAL_SIZE=$(du -sh .archive | cut -f1)
  echo "📦 Total: ${TOTAL_FILES} files, ${TOTAL_SIZE}"
  
  # 0.0.4 Confirm deletion (safety check)
  echo ""
  echo "⚠️  WARNING: This will PERMANENTLY delete all archived files from previous cleanups."
  echo "   These files cannot be recovered after this operation."
  echo ""
  read -p "   Continue? (type 'yes' to confirm): " CONFIRM
  
  if [ "$CONFIRM" = "yes" ]; then
    # 0.0.5 Remove .archive directory and all contents
    echo "🗑️  Removing .archive directory..."
    rm -rf .archive
    
    # 0.0.6 Stage the deletion in git
    git add -A
    git commit -m "chore(cleanup): permanently delete all prior archived files from .archive/"
    
    echo "✅ All prior archived files have been permanently deleted"
  else
    echo "❌ Deletion cancelled. Keeping .archive directory."
    exit 1
  fi
else
  echo "✅ No .archive directory found. Nothing to clean up."
fi

echo ""
echo "---"
echo ""
```

---

## 1) Safety First — Git Checkpoint & Utilities

Run from repo root in bash/zsh. Requires git.

**Following:** `.windsurf/rules/git-workflow.md`

```bash
set -euo pipefail

# 1.0 Pre-Flight Safety Checks
echo "🔒 Running pre-flight safety checks..."

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: You have uncommitted changes. Commit or stash them first."
  git status --short
  exit 1
fi

# Check current branch (MUST be feature branch per git-workflow.md)
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
  echo "❌ ERROR: You're on the main branch!"
  echo "   Per .windsurf/rules/git-workflow.md: NEVER work directly on main"
  echo "   Create a feature branch first: git switch -c feature/cleanup-YYYYMMDD"
  exit 1
fi

# Verify we're in AI-EssayGrader project (not gift-of-time-assistant)
CURRENT_DIR="$(pwd)"
if [[ "$CURRENT_DIR" != *"/AI-EssayGrader/AI-EssayGrader"* ]]; then
  echo "❌ ERROR: Not in AI-EssayGrader project directory!"
  echo "   Per .windsurf/rules/multi-project-workspace.md:"
  echo "   - AI-EssayGrader: Active project (changes allowed)"
  echo "   - gift-of-time-assistant: Reference only (NO changes)"
  echo "   Current: $CURRENT_DIR"
  exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# 1.1 Create a checkpoint branch & tag
TS="$(date +%Y%m%d-%H%M%S)"
git fetch --all --prune
git switch -c cleanup/${TS}
git tag -a "pre-cleanup-${TS}" -m "Checkpoint before cleanup ${TS}"

echo "✅ Created checkpoint branch: cleanup/${TS}"
echo "✅ Created safety tag: pre-cleanup-${TS}"
echo ""

# 1.2 Create archive folders for this run
ARCHIVE=".archive/${TS}"
mkdir -p "${ARCHIVE}/removed" "${ARCHIVE}/refactor_backups"

echo "✅ Created archive directories:"
echo "   - ${ARCHIVE}/removed (for deleted files)"
echo "   - ${ARCHIVE}/refactor_backups (for backups)"
echo ""

# 1.3 Helper functions (use git mv to preserve history)
move_to_removed() {
  local src="$1"
  local dest="${ARCHIVE}/removed/${src}"
  mkdir -p "$(dirname "${dest}")"
  
  # Use git mv if tracked; otherwise just mv
  if git ls-files --error-unmatch "${src}" >/dev/null 2>&1; then
    git mv "${src}" "${dest}"
  else
    mkdir -p "$(dirname "${dest}")"
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
```

---

## 2) Review the Current Codebase (Senior Dev Pass)

**Objective:** Identify compliance issues, dead code, and standards drift per .windsurf rules.

### 2.1 Code Style Compliance Check

**Following:** `.windsurf/rules/code-style.md`

```bash
echo "📝 Checking code style compliance..."
echo ""

# Check for common style violations
echo "Checking naming conventions..."
echo ""

# Find files with incorrect naming
echo "Files NOT in kebab-case:"
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*test*" | while read file; do
  basename_only=$(basename "$file" | sed 's/\.[^.]*$//')
  if [[ ! "$basename_only" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] && [[ ! "$basename_only" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
    echo "  ⚠️  $file (should be kebab-case or PascalCase for components)"
  fi
done

echo ""
echo "Checking for 'any' types (should be explicit):"
grep -r "any" src --include="*.ts" --include="*.tsx" | head -n 10 || echo "  ✅ None found"

echo ""
echo "Checking for console.logs (except error handlers):"
grep -r "console.log" src --include="*.ts" --include="*.tsx" | grep -v "console.error" | head -n 10 || echo "  ✅ None found"

echo ""
```

### 2.2 Security Audit

**Following:** `.windsurf/rules/security.md`

```bash
echo "🔒 Running security audit..."
echo ""

# Check for hardcoded secrets
echo "Checking for potential hardcoded secrets..."
grep -ri "api.key\|password\|secret\|token" src --include="*.ts" --include="*.tsx" | \
  grep -v "process.env" | \
  grep -v "// " | \
  grep -v "type " | \
  head -n 5 || echo "  ✅ None found"

echo ""

# Check for SQL injection risks
echo "Checking for SQL injection risks..."
grep -r "sql\`" netlify/functions --include="*.ts" -A 2 | \
  grep "\${" | \
  head -n 5 && echo "  ⚠️  Review these for parameterization" || echo "  ✅ All queries use parameterized syntax"

echo ""

# Verify .env is in .gitignore
if grep -q "\.env" .gitignore; then
  echo "✅ .env is in .gitignore"
else
  echo "❌ ERROR: .env NOT in .gitignore!"
fi

echo ""
```

### 2.3 Database Schema Verification

**Following:** `.windsurf/rules/database-design.md` & `neon-database.md`

```bash
echo "🗄️  Checking database schema consistency..."
echo ""

# Verify db_ref.md exists and is recent
if [ -f "db_ref.md" ]; then
  LAST_UPDATED=$(head -n 5 db_ref.md | grep "Last Updated" || echo "Unknown")
  echo "✅ db_ref.md exists"
  echo "   $LAST_UPDATED"
  echo ""
  echo "⚠️  REMINDER: Per .windsurf/rules/database-design.md:"
  echo "   - BEFORE schema changes: Read db_ref.md"
  echo "   - AFTER schema changes: Update db_ref.md"
else
  echo "⚠️  WARNING: db_ref.md not found!"
  echo "   This is the single source of truth for database schema"
fi

echo ""

# Check migration files follow naming convention
echo "Checking migration file naming..."
if [ -d "migrations" ]; then
  ls migrations/*.sql 2>/dev/null | while read migration; do
    basename_only=$(basename "$migration")
    if [[ "$basename_only" =~ ^[a-z_]+\.sql$ ]]; then
      echo "  ✅ $basename_only (follows naming convention)"
    else
      echo "  ⚠️  $basename_only (consider snake_case naming)"
    fi
  done
else
  echo "  ℹ️  No migrations directory found"
fi

echo ""
```

### 2.4 Testing Coverage Check

**Following:** `.windsurf/rules/testing.md`

```bash
echo "🧪 Checking test coverage..."
echo ""

# Count test files
TEST_COUNT=$(find src netlify/functions -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l)
SOURCE_COUNT=$(find src netlify/functions -name "*.ts" -o -name "*.tsx" | grep -v ".test." | grep -v ".spec." | wc -l)

echo "Test files: $TEST_COUNT"
echo "Source files: $SOURCE_COUNT"
echo ""

if [ "$TEST_COUNT" -lt 10 ]; then
  echo "⚠️  Low test coverage! Per .windsurf/rules/testing.md:"
  echo "   - Target: 75%+ overall coverage"
  echo "   - Critical functions: 90%+"
  echo "   - See TEST_PLAN.md for implementation guide"
fi

echo ""

# Check if test infrastructure exists
if [ -f "vitest.config.ts" ]; then
  echo "✅ vitest.config.ts exists"
else
  echo "⚠️  vitest.config.ts not found"
fi

if [ -f "src/test/setup.ts" ]; then
  echo "✅ src/test/setup.ts exists"
else
  echo "⚠️  src/test/setup.ts not found"
fi

echo ""
```

### 2.5 Verify .gitignore is Comprehensive

**Following:** `.windsurf/rules/security.md` & `git-workflow.md`

```bash
echo "📝 Checking .gitignore..."

GITIGNORE_REQUIRED=(
  ".env"
  ".env.local"
  ".env.*.local"
  "node_modules"
  "dist"
  "build"
  ".netlify"
  "*.log"
  ".DS_Store"
  "coverage"
  ".vscode"
  ".idea"
)

for pattern in "${GITIGNORE_REQUIRED[@]}"; do
  if grep -q "$pattern" .gitignore; then
    echo "  ✅ $pattern"
  else
    echo "  ⚠️  Missing: $pattern"
  fi
done

echo ""
```

---

## 3) Move Root Planning Markdown Files to OldPlans/

**Objective:** Reduce root clutter while keeping planning docs.

**Following:** `.windsurf/rules/git-workflow.md` (keeping repo organized)

```bash
mkdir -p OldPlans

# Move only ROOT-level .md files except the safelist:
find . -maxdepth 1 -type f -name "*.md" \
  ! -name "README.md" \
  ! -name "LICENSE" ! -name "LICENSE.*" \
  ! -name "SECURITY.md" \
  ! -name "CODE_OF_CONDUCT.md" \
  ! -name "CONTRIBUTING.md" \
  ! -name "CHANGELOG.md" \
  ! -name "TEST_PLAN.md" \
  ! -name "MasterToDo.md" \
  -exec git mv {} OldPlans/ \; || true

git add -A
git commit -m "chore(cleanup): relocate root planning .md files to OldPlans/

Per .windsurf/rules/git-workflow.md: Keep repo organized"

echo "✅ Root planning docs moved to OldPlans/"
```

---

## 3.5) Backup Database Schema (Safety Net)

**Objective:** Create a snapshot of current database schema before cleanup.

**Following:** `.windsurf/rules/database-design.md` & `neon-database.md`

```bash
echo "💾 Creating database schema backup..."
echo ""
echo "⚠️  CRITICAL: Per .windsurf/rules/database-design.md"
echo "   ALWAYS backup schema before ANY database changes!"
echo ""

SCHEMA_BACKUP="${ARCHIVE}/database_schema_backup.sql"

# Option 1: Use Neon branching (RECOMMENDED)
echo "📋 Recommended: Create Neon branch for testing"
echo "   Command: neon branches create --name cleanup-test-${TS}"
echo ""

# Option 2: Export schema
if [ -n "${DATABASE_URL:-}" ]; then
  echo "  Alternative: Export schema to ${SCHEMA_BACKUP}"
  echo "  ⚠️  Manual step: Run get_complete_schema.sql in Neon"
  echo "     Save output to: ${SCHEMA_BACKUP}"
else
  echo "  ⚠️  DATABASE_URL not set. Manual backup required."
fi

read -p "Database backed up or Neon branch created? (y/n): " DB_BACKED_UP
if [ "$DB_BACKED_UP" != "y" ]; then
  echo "❌ Aborted. Backup database first."
  exit 1
fi

git add -A
git commit -m "chore(cleanup): add database schema backup [${TS}]

Per .windsurf/rules/database-design.md: Always backup before changes"

echo "✅ Database backup checkpoint created"
echo ""
```

---

## 4) Clean Up Migrations and SQL Scripts

**Objective:** Archive old migrations while maintaining schema integrity.

**Following:** `.windsurf/rules/database-design.md`

```bash
echo "📊 Current migrations:"
ls -lh migrations/*.sql 2>/dev/null || echo "  (no migrations found)"
echo ""

echo "⚠️  REMINDER: Per .windsurf/rules/database-design.md:"
echo "   - Table-prefixed IDs (e.g., submission_id, not just id)"
echo "   - Foreign keys with explicit ON DELETE rules"
echo "   - Indexes for all foreign keys"
echo "   - Comments on tables and columns"
echo ""

# Review each migration
echo "Review migrations for archiving candidates:"
echo "  - One-time data fixes"
echo "  - Superseded migrations"
  echo "  - Test/development-only migrations"
echo ""

# Create migrations archive folder
mkdir -p "${ARCHIVE}/removed/migrations"

# Manual review process
ls migrations/*.sql 2>/dev/null | while read migration; do
  echo "Review: $migration"
  read -p "  Archive this migration? (y/n): " ARCHIVE_MIGRATION
  if [ "$ARCHIVE_MIGRATION" = "y" ]; then
    move_to_removed "$migration"
  fi
done

git add -A
git commit -m "chore(cleanup): archive old migrations [${TS}]

Preserved active schema-defining migrations"

echo "✅ Migration cleanup complete"
echo ""
```

---

## 4.5) Clean Up Root-Level Scripts and Data Files

**Objective:** Archive one-time scripts and data files from root directory.

```bash
echo "🔍 Root-level scripts and data files:"
find . -maxdepth 1 -type f \( -name "*.sql" -o -name "*.js" -o -name "*.json" \) \
  ! -name "package*.json" \
  ! -name "tsconfig*.json" \
  ! -name "components.json" \
  ! -name "*.config.js" \
  ! -name "*.config.ts" \
  -print

echo ""
echo "Review each file for archiving..."
echo ""

# Archive one-time SQL scripts
find . -maxdepth 1 -type f -name "*.sql" -print0 | while IFS= read -r -d '' sqlfile; do
  echo "Found SQL: $sqlfile"
  read -p "  Archive? (y/n): " ARCHIVE_SQL
  if [ "$ARCHIVE_SQL" = "y" ]; then
    move_to_removed "$sqlfile"
  fi
done

git add -A
git commit -m "chore(cleanup): archive root-level scripts and data files [${TS}]"

echo "✅ Root cleanup complete"
echo ""
```

---

## ✅ CLEANUP COMPLETE

The file organization cleanup is now complete following all .windsurf rules:

**Completed:**
- ✅ Section 0: Pre-Cleanup (removed old archives)
- ✅ Section 1: Safety First (checkpoint branch & tag created per git-workflow.md)
- ✅ Section 2: Codebase Review (code-style.md, security.md, database-design.md, testing.md)
- ✅ Section 3: Root Planning Docs (moved to OldPlans/)
- ✅ Section 3.5: Database Backup (per database-design.md)
- ✅ Section 4: Migrations Cleanup (preserved schema integrity)
- ✅ Section 4.5: Root Scripts Cleanup (archived one-time files)

**Standards Applied:**
- ✅ `.windsurf/rules/code-style.md` - TypeScript naming conventions
- ✅ `.windsurf/rules/git-workflow.md` - Feature branch workflow
- ✅ `.windsurf/rules/database-design.md` - Schema backup procedures
- ✅ `.windsurf/rules/security.md` - Secret management, input validation
- ✅ `.windsurf/rules/testing.md` - Test coverage verification
- ✅ `.windsurf/rules/multi-project-workspace.md` - Project isolation

**Next Steps:**

For code refactoring, testing, and quality improvements, see:
📄 **ReusePlans/REFACTOR.md**

---

## Rollback

If needed, restore to pre-cleanup state:

```bash
# Full rollback
git reset --hard pre-cleanup-${TS}

# Restore individual files
git mv ${ARCHIVE}/removed/[file] [original-path]
```

---

**End of CLEANUP.md (Updated for .windsurf rules compliance)**

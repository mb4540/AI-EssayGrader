CLEANUP.md — Safe Cleanup, Refactor, Test, and Rollback Plan

**⚠️ THIS IS A REFERENCE TEMPLATE - DO NOT MODIFY FOR SPECIFIC EXECUTIONS**

For specific cleanup tasks, create a new file like `CLEANUP_EXECUTION_YYYY-MM-DD.md` based on this template.

---

Goal: Tidy the codebase without breaking shipping software. All removals are soft-deleted (renamed/moved) so they can be restored. Any file slated for refactor is backed up first. Root planning .md files are moved to OldPlans/ (excluded from Git). Everything is validated by tests with a quick rollback path.

**Key Principles:**
- **OldPlans/**: Historical documentation, NOT tracked in Git (in .gitignore)
- **Starting Fresh**: Delete obsolete files permanently, don't archive
- **Ongoing Work**: Move completed work to OldPlans/ for reference
- **Safety First**: Always create Git checkpoint before cleanup

---

## 📋 Table of Contents

**Pre-Cleanup:**
- [Section 0: Pre-Cleanup - Remove All Prior Soft-Deleted Files](#0-pre-cleanup-remove-all-prior-soft-deleted-files)

**Safety & Setup:**
- [Section 1: Safety First - Git Checkpoint & Utilities](#1-safety-first--git-checkpoint--utilities)
  - 1.0 Pre-Flight Safety Checks
  - 1.1 Create Checkpoint Branch & Tag
  - 1.1.5 Optional Dry-Run Mode
  - 1.2 Create Archive Folders
  - 1.3 Helper Functions

**Codebase Review:**
- [Section 2: Review the Current Codebase](#2-review-the-current-codebase-senior-dev-pass)
  - 2.5 Verify .gitignore

**File Organization:**
- [Section 3: Move Root Planning Markdown Files](#3-move-root-planning-markdown-files-to-oldplans)
- [Section 3.5: Backup Database Schema](#35-backup-database-schema-safety-net)
- [Section 4: Clean Up Migrations and SQL Scripts](#4-clean-up-migrations-and-sql-scripts)
- [Section 4.5: Clean Up Root-Level Scripts and Data Files](#45-clean-up-root-level-scripts-and-data-files)

**Completion:**
- [Cleanup Complete Summary](#-cleanup-complete)
- [Windsurf / Agent Execution Notes](#windsurf--agent-execution-notes)
- [Rollback Instructions](#rollback)

**Next Phase:**
- For code refactoring, testing, and quality improvements, see **ReusePlans/REFACTOR.md**

---

0) Pre-Cleanup: Remove All Prior Soft-Deleted Files

Run from repo root in bash/zsh. Requires git.

Objective: Permanently delete all files from previous cleanup runs that are in .archive/ folders.

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

1) Safety First — Git Checkpoint & Utilities

Run from repo root in bash/zsh. Requires git.

set -euo pipefail

# 1.0 Pre-Flight Safety Checks
echo "🔒 Running pre-flight safety checks..."

# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: You have uncommitted changes. Commit or stash them first."
  git status --short
  exit 1
fi

# Check current branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
  echo "⚠️  WARNING: You're on the main branch!"
  read -p "   Continue anyway? (type 'yes'): " MAIN_CONFIRM
  if [ "$MAIN_CONFIRM" != "yes" ]; then
    echo "❌ Aborted. Switch to a feature branch first."
    exit 1
  fi
fi

# Check if backup script exists
if [ ! -f "scripts/backup_and_promote.sh" ]; then
  echo "⚠️  WARNING: Backup script not found at scripts/backup_and_promote.sh"
  echo "   This is your rollback mechanism. Continue without it?"
  read -p "   (y/n): " NO_BACKUP
  if [ "$NO_BACKUP" != "y" ]; then
    exit 1
  fi
fi

echo "✅ Pre-flight checks passed"
echo ""

# 1.1 Create a checkpoint branch & tag
TS="$(date +%Y%m%d-%H%M%S)"
git fetch --all --prune
git switch -c cleanup/${TS}
git tag -a "pre-cleanup-${TS}" -m "Checkpoint before cleanup ${TS}"

# 1.1.5 Optional: Enable dry-run mode
read -p "Run in DRY-RUN mode? (shows what would be done, no changes): (y/n) " DRY_RUN
if [ "$DRY_RUN" = "y" ]; then
  echo "🧪 DRY-RUN MODE ENABLED - No changes will be made"
  DRY_RUN_MODE=true
  
  # Override helper functions for dry-run
  move_to_removed() {
    echo "  [DRY-RUN] Would move: $1 -> ${ARCHIVE}/removed/$1"
  }
  
  backup_for_refactor() {
    echo "  [DRY-RUN] Would backup: $1 -> ${ARCHIVE}/refactor_backups/$1"
  }
else
  DRY_RUN_MODE=false
fi

# 1.2 Create archive folders for this run
ARCHIVE=".archive/${TS}"
mkdir -p "${ARCHIVE}/removed" "${ARCHIVE}/refactor_backups"

# 1.3 Helper fns (use git mv to preserve history where possible)
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

2) Review the Current Codebase (Senior Dev Pass)

Objective: Identify readability issues, dead code, and standards drift.

Tasks:

Scan for:

Non-idiomatic patterns, large functions, duplicated logic.

Unused exports/dead modules (use your preferred tools, e.g., npx ts-prune, npx depcheck).

Missing types, weak typing, missing tests.

Record decisions in CLEANUP_NOTES.md (what to refactor/remove and why).

Tip: List candidate large files (>350 lines):

echo "Large files (>350 lines):"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" \
  -exec wc -l {} + | awk '$1>350 {print $2}'

# 2.5 Verify .gitignore is comprehensive
echo "📝 Checking .gitignore..."
GITIGNORE_REQUIRED=(
  ".env"
  ".env.local"
  "node_modules"
  "dist"
  ".netlify"
  "*.log"
)

for pattern in "${GITIGNORE_REQUIRED[@]}"; do
  if grep -q "$pattern" .gitignore; then
    echo "  ✅ $pattern"
  else
    echo "  ⚠️  Missing: $pattern"
  fi
done

3) Move Root Planning Markdown Files to OldPlans/

Objective: Reduce root clutter while keeping planning docs.

Notes:

Move root-level *.md created for Cascade planning into OldPlans/.

Do not move canonical docs: README.md, LICENSE*, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, CHANGELOG.md.

mkdir -p OldPlans
# Move only ROOT-level .md files except the safelist:
find . -maxdepth 1 -type f -name "*.md" \
  ! -name "README.md" \
  ! -name "LICENSE" ! -name "LICENSE.*" \
  ! -name "SECURITY.md" \
  ! -name "CODE_OF_CONDUCT.md" \
  ! -name "CONTRIBUTING.md" \
  ! -name "CHANGELOG.md" \
  -exec git mv {} OldPlans/ \; || true

git add -A
git commit -m "chore(cleanup): relocate root planning .md files to OldPlans/"

3.5) Backup Database Schema (Safety Net)

Objective: Create a snapshot of current database schema before cleanup.

# 3.5.1 Export current schema (if using Neon/PostgreSQL)
echo "💾 Creating database schema backup..."
SCHEMA_BACKUP="${ARCHIVE}/database_schema_backup.sql"

# Note: Requires DATABASE_URL environment variable
if [ -n "$DATABASE_URL" ]; then
  echo "  Exporting schema to ${SCHEMA_BACKUP}"
  # Add your database export command here
  # Example for PostgreSQL:
  # pg_dump "$DATABASE_URL" --schema-only > "$SCHEMA_BACKUP"
  echo "  ⚠️  Manual step: Export your database schema"
  echo "     Save to: ${SCHEMA_BACKUP}"
else
  echo "  ⚠️  DATABASE_URL not set. Skipping auto-backup."
  echo "     Manually backup your database before proceeding!"
fi

read -p "Database backed up? (y/n): " DB_BACKED_UP
if [ "$DB_BACKED_UP" != "y" ]; then
  echo "❌ Aborted. Backup database first."
  exit 1
fi

git add -A
git commit -m "chore(cleanup): add database schema backup [${TS}]"

4) Clean Up Migrations and SQL Scripts

Objective: Archive old migrations and single-use SQL scripts to reduce clutter.

Notes:

Database migrations should be kept if they define the current schema state.

Single-use helper scripts (data fixes, one-time imports) can be archived after successful execution.

Keep a migrations/README.md documenting which migrations are active vs archived.

Procedure:

# 4.1 Review migrations folder
echo "📊 Current migrations:"
ls -lh migrations/*.sql 2>/dev/null || echo "  (no migrations found)"

# 4.2 Identify candidates for archiving
# - One-time data fixes (e.g., cleanup scripts, data imports)
# - Superseded migrations (if you've consolidated schema)
# - Test/development-only migrations

# 4.3 Create migrations archive folder
mkdir -p "${ARCHIVE}/removed/migrations"

# 4.4 Archive single-use SQL scripts (edit list as needed)
MIGRATIONS_TO_ARCHIVE=(
  # Example: Add your single-use scripts here
  # "migrations/999_one_time_data_fix.sql"
  # "migrations/temp_import_helper.sql"
)

for script in "${MIGRATIONS_TO_ARCHIVE[@]}"; do
  if [ -f "$script" ]; then
    move_to_removed "$script"
  fi
done

# 4.5 Archive root-level SQL scripts (if any)
echo "🔍 Checking for root-level SQL scripts..."
find . -maxdepth 1 -type f -name "*.sql" -print0 | while IFS= read -r -d '' sqlfile; do
  echo "  Found: $sqlfile"
  read -p "  Archive this file? (y/n): " ARCHIVE_SQL
  if [ "$ARCHIVE_SQL" = "y" ]; then
    move_to_removed "$sqlfile"
  fi
done

# 4.6 Document what's left
if [ -f "migrations/README.md" ]; then
  echo "✅ migrations/README.md exists"
else
  echo "📝 Consider creating migrations/README.md to document active migrations"
fi

git add -A
git commit -m "chore(cleanup): archive old migrations and SQL scripts [${TS}]"

4.5) Clean Up Root-Level Scripts and Data Files

Objective: Archive one-time scripts and data files from root directory.

# 4.5.1 List root-level scripts and data files
echo "🔍 Root-level scripts and data files:"
find . -maxdepth 1 -type f \( -name "*.sql" -o -name "*.js" -o -name "*.json" \) \
  ! -name "package*.json" \
  ! -name "tsconfig*.json" \
  ! -name "components.json" \
  ! -name "*.config.js" \
  -print

# 4.5.2 Archive one-time SQL scripts
ROOT_SQL_TO_ARCHIVE=(
  "cleanup-earnings.sql"
  "find_duplicate_stocks.sql"
  "fix-cash-position.sql"
  "neon_initial_tables.sql"  # Superseded by migrations
)

for script in "${ROOT_SQL_TO_ARCHIVE[@]}"; do
  if [ -f "$script" ]; then
    move_to_removed "$script"
  fi
done

# 4.5.3 Archive test scripts (move to scripts/tests/ or archive)
ROOT_TEST_SCRIPTS=(
  "test-earnings.js"
  "test-prices.js"
)

echo "📝 Test scripts found. Options:"
echo "  1) Move to scripts/tests/ (keep for future use)"
echo "  2) Archive (one-time use only)"
read -p "Choose (1/2): " TEST_CHOICE

if [ "$TEST_CHOICE" = "1" ]; then
  mkdir -p scripts/tests
  for script in "${ROOT_TEST_SCRIPTS[@]}"; do
    [ -f "$script" ] && git mv "$script" "scripts/tests/"
  done
elif [ "$TEST_CHOICE" = "2" ]; then
  for script in "${ROOT_TEST_SCRIPTS[@]}"; do
    [ -f "$script" ] && move_to_removed "$script"
  done
fi

# 4.5.4 Archive one-time data imports
ROOT_DATA_FILES=(
  "tmf-import-2025-10-04.json"
  # Add other large data files here
)

for datafile in "${ROOT_DATA_FILES[@]}"; do
  if [ -f "$datafile" ]; then
    move_to_removed "$datafile"
  fi
done

git add -A
git commit -m "chore(cleanup): archive root-level scripts and data files [${TS}]"

---

## ✅ CLEANUP COMPLETE

The file organization cleanup is now complete. The following steps have been executed:

**Completed:**
- ✅ Section 0: Pre-Cleanup (removed old archives)
- ✅ Section 1: Safety First (checkpoint branch & tag created)
- ✅ Section 2: Codebase Review (.gitignore verification)
- ✅ Section 3: Root Planning Docs (moved to OldPlans/)
- ✅ Section 3.5: Database Backup (schema backup created)
- ✅ Section 4: Migrations Cleanup (archived old migrations)
- ✅ Section 4.5: Root Scripts Cleanup (archived SQL/JS/JSON files)

**Next Steps:**

For code refactoring, testing, and quality improvements, see:
📄 **ReusePlans/REFACTOR.md**

That file contains:
- Remove unused code
- Create reusable common components
- Refactor large files
- Enhance documentation
- Testing & quality gates
- PR strategy

---

## Windsurf / Agent Execution Notes

This file contains the CLEANUP phase only (file organization).

Execute sections 0-4.5 in order:

1. Run each code block
2. Verify console output
3. Stage & commit changes as indicated
4. Proceed to REFACTOR.md for code quality improvements

## Rollback

If needed, restore to pre-cleanup state:

git reset --hard pre-cleanup-${TS}

Or restore individual files:

git mv ${ARCHIVE}/removed/[file] [original-path]

End of CLEANUP.md
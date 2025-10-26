# FastAI Grader - Cleanup Execution Plan
**Date**: October 26, 2024  
**Based on**: ReusePlans/CLEANUP.md (Reference Template)  
**Purpose**: Fresh start - Delete old plan files, organize current documentation

---

## 🎯 Objectives

1. **Delete old plan files permanently** (starting fresh, not archiving)
2. **Move current documentation** to OldPlans (excluded from Git)
3. **Keep only essential root files** (README, LICENSE, etc.)
4. **Verify .gitignore** excludes OldPlans and .archive

---

## 📋 Pre-Execution Checklist

- [x] .gitignore updated to exclude `OldPlans/` and `.archive/`
- [ ] All current work committed to Git
- [ ] Backup created (Git tag)
- [ ] Ready to execute cleanup

---

## Section 0: Pre-Cleanup - Delete Old Plan Files

**Status**: Starting Fresh  
**Action**: PERMANENTLY DELETE (not archive) old plan files

### Files to Delete Permanently:

```bash
# These are from previous project iterations - delete permanently
OldPlans/NEON_DATABASE_RULES.md      # Superseded by .windsurf/rules/neon-database.md
OldPlans/NEON_SETUP_CHECKLIST.md    # Setup complete, no longer needed
```

### Execution:

```bash
# Navigate to project root
cd /Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader

# Delete old plan files permanently
rm -rf OldPlans/NEON_DATABASE_RULES.md
rm -rf OldPlans/NEON_SETUP_CHECKLIST.md

# Commit the deletion
git add -A
git commit -m "chore(cleanup): delete obsolete plan files from previous iterations"
```

**Rationale**: These files are from previous setup phases and are now superseded by:
- `.windsurf/rules/neon-database.md` (comprehensive Neon rules)
- `.windsurf/rules/database-design.md` (database design standards)
- Setup is complete and verified working

---

## Section 1: Safety First - Git Checkpoint

### 1.1 Create Checkpoint

```bash
# Create timestamp
TS="$(date +%Y%m%d-%H%M%S)"

# Create checkpoint branch
git checkout -b cleanup/${TS}

# Create safety tag
git tag -a "pre-cleanup-${TS}" -m "Checkpoint before cleanup ${TS}"

echo "✅ Checkpoint created: pre-cleanup-${TS}"
echo "   Rollback command: git reset --hard pre-cleanup-${TS}"
```

### 1.2 Verify Clean State

```bash
# Check for uncommitted changes
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ ERROR: Uncommitted changes detected"
  git status --short
  exit 1
else
  echo "✅ Working directory clean"
fi
```

---

## Section 2: Review Current Root Files

### 2.1 List Root Markdown Files

```bash
echo "📄 Current root .md files:"
find . -maxdepth 1 -type f -name "*.md" -exec ls -lh {} \;
```

### 2.2 Files to Keep in Root

**Essential Documentation** (DO NOT MOVE):
- `README.md` - Project documentation
- `LICENSE` / `LICENSE.md` - License file
- `SECURITY.md` - Security policy (if exists)
- `CODE_OF_CONDUCT.md` - Code of conduct (if exists)
- `CONTRIBUTING.md` - Contribution guidelines (if exists)
- `CHANGELOG.md` - Change log (if exists)

**Current Project Files** (KEEP):
- `.windsurf/` directory - AI assistant rules (tracked in Git)
- `ReusePlans/` directory - Reusable templates (tracked in Git)

### 2.3 Files to Move to OldPlans

**Planning/Documentation Files** (MOVE to OldPlans):
- `ANNOTATION_PROGRESS.md`
- `ANNOTATOR.md`
- `ANNOTATOR_UPDATED_PLAN.md`
- `BLOBSTORAGECLUES.md`
- `BUILD_SUMMARY.md`
- `COMMANDS.md` (superseded by .windsurf/rules/)
- `DEPLOYMENT_CHECKLIST.md`
- `DRAFT_COMPARISON_FEATURE.md`
- `FEATURE_SUMMARY.md`
- `FILESTORAGE.md`
- `FastAIGrader.md`
- `INITIALIZATION_COMPLETE.md`
- `NEON_DATABASE_RULES.md` (if still in root)
- `NetlifyBlobs.md`
- `PROJECT_STATUS.md`
- `QUICKSTART.md`
- `SETUP_GUIDE.md`
- `TODO.md`

---

## Section 3: Execute Cleanup

### 3.1 Move Planning Docs to OldPlans

```bash
# Create OldPlans directory (if doesn't exist)
mkdir -p OldPlans

# Move planning markdown files
PLANNING_DOCS=(
  "ANNOTATION_PROGRESS.md"
  "ANNOTATOR.md"
  "ANNOTATOR_UPDATED_PLAN.md"
  "BLOBSTORAGECLUES.md"
  "BUILD_SUMMARY.md"
  "COMMANDS.md"
  "DEPLOYMENT_CHECKLIST.md"
  "DRAFT_COMPARISON_FEATURE.md"
  "FEATURE_SUMMARY.md"
  "FILESTORAGE.md"
  "FastAIGrader.md"
  "INITIALIZATION_COMPLETE.md"
  "NetlifyBlobs.md"
  "PROJECT_STATUS.md"
  "QUICKSTART.md"
  "SETUP_GUIDE.md"
  "TODO.md"
)

for doc in "${PLANNING_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    mv "$doc" OldPlans/
    echo "  Moved: $doc -> OldPlans/"
  fi
done

echo "✅ Planning docs moved to OldPlans/"
```

### 3.2 Clean Up Root SQL Files

```bash
# List root SQL files
echo "🔍 Root SQL files:"
find . -maxdepth 1 -type f -name "*.sql"

# Move old schema files to OldPlans
SQL_FILES=(
  "schema.sql"  # Old schema (superseded by schema_v2_proper_naming.sql)
)

for sqlfile in "${SQL_FILES[@]}"; do
  if [ -f "$sqlfile" ]; then
    mv "$sqlfile" OldPlans/
    echo "  Moved: $sqlfile -> OldPlans/"
  fi
done

echo "✅ Old SQL files moved"
```

### 3.3 Clean Up Migration Files

```bash
# List migration files
echo "🔍 Migration files:"
find . -maxdepth 1 -type f -name "schema_migration_*.sql"

# Move old migrations to OldPlans/migrations
mkdir -p OldPlans/migrations

MIGRATIONS=(
  "schema_migration_annotations.sql"
  "schema_migration_assignment_criteria.sql"
  "schema_migration_drafts.sql"
  "schema_migration_image_url.sql"
  "schema_migration_original_file_storage.sql"
  "schema_migration_rename_pk.sql"
  "schema_migration_source_type_pdf_doc.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    mv "$migration" OldPlans/migrations/
    echo "  Moved: $migration -> OldPlans/migrations/"
  fi
done

echo "✅ Migrations archived"
```

### 3.4 Clean Up Root Scripts

```bash
# List root TypeScript files
echo "🔍 Root .ts files:"
find . -maxdepth 1 -type f -name "*.ts"

# Move one-time scripts to OldPlans/scripts
mkdir -p OldPlans/scripts

SCRIPTS=(
  "run-assignment-criteria-migration.ts"
  "run-image-url-migration.ts"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    mv "$script" OldPlans/scripts/
    echo "  Moved: $script -> OldPlans/scripts/"
  fi
done

echo "✅ Scripts archived"
```

---

## Section 4: Verify and Commit

### 4.1 Verify Root Directory

```bash
echo "📂 Root directory after cleanup:"
ls -lh *.md 2>/dev/null || echo "  (no .md files except README)"
ls -lh *.sql 2>/dev/null || echo "  (only schema_v2_proper_naming.sql should remain)"
ls -lh *.ts 2>/dev/null || echo "  (no .ts files in root)"

echo ""
echo "📂 OldPlans directory:"
ls -lh OldPlans/
```

### 4.2 Verify .gitignore

```bash
echo "🔍 Verifying .gitignore..."
if grep -q "OldPlans/" .gitignore; then
  echo "  ✅ OldPlans/ excluded from Git"
else
  echo "  ❌ ERROR: OldPlans/ not in .gitignore"
  exit 1
fi

if grep -q ".archive/" .gitignore; then
  echo "  ✅ .archive/ excluded from Git"
else
  echo "  ❌ ERROR: .archive/ not in .gitignore"
  exit 1
fi
```

### 4.3 Commit Changes

```bash
# Stage all changes
git add -A

# Commit cleanup
git commit -m "chore(cleanup): organize project files

- Delete obsolete plan files from previous iterations
- Move planning docs to OldPlans/ (not tracked in Git)
- Move old schema and migrations to OldPlans/
- Move one-time scripts to OldPlans/
- Keep only essential root files
- Update .gitignore to exclude OldPlans/ and .archive/

Root now contains:
- README.md (project documentation)
- schema_v2_proper_naming.sql (current schema)
- .windsurf/ (AI rules - tracked)
- ReusePlans/ (templates - tracked)
- src/, netlify/, etc. (application code)"

echo "✅ Cleanup committed"
```

### 4.4 Push to Remote (Optional)

```bash
# Push cleanup branch
git push -u origin cleanup/${TS}

# Push tag
git push origin pre-cleanup-${TS}

echo "✅ Pushed to remote"
```

---

## Section 5: Final Verification

### 5.1 Check Git Status

```bash
git status
```

**Expected**: Clean working directory

### 5.2 Verify OldPlans Not Tracked

```bash
git ls-files OldPlans/ 2>/dev/null
```

**Expected**: No output (OldPlans is ignored)

### 5.3 Verify Root Directory

```bash
echo "📂 Final root directory structure:"
ls -lh | grep -E "^-|^d" | grep -v node_modules
```

**Expected Root Files**:
- `README.md`
- `schema_v2_proper_naming.sql`
- `package.json`, `package-lock.json`
- `tsconfig.json`, `vite.config.ts`
- `tailwind.config.js`, `postcss.config.js`
- `netlify.toml`
- `index.html`

**Expected Root Directories**:
- `.windsurf/` (tracked)
- `ReusePlans/` (tracked)
- `OldPlans/` (NOT tracked)
- `src/`, `netlify/`, `public/`, `scripts/`
- `node_modules/`, `dist/`, `.netlify/` (ignored)

---

## ✅ Cleanup Complete!

### Summary of Changes:

1. **Deleted Permanently**:
   - `OldPlans/NEON_DATABASE_RULES.md` (superseded)
   - `OldPlans/NEON_SETUP_CHECKLIST.md` (setup complete)

2. **Moved to OldPlans** (not tracked in Git):
   - 17 planning/documentation .md files
   - 1 old schema file (schema.sql)
   - 7 migration files
   - 2 one-time script files

3. **Kept in Root**:
   - Essential docs (README.md)
   - Current schema (schema_v2_proper_naming.sql)
   - AI rules (.windsurf/ - tracked)
   - Reusable templates (ReusePlans/ - tracked)
   - Application code (src/, netlify/, etc.)

4. **Updated**:
   - `.gitignore` now excludes OldPlans/ and .archive/

### Rollback Instructions:

If needed, restore to pre-cleanup state:

```bash
# Reset to checkpoint
git reset --hard pre-cleanup-${TS}

# Or restore specific files from OldPlans
cp OldPlans/[filename] ./
```

### Next Steps:

1. **Merge cleanup branch** to main (if satisfied)
2. **Delete cleanup branch** after merge
3. **Continue development** with clean root directory

---

## 📝 Notes

- **OldPlans directory**: Contains historical documentation, not tracked in Git
- **Future cleanups**: Move old files to OldPlans, don't delete permanently
- **Reference template**: See `ReusePlans/CLEANUP.md` for future cleanup procedures
- **This file**: Can be moved to OldPlans after execution

---

**Execution Date**: _________________  
**Executed By**: _________________  
**Status**: ☐ Complete ☐ Partial ☐ Rolled Back  
**Notes**: _________________

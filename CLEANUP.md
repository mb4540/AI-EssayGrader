# Pre-Deployment Cleanup Plan

**Created:** October 31, 2025  
**Status:** Ready to Execute  
**Goal:** Clean up codebase before production deployment

---

## 📋 Cleanup Checklist

### 1. 🗂️ Archive Completed Migration Files

**Move to `/migrations/archive/`:**
- [ ] `EXECUTE_FERPA_MIGRATION.sql` (had errors, superseded by SIMPLE version)
- [ ] `fix_submissions_foreign_key.sql` (temporary fix file)
- [ ] `check_submissions_schema.sql` (temporary check file)
- [ ] `check_actual_submissions_schema.sql` (temporary check file)
- [ ] `check_versions_schema.sql` (temporary check file)
- [ ] `verify_migration.sql` (temporary verification)

**Keep in `/migrations/` (active/reference):**
- ✅ `FERPA_MIGRATION_SIMPLE.sql` (successful migration)
- ✅ `fix_submission_versions_table.sql` (successful)
- ✅ `add_missing_submission_columns.sql` (successful)
- ✅ `add_grading_criteria_to_assignments.sql` (successful)
- ✅ `link_submissions_to_assignment.sql` (successful)

---

### 2. 📄 Archive Obsolete Plan Files

**Move to `/ReusePlans/archive/`:**
- [ ] `MIGRATION_DECISION.md` (decision made, obsolete)
- [ ] `COLUMN_NAME_FIX_SUMMARY.md` (completed)
- [ ] `ACTUAL_SCHEMA_ANALYSIS.md` (reference only)
- [ ] `FINAL_FIX_SUMMARY.md` (completed)
- [ ] `STUDENT_BRIDGE_DATABASE_ANALYSIS.md` (completed)

**Keep in `/ReusePlans/` (active reference):**
- ✅ `MASTER_PLAN.md` (current plan)
- ✅ `FERPA_MIGRATION_PLAN.md` (reference)
- ✅ `FERPA_IMPLEMENTATION_CHECKLIST.md` (reference)
- ✅ `PRE_MIGRATION_CHECKLIST.md` (reference)

---

### 3. 🧹 Remove Temporary/Debug Files

**Delete these files:**
- [ ] `add_tenant_to_assignments.sql` (temporary, not needed)
- [ ] `add_missing_version_columns.sql` (already applied)
- [ ] Any `*.log` files
- [ ] Any `.DS_Store` files

---

### 4. 🔍 Code Cleanup

#### A. Remove Console Logs (Production)
**Files to check:**
- [ ] `src/pages/Dashboard.tsx` - Remove debug console.logs
- [ ] `src/pages/Submission.tsx` - Remove debug console.logs
- [ ] `src/pages/Students.tsx` - Remove debug console.logs
- [ ] `src/hooks/useBridge.ts` - Keep only error logs

**Pattern to find:**
```bash
grep -r "console.log" src/ --exclude-dir=node_modules
```

#### B. Remove TODO Comments (or document them)
**Files to check:**
- [ ] `netlify/functions/assignments.ts` - Line 11, 40: "TODO: Get from auth context"
- [ ] `netlify/functions/grade.ts` - Check for TODOs
- [ ] `netlify/functions/ingest.ts` - Check for TODOs

**Action:** Either implement or document as future work

#### C. Verify All Error Handling
**Check these functions have proper error handling:**
- [x] `ingest.ts` - ✅ Has try/catch
- [x] `grade.ts` - ✅ Has try/catch
- [x] `list.ts` - ✅ Has try/catch
- [x] `get-submission.ts` - ✅ Has try/catch
- [x] `save-teacher-edits.ts` - ✅ Has try/catch
- [x] `delete-submission.ts` - ✅ Has try/catch
- [x] `assignments.ts` - ✅ Has try/catch

---

### 5. 📝 Documentation Updates

#### A. Update README.md
- [ ] Add FERPA compliance section
- [ ] Document Student Bridge setup
- [ ] Update deployment instructions
- [ ] Add environment variables list

#### B. Create DEPLOYMENT.md
- [ ] List all required environment variables
- [ ] Document Neon database setup
- [ ] Document Netlify deployment steps
- [ ] Document bridge file creation process

#### C. Update MASTER_PLAN.md
- [ ] Mark Phase 1 as COMPLETE
- [ ] Update status of all tasks
- [ ] Archive completed sections

---

### 6. 🔒 Security Audit

#### A. Environment Variables
- [x] `DATABASE_URL` - ✅ In .env, not committed
- [x] `OPENAI_API_KEY` - ✅ In .env, not committed
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify no secrets in code

#### B. Verify .gitignore
**Should include:**
```
.env
.env.local
.env.production
node_modules/
dist/
.netlify/
*.log
.DS_Store
students.bridge.json.enc.json
```

#### C. Check for Hardcoded Values
- [ ] No hardcoded API keys
- [ ] No hardcoded database URLs
- [ ] No hardcoded passwords
- [ ] Tenant ID uses constant (not hardcoded string)

---

### 7. 🧪 Final Testing Checklist

#### A. Core Functionality
- [x] Bridge unlock works
- [x] Student roster displays
- [x] Dashboard loads submissions
- [x] Create new submission
- [x] AI grading works
- [x] Teacher feedback works
- [x] View submission works
- [x] Delete submission works
- [x] Assignment creation works
- [x] Assignment selection auto-populates criteria

#### B. FERPA Compliance Verification
- [x] No student names in database
- [x] No district IDs in database
- [x] Only UUIDs in submissions table
- [x] Bridge file encrypted
- [x] Names resolved locally only
- [x] Network requests contain no PII (check DevTools)

#### C. Error Handling
- [ ] Test with invalid student UUID
- [ ] Test with missing assignment
- [ ] Test with network failure
- [ ] Test with invalid bridge passphrase

---

### 8. 📦 Build & Deploy Preparation

#### A. Clean Build
```bash
# Remove old build artifacts
rm -rf dist/
rm -rf .netlify/

# Clean install dependencies
rm -rf node_modules/
npm install

# Build for production
npm run build
```

#### B. Verify Build
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Bundle size reasonable

#### C. Test Production Build Locally
```bash
# Test production build
npm run preview

# Test Netlify functions locally
netlify dev
```

---

### 9. 🗄️ Database Cleanup

#### A. Remove Backup Table (After Verification)
```sql
-- ONLY after confirming everything works
-- DROP TABLE IF EXISTS grader.students_backup;
```
**Action:** Keep for 30 days, then remove

#### B. Verify Foreign Keys
```sql
-- Check all foreign keys are correct
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'grader';
```

#### C. Verify Indexes
```sql
-- Check indexes exist for performance
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'grader'
ORDER BY tablename, indexname;
```

---

### 10. 📊 Performance Optimization

#### A. Database Indexes (Already Done)
- [x] `idx_students_tenant_id` on students(tenant_id)
- [x] `idx_submissions_student_id` on submissions(student_id)
- [x] `idx_submissions_assignment_id` on submissions(assignment_id)
- [x] `idx_submission_versions_submission_id` on submission_versions(submission_id)
- [x] `idx_assignments_tenant_id` on assignments(tenant_id)

#### B. Frontend Optimization
- [ ] Lazy load heavy components
- [ ] Optimize bundle size
- [ ] Check for unused dependencies

---

## 🎯 Execution Order

**Step-by-step execution:**

1. **Archive Files** (5 min)
   - Move old migrations to archive
   - Move obsolete plans to archive

2. **Code Cleanup** (15 min)
   - Remove debug console.logs
   - Address TODO comments
   - Verify error handling

3. **Documentation** (20 min)
   - Update README.md
   - Create DEPLOYMENT.md
   - Update MASTER_PLAN.md

4. **Security Audit** (10 min)
   - Check .gitignore
   - Verify no secrets in code
   - Check environment variables

5. **Final Testing** (15 min)
   - Run through all features
   - Test error cases
   - Verify FERPA compliance

6. **Build & Deploy** (10 min)
   - Clean build
   - Test locally
   - Deploy to Netlify

**Total Time: ~75 minutes**

---

## ✅ Sign-Off Checklist

Before deploying to production:

- [ ] All files archived/cleaned
- [ ] Code cleanup complete
- [ ] Documentation updated
- [ ] Security audit passed
- [ ] All tests passed
- [ ] Build successful
- [ ] Local preview works
- [ ] FERPA compliance verified
- [ ] Team reviewed (if applicable)
- [ ] Backup created

---

## 🚀 Ready to Deploy!

Once all items are checked, the application is ready for production deployment to Netlify.

**Deployment Command:**
```bash
netlify deploy --prod
```

Or use the Netlify UI for deployment.

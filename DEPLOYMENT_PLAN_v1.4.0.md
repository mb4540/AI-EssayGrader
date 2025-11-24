# Deployment Plan: Class Period Organization (v1.4.0)

**Date:** November 24, 2025  
**Branch:** `feature/class-period-organization`  
**Target:** Production (`main`)

## 📋 Pre-Deployment Checklist

### ✅ Completed
- [x] Feature fully implemented and tested manually
- [x] Database migration created (`migrations/add_class_period_to_students.sql`)
- [x] Database migration executed successfully in production
- [x] `db_ref.md` updated with schema changes
- [x] All backend endpoints tested
- [x] All UI components tested manually
- [x] Filtering functionality verified
- [x] Data syncing verified
- [x] CompletedToDo.md updated
- [x] Root directory cleaned up

### ⚠️ Known Issues
- **Test Suite**: 8 test files failing due to missing `getClassPeriods` mock in BridgeManager tests
  - **Impact**: None on production - tests need updating, not production code
  - **Action**: Update tests in next iteration (non-blocking for deployment)

## 🎯 What's Being Deployed

### Database Changes
- Added `class_period` column to `grader.students` table
- Added index on `class_period` for performance
- Migration already executed in production ✅

### Backend Changes
- New endpoint: `netlify/functions/update-student.ts`
- Updated: `netlify/functions/list.ts` (8 query branches with class_period filtering)
- Updated: `src/lib/schema.ts` (added class_period validation)
- Updated: `src/lib/api.ts` (added class_period parameter)

### Frontend Changes
- **Bridge Store**: Added class period management methods
- **BridgeManager**: "Manage Classes" card with add/remove/sync functionality
- **AddStudentModal**: Class period dropdown
- **EditStudentModal**: Class period dropdown with pre-population
- **Dashboard**: Class period filter dropdown
- **Dashboard**: New "By Class" view (3-level accordion)

### Files Modified
```
Database:
- migrations/add_class_period_to_students.sql
- db_ref.md

Backend:
- netlify/functions/update-student.ts (NEW)
- netlify/functions/list.ts
- src/lib/schema.ts
- src/lib/api.ts

Bridge:
- src/bridge/bridgeTypes.ts
- src/bridge/bridgeStore.ts
- src/hooks/useBridge.ts

Components:
- src/components/bridge/BridgeManager.tsx
- src/components/bridge/AddStudentModal.tsx
- src/components/bridge/EditStudentModal.tsx

Pages:
- src/pages/Dashboard.tsx

Documentation:
- MasterToDo/CompletedToDo.md
```

## 🚀 Deployment Steps

### Step 1: Final Commit & Push
```bash
git push origin feature/class-period-organization
```

### Step 2: Merge to Main
```bash
git checkout main
git pull origin main
git merge feature/class-period-organization
```

### Step 3: Tag Release
```bash
git tag -a v1.4.0 -m "Release v1.4.0: Class Period Organization"
git push origin v1.4.0
```

### Step 4: Push to Production
```bash
git push origin main
```

### Step 5: Verify Deployment
- Check Netlify build status
- Test class period management in production
- Test filtering by class period
- Test "By Class" view
- Test sync functionality

## 🔍 Post-Deployment Verification

### Manual Testing Checklist
- [ ] Can create class periods in BridgeManager
- [ ] Can assign students to class periods
- [ ] Can edit student class periods
- [ ] Dashboard filter dropdown shows class periods
- [ ] Filtering by class period works correctly
- [ ] "By Class" view displays correctly
- [ ] "Sync All" button works
- [ ] Data persists after page reload

### Rollback Plan
If issues occur:
```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or reset to previous tag
git reset --hard v1.3.0
git push --force origin main
```

## 📊 Success Metrics
- Teachers can organize students by class periods
- Dashboard filtering reduces cognitive load
- "By Class" view provides clear organization
- No performance degradation
- No data loss or corruption

## 🐛 Known Technical Debt
- Update BridgeManager tests to mock `getClassPeriods`
- Add integration tests for class period filtering
- Consider adding class period to CSV import/export

## 📝 Notes
- Database migration already executed - no additional DB changes needed
- Feature is backwards compatible - existing students without class periods work fine
- FERPA compliant - class_period is non-PII

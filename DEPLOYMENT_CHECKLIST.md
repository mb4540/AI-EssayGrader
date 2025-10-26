# Pre-Deployment Checklist - Phase 0

**Before deploying Phase 0 (Bridge System) to production**

---

## ⚠️ CRITICAL: Do NOT Run Migration Yet

The database migration should **NOT** be run until:
1. Bridge system is tested in production
2. Teachers have generated their bridge files
3. Bridge functionality is verified working

**For now**: Deploy the code, but keep existing database schema intact.

---

## Pre-Deployment Checklist

### 1. Code Readiness

- [ ] All tests passing locally (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (except known vitest.config.ts)
- [ ] Bridge route accessible (`/bridge`)
- [ ] StudentSelector component created

### 2. Environment Variables

**Required in Netlify:**
- [ ] `NEON_DATABASE_URL` - Database connection string
- [ ] `OPENAI_API_KEY` - OpenAI API key (existing)
- [ ] `OPENAI_MODEL` - Model name (existing)

**NOT needed yet** (Phase 1):
- JWT_SECRET (Phase 1)
- MAILGUN_API_KEY (Phase 2)
- MAILGUN_DOMAIN (Phase 2)

### 3. Database State

**DO NOT CHANGE YET:**
- [ ] Keep `student_name` column in database
- [ ] Keep `district_student_id` column in database
- [ ] Do NOT run migration script

**Why?** The bridge system needs to coexist with the old system initially for testing.

### 4. Backward Compatibility

The current deployment should:
- ✅ Work with existing submissions (have student_name)
- ✅ Work with new submissions (use UUID from bridge)
- ✅ Allow teachers to test bridge without breaking existing data

### 5. Testing Plan

After deployment, test:
1. Bridge Manager accessible at `/bridge`
2. Can create new bridge
3. Can add students
4. Can import CSV
5. Can export bridge file
6. Bridge persists in IndexedDB
7. Existing submissions still visible
8. Can create new submission (if bridge unlocked)

---

## Deployment Steps

### Step 1: Commit and Push Code

```bash
# Check status
git status

# Add all Phase 0 files
git add .

# Commit
git commit -m "feat: Phase 0 - Privacy-first bridge system

- Add encrypted local student identity management
- Add Bridge Manager UI (/bridge route)
- Add StudentSelector component
- Add comprehensive test suite (48 tests)
- Add database migration scripts (not run yet)
- Update schema to support UUID-only
- Maintain backward compatibility

DO NOT RUN MIGRATION YET - Testing phase"

# Push to main
git push origin main
```

### Step 2: Verify Netlify Build

1. Go to Netlify dashboard
2. Wait for build to complete
3. Check build logs for errors
4. Verify deployment succeeded

### Step 3: Test in Production

**Test Bridge System:**
1. Navigate to `https://your-app.netlify.app/bridge`
2. Click "Create New"
3. Enter passphrase
4. Add a test student
5. Verify student appears in roster
6. Export bridge file
7. Lock bridge
8. Import bridge file
9. Unlock with passphrase
10. Verify student still there

**Test Existing Functionality:**
1. Navigate to dashboard
2. Verify existing submissions load
3. Try creating a new submission (may need bridge unlocked)
4. Verify submission saves

### Step 4: Monitor for Issues

- [ ] Check Netlify function logs
- [ ] Check browser console for errors
- [ ] Test on different browsers
- [ ] Test IndexedDB fallback (Safari)

---

## Rollback Plan

If issues occur:

### Option 1: Revert Deployment
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Option 2: Hotfix
- Fix issue locally
- Test thoroughly
- Deploy fix

### Option 3: Netlify Rollback
- Go to Netlify dashboard
- Deploys → Previous deploy → Publish

---

## Known Issues to Monitor

### 1. Schema Compatibility

**Issue**: `IngestRequestSchema` now requires `student_id` (UUID)

**Impact**: Old submission form won't work without bridge

**Solution**: 
- Bridge must be unlocked to create submissions
- Or temporarily make `student_id` optional during transition

### 2. IndexedDB in Safari

**Issue**: Safari has stricter IndexedDB policies

**Solution**: Already implemented fallback, but test thoroughly

### 3. File System Access API

**Issue**: Not supported in all browsers

**Solution**: Manual export/import fallback implemented

---

## Post-Deployment Verification

### Success Criteria

✅ Bridge Manager loads without errors  
✅ Can create and unlock bridge  
✅ Can add/edit/delete students  
✅ Can export/import bridge file  
✅ Existing submissions still visible  
✅ No console errors  
✅ No function errors in Netlify logs  

### If All Tests Pass

1. ✅ Phase 0 successfully deployed
2. ✅ Teachers can start using bridge
3. ✅ Monitor for 1 week
4. ✅ Then plan migration (Phase 0.4)

### If Tests Fail

1. Document the issue
2. Rollback if critical
3. Fix locally
4. Re-test
5. Re-deploy

---

## Migration Timeline (After Successful Deployment)

**Week 1**: Deploy code, test bridge system  
**Week 2**: Teachers generate bridge files  
**Week 3**: Verify all teachers have bridges  
**Week 4**: Run database migration  
**Week 5**: Monitor and verify  

---

## Communication Plan

### Before Deployment
- [ ] Notify users of new bridge feature
- [ ] Explain it's optional for now
- [ ] Provide bridge documentation

### After Deployment
- [ ] Send announcement about bridge system
- [ ] Provide tutorial video/guide
- [ ] Offer support for setup

### Before Migration
- [ ] Warn users migration is coming
- [ ] Ensure all have bridge files
- [ ] Schedule maintenance window

---

## Support Resources

### For Users
- Bridge Manager: `/bridge`
- Help page: `/help`
- Documentation: `identity.md`

### For Developers
- Migration guide: `database/MIGRATION_GUIDE.md`
- Testing summary: `TESTING_SUMMARY.md`
- Progress tracker: `PROGRESS.md`

---

## Quick Deploy Command

```bash
# One-line deploy (after testing locally)
npm run test:run && npm run build && git add . && git commit -m "feat: Phase 0 deployment" && git push origin main
```

---

## Emergency Contacts

- Netlify Dashboard: https://app.netlify.com
- Neon Dashboard: https://console.neon.tech
- GitHub Repo: [your-repo-url]

---

**Ready to deploy?** Follow the steps above carefully and monitor closely!

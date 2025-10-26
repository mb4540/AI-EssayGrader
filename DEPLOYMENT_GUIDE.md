# Production Deployment Guide

**Project**: FastAI Grader  
**Date**: October 26, 2025  
**Status**: Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] Phase 1: Authentication system
- [x] Phase 4: Protected API endpoints
- [x] Frontend API client updated
- [x] 401 error handling implemented
- [x] Tenant isolation verified

### ✅ Environment Variables
Required variables for Netlify:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_dWrgByms6EO7@ep-calm-queen-a8z6j97e-pooler.eastus2.azure.neon.tech/neondb?sslmode=require

# Authentication
JWT_SECRET=[GENERATE_SECURE_RANDOM_STRING]

# OpenAI (existing)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Optional
PUBLIC_TENANT_ID=[tenant_id_for_public_data]
```

### ✅ Database Ready
- [x] `tenants` table exists
- [x] `users` table exists
- [x] Test user created
- [x] Indexes created
- [x] Foreign keys configured

---

## Deployment Steps

### Step 1: Generate JWT Secret

Generate a secure random string for production:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online (use a trusted generator)
# https://www.grc.com/passwords.htm
```

**Save this value** - you'll need it for Netlify environment variables.

---

### Step 2: Configure Netlify Environment Variables

1. Go to Netlify Dashboard
2. Select your site: `ai-essaygrader`
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Neon dashboard |
| `JWT_SECRET` | `[generated-secret]` | From Step 1 |
| `OPENAI_API_KEY` | `sk-...` | Existing value |
| `OPENAI_MODEL` | `gpt-4o-mini` | Existing value |
| `PUBLIC_TENANT_ID` | `[tenant-id]` | Optional, for public data |

**Important**: Click **Save** after adding each variable.

---

### Step 3: Deploy to Netlify

#### Option A: Deploy via Git (Recommended)

```bash
# 1. Commit all changes
git add .
git commit -m "Phase 4: Protected API endpoints with authentication"

# 2. Push to main branch
git push origin main

# 3. Netlify will auto-deploy
# Watch the deploy log in Netlify dashboard
```

#### Option B: Manual Deploy

```bash
# 1. Build the project
npm run build

# 2. Deploy via Netlify CLI
netlify deploy --prod

# 3. Confirm deployment
```

---

### Step 4: Verify Deployment

#### 4.1 Check Build Log

1. Go to Netlify Dashboard → **Deploys**
2. Click on latest deploy
3. Check for errors in build log
4. Verify all functions deployed:
   - `auth-login`
   - `auth-register`
   - `auth-me`
   - `ingest`
   - `grade`
   - `list`
   - `save-teacher-edits`

#### 4.2 Test Authentication

1. Visit your production URL: `https://ai-essaygrader.netlify.app`
2. Should redirect to `/login`
3. Try to login with test credentials:
   - Email: `test@example.com`
   - Password: `testpass123`
4. Should redirect to dashboard on success

#### 4.3 Test Protected Endpoints

Open browser DevTools → Console:

```javascript
// Should redirect to login (401)
fetch('https://ai-essaygrader.netlify.app/.netlify/functions/list')
  .then(r => console.log('Status:', r.status));

// Should work with token
const token = localStorage.getItem('auth_token');
fetch('https://ai-essaygrader.netlify.app/.netlify/functions/list', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => console.log('Data:', d));
```

---

### Step 5: Create Production Test Users

#### 5.1 Register New Users

1. Go to `/register`
2. Create at least 2 test accounts in different tenants:

**User 1:**
- Email: `teacher1@school1.com`
- Password: `[secure-password]`
- School: `Test School 1`

**User 2:**
- Email: `teacher2@school2.com`
- Password: `[secure-password]`
- School: `Test School 2`

#### 5.2 Verify Tenant Isolation

Follow the manual testing guide in `tests/tenant-isolation.test.ts`

---

## Post-Deployment Verification

### Functional Tests

- [ ] **Login works**
  - Can login with test credentials
  - Token stored in localStorage
  - Redirects to dashboard

- [ ] **Registration works**
  - Can create new account
  - New tenant created
  - Auto-login after registration

- [ ] **Protected routes work**
  - Dashboard accessible when logged in
  - Submission page accessible when logged in
  - Redirects to login when not authenticated

- [ ] **API endpoints work**
  - Can create submissions
  - Can grade submissions
  - Can list submissions
  - Can save teacher edits

- [ ] **401 handling works**
  - Expired/invalid token redirects to login
  - Auth data cleared from localStorage

### Security Tests

- [ ] **Tenant isolation**
  - User A cannot see User B's data
  - User A cannot access User B's submissions
  - User A cannot grade User B's submissions
  - User A cannot edit User B's submissions

- [ ] **Authentication required**
  - All endpoints return 401 without token
  - Cannot access protected routes without login
  - Token required for all API calls

- [ ] **No data leakage**
  - 404 responses for cross-tenant access (not 403)
  - Error messages don't reveal data existence
  - No tenant enumeration possible

---

## Rollback Plan

If deployment fails or issues are found:

### Option 1: Revert via Git

```bash
# 1. Revert to previous commit
git revert HEAD

# 2. Push to trigger redeploy
git push origin main
```

### Option 2: Rollback in Netlify

1. Go to Netlify Dashboard → **Deploys**
2. Find previous working deploy
3. Click **...** → **Publish deploy**
4. Confirm rollback

### Option 3: Disable Authentication (Emergency)

If authentication is blocking users:

1. Create a temporary bypass in `lib/auth.ts`:
   ```typescript
   export async function authenticateRequest(authHeader: string | undefined) {
     // TEMPORARY BYPASS - REMOVE ASAP
     return {
       user: { /* default user */ },
       tenant_id: '00000000-0000-0000-0000-000000000001'
     };
   }
   ```

2. Deploy hotfix
3. Fix issues
4. Remove bypass
5. Redeploy

**⚠️ Only use this as last resort!**

---

## Monitoring

### What to Monitor

1. **Error Rates**
   - Watch Netlify function logs
   - Check for 401/404 spikes
   - Monitor authentication failures

2. **Performance**
   - API response times
   - Database query performance
   - Token verification speed

3. **User Feedback**
   - Login issues
   - Data access problems
   - Cross-tenant access attempts

### Netlify Function Logs

Access logs at:
```
https://app.netlify.com/sites/ai-essaygrader/logs
```

Filter by function:
- `auth-login` - Login attempts
- `auth-register` - Registration attempts
- `ingest` - Submission creation
- `grade` - Grading requests
- `list` - Data access

---

## Common Issues & Solutions

### Issue 1: "Authentication required" on all requests

**Cause**: JWT_SECRET not set or incorrect

**Solution**:
1. Check Netlify environment variables
2. Verify JWT_SECRET is set
3. Redeploy if needed

---

### Issue 2: Token expired immediately

**Cause**: Clock skew or JWT_SECRET mismatch

**Solution**:
1. Verify JWT_SECRET matches between deploys
2. Check server time is correct
3. Clear localStorage and re-login

---

### Issue 3: Cannot see any submissions

**Cause**: Tenant isolation working correctly OR no data

**Solution**:
1. Verify user is logged in
2. Check tenant_id in database
3. Verify submissions exist for that tenant
4. Check browser console for errors

---

### Issue 4: 404 on valid submission

**Cause**: Submission belongs to different tenant

**Solution**:
1. This is expected behavior (tenant isolation)
2. Verify user is accessing their own data
3. Check tenant_id in database

---

## Success Criteria

Deployment is successful when:

- ✅ All users can login
- ✅ All users can register
- ✅ All protected endpoints work
- ✅ Tenant isolation verified
- ✅ No 401 errors for valid tokens
- ✅ No cross-tenant data access
- ✅ No production errors in logs
- ✅ Performance is acceptable

---

## Next Steps After Deployment

### Phase 2: Email Integration
- Set up Mailgun
- Add email verification
- Add password reset
- Send welcome emails

### Phase 3: Frontend Polish
- Add user profile page
- Add settings page
- Add logout button in UI
- Improve error messages

### Phase 5: Advanced Features
- Add role-based permissions (admin vs teacher)
- Add tenant management
- Add usage analytics
- Add API rate limiting

---

## Support

If issues arise during deployment:

1. **Check Netlify logs** for errors
2. **Check browser console** for frontend errors
3. **Check database** for data issues
4. **Review this guide** for common issues
5. **Rollback if necessary** using rollback plan

---

## Deployment Checklist

Before marking deployment complete:

- [ ] Environment variables configured
- [ ] JWT_SECRET generated and set
- [ ] Code deployed to production
- [ ] Build successful
- [ ] All functions deployed
- [ ] Login tested
- [ ] Registration tested
- [ ] API endpoints tested
- [ ] Tenant isolation verified
- [ ] 401 handling verified
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Test users created
- [ ] Documentation updated

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: _______________  
**Issues Found**: _______________  
**Resolution**: _______________

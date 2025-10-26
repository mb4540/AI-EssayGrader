# Phase 1: Multi-Tenant Authentication - Implementation Plan

**Status**: 🚧 In Progress  
**Started**: October 26, 2025

---

## Overview

Add multi-tenant support with user authentication so multiple teachers/districts can use the system independently with secure accounts.

---

## Phase 1 Sub-Tasks

### 1.1 Database Schema ✅ (In Progress)
**Files Created:**
- `database/migrations/002_add_multi_tenant_auth.sql`

**What It Does:**
- Creates `tenants` table (districts/schools/individuals)
- Creates `users` table (teachers with authentication)
- Adds `tenant_id` to all existing tables
- Creates indexes for performance
- Backfills existing data to default tenant
- Creates helper functions

**Tables Added:**
```sql
grader.tenants:
- tenant_id (UUID, PK)
- tenant_name (TEXT)
- tenant_type (district/school/individual)
- subdomain (TEXT, unique, optional)
- settings (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at

grader.users:
- user_id (UUID, PK)
- tenant_id (UUID, FK)
- email (TEXT)
- password_hash (TEXT)
- full_name (TEXT)
- role (admin/teacher)
- is_active (BOOLEAN)
- email_verified (BOOLEAN)
- verification_token (TEXT)
- reset_token (TEXT)
- last_login_at (TIMESTAMPTZ)
- created_at, updated_at
```

### 1.2 Authentication Library ✅ (In Progress)
**Files Created:**
- `netlify/functions/lib/auth.ts`

**What It Does:**
- Password hashing (bcrypt)
- JWT token generation/verification
- User registration
- User login
- Email verification
- Password reset
- Get current user

**Functions:**
- `hashPassword()` - Bcrypt hashing
- `verifyPassword()` - Compare passwords
- `generateToken()` - Create JWT
- `verifyToken()` - Validate JWT
- `registerUser()` - Create new user account
- `loginUser()` - Authenticate user
- `verifyEmail()` - Confirm email address
- `requestPasswordReset()` - Generate reset token
- `resetPassword()` - Update password
- `getCurrentUser()` - Get user by ID

### 1.3 Authentication API Endpoints (Pending)
**Files to Create:**
- `netlify/functions/auth-register.ts`
- `netlify/functions/auth-login.ts`
- `netlify/functions/auth-verify-email.ts`
- `netlify/functions/auth-request-reset.ts`
- `netlify/functions/auth-reset-password.ts`
- `netlify/functions/auth-me.ts`

**Endpoints:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/request-reset
POST /api/auth/reset-password
GET  /api/auth/me
```

### 1.4 Authentication Middleware (Pending)
**Files to Create:**
- `netlify/functions/lib/authMiddleware.ts`

**What It Does:**
- Extract JWT from Authorization header
- Verify token validity
- Attach user info to request
- Check tenant access
- Role-based authorization

### 1.5 Update Existing Functions (Pending)
**Files to Update:**
- `netlify/functions/ingest.ts`
- `netlify/functions/grade.ts`
- `netlify/functions/list.ts`
- `netlify/functions/save-teacher-edits.ts`
- `netlify/functions/health-check.ts`

**Changes:**
- Add authentication check
- Add tenant_id to all queries
- Filter data by tenant
- Add PII guards

### 1.6 Testing (Pending)
**Files to Create:**
- `netlify/functions/lib/auth.test.ts`
- `src/test/auth-integration.test.ts`

**Test Coverage:**
- Registration flow
- Login flow
- Token generation/verification
- Email verification
- Password reset
- Tenant isolation

---

## Dependencies Added

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

---

## Environment Variables Required

**New Variables:**
```
JWT_SECRET=your-secret-key-change-in-production
```

**Existing Variables:**
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Migration Strategy

### Step 1: Run Database Migration
```bash
psql $DATABASE_URL -f database/migrations/002_add_multi_tenant_auth.sql
```

**What Happens:**
- Creates tenants and users tables
- Adds tenant_id to existing tables
- Creates default tenant (00000000-0000-0000-0000-000000000000)
- Assigns all existing data to default tenant

### Step 2: Deploy Authentication Functions
- Deploy new auth endpoints
- Test registration and login
- Verify JWT tokens work

### Step 3: Update Existing Functions
- Add authentication middleware
- Add tenant filtering
- Test with authenticated requests

### Step 4: Frontend Integration (Phase 3)
- Add login/register pages
- Store JWT in localStorage
- Add Authorization header to requests
- Handle token expiration

---

## Security Considerations

### Password Security ✅
- Bcrypt with 12 rounds
- Minimum 8 characters
- Stored as hash only

### JWT Security ✅
- 7-day expiration
- Signed with secret key
- Contains minimal payload (user_id, tenant_id, email, role)

### Email Verification ✅
- 24-hour token expiration
- Random 32-byte hex token
- Cleared after verification

### Password Reset ✅
- 1-hour token expiration
- Random 32-byte hex token
- Cleared after reset

### Tenant Isolation ✅
- All queries filtered by tenant_id
- Foreign key constraints
- Indexes for performance

---

## API Design

### Registration
```typescript
POST /api/auth/register
{
  "email": "teacher@school.edu",
  "password": "secure-password",
  "full_name": "Jane Doe",
  "tenant_name": "Springfield Elementary" // Creates new tenant
}

Response:
{
  "user": {
    "user_id": "uuid",
    "tenant_id": "uuid",
    "email": "teacher@school.edu",
    "full_name": "Jane Doe",
    "role": "teacher",
    "email_verified": false
  },
  "token": "jwt-token",
  "verification_token": "hex-token" // For email verification
}
```

### Login
```typescript
POST /api/auth/login
{
  "email": "teacher@school.edu",
  "password": "secure-password"
}

Response:
{
  "user": {
    "user_id": "uuid",
    "tenant_id": "uuid",
    "email": "teacher@school.edu",
    "full_name": "Jane Doe",
    "role": "teacher",
    "email_verified": true,
    "last_login_at": "2025-10-26T12:00:00Z"
  },
  "token": "jwt-token"
}
```

### Authenticated Requests
```typescript
GET /api/submissions
Headers: {
  "Authorization": "Bearer jwt-token"
}

// Backend automatically:
// 1. Verifies token
// 2. Extracts user_id and tenant_id
// 3. Filters results by tenant_id
```

---

## Backward Compatibility

### During Transition
- Existing data assigned to default tenant
- Old API endpoints still work (no auth required yet)
- New endpoints require authentication
- Gradual migration path

### After Full Migration
- All endpoints require authentication
- Default tenant can be deactivated
- All data isolated by tenant

---

## Testing Plan

### Unit Tests
- [ ] Password hashing/verification
- [ ] JWT generation/verification
- [ ] Token extraction from headers
- [ ] User registration validation
- [ ] Login validation
- [ ] Email verification
- [ ] Password reset

### Integration Tests
- [ ] Full registration flow
- [ ] Full login flow
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Tenant isolation (can't access other tenant's data)
- [ ] Role-based access control

### E2E Tests (Phase 3)
- [ ] Register → Verify Email → Login
- [ ] Login → Create Submission → View Dashboard
- [ ] Forgot Password → Reset → Login
- [ ] Multiple tenants can't see each other's data

---

## Success Criteria

Phase 1 is complete when:

- [ ] Database migration runs successfully
- [ ] Authentication library fully implemented
- [ ] All auth endpoints deployed and tested
- [ ] JWT tokens work correctly
- [ ] Email verification works
- [ ] Password reset works
- [ ] Tenant isolation verified
- [ ] Tests passing
- [ ] Documentation complete

---

## Next Steps (After Phase 1)

**Phase 2: Email Integration**
- Set up Mailgun
- Send verification emails
- Send password reset emails
- Email templates

**Phase 3: Frontend Authentication**
- Login/Register pages
- Protected routes
- AuthContext
- Token management
- Logout functionality

**Phase 4: Update All Functions**
- Add auth to all endpoints
- Add tenant filtering
- Add PII guards
- Test thoroughly

---

## Timeline Estimate

- **1.1 Database Schema**: ✅ Complete
- **1.2 Auth Library**: ✅ Complete
- **1.3 API Endpoints**: 1-2 hours
- **1.4 Middleware**: 30 minutes
- **1.5 Update Functions**: 1-2 hours
- **1.6 Testing**: 1 hour

**Total**: 4-6 hours

---

## Current Status

✅ Database schema created  
✅ Authentication library created  
🚧 Installing dependencies (bcryptjs, jsonwebtoken)  
⏳ API endpoints (next)  
⏳ Middleware (next)  
⏳ Update existing functions (next)  
⏳ Testing (next)  

**Ready to continue with API endpoints once dependencies are installed!**

# AI-EssayGrader: Implementation Summary

**Date**: October 26, 2025  
**Status**: Planning Complete - Ready for Implementation

---

## Overview

AI-EssayGrader will be transformed into a **privacy-first multi-tenant SaaS platform** combining:
1. **Multi-tenant architecture** from gift-of-time-assistant
2. **Local identity bridge** for student privacy (new approach)

---

## Two Core Features

### 1. Multi-Tenant Architecture (gift-of-time-assistant pattern)

**What it provides:**
- Multiple schools/districts on one platform
- Complete data isolation between tenants
- User authentication (JWT-based)
- Role-based access (admin, teacher)
- Email integration (password resets via Mailgun)

**Key tables:**
- `grader.tenants` - Organizations
- `grader.app_users` - Teachers/admins with authentication
- `grader.password_reset_tokens` - Secure password resets

**All existing tables get:**
- `tenant_id` column for data isolation
- `created_by` column to track which user created records

### 2. Local Identity Bridge (NEW - privacy-first)

**What it provides:**
- **Zero student PII in cloud** - Names and local IDs never leave teacher's machine
- **Encrypted local bridge file** - Maps (Student Name, Local ID) ↔ UUID
- **AES-GCM encryption** - Bridge file encrypted with teacher's passphrase
- **Offline-capable** - Works without internet connection
- **FERPA/COPPA compliant by design** - No student data breach risk

**How it works:**
```
Teacher's Machine                     Cloud (Netlify + Neon)
┌─────────────────────┐              ┌──────────────────┐
│ Bridge File         │              │ grader.students  │
│ (Encrypted)         │              │ - student_id     │
│                     │              │ - tenant_id      │
│ Sharon Lee          │──resolve──>  │ - created_at     │
│ S123456             │   UUID       │                  │
│ → 8e7ec89d-...      │              │ (NO NAMES!)      │
└─────────────────────┘              └──────────────────┘
```

**Bridge file structure:**
- Extension: `.bridge.json.enc`
- Encryption: AES-GCM with PBKDF2 (210k iterations)
- Integrity: HMAC-SHA256
- Storage: File System Access API or IndexedDB

---

## Database Changes

### Remove PII from Cloud

**BEFORE:**
```sql
create table grader.students (
  student_id uuid primary key,
  student_name text not null,           -- ❌ REMOVE
  district_student_id text,             -- ❌ REMOVE
  created_at timestamptz
);
```

**AFTER:**
```sql
create table grader.students (
  student_id uuid primary key,
  tenant_id uuid references grader.tenants(tenant_id),  -- ✅ ADD
  created_at timestamptz
);
-- NO NAMES, NO LOCAL IDs - ONLY UUIDs
```

### Add Multi-Tenant Tables

```sql
-- Organizations
create table grader.tenants (
  tenant_id uuid primary key,
  name text not null unique,
  created_at timestamptz
);

-- Teachers/Admins
create table grader.app_users (
  user_id uuid primary key,
  tenant_id uuid references grader.tenants(tenant_id),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher')),
  first_name text,
  last_name text,
  created_at timestamptz
);

-- Password Reset Tokens
create table grader.password_reset_tokens (
  id uuid primary key,
  user_id uuid references grader.app_users(user_id),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz
);
```

---

## Frontend Changes

### New Bridge Infrastructure (`src/bridge/`)

**Files to create:**
1. `crypto.ts` - AES-GCM encryption, PBKDF2 key derivation, HMAC
2. `storage.ts` - File System Access API + IndexedDB fallback
3. `bridgeStore.ts` - In-memory bridge state, CRUD operations
4. `bridgeTypes.ts` - TypeScript types
5. `useBridge.ts` - React hook for bridge operations
6. `piiGuard.ts` - Development guard to block PII in API calls

**Components to create:**
1. `BridgeManager.tsx` - Main UI (create/import/export bridge, roster grid)
2. `AddStudentModal.tsx` - Add individual students
3. `ImportCsvModal.tsx` - Bulk CSV import with deduplication

### New Authentication Pages

1. `Login.tsx` - Teacher login
2. `Register.tsx` - Teacher registration + tenant selection
3. `ForgotPassword.tsx` - Request password reset
4. `ResetPassword.tsx` - Complete password reset

### New Contexts

1. `AuthContext.tsx` - Authentication state management
2. Bridge state integrated into existing app state

### Schema Changes

**BEFORE:**
```typescript
export const IngestRequestSchema = z.object({
  student_name: z.string().min(1),      // ❌ REMOVE
  student_id: z.string().optional(),    // ❌ CHANGE
  // ...
});
```

**AFTER:**
```typescript
export const IngestRequestSchema = z.object({
  student_id: z.string().uuid(),        // ✅ REQUIRED UUID
  // NO student_name field
  // ...
});
```

---

## Backend Changes

### New Functions

1. **auth.ts** - Register, login, verify JWT
2. **auth-send-reset.ts** - Send password reset email (Mailgun)
3. **auth-complete-reset.ts** - Complete password reset
4. **admin-users.ts** - User management (optional Phase 5)
5. **admin-tenants.ts** - Tenant management (optional Phase 5)

### PII Guards (ALL functions)

**Every function must:**
```typescript
// 1. Authenticate user
const user = await authenticate(event)
if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

// 2. Reject PII in request
const body = JSON.parse(event.body || '{}')
const PII_KEYS = ['student_name', 'name', 'localId', 'studentName', 'fullName', 'district_student_id']
const foundPII = PII_KEYS.filter(k => k in body)
if (foundPII.length > 0) {
  return { statusCode: 400, body: JSON.stringify({ error: 'PII not allowed', forbidden_keys: foundPII }) }
}

// 3. Filter by tenant_id
const submissions = await sql`
  SELECT * FROM grader.submissions
  WHERE tenant_id = ${user.tenantId}
  ORDER BY created_at DESC
`
```

### Modified Functions

**ingest.ts** - Now expects `student_id` (UUID), rejects `student_name`  
**list.ts** - Filter by `tenant_id`  
**get-submission.ts** - Filter by `tenant_id`  
**delete-submission.ts** - Filter by `tenant_id`  
**assignments.ts** - Filter by `tenant_id`  
**All others** - Add authentication + tenant filtering

---

## Implementation Phases

### Phase 0: Local Identity Bridge (Week 1) ⭐ NEW
- Implement bridge crypto (AES-GCM, PBKDF2)
- Build Bridge Manager UI
- CSV import functionality
- Database migration (remove PII, backup for bridge generation)
- Update IngestRequestSchema

### Phase 1: Multi-Tenant Database & Auth (Week 2)
- Create tenant/user tables
- Implement auth.ts (register, login, verify)
- Add tenant_id to all tables
- Test with Postman

### Phase 2: Email Integration (Week 3)
- Set up Mailgun
- Create email templates (React Email)
- Implement password reset flow
- Test email delivery

### Phase 3: Frontend Auth UI (Week 4)
- Create AuthContext
- Build Login/Register/ForgotPassword pages
- Protected routes
- Update navigation

### Phase 4: Update All APIs (Week 5)
- Add authentication to all functions
- Add PII guards to all functions
- Add tenant_id filtering
- Comprehensive testing

### Phase 5: Admin Features (Week 6 - Optional)
- User management UI
- Tenant management UI
- Invitation flow

### Phase 6: Testing & Polish (Week 7)
- Security audit
- Performance testing
- Documentation
- Production deployment

---

## Key Files Reference

### Planning Documents
- `MULTI_TENANT_EMAIL_PLAN.md` - Complete multi-tenant implementation plan
- `identity.md` - Complete local identity bridge technical specification
- `IMPLEMENTATION_SUMMARY.md` - This file (overview)

### Database
- `schema_v2_proper_naming.sql` - Current schema
- `schema_migration_remove_pii.sql` - Migration to remove PII (to be created)
- `schema_migration_add_tenants.sql` - Migration to add multi-tenant tables (to be created)

### Reference Project
- `/gift-of-time-assistant/` - READ ONLY reference for multi-tenant patterns

---

## Environment Variables Needed

```bash
# Database
NEON_DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key-minimum-32-characters

# Email (Mailgun)
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=yourdomain.com
FROM_EMAIL="AI EssayGrader <noreply@yourdomain.com>"

# App
APP_BASE_URL=https://ai-essaygrader.netlify.app
NODE_ENV=production
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mailgun.js": "^10.2.3",
    "form-data": "^4.0.0",
    "@react-email/components": "^0.0.25",
    "@react-email/render": "^1.0.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.7"
  }
}
```

---

## Success Criteria

### Phase 0 (Identity Bridge)
- ✅ Bridge file encrypts/decrypts correctly
- ✅ Can add students and get UUIDs
- ✅ Can import CSV with deduplication
- ✅ Can export/import encrypted bridge
- ✅ DevTools shows NO PII in network requests
- ✅ Cloud database has NO student names

### Phase 1 (Multi-Tenant)
- ✅ Can register new user/tenant
- ✅ Can login and receive JWT
- ✅ Token includes tenant_id
- ✅ All queries filter by tenant_id
- ✅ Data completely isolated between tenants

### Phase 2 (Email)
- ✅ Password reset email arrives
- ✅ Reset link works
- ✅ Confirmation email sent
- ✅ Tokens expire after 15 minutes
- ✅ Tokens are single-use

### Overall
- ✅ No student PII in cloud database
- ✅ No student PII in API requests
- ✅ Multi-tenant data isolation verified
- ✅ Authentication required for all endpoints
- ✅ Teachers can manage their own bridge files
- ✅ App works offline (bridge operations)

---

## Questions Answered

1. **Tenant Model**: Flat tenants (one per school/district)
2. **Roles**: Admin and teacher (no student role needed)
3. **Email Provider**: Mailgun (same as gift-of-time-assistant)
4. **Admin Features**: Phase 5 (optional, can defer)
5. **Existing Data**: Backup and generate bridge file from backup
6. **Custom Domain**: Needed for production email (or use sandbox for testing)

---

## Next Steps

1. ✅ Review both plan documents
2. ⏸️ Confirm approach with user
3. ⏸️ Begin Phase 0 implementation (Identity Bridge)
4. ⏸️ Set up Mailgun account
5. ⏸️ Add environment variables

**Status**: ⏸️ Awaiting user approval to proceed with implementation

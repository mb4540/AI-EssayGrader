# Multi-Tenant & Email Implementation Plan
**AI-EssayGrader** | Reference: gift-of-time-assistant | Date: Oct 26, 2025

## Executive Summary

Transform AI-EssayGrader into a **privacy-first multi-tenant SaaS platform** with authentication and email capabilities by adapting patterns from gift-of-time-assistant, while implementing **local-only student identity management**.

### Key Features
- ✅ Multi-tenant architecture (schools/districts isolated)
- ✅ User authentication (JWT-based)
- ✅ Email integration (Mailgun for password resets)
- ✅ Role-based access (admin, teacher)
- ✅ Tenant management
- ✅ **Local Identity Bridge** - Student PII never sent to cloud
- ✅ **Encrypted bridge files** - AES-GCM encrypted student roster
- ✅ **UUID-only cloud** - Complete PII removal from database

---

## Current State Analysis

### AI-EssayGrader (Target)
**Database:** `grader` schema with students, assignments, submissions  
**Backend:** Netlify Functions (TypeScript), Neon DB  
**Frontend:** React + TypeScript, no auth  
**Missing:** tenant_id columns, auth tables, auth UI, email

### gift-of-time-assistant (Reference)
**Database:** Multi-tenant with tenants, app_users, password_reset_tokens  
**Backend:** Auth functions (register, login, password reset), Mailgun integration  
**Frontend:** Login/Register pages, AuthContext, protected routes  
**Email:** React Email templates, Mailgun sending

---

## Database Schema Changes

### Privacy-First Approach: Local Identity Bridge

**Critical Design Decision**: Student PII (names, local IDs) will **NEVER** be stored in the cloud.

**How it works:**
1. Teachers maintain an **encrypted bridge file** on their local machine
2. Bridge file maps: `(Student Name, Local ID) ↔ UUID`
3. Frontend resolves UUIDs locally before API calls
4. Cloud only sees and stores UUIDs
5. Bridge file encrypted with AES-GCM + teacher passphrase

**Benefits:**
- ✅ Complete PII removal from cloud
- ✅ FERPA/COPPA compliance by design
- ✅ No data breach risk for student identities
- ✅ Teacher controls their own data
- ✅ Works offline

**See**: `identity.md` for complete technical specification

---

### New Tables to Add

```sql
-- 1. Tenants (organizations)
CREATE TABLE grader.tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE grader.app_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES grader.tenants(tenant_id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,  -- bcrypt
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Password Reset Tokens
CREATE TABLE grader.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES grader.app_users(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- SHA-256 hash
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,  -- Single-use enforcement
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Modify Existing Tables

#### Step 1: Remove PII from students table

```sql
-- CRITICAL: Backup existing data first for bridge file generation
CREATE TABLE grader.students_backup AS 
SELECT student_id, student_name, district_student_id, created_at 
FROM grader.students;

-- Remove PII columns
ALTER TABLE grader.students DROP COLUMN IF EXISTS student_name;
ALTER TABLE grader.students DROP COLUMN IF EXISTS district_student_id;

-- Remove unique constraint that included student_name
ALTER TABLE grader.students DROP CONSTRAINT IF EXISTS students_district_student_id_student_name_key;

-- Result: grader.students now only has (student_id, created_at)
```

#### Step 2: Add tenant_id to all tables

```sql
-- Add tenant_id column to students
ALTER TABLE grader.students 
ADD COLUMN tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;

CREATE INDEX idx_students_tenant ON grader.students(tenant_id);

-- Add tenant_id column to assignments
ALTER TABLE grader.assignments 
ADD COLUMN tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;

CREATE INDEX idx_assignments_tenant ON grader.assignments(tenant_id);

-- Add tenant_id column to submissions
ALTER TABLE grader.submissions 
ADD COLUMN tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;

CREATE INDEX idx_submissions_tenant ON grader.submissions(tenant_id);

-- Add created_by to track which user created records
ALTER TABLE grader.submissions
ADD COLUMN created_by UUID REFERENCES grader.app_users(user_id) ON DELETE SET NULL;

ALTER TABLE grader.assignments
ADD COLUMN created_by UUID REFERENCES grader.app_users(user_id) ON DELETE SET NULL;
```

---

## Backend Implementation

### New Functions

#### 1. auth.ts
**Endpoints:**
- `POST /api/auth?action=register` - Register user/tenant
- `POST /api/auth?action=login` - Login
- `POST /api/auth?action=verify` - Verify JWT

**Key Logic:**
- First user with tenant name → admin role
- Subsequent users → teacher role
- JWT includes: userId, email, tenantId, role
- 7-day token expiration

#### 2. auth-send-reset.ts
**Endpoint:** `POST /api/auth/send-reset`

**Flow:**
1. Generate random token (32 bytes)
2. Hash with SHA-256
3. Store in password_reset_tokens (15 min expiry)
4. Render email template
5. Send via Mailgun
6. Return generic success

#### 3. auth-complete-reset.ts
**Endpoint:** `POST /api/auth/complete-reset`

**Flow:**
1. Hash token, lookup in DB
2. Verify not expired, not used
3. Hash new password (bcrypt)
4. Update user password
5. Mark token as used
6. Send confirmation email

### Authentication Middleware

```typescript
async function authenticate(event): Promise<User | null> {
  const token = event.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  const [user] = await sql`
    SELECT au.*, t.name as tenant_name
    FROM grader.app_users au
    JOIN grader.tenants t ON au.tenant_id = t.tenant_id
    WHERE au.user_id = ${decoded.userId}
  `
  
  return user ? { userId: user.user_id, email: user.email, 
                  tenantId: user.tenant_id, role: user.role } : null
}
```

### Update All Functions

**Pattern:**
```typescript
export const handler = async (event) => {
  const user = await authenticate(event)
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  
  // PII Guard - Reject if request contains student names
  const body = JSON.parse(event.body || '{}')
  const PII_KEYS = ['student_name', 'name', 'localId', 'studentName', 'fullName', 'district_student_id']
  const foundPII = PII_KEYS.filter(k => k in body)
  if (foundPII.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'PII not allowed in cloud requests',
        forbidden_keys: foundPII 
      })
    }
  }

  // All queries now include tenant_id
  const submissions = await sql`
    SELECT * FROM grader.submissions
    WHERE tenant_id = ${user.tenantId}
    ORDER BY created_at DESC
  `
  
  return { statusCode: 200, body: JSON.stringify(submissions) }
}
```

### Dependencies

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "mailgun.js": "^10.2.3",
    "form-data": "^4.0.0",
    "@react-email/components": "^0.0.25",
    "@react-email/render": "^1.0.1"
  }
}
```

---

## Frontend Implementation

### New Pages

#### 1. Login (`/login`)
- Email + password inputs
- "Forgot password?" link
- "Register" link
- Error handling

#### 2. Register (`/register`)
- Email, password, first/last name
- Organization selection:
  - Create new organization (becomes admin)
  - Join existing organization (becomes teacher)
- Form validation

#### 3. Forgot Password (`/forgot-password`)
- Email input
- Generic success message
- Back to login link

#### 4. Reset Password (`/reset-password?token=xxx`)
- New password + confirm
- Token validation
- Success → redirect to login

### AuthContext

```typescript
interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) verifyAndSetUser(savedToken)
  }, [])
  
  // ... login, register, logout functions
}
```

### Protected Routes

```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" />
  return <>{children}</>
}

// App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/submission/:id?" element={<ProtectedRoute><Submission /></ProtectedRoute>} />
</Routes>
```

### API Client

```typescript
// src/lib/api/auth.ts
export async function login(email: string, password: string) {
  const response = await fetch('/.netlify/functions/auth?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error('Login failed')
  return response.json()
}

// Update all API calls to include token
const token = localStorage.getItem('auth_token')
fetch('/api/submissions', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## Email Integration

### Mailgun Setup

**Environment Variables:**
```bash
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=yourdomain.com  # or sandbox for testing
FROM_EMAIL="AI EssayGrader <noreply@yourdomain.com>"
APP_BASE_URL=https://ai-essaygrader.netlify.app
JWT_SECRET=your-secret-key-min-32-chars
```

### Email Templates

Create `emails/ResetPasswordEmail.jsx`:
```jsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export const ResetPasswordEmail = ({ resetUrl, userEmail, firstName }) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Heading>AI EssayGrader</Heading>
        <Heading>Password Reset Request</Heading>
        <Text>Hello{firstName ? ` ${firstName}` : ''},</Text>
        <Text>Click the button below to reset your password:</Text>
        <Button href={resetUrl}>Reset Password</Button>
        <Text>This link expires in 15 minutes.</Text>
      </Container>
    </Body>
  </Html>
)
```

### Sending Email

```typescript
import Mailgun from 'mailgun.js'
import { render } from '@react-email/render'
import ResetPasswordEmail from '../../emails/ResetPasswordEmail.jsx'

const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY })

const html = await render(ResetPasswordEmail({ resetUrl, userEmail, firstName }))

await mg.messages.create(process.env.MAILGUN_DOMAIN, {
  from: process.env.FROM_EMAIL,
  to: userEmail,
  subject: "Reset your password - AI EssayGrader",
  html
})
```

---

## Implementation Phases

### Phase 0: Local Identity Bridge (Week 1)
**Goal:** Implement privacy-first student identity management

**Tasks:**
1. ✅ Create bridge infrastructure
   - Implement crypto.ts (AES-GCM, PBKDF2, HMAC)
   - Implement storage.ts (File System Access API + IndexedDB)
   - Implement bridgeStore.ts (CRUD operations)
   - Create bridgeTypes.ts (TypeScript types)

2. ✅ Build Bridge Manager UI
   - BridgeManager.tsx (main interface)
   - AddStudentModal.tsx (add individual students)
   - ImportCsvModal.tsx (bulk import)
   - Passphrase lock/unlock flow

3. ✅ Integrate with existing submission flow
   - Update submission form to use bridge lookup
   - Add student selector that resolves to UUID
   - Update IngestRequestSchema (remove student_name)

4. ✅ Database migration
   - Backup existing students table
   - Remove PII columns
   - Generate initial bridge file from backup

**Deliverables:**
- Working bridge encryption/decryption
- Bridge Manager UI
- CSV import functionality
- Migration script with bridge generation

**Success Criteria:**
- Can create/unlock bridge with passphrase
- Can add students and get UUIDs
- Can export/import encrypted bridge
- No PII in API requests (verified in DevTools)

---

### Phase 1: Database & Auth Core (Week 2)
- [ ] Run database migration (new tables + tenant_id columns)
- [ ] Create auth.ts (register, login, verify)
- [ ] Implement JWT + bcrypt
- [ ] Test with Postman

### Phase 2: Email Integration (Week 3)
- [ ] Set up Mailgun account
- [ ] Create email templates
- [ ] Implement auth-send-reset.ts
- [ ] Implement auth-complete-reset.ts
- [ ] Test email delivery

### Phase 3: Frontend Auth UI (Week 3)
- [ ] Create AuthContext
- [ ] Build Login/Register/ForgotPassword pages
- [ ] Create ProtectedRoute component
- [ ] Update App routing
- [ ] Add user menu to header

### Phase 4: Update All APIs (Week 4)
- [ ] Add authentication to all functions
- [ ] Add tenant_id filtering to all queries
- [ ] Add created_by tracking
- [ ] Test multi-tenant isolation

### Phase 5: Admin Features (Optional)
- [ ] Create admin-users.ts
- [ ] Create admin-tenants.ts
- [ ] Build admin dashboard UI
- [ ] Add user invitation flow

### Phase 6: Testing & Polish
- [ ] Security audit
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation

---

## Security Considerations

### Password Security
- ✅ bcrypt for hashing (cost factor 10)
- ✅ Min 8 characters required
- ✅ Password reset tokens hashed (SHA-256)
- ✅ 15-minute token expiration
- ✅ Single-use tokens

### JWT Security
- ✅ Secret key min 32 characters
- ✅ 7-day expiration
- ✅ Verify on every request
- ✅ Include tenant_id in token

### Data Isolation
- ✅ All queries filter by tenant_id
- ✅ Foreign key constraints
- ✅ No cross-tenant data access
- ✅ Test with multiple tenants

### API Security
- ✅ All endpoints require authentication
- ✅ Role-based authorization
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration

---

## Environment Variables

### Required for Development
```bash
# Database
NEON_DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key-minimum-32-characters

# Email (Mailgun)
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=sandbox-xxx.mailgun.org  # or custom domain
FROM_EMAIL="AI EssayGrader <noreply@yourdomain.com>"

# App
APP_BASE_URL=http://localhost:8888
NODE_ENV=development
```

### Required for Production
```bash
# Same as above, plus:
APP_BASE_URL=https://ai-essaygrader.netlify.app
NODE_ENV=production
MAILGUN_DOMAIN=yourdomain.com  # Custom verified domain
```

---

## Testing Checklist

### Authentication
- [ ] Register new user with new tenant (becomes admin)
- [ ] Register new user with existing tenant (becomes teacher)
- [ ] Login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Token persists across page refresh
- [ ] Logout clears token

### Password Reset
- [ ] Request reset email
- [ ] Email arrives with correct link
- [ ] Reset password with valid token
- [ ] Token expires after 15 minutes
- [ ] Token cannot be reused
- [ ] Confirmation email sent

### Multi-Tenant Isolation
- [ ] Create 2 tenants with different users
- [ ] Verify Tenant A cannot see Tenant B's data
- [ ] Verify queries filter by tenant_id
- [ ] Test all CRUD operations

### API Security
- [ ] Unauthenticated requests return 401
- [ ] Invalid tokens return 401
- [ ] Teachers cannot access admin endpoints
- [ ] SQL injection attempts fail

---

## Reference Files

### From gift-of-time-assistant (READ ONLY)

**Backend:**
- `apps/backend/functions/auth.js` - Main auth logic
- `apps/backend/functions/auth-send-reset.js` - Send reset email
- `apps/backend/functions/auth-complete-reset.js` - Complete reset
- `apps/backend/functions/admin-users.js` - User management
- `apps/backend/functions/admin-tenants.js` - Tenant management

**Frontend:**
- `apps/frontend/src/contexts/AuthContext.tsx` - Auth state
- `apps/frontend/src/pages/Login.tsx` - Login page
- `apps/frontend/src/pages/Register.tsx` - Register page
- `apps/frontend/src/pages/ForgotPassword.tsx` - Forgot password
- `apps/frontend/src/lib/api/auth.ts` - API client

**Email:**
- `emails/ResetPasswordEmail.jsx` - Email template

---

## Next Steps

1. **Review this plan** - Confirm approach and scope
2. **Phase 1 Start** - Database migration script
3. **Set up Mailgun** - Create account, get API key
4. **Environment setup** - Add required env vars
5. **Begin implementation** - Follow phases sequentially

---

## Questions for Review

1. **Tenant Model**: Should we support hierarchical tenants (district → schools)?
2. **Roles**: Do we need a "student" role, or just admin/teacher?
3. **Email Provider**: Mailgun OK, or prefer SendGrid/Resend?
4. **Admin Features**: Priority for Phase 5, or defer?
5. **Migration Strategy**: Fresh start or preserve existing data?
6. **Custom Domain**: Do you have a domain for email sending?

---

**Status**: ⏸️ Awaiting Review  
**Next Action**: User review and approval to proceed

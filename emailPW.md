# Email Password Reset Plan

## Overview
Implement a secure "Forgot Password" workflow modeled after the gift-of-time-assistant implementation. The feature will allow teachers to request a password reset via email, receive a time-limited single-use link, and set a new password through a dedicated reset form.

---

## Goals
1. Allow users to request a password reset by entering their email.
2. Generate secure, single-use reset tokens stored server-side (hash only).
3. Email a reset link using Mailgun (or equivalent) with configurable sender domain.
4. Provide a reset form that validates token, enforces password rules, and updates credentials.
5. Maintain audit logs and session security after password changes.
6. Provide graceful UX messaging without leaking account existence.

---

## Parity Reference: gift-of-time-assistant
**Key Components identified in reference project:**
- `/apps/frontend/src/pages/ForgotPassword.tsx` – email collection + UX messaging
- `/apps/frontend/src/pages/ResetPassword.tsx` – new password form with token validation
- `/apps/frontend/src/lib/api/auth.ts` – client helpers for REST calls
- `/apps/backend/functions/auth-send-reset.js` – Netlify function to create tokens, send emails
- `/apps/backend/functions/auth-complete-reset.js` – Netlify function to validate token, update password
- `/emails/ResetPasswordEmail.jsx` – React Email template for reset link
- Database Table: `password_reset_tokens` with hashed tokens, expiry, used_at flags

We will adapt these patterns for AI-EssayGrader.

---

## Implementation Plan

### 1. Backend (Netlify Functions)
1. **Create endpoints**
   - `netlify/functions/auth-send-reset.ts`
   - `netlify/functions/auth-complete-reset.ts`
2. **Token creation**
   - Generate random 32-byte token (hex)
   - Hash using SHA-256 before storing
   - Store in new `password_reset_tokens` table with columns:
     - `reset_token_id uuid primary key`
     - `user_id uuid references grader.users(user_id)`
     - `token_hash text not null unique`
     - `expires_at timestamptz not null`
     - `used_at timestamptz null`
     - `created_at timestamptz default now()`
   - Insert only if email exists (no user enumeration in response).
3. **Email delivery**
   - Use Mailgun (preferred) or fallback to console log in dev.
   - React Email template (e.g., `emails/PasswordResetEmail.tsx`).
   - Include link: `${APP_BASE_URL}/reset-password?token=...`.
   - Token lifetime: 15 minutes.
   - Graceful handling when env vars missing (log, but respond success).
4. **Token verification + password update**
   - Validate token hash exists, not used, not expired.
   - Hash new password using Argon2id (preferred) or bcrypt if consistent with current stack.
   - Update user record, mark token `used_at = now()`.
   - Optionally email confirmation of password change.
5. **Security logging**
   - Log reset requests and completions (without sensitive data).
   - Consider rate limiting (future improvement).

### 2. Database Migration
1. Migration file: `migrations/add_password_reset_tokens.sql`.
2. Ensure `db_ref.md` updated with new table and relationships.
3. Add index on `(token_hash)` and `(user_id)` for quick lookup/cleanup.
4. Optional cleanup job: expire tokens older than 24h.

### 3. Frontend (React)
1. **Forgot Password Page** (`src/pages/ForgotPassword.tsx`)
   - Form with email input.
   - Call `POST /api/auth/send-reset`.
   - Display stateful success message regardless of email existence.
   - Loading state + disabled button.
2. **Reset Password Page** (`src/pages/ResetPassword.tsx`)
   - Parse token from query string.
   - Form with password + confirm fields.
   - Client-side validation (length >= 8, match).
   - Call `POST /api/auth/complete-reset`.
   - On success, show confirmation + redirect to login.
3. **API Helpers** (`src/lib/api/auth.ts`)
   - `forgotPassword(email: string)`
   - `resetPassword(token: string, password: string)`
4. **Routing Updates** (`src/App.tsx` or router config)
   - Add routes `/forgot-password`, `/reset-password`.
5. **Login Page CTA**
   - Link to forgot password page.
   - Remove existing placeholder alert.
   - **Remove "Test Credentials" section** from bottom of login card (production cleanup).
6. **UX Copy**
   - Mirror reference messaging: "If an account with that email exists..."
   - Provide safe fallback messages on errors.

### 4. Email Template
1. New file `emails/PasswordResetEmail.tsx` using React Email.
2. Content structure:
   - Logo / brand header
   - Greeting (try to include teacher first name if available)
   - CTA button + fallback link
   - Expiration reminder
   - Support contact info (placeholder for now)
3. Use `render()` to convert to HTML in function.
4. Configure `APP_BASE_URL` or `PUBLIC_BASE_URL` env var for link base.

### 5. Environment Variables (Production & Dev)
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `FROM_EMAIL`
- `APP_BASE_URL` (e.g., https://ai-essaygrader.netlify.app)
- Ensure `NEON_DATABASE_URL` accessible to Netlify functions.

### 6. Testing Strategy
1. **Unit/Integration (if time)**
   - Utility for hashing + verifying tokens.
   - API handler logic with mock DB.
2. **Manual Testing Checklist**
   - Request password reset for existing user (check email).
   - Request for non-existent email (ensure generic response, no email).
   - Click link, reset password, confirm login works with new password.
   - Try reusing token (should fail).
   - Try expired token (simulate by editing DB).
   - Ensure logs show actions without leaking info.
   - Validate cross-browser forms.

### 7. Security Considerations
- Hash tokens server-side; never store raw token.
- Short expiration + single-use enforcement.
- Rate limit (future enhancement) – use IP throttling or simple counter.
- Avoid error messages that reveal if email exists.
- Use HTTPS links only.
- Ensure password hashing algorithm matches existing auth system (check current implementation).
- After reset, consider invalidating existing sessions (future improvement).

### 8. Rollout Steps
1. Finalize migration, update `db_ref.md`.
2. Implement backend functions + email template.
3. Add frontend pages and routes.
4. Configure environment variables in Netlify + local `.env`.
5. Manual end-to-end testing in staging/localhost.
6. Update `SafeCodeRelease.md` with new feature (future release).
7. Communicate to teachers (Release notes / Help page update).

### 9. Post-Launch Tasks
- Monitor Mailgun logs for delivery issues.
- Track password reset requests for abuse patterns.
- Add admin notifications or alerts for high reset volume (future).
- Provide support documentation for teachers.

---

## Timeline Estimate
- Backend functions + email template: **6-8 hours**
- Database migration + documentation: **1 hour**
- Frontend pages + routing: **4 hours**
- QA & testing: **2 hours**
- Total: **13-15 hours** (over 2-3 working days)

---

## Dependencies
- Existing authentication system (user table, hashing mechanism)
- Netlify functions with Neon database access
- Mailgun account + verified domain (see prior Mailgun memory about authorized recipients)
- React Email package (if not already installed)

---

## Open Questions / Follow-ups
1. Confirm current password hashing algorithm (bcrypt vs argon2) – align with existing user records.
2. Determine support contact info to include in email template.
3. Decide if we need audit logs table for tracking resets.
4. Clarify whether to invalidate active sessions post-reset in phase 1.
5. Verify Mailgun domain configuration (sandbox vs production) to avoid delivery issues.

---

**Status:** Ready for implementation

*Prepared: November 1, 2025*

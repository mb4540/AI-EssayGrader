-- Migration: Add Password Reset Tables
-- Created: November 1, 2025
-- Purpose: Support email-based password reset functionality

-- ============================================================================
-- 1. PASSWORD RESET TOKENS TABLE
-- ============================================================================
-- Stores hashed reset tokens (SHA-256) with expiration and single-use tracking
CREATE TABLE IF NOT EXISTS grader.password_reset_tokens (
  reset_token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES grader.users(user_id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_user 
  ON grader.password_reset_tokens(user_id);
  
CREATE INDEX idx_password_reset_tokens_hash 
  ON grader.password_reset_tokens(token_hash);
  
CREATE INDEX idx_password_reset_tokens_expires 
  ON grader.password_reset_tokens(expires_at) 
  WHERE used_at IS NULL;

-- ============================================================================
-- 2. PASSWORD RESET AUDIT TABLE
-- ============================================================================
-- Tracks all password reset activity for security monitoring
CREATE TABLE IF NOT EXISTS grader.password_reset_audit (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES grader.users(user_id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('reset_requested', 'reset_completed', 'reset_failed', 'token_expired')),
  email text NOT NULL,
  ip_address text NULL,
  user_agent text NULL,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX idx_password_reset_audit_user 
  ON grader.password_reset_audit(user_id);
  
CREATE INDEX idx_password_reset_audit_created 
  ON grader.password_reset_audit(created_at DESC);
  
CREATE INDEX idx_password_reset_audit_email 
  ON grader.password_reset_audit(email);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE grader.password_reset_tokens IS 
  'Stores hashed password reset tokens with expiration and single-use tracking';

COMMENT ON COLUMN grader.password_reset_tokens.token_hash IS 
  'SHA-256 hash of the reset token (never store raw token)';

COMMENT ON COLUMN grader.password_reset_tokens.expires_at IS 
  'Token expiration time (15 minutes from creation)';

COMMENT ON COLUMN grader.password_reset_tokens.used_at IS 
  'Timestamp when token was used (NULL = unused, enforces single-use)';

COMMENT ON TABLE grader.password_reset_audit IS 
  'Audit log of all password reset activity for security monitoring';

COMMENT ON COLUMN grader.password_reset_audit.action IS 
  'Type of action: reset_requested, reset_completed, reset_failed, token_expired';

-- ============================================================================
-- CLEANUP FUNCTION (Optional - run periodically)
-- ============================================================================
-- Delete expired tokens older than 24 hours
COMMENT ON TABLE grader.password_reset_tokens IS 
  'Run cleanup: DELETE FROM grader.password_reset_tokens WHERE expires_at < NOW() - INTERVAL ''24 hours'';';

-- Migration: Add Multi-Tenant Authentication
-- Date: 2025-10-26
-- Purpose: Add tenant and user tables for multi-tenant support with authentication
--
-- This migration adds:
-- 1. Tenants table (districts/schools)
-- 2. Users table (teachers with authentication)
-- 3. tenant_id to all existing tables
-- 4. Indexes for performance

-- ============================================================================
-- STEP 1: Create Tenants Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS grader.tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name TEXT NOT NULL,
  tenant_type TEXT CHECK (tenant_type IN ('district', 'school', 'individual')),
  subdomain TEXT UNIQUE, -- For future custom domains (optional)
  settings JSONB DEFAULT '{}', -- Tenant-specific settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for active tenants
CREATE INDEX idx_tenants_active ON grader.tenants(is_active) WHERE is_active = true;

-- Index for subdomain lookups
CREATE INDEX idx_tenants_subdomain ON grader.tenants(subdomain) WHERE subdomain IS NOT NULL;

COMMENT ON TABLE grader.tenants IS 'Organizations using the grading system (districts, schools, or individual teachers)';

-- ============================================================================
-- STEP 2: Create Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS grader.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_token_expires TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: email must be unique within a tenant
  UNIQUE (tenant_id, email)
);

-- Index for login lookups
CREATE INDEX idx_users_tenant_email ON grader.users(tenant_id, email);

-- Index for active users
CREATE INDEX idx_users_active ON grader.users(is_active) WHERE is_active = true;

-- Index for verification tokens
CREATE INDEX idx_users_verification_token ON grader.users(verification_token) WHERE verification_token IS NOT NULL;

-- Index for reset tokens
CREATE INDEX idx_users_reset_token ON grader.users(reset_token) WHERE reset_token IS NOT NULL;

COMMENT ON TABLE grader.users IS 'Teachers and administrators with authentication credentials';

-- ============================================================================
-- STEP 3: Add tenant_id to Existing Tables
-- ============================================================================

-- Add tenant_id to students table
ALTER TABLE grader.students 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;

-- Add tenant_id to assignments table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'assignments') THEN
    ALTER TABLE grader.assignments 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add tenant_id to submissions table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'submissions') THEN
    ALTER TABLE grader.submissions 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES grader.tenants(tenant_id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create Indexes for Tenant Isolation
-- ============================================================================

-- Index for tenant-based queries on students
CREATE INDEX IF NOT EXISTS idx_students_tenant ON grader.students(tenant_id);

-- Index for tenant-based queries on assignments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'assignments') THEN
    CREATE INDEX IF NOT EXISTS idx_assignments_tenant ON grader.assignments(tenant_id);
  END IF;
END $$;

-- Index for tenant-based queries on submissions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'submissions') THEN
    CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON grader.submissions(tenant_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create Default Tenant for Existing Data
-- ============================================================================

-- Create a default tenant for migration purposes
INSERT INTO grader.tenants (tenant_id, tenant_name, tenant_type, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Legacy Data',
  'individual',
  true
)
ON CONFLICT (tenant_id) DO NOTHING;

-- Assign existing students to default tenant
UPDATE grader.students 
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

-- Assign existing assignments to default tenant (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'assignments') THEN
    UPDATE grader.assignments 
    SET tenant_id = '00000000-0000-0000-0000-000000000000'
    WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Assign existing submissions to default tenant (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'submissions') THEN
    UPDATE grader.submissions 
    SET tenant_id = '00000000-0000-0000-0000-000000000000'
    WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Make tenant_id NOT NULL (after backfill)
-- ============================================================================

-- Make tenant_id required on students
ALTER TABLE grader.students 
ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id required on assignments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'assignments') THEN
    ALTER TABLE grader.assignments 
    ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- Make tenant_id required on submissions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'grader' AND table_name = 'submissions') THEN
    ALTER TABLE grader.submissions 
    ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Create Updated At Trigger
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION grader.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenants
CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON grader.tenants
FOR EACH ROW EXECUTE FUNCTION grader.update_updated_at();

-- Trigger for users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON grader.users
FOR EACH ROW EXECUTE FUNCTION grader.update_updated_at();

-- ============================================================================
-- STEP 8: Create Helper Functions
-- ============================================================================

-- Function to create a new tenant
CREATE OR REPLACE FUNCTION grader.create_tenant(
  p_tenant_name TEXT,
  p_tenant_type TEXT DEFAULT 'individual'
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO grader.tenants (tenant_name, tenant_type)
  VALUES (p_tenant_name, p_tenant_type)
  RETURNING tenant_id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new user
CREATE OR REPLACE FUNCTION grader.create_user(
  p_tenant_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'teacher'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO grader.users (tenant_id, email, password_hash, full_name, role)
  VALUES (p_tenant_id, p_email, p_password_hash, p_full_name, p_role)
  RETURNING user_id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'grader' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'grader'
  AND table_name IN ('tenants', 'users', 'students', 'assignments', 'submissions')
ORDER BY table_name;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'grader'
  AND tablename IN ('tenants', 'users', 'students', 'assignments', 'submissions')
ORDER BY tablename, indexname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

RAISE NOTICE 'Migration 002_add_multi_tenant_auth completed successfully';
RAISE NOTICE 'Created tables: tenants, users';
RAISE NOTICE 'Added tenant_id to existing tables';
RAISE NOTICE 'Created default tenant for legacy data';

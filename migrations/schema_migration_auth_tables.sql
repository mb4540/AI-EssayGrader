-- Authentication Tables Migration
-- Adds tenants and users tables for multi-tenant authentication
-- Run this in your Neon Postgres console

-- ============================================================================
-- Tenants Table
-- ============================================================================

create table if not exists grader.tenants (
  tenant_id uuid primary key default gen_random_uuid(),
  tenant_name text not null,
  tenant_type text not null check (tenant_type in ('individual', 'school', 'district')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenants_name on grader.tenants(tenant_name);

-- ============================================================================
-- Users Table
-- ============================================================================

create table if not exists grader.users (
  user_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references grader.tenants(tenant_id) on delete restrict,
  email text not null,
  password_hash text not null,
  full_name text not null,
  role text not null default 'teacher' check (role in ('admin', 'teacher')),
  is_active boolean not null default true,
  email_verified boolean not null default false,
  verification_token text,
  verification_token_expires timestamptz,
  reset_token text,
  reset_token_expires timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, email)
);

create index if not exists idx_users_tenant on grader.users(tenant_id);
create index if not exists idx_users_email on grader.users(email);
create index if not exists idx_users_verification_token on grader.users(verification_token);
create index if not exists idx_users_reset_token on grader.users(reset_token);

-- ============================================================================
-- Update Trigger for Tenants
-- ============================================================================

create trigger trg_tenants_updated
before update on grader.tenants
for each row execute function grader.update_timestamp();

-- ============================================================================
-- Update Trigger for Users
-- ============================================================================

create trigger trg_users_updated
before update on grader.users
for each row execute function grader.update_timestamp();

-- ============================================================================
-- Create Test User
-- ============================================================================

-- Insert test tenant
insert into grader.tenants (tenant_id, tenant_name, tenant_type)
values ('00000000-0000-0000-0000-000000000001', 'Test School', 'school')
on conflict do nothing;

-- Insert test user (password: testpass123)
-- Password hash generated with bcrypt rounds=12
insert into grader.users (
  user_id,
  tenant_id,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  email_verified
)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEgzK3e', -- testpass123
  'Test User',
  'teacher',
  true,
  true
)
on conflict do nothing;

-- ============================================================================
-- Link Existing Data to Test Tenant (Optional)
-- ============================================================================

-- Add tenant_id column to existing tables if needed
-- This allows linking students, assignments, and submissions to tenants

alter table grader.students 
add column if not exists tenant_id uuid references grader.tenants(tenant_id) on delete restrict;

alter table grader.assignments 
add column if not exists tenant_id uuid references grader.tenants(tenant_id) on delete restrict;

-- Update existing records to use test tenant
update grader.students set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update grader.assignments set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;

-- Create indexes
create index if not exists idx_students_tenant on grader.students(tenant_id);
create index if not exists idx_assignments_tenant on grader.assignments(tenant_id);

-- Add tenant_id column to assignments table
ALTER TABLE grader.assignments
  ADD COLUMN IF NOT EXISTS tenant_id uuid NOT NULL DEFAULT 'public'::uuid;

-- Add index for tenant queries
CREATE INDEX IF NOT EXISTS idx_assignments_tenant_id 
  ON grader.assignments(tenant_id);

-- Verify column added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'grader' 
  AND table_name = 'assignments'
ORDER BY ordinal_position;

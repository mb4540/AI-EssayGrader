-- ============================================================================
-- COMPLETE DATABASE SCHEMA REPORT
-- Run this in Neon SQL Editor to get full schema details
-- ============================================================================

-- PART 1: All Tables with Column Details
-- ============================================================================
SELECT 
  t.table_schema,
  t.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  CASE 
    WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
    ELSE ''
  END as key_type
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_schema = c.table_schema 
  AND t.table_name = c.table_name
LEFT JOIN (
  SELECT ku.table_schema, ku.table_name, ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema 
    AND c.table_name = pk.table_name 
    AND c.column_name = pk.column_name
WHERE t.table_schema = 'grader'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ============================================================================
-- PART 2: Foreign Key Relationships
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'grader'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'grader'
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 4: Table Row Counts
-- ============================================================================
SELECT 
  schemaname,
  relname as table_name,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'grader'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- PART 5: Constraints (CHECK, UNIQUE, etc.)
-- ============================================================================
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'grader'
  AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

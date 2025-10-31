# Database Reference - AI-EssayGrader

**Last Updated:** October 31, 2025 - 1:42 PM UTC-05:00  
**Database:** Neon Postgres  
**Schema:** `grader`

> ⚠️ **IMPORTANT**: This file must be updated whenever database schema changes are made.
> Always reference this file before making database changes.

## 📝 Recent Migrations

### October 31, 2025 - BulletProof Grading Schema
**Migration:** `migrations/add_bulletproof_grading.sql`
- Added rubric JSON storage to assignments
- Added scale mode (percent/points) configuration
- Added computed scores and audit trail to submissions
- Added calculator version tracking

---

## 📊 Database Statistics

- **Total Tables:** 6
- **Total Records:** 25 rows
- **Total Size:** ~544 KB
- **Schema:** `grader`

---

## 📋 Table Structures

### 1. assignments

**Purpose:** Store assignment definitions with grading criteria and bulletproof grading configuration

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| assignment_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| title | text | NO | null | |
| description | text | YES | null | |
| created_at | timestamptz | NO | now() | |
| tenant_id | uuid | NO | null | FK → tenants |
| grading_criteria | text | YES | null | |
| **rubric_json** | **jsonb** | **YES** | **null** | |
| **scale_mode** | **text** | **YES** | **'percent'** | **CHECK** |
| **total_points** | **numeric(10,4)** | **YES** | **null** | |
| **rounding_mode** | **text** | **YES** | **'HALF_UP'** | |
| **rounding_decimals** | **integer** | **YES** | **2** | |

**Row Count:** 1  
**Size:** 48 KB

**New Columns (BulletProof Grading):**
- `rubric_json` - Structured rubric with criteria, levels, and weights (JSON)
- `scale_mode` - Grading scale mode: 'percent' (0-100) or 'points' (custom total)
- `total_points` - Total points for assignment (used when scale_mode='points')
- `rounding_mode` - Rounding mode for calculator: HALF_UP, HALF_EVEN, or HALF_DOWN
- `rounding_decimals` - Number of decimal places for rounding (0-4)

**Indexes:**
- `assignments_pkey` - PRIMARY KEY (assignment_id)
- `idx_assignments_tenant` - (tenant_id)
- `idx_assignments_scale_mode` - (scale_mode)

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

**Constraints:**
- `chk_total_points_required` - Ensures total_points is set and > 0 when scale_mode='points'
- `chk_rounding_decimals_range` - Ensures rounding_decimals is between 0-4
- `chk_rounding_mode_valid` - Ensures rounding_mode is HALF_UP, HALF_EVEN, or HALF_DOWN
- CHECK on scale_mode - Must be 'percent' or 'points'

---

### 2. students

**Purpose:** Store student UUIDs only (FERPA compliant - NO PII)

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| student_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| created_at | timestamptz | NO | now() | |
| tenant_id | uuid | NO | null | FK → tenants |

**Row Count:** 5  
**Size:** 48 KB

**⚠️ FERPA COMPLIANCE:**
- NO student names stored
- NO district IDs stored
- Only anonymous UUIDs
- Student names stored in encrypted local bridge file

**Indexes:**
- `students_pkey` - PRIMARY KEY (student_id)
- `idx_students_tenant` - (tenant_id)

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

---

### 3. submissions

**Purpose:** Store student essay submissions, grades, and bulletproof grading audit trail

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| submission_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| student_id | uuid | NO | null | FK → students |
| assignment_id | uuid | YES | null | FK → assignments |
| source_type | text | NO | null | CHECK |
| verbatim_text | text | NO | null | |
| teacher_criteria | text | NO | null | |
| ai_grade | numeric | YES | null | CHECK (0-100) |
| ai_feedback | jsonb | YES | null | |
| teacher_grade | numeric | YES | null | CHECK (0-100) |
| teacher_feedback | text | YES | null | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| tenant_id | uuid | NO | null | FK → tenants |
| draft_mode | text | YES | 'single' | |
| rough_draft_text | text | YES | null | |
| final_draft_text | text | YES | null | |
| image_url | text | YES | null | |
| original_file_url | text | YES | null | |
| **extracted_scores** | **jsonb** | **YES** | **null** | |
| **computed_scores** | **jsonb** | **YES** | **null** | |
| **calculator_version** | **text** | **YES** | **null** | |

**Row Count:** 6  
**Size:** 176 KB

**New Columns (BulletProof Grading):**
- `extracted_scores` - LLM-extracted per-criterion scores and rationales (JSON)
- `computed_scores` - Deterministically computed final scores from Python calculator (JSON)
- `calculator_version` - Version/hash of calculator used for audit trail

**Indexes:**
- `submissions_pkey` - PRIMARY KEY (submission_id)
- `idx_submissions_student` - (student_id)
- `idx_submissions_assignment` - (assignment_id)
- `idx_submissions_tenant` - (tenant_id)
- `idx_submissions_calculator_version` - (calculator_version)

**Foreign Keys:**
- `student_id` → `students.student_id` (ON DELETE RESTRICT)
- `assignment_id` → `assignments.assignment_id` (ON DELETE SET NULL)
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

**Constraints:**
- `source_type` must be one of: 'text', 'docx', 'image', 'pdf'
- `ai_grade` must be between 0 and 100
- `teacher_grade` must be between 0 and 100

---

### 4. submission_versions

**Purpose:** Store version history of submission grades and feedback

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| version_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| submission_id | uuid | NO | null | FK → submissions |
| ai_grade | numeric | YES | null | CHECK (0-100) |
| ai_feedback | jsonb | YES | null | |
| teacher_grade | numeric | YES | null | CHECK (0-100) |
| teacher_feedback | text | YES | null | |
| snapshot_at | timestamptz | NO | now() | |
| draft_mode | text | YES | null | |
| rough_draft_text | text | YES | null | |
| final_draft_text | text | YES | null | |

**Row Count:** 8  
**Size:** 96 KB

**Indexes:**
- `submission_versions_pkey` - PRIMARY KEY (version_id)
- `idx_submission_versions_submission_id` - (submission_id, snapshot_at DESC)

**Foreign Keys:**
- `submission_id` → `submissions.submission_id` (ON DELETE CASCADE)

**Constraints:**
- `ai_grade` must be between 0 and 100
- `teacher_grade` must be between 0 and 100

---

### 5. tenants

**Purpose:** Multi-tenancy support for districts/schools/individuals

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| tenant_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| tenant_name | text | NO | null | |
| tenant_type | text | YES | null | CHECK |
| subdomain | text | YES | null | UNIQUE |
| settings | jsonb | YES | '{}'::jsonb | |
| is_active | boolean | NO | true | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Row Count:** 3  
**Size:** 72 KB

**Indexes:**
- `tenants_pkey` - PRIMARY KEY (tenant_id)
- `tenants_subdomain_key` - UNIQUE (subdomain)
- `idx_tenants_subdomain` - (subdomain) WHERE subdomain IS NOT NULL
- `idx_tenants_active` - (is_active) WHERE is_active = true

**Constraints:**
- `tenant_type` must be one of: 'district', 'school', 'individual'
- `subdomain` must be unique

**Current Usage:**
- Using `PUBLIC_TENANT_ID` = '00000000-0000-0000-0000-000000000000' for all users
- Multi-tenancy infrastructure ready but not yet activated

---

### 6. users

**Purpose:** User authentication and authorization (not yet implemented)

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| user_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| tenant_id | uuid | NO | null | FK → tenants |
| email | text | NO | null | UNIQUE (per tenant) |
| password_hash | text | NO | null | |
| full_name | text | NO | null | |
| role | text | NO | 'teacher' | CHECK |
| is_active | boolean | NO | true | |
| email_verified | boolean | NO | false | |
| verification_token | text | YES | null | |
| verification_token_expires | timestamptz | YES | null | |
| reset_token | text | YES | null | |
| reset_token_expires | timestamptz | YES | null | |
| last_login_at | timestamptz | YES | null | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Row Count:** 2  
**Size:** 104 KB

**Indexes:**
- `users_pkey` - PRIMARY KEY (user_id)
- `users_tenant_id_email_key` - UNIQUE (tenant_id, email)
- `idx_users_tenant_email` - (tenant_id, email)
- `idx_users_active` - (is_active) WHERE is_active = true
- `idx_users_verification_token` - (verification_token) WHERE verification_token IS NOT NULL
- `idx_users_reset_token` - (reset_token) WHERE reset_token IS NOT NULL

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

**Constraints:**
- `role` must be one of: 'admin', 'teacher'
- `email` must be unique per tenant

**Status:** Table exists but authentication not yet implemented

---

## 🔗 Relationship Diagram

```
tenants (3 rows)
  ├─→ students (5 rows) [RESTRICT]
  │     └─→ submissions (6 rows) [RESTRICT]
  │           ├─→ submission_versions (8 rows) [CASCADE]
  │           └─→ assignments (1 row) [SET NULL]
  ├─→ assignments (1 row) [RESTRICT]
  └─→ users (2 rows) [RESTRICT]
```

**Foreign Key Rules:**
- **RESTRICT**: Prevents deletion if referenced records exist
- **CASCADE**: Automatically deletes related records
- **SET NULL**: Sets foreign key to NULL when parent is deleted

---

## 🔍 Indexes Summary

**Total Indexes:** 20

**Performance Optimizations:**
- ✅ All primary keys indexed
- ✅ All foreign keys indexed (improves JOIN performance)
- ✅ Tenant filtering indexed on all tables
- ✅ Composite index on submission_versions (submission_id, snapshot_at DESC)
- ✅ Partial indexes on active records (users, tenants)
- ✅ No duplicate indexes - database optimized

---

## ✅ Data Validation Constraints

### Grade Validation
- `submissions.ai_grade`: 0-100
- `submissions.teacher_grade`: 0-100
- `submission_versions.ai_grade`: 0-100
- `submission_versions.teacher_grade`: 0-100

### Enum Validation
- `submissions.source_type`: 'text', 'docx', 'image', 'pdf'
- `tenants.tenant_type`: 'district', 'school', 'individual'
- `users.role`: 'admin', 'teacher'

### Uniqueness Constraints
- `tenants.subdomain` - globally unique
- `users.(tenant_id, email)` - unique per tenant

---

## 🔒 FERPA Compliance Status

### ✅ COMPLIANT
- **students table**: Contains ZERO PII
  - Only stores: student_id (UUID), tenant_id, created_at
  - NO student names
  - NO district IDs
  - NO personal information

### 🛡️ Student Identity Bridge
- Student names stored in encrypted local file
- Encryption: AES-256-GCM
- File: `students.bridge.json.enc.json`
- Location: User's local machine only
- Never transmitted to cloud
- Never stored in database

### ✅ Network Requests
- All API calls use UUIDs only
- No PII transmitted over network
- Student names resolved locally from bridge

---

## 🗑️ Cleanup Status

### ✅ Cleanup Completed (October 31, 2025)

**Removed:**
1. ✅ Duplicate index `idx_submission_versions_submission` - Removed
2. ✅ Backup table `students_backup` - Removed

**Result:**
- Database is now optimized
- No duplicate indexes
- No unused tables
- Total indexes reduced from 21 to 20

---

## 📝 Migration History

### Applied Migrations:
1. ✅ `FERPA_MIGRATION_SIMPLE.sql` - Removed PII from students table
2. ✅ `fix_submission_versions_table.sql` - Fixed version table schema
3. ✅ `add_missing_submission_columns.sql` - Added draft mode columns
4. ✅ `add_grading_criteria_to_assignments.sql` - Added criteria column
5. ✅ `cleanup_database.sql` - Removed duplicate index and backup table (Oct 31, 2025)

### Archived Migrations:
- `EXECUTE_FERPA_MIGRATION.sql` - Failed version (superseded)
- `fix_submissions_foreign_key.sql` - Temporary fix
- `add_missing_version_columns.sql` - Applied
- `add_tenant_to_assignments.sql` - Applied
- `link_submissions_to_assignment.sql` - Applied

---

## 🚀 Future Enhancements

### Ready for Implementation:
1. **Authentication System**
   - `users` table ready
   - Email verification support
   - Password reset support
   - Role-based access control

2. **Multi-Tenancy**
   - `tenants` table ready
   - All tables have tenant_id
   - Subdomain support ready
   - Currently using PUBLIC_TENANT_ID

3. **Version History UI**
   - `submission_versions` table populated
   - 8 versions for 6 submissions
   - Ready for UI implementation

---

## 📊 Query Examples

### Get all submissions for a student
```sql
SELECT 
  s.submission_id,
  s.student_id,
  a.title as assignment_title,
  s.ai_grade,
  s.teacher_grade,
  s.created_at
FROM grader.submissions s
LEFT JOIN grader.assignments a ON s.assignment_id = a.assignment_id
WHERE s.student_id = 'uuid-here'
ORDER BY s.created_at DESC;
```

### Get version history for a submission
```sql
SELECT 
  version_id,
  ai_grade,
  teacher_grade,
  snapshot_at
FROM grader.submission_versions
WHERE submission_id = 'uuid-here'
ORDER BY snapshot_at DESC;
```

### Get all submissions by assignment
```sql
SELECT 
  s.submission_id,
  s.student_id,
  s.ai_grade,
  s.teacher_grade,
  s.created_at
FROM grader.submissions s
WHERE s.assignment_id = 'uuid-here'
  AND s.tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY s.created_at DESC;
```

---

## 🔧 Maintenance Commands

### Analyze table statistics
```sql
ANALYZE grader.submissions;
ANALYZE grader.submission_versions;
```

### Check table sizes
```sql
SELECT 
  schemaname,
  relname as table_name,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'grader'
ORDER BY n_live_tup DESC;
```

### Vacuum tables
```sql
VACUUM ANALYZE grader.submissions;
VACUUM ANALYZE grader.submission_versions;
```

---

## 📞 Database Connection

**Provider:** Neon Postgres  
**Environment Variable:** `DATABASE_URL`  
**Connection:** Serverless SQL via `@neondatabase/serverless`  
**Schema:** `grader`

---

**Last Schema Update:** October 31, 2025  
**Next Review:** After any schema changes  
**Maintained By:** Development Team

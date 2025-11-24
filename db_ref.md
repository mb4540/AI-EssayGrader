# Database Reference - AI-EssayGrader

**Last Updated:** November 24, 2025 - 6:00 AM UTC-06:00  
**Database:** Neon Postgres  
**Schema:** `grader`

> ⚠️ **IMPORTANT**: This file must be updated whenever database schema changes are made.
> Always reference this file before making database changes.

## 📝 Recent Migrations

### November 24, 2025 - Class Period Organization
**Migration:** `migrations/add_class_period_to_students.sql`
- Added `class_period` column to `grader.students` table
- Added index on `class_period` for filtering performance
- Enables teachers to organize students by class period/section
- Non-PII field (e.g., "Period 1", "Block A")

### November 14, 2025 - Background Tasks Table
**Migration:** `migrations/add_background_tasks.sql`
- Added `grader.background_tasks` table for async job tracking
- Enables long-running operations (grading, etc.) without 30-second timeout
- Tracks job status: pending → processing → completed/failed
- 5 indexes for efficient queries
- Supports grading, assessment generation, lesson plans, text extraction

### November 1, 2025 - Password Reset Tables
**Migration:** `migrations/add_password_reset_tables.sql`
- Added `grader.password_reset_tokens` table for secure token storage
- Added `grader.password_reset_audit` table for security audit logging
- SHA-256 token hashing with 15-minute expiration
- Single-use token enforcement
- Comprehensive audit trail for all reset activity

### November 1, 2025 - Inline Annotations Feature
**Migration:** `migrations/add_inline_annotations.sql`
- Added `grader.annotations` table for inline text annotations
- Added `grader.annotation_events` table for audit trail
- Added 7 indexes for annotation queries
- Supports AI-suggested and teacher-created annotations with workflow states
- Line-based text anchoring with character offsets

### October 31, 2025 - Document Type Column
**Migration:** `migrations/add_document_type.sql`
- Added `document_type` column to assignments table
- Added index on document_type for filtering
- Supports ELA document type selection (personal_narrative, argumentative, etc.)

### October 31, 2025 - BulletProof Grading Schema
**Migration:** `migrations/add_bulletproof_grading.sql`
- Added rubric JSON storage to assignments
- Added scale mode (percent/points) configuration
- Added computed scores and audit trail to submissions
- Added calculator version tracking

---

## 📊 Database Statistics

- **Total Tables:** 11
- **Total Records:** 25+ rows
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
| **document_type** | **text** | **YES** | **null** | |

**Row Count:** 1  
**Size:** 48 KB

**New Columns (BulletProof Grading):**
- `rubric_json` - Structured rubric with criteria, levels, and weights (JSON)
- `scale_mode` - Grading scale mode: 'percent' (0-100) or 'points' (custom total)
- `total_points` - Total points for assignment (used when scale_mode='points')
- `rounding_mode` - Rounding mode for calculator: HALF_UP, HALF_EVEN, or HALF_DOWN
- `rounding_decimals` - Number of decimal places for rounding (0-4)
- `document_type` - Type of document (e.g., personal_narrative, argumentative) - helps AI provide relevant feedback

**Indexes:**
- `assignments_pkey` - PRIMARY KEY (assignment_id)
- `idx_assignments_tenant` - (tenant_id)
- `idx_assignments_scale_mode` - (scale_mode)
- `idx_assignments_document_type` - (document_type)

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

**Constraints:**
- `chk_total_points_required` - Ensures total_points is set and > 0 when scale_mode='points'
- `chk_rounding_decimals_range` - Ensures rounding_decimals is between 0-4
- `chk_rounding_mode_valid` - Ensures rounding_mode is HALF_UP, HALF_EVEN, or HALF_DOWN
- CHECK on scale_mode - Must be 'percent' or 'points'

---

### 2. background_tasks

**Purpose:** Track long-running background jobs (grading, assessment generation, etc.) to avoid function timeouts

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| task_id | uuid | NO | null | PRIMARY KEY |
| tenant_id | uuid | NO | null | FK → tenants |
| task_type | text | NO | null | CHECK |
| status | text | NO | 'pending' | CHECK |
| input_data | jsonb | NO | null | |
| output_data | jsonb | YES | null | |
| error_message | text | YES | null | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| completed_at | timestamptz | YES | null | |

**Row Count:** 0 (new table)  
**Size:** 8 KB

**Purpose:**
- Enables async processing for operations that exceed 30-second function timeout
- Tracks job lifecycle: pending → processing → completed/failed
- Stores input parameters and output results as JSON
- Provides audit trail for all background operations

**Task Types:**
- `grading` - AI grading of submissions
- `assessment_generation` - Creating assessments
- `lesson_plan_generation` - Generating lesson plans
- `text_extraction` - OCR and document processing

**Status Values:**
- `pending` - Job created, not yet started
- `processing` - Job currently running
- `completed` - Job finished successfully
- `failed` - Job encountered an error

**Indexes:**
- `background_tasks_pkey` - PRIMARY KEY (task_id)
- `idx_background_tasks_tenant` - (tenant_id)
- `idx_background_tasks_status` - (status)
- `idx_background_tasks_type` - (task_type)
- `idx_background_tasks_created` - (created_at DESC)
- `idx_background_tasks_tenant_status` - (tenant_id, status)

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE CASCADE)

**Constraints:**
- `chk_background_tasks_status` - Status must be pending, processing, completed, or failed
- `chk_background_tasks_type` - Task type must be grading, assessment_generation, lesson_plan_generation, or text_extraction

---

### 3. students

**Purpose:** Store student UUIDs only (FERPA compliant - NO PII)

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| student_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| created_at | timestamptz | NO | now() | |
| tenant_id | uuid | NO | null | FK → tenants |
| **class_period** | **text** | **YES** | **null** | |

**Row Count:** 5  
**Size:** 48 KB

**⚠️ FERPA COMPLIANCE:**
- NO student names stored
- NO district IDs stored
- Only anonymous UUIDs
- Student names stored in encrypted local bridge file
- `class_period` is non-PII (e.g., "Period 1", "Block A")

**Indexes:**
- `students_pkey` - PRIMARY KEY (student_id)
- `idx_students_tenant` - (tenant_id)
- `idx_students_class_period` - (class_period)

**Foreign Keys:**
- `tenant_id` → `tenants.tenant_id` (ON DELETE RESTRICT)

---

### 4. submissions

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

### 5. submission_versions

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

### 6. tenants

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

### 7. users

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

### 8. annotations

**Purpose:** Store inline text annotations (AI-suggested and teacher-created) with line-based anchoring

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| annotation_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| submission_id | uuid | NO | null | FK → submissions |
| line_number | integer | NO | null | CHECK (> 0) |
| start_offset | integer | NO | null | CHECK (>= 0) |
| end_offset | integer | NO | null | CHECK (>= start_offset) |
| quote | text | NO | null | |
| category | text | NO | null | |
| suggestion | text | NO | null | |
| severity | text | YES | null | CHECK |
| status | text | NO | 'ai_suggested' | CHECK |
| created_by | uuid | YES | null | FK → users |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| ai_payload | jsonb | YES | null | |

**Row Count:** 0 (new table)  
**Size:** ~8 KB

**Indexes:**
- `annotations_pkey` - PRIMARY KEY (annotation_id)
- `idx_annotations_submission` - (submission_id)
- `idx_annotations_status` - (status)
- `idx_annotations_line` - (submission_id, line_number)
- `idx_annotations_created_by` - (created_by) WHERE created_by IS NOT NULL

**Foreign Keys:**
- `submission_id` → `submissions.submission_id` (ON DELETE CASCADE)
- `created_by` → `users.user_id` (ON DELETE SET NULL)

**Constraints:**
- `line_number` must be > 0
- `start_offset` must be >= 0
- `end_offset` must be >= start_offset
- `severity` must be one of: 'info', 'warning', 'error'
- `status` must be one of: 'ai_suggested', 'teacher_edited', 'teacher_rejected', 'teacher_approved', 'teacher_created'

---

### 9. annotation_events

**Purpose:** Audit trail for all annotation lifecycle events

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| event_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| annotation_id | uuid | NO | null | FK → annotations |
| event_type | text | NO | null | CHECK |
| payload | jsonb | NO | null | |
| created_by | uuid | YES | null | FK → users |
| created_at | timestamptz | NO | now() | |

**Row Count:** 0 (new table)  
**Size:** ~8 KB

**Indexes:**
- `annotation_events_pkey` - PRIMARY KEY (event_id)
- `idx_annotation_events_annotation` - (annotation_id, created_at DESC)
- `idx_annotation_events_type` - (event_type)
- `idx_annotation_events_created_by` - (created_by) WHERE created_by IS NOT NULL

**Foreign Keys:**
- `annotation_id` → `annotations.annotation_id` (ON DELETE CASCADE)
- `created_by` → `users.user_id` (ON DELETE SET NULL)

**Constraints:**
- `event_type` must be one of: 'ai_created', 'teacher_edit', 'teacher_reject', 'teacher_approve', 'teacher_create', 'teacher_delete'

---

### 10. password_reset_tokens

**Purpose:** Secure storage of password reset tokens with SHA-256 hashing and expiration

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| reset_token_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | null | FK → users |
| token_hash | text | NO | null | UNIQUE |
| expires_at | timestamptz | NO | null | |
| used_at | timestamptz | YES | null | |
| created_at | timestamptz | NO | now() | |

**Row Count:** 0 (new table)  
**Size:** ~8 KB

**Indexes:**
- `password_reset_tokens_pkey` - PRIMARY KEY (reset_token_id)
- `password_reset_tokens_token_hash_key` - UNIQUE (token_hash)
- `idx_password_reset_tokens_user` - (user_id)
- `idx_password_reset_tokens_hash` - (token_hash)
- `idx_password_reset_tokens_expires` - (expires_at) WHERE used_at IS NULL

**Foreign Keys:**
- `user_id` → `users.user_id` (ON DELETE CASCADE)

**Security Features:**
- Raw tokens never stored (SHA-256 hash only)
- 15-minute expiration window
- Single-use enforcement via `used_at` timestamp
- Automatic cleanup of expired tokens

---

### 11. password_reset_audit

**Purpose:** Comprehensive audit log for all password reset activity

| Column | Type | Nullable | Default | Key |
|--------|------|----------|---------|-----|
| audit_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | YES | null | FK → users |
| action | text | NO | null | CHECK |
| email | text | NO | null | |
| ip_address | text | YES | null | |
| user_agent | text | YES | null | |
| error_message | text | YES | null | |
| created_at | timestamptz | NO | now() | |

**Row Count:** 0 (new table)  
**Size:** ~8 KB

**Indexes:**
- `password_reset_audit_pkey` - PRIMARY KEY (audit_id)
- `idx_password_reset_audit_user` - (user_id)
- `idx_password_reset_audit_created` - (created_at DESC)
- `idx_password_reset_audit_email` - (email)

**Foreign Keys:**
- `user_id` → `users.user_id` (ON DELETE SET NULL)

**Constraints:**
- `action` must be one of: 'reset_requested', 'reset_completed', 'reset_failed', 'token_expired'

**Audit Events:**
- **reset_requested**: User requested password reset email
- **reset_completed**: Password successfully changed
- **reset_failed**: Reset attempt failed (invalid token, already used, etc.)
- **token_expired**: User attempted to use expired token

---

## 🔗 Relationship Diagram

```
tenants (3 rows)
  ├─→ students (5 rows) [RESTRICT]
  │     └─→ submissions (6 rows) [RESTRICT]
  │           ├─→ submission_versions (8 rows) [CASCADE]
  │           ├─→ annotations (0 rows) [CASCADE]
  │           │     └─→ annotation_events (0 rows) [CASCADE]
  │           └─→ assignments (1 row) [SET NULL]
  ├─→ assignments (1 row) [RESTRICT]
  └─→ users (2 rows) [RESTRICT]
        ├─→ annotations.created_by [SET NULL]
        ├─→ annotation_events.created_by [SET NULL]
        ├─→ password_reset_tokens (0 rows) [CASCADE]
        └─→ password_reset_audit (0 rows) [SET NULL]
```

**Foreign Key Rules:**
- **RESTRICT**: Prevents deletion if referenced records exist
- **CASCADE**: Automatically deletes related records
- **SET NULL**: Sets foreign key to NULL when parent is deleted

---

## 🔍 Indexes Summary

**Total Indexes:** 36

**Performance Optimizations:**
- ✅ All primary keys indexed
- ✅ All foreign keys indexed (improves JOIN performance)
- ✅ Tenant filtering indexed on all tables
- ✅ Composite index on submission_versions (submission_id, snapshot_at DESC)
- ✅ Composite index on annotations (submission_id, line_number)
- ✅ Composite index on annotation_events (annotation_id, created_at DESC)
- ✅ Partial indexes on active records (users, tenants)
- ✅ Partial indexes on annotation creators (created_by IS NOT NULL)
- ✅ Partial index on unused password reset tokens (used_at IS NULL)
- ✅ Token hash indexed for fast password reset lookups
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

**Last Schema Update:** November 14, 2025  
**Next Review:** After any schema changes  
**Maintained By:** Development Team

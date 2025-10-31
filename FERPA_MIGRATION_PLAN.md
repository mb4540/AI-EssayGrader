# FERPA Compliance Migration Plan
## Student Identity Bridge Implementation

## Current State (NOT FERPA Compliant)
```sql
-- Students table contains PII
CREATE TABLE grader.students (
  student_id uuid PRIMARY KEY,           -- UUID (good)
  student_name text NOT NULL,            -- ❌ PII in cloud
  district_student_id text,              -- ❌ PII in cloud
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL
);
```

**Problem:** Student names and district IDs are stored in the cloud database.

## Target State (FERPA Compliant)
```sql
-- Students table contains NO PII
CREATE TABLE grader.students (
  student_id uuid PRIMARY KEY,           -- ✅ Only UUID in cloud
  tenant_id uuid NOT NULL,
  created_at timestamptz NOT NULL
  -- REMOVED: student_name
  -- REMOVED: district_student_id
);
```

**Solution:** Only UUIDs stored in cloud. Names stored locally in encrypted bridge file.

## Bridge File (Local Only)
```json
{
  "version": "1.0",
  "payload": {
    "roster": [
      {
        "uuid": "f4100a7c-...",           // ✅ Sent to cloud
        "localId": "S12345",              // ❌ Never sent to cloud
        "name": "John Smith",             // ❌ Never sent to cloud
        "createdAt": "2025-10-26T12:00:00Z"
      }
    ]
  }
}
```

## Migration Steps

### Step 1: Backup Current Data
```sql
-- Create backup table with PII (for generating bridge files)
CREATE TABLE grader.students_backup AS 
SELECT 
  student_id,
  student_name,
  district_student_id,
  tenant_id,
  created_at
FROM grader.students;

-- Verify backup
SELECT COUNT(*) FROM grader.students_backup;
```

### Step 2: Export Data for Bridge Files
```sql
-- Export student data for each tenant to create bridge files
SELECT 
  student_id as uuid,
  district_student_id as localId,
  student_name as name,
  created_at as createdAt,
  tenant_id
FROM grader.students_backup
ORDER BY tenant_id, student_name;
```

**Action:** Save this data and create encrypted bridge files for each tenant.

### Step 3: Remove PII Columns from Students Table
```sql
-- Remove PII columns
ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS student_name CASCADE;

ALTER TABLE grader.students 
  DROP COLUMN IF EXISTS district_student_id CASCADE;

-- Verify schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'grader' AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected result: Only student_id, tenant_id, created_at
```

### Step 4: Update Frontend Schema
```typescript
// src/lib/schema.ts - AFTER migration
export const IngestRequestSchema = z.object({
  // REMOVED: student_name (deprecated)
  student_id: z.string().uuid(),  // ✅ Required - UUID from bridge
  assignment_id: z.string().uuid().optional(),
  assignment_title: z.string().optional(),
  teacher_criteria: z.string().min(1),
  source_type: z.enum(['text', 'docx', 'pdf', 'doc', 'image']),
  draft_mode: z.enum(['single', 'comparison']).default('single'),
  verbatim_text: z.string().optional(),
  rough_draft_text: z.string().optional(),
  final_draft_text: z.string().optional(),
});
```

### Step 5: Update Backend Functions

#### ingest.ts (AFTER migration)
```typescript
const { student_id, assignment_id, ... } = validation.data;

// Verify student exists (UUID only, no name)
const studentResult = await sql`
  SELECT student_id FROM grader.students 
  WHERE tenant_id = ${tenant_id}
  AND student_id = ${student_id}
  LIMIT 1
`;

if (studentResult.length === 0) {
  // Create student record (UUID only, no PII)
  await sql`
    INSERT INTO grader.students (student_id, tenant_id, created_at)
    VALUES (${student_id}, ${tenant_id}, NOW())
  `;
}
```

#### list.ts (AFTER migration)
```typescript
// Return submissions WITHOUT student names
const submissions = await sql`
  SELECT 
    s.submission_id,
    s.student_id,              -- ✅ Only UUID
    s.assignment_id,
    s.ai_grade,
    s.teacher_grade,
    s.created_at
    -- REMOVED: st.student_name
    -- REMOVED: st.district_student_id
  FROM grader.submissions s
  WHERE s.tenant_id = ${tenant_id}
  ORDER BY s.created_at DESC
`;

// Frontend will resolve names from bridge
```

### Step 6: Update Frontend to Use Bridge

#### Submission Form (AFTER migration)
```typescript
// src/pages/Submission.tsx
import { useBridge } from '@/hooks/useBridge';

export default function Submission() {
  const { findByLocalId, findByName } = useBridge();
  const [studentSearch, setStudentSearch] = useState('');
  
  // Resolve UUID from bridge before API call
  const handleSubmit = async () => {
    // User enters "John Smith" or "S12345"
    const student = findByLocalId(studentSearch) || findByName(studentSearch);
    
    if (!student) {
      alert('Student not found in roster. Please add them first.');
      return;
    }
    
    // Send only UUID to API
    await ingestMutation.mutateAsync({
      student_id: student.uuid,  // ✅ Only UUID sent to cloud
      // NO student_name sent
      ...
    });
  };
}
```

#### Dashboard List (AFTER migration)
```typescript
// src/pages/Dashboard.tsx
import { useBridge } from '@/hooks/useBridge';

export default function Dashboard() {
  const { findByUuid } = useBridge();
  const { data } = useQuery(['submissions'], listSubmissions);
  
  return (
    <table>
      {data?.submissions.map(submission => {
        // Resolve name from bridge using UUID
        const student = findByUuid(submission.student_id);
        
        return (
          <tr key={submission.id}>
            <td>
              {student ? student.name : 'Unknown'}  {/* From bridge */}
              <br/>
              <small>{student?.localId}</small>     {/* From bridge */}
            </td>
            <td>{submission.ai_grade}</td>
          </tr>
        );
      })}
    </table>
  );
}
```

## Rollback Plan

If migration fails, restore from backup:
```sql
-- Restore students table from backup
DROP TABLE grader.students;

CREATE TABLE grader.students AS 
SELECT * FROM grader.students_backup;

-- Restore primary key and constraints
ALTER TABLE grader.students 
  ADD PRIMARY KEY (student_id);

ALTER TABLE grader.students 
  ALTER COLUMN student_name SET NOT NULL;

ALTER TABLE grader.students 
  ALTER COLUMN tenant_id SET NOT NULL;
```

## Testing Checklist

- [ ] Backup created and verified
- [ ] Bridge files created for all tenants
- [ ] Teachers can unlock bridge and see roster
- [ ] PII columns removed from database
- [ ] Frontend resolves names from bridge
- [ ] Submission form works with UUID lookup
- [ ] Dashboard displays names from bridge
- [ ] List/search works with bridge
- [ ] No PII in API requests (check DevTools Network tab)
- [ ] No PII in database (verify with SQL query)

## FERPA Compliance Verification

After migration, verify:
```sql
-- This should return NO rows with PII
SELECT * FROM grader.students LIMIT 10;
-- Expected: Only student_id (UUID), tenant_id, created_at

-- Check submissions table doesn't have PII either
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'grader' 
  AND table_name = 'submissions'
  AND column_name LIKE '%name%';
-- Expected: No results
```

## Timeline

1. **Phase 1 (Preparation)**: Create backups, export data for bridge files
2. **Phase 2 (Migration)**: Remove PII columns from database
3. **Phase 3 (Code Updates)**: Update all functions and frontend
4. **Phase 4 (Testing)**: Verify FERPA compliance
5. **Phase 5 (Cleanup)**: Drop backup tables after verification

**Estimated Time:** 2-4 hours for full migration and testing

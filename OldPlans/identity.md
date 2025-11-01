# AI-EssayGrader: Local Identity Bridge — Technical Implementation Plan

**Project**: AI-EssayGrader  
**Purpose**: Privacy-first student identity management using local-only encrypted bridge  
**Architecture**: React+Vite + TypeScript + Netlify Functions + Neon Postgres  
**Date**: October 26, 2025

---

## Context: AI-EssayGrader Integration

This plan adapts the local bridge file pattern specifically for **AI-EssayGrader**, which currently:
- Uses `grader.students` table with `student_id` (UUID) and `student_name` (text)
- Has `district_student_id` field (optional local ID)
- Accepts student names via `IngestRequestSchema` in frontend
- Stores submissions linked to student UUIDs

**Goal**: Remove PII (student names, local IDs) from cloud while maintaining full functionality.

---

# Local Bridge File — Technical Plan

## 0) Scope & Non-Goals

### Scope
* Generate, store, and use a *local-only* encrypted "bridge file" that maps **(Student Name, Local Student ID) → UUID**
* Frontend resolves student UUID locally before calling cloud APIs
* Cloud (Netlify Functions + Neon) only ever sees and stores **UUIDs**
* Maintain existing AI-EssayGrader functionality (grading, submissions, assignments)
* Support CSV import for bulk student roster setup
* Encrypted backup/restore for teacher data portability

### Non-Goals
* Roster sync with SIS (Student Information System)
* Multi-device sync (each device has its own bridge file)
* Cloud storage of bridge file
* Real-time collaboration between teachers
* Student-facing login/authentication

---

## 1) High-Level Architecture

```
[Teacher Browser (React+Vite)]     [Netlify Functions]           [Neon (Postgres)]
┌──────────────────────────────┐   ┌──────────────────────────┐  ┌───────────────┐
│ Bridge Manager (UI)          │   │ writeScore(readonly UUID)│  │ tables keyed  │
│  - Create/Import bridge      │   │ getStudentWork(UUID)     │  │ by UUID only  │
│  - Add students (PII→UUID)   │   │ ...                      │  │               │
│  - Export/Backup (Encrypted) │   └──────────────────────────┘  └───────────────┘
│                              │           ↑   ↑   ↑
│ Bridge SDK (Local Only)      │           │   │   │
│  - crypto: AES-GCM + PBKDF2  │           │   │   └── Never send PII
│  - storage: FS Access API or │           │
│    IndexedDB (encrypted)     │           └── Client resolves UUID locally
└──────────────────────────────┘
```

**Key guarantees**

* Cloud endpoints accept **UUIDs only**; reject payloads containing `studentName`/`localId`.
* The **bridge file stays on disk** (teacher’s machine). Encrypted at rest with a **passphrase**.
* App keeps PII in memory only while unlocked; **never logs or sends PII**.

---

## 2) Data Model

### 2.1 Bridge file (encrypted JSON, extension: `.bridge.json.enc`)

After decrypt, JSON shape:

```json
{
  "version": "1.0",
  "createdAt": "2025-10-26T00:00:00Z",
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "saltB64": "<...>", "iterations": 210000 },
  "cipher": { "name": "AES-GCM" },
  "payload": {
    "district": "Mansfield ISD",
    "school": "Asa Low Intermediate",
    "roster": [
      {
        "uuid": "8e7ec89d-1a7a-4b5c-a20f-8a1a5d2ea2a6",
        "localId": "S123456",
        "name": "Sharon Lee",
        "createdAt": "2025-10-26T00:00:00Z",
        "updatedAt": "2025-10-26T00:00:00Z"
      }
    ]
  },
  "integrity": { "hmac": "B64(...)", "algo": "HMAC-SHA256" }
}
```

* **Encryption:** AES-GCM with a key derived from passphrase via PBKDF2.
* **Integrity:** HMAC over plaintext payload (defense-in-depth vs. tampering).

### 2.2 Cloud data (Neon) - AI-EssayGrader Schema

**Existing schema** (`grader` schema) will be modified to remove PII:

```sql
-- MODIFIED: Remove student_name and district_student_id
create table grader.students (
  student_id uuid constraint students_pkey primary key default gen_random_uuid(),
  -- REMOVED: student_name text not null,
  -- REMOVED: district_student_id text,
  created_at timestamptz not null default now()
);

-- Existing tables remain UUID-keyed (already compliant)
create table grader.assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table grader.submissions (
  submission_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references grader.students(student_id),
  assignment_id uuid references grader.assignments(assignment_id),
  source_type text not null,
  verbatim_text text not null,
  teacher_criteria text not null,
  ai_grade numeric(5,2),
  ai_feedback jsonb,
  teacher_grade numeric(5,2),
  teacher_feedback text,
  created_at timestamptz not null default now()
);
```

---

## 3) Frontend Implementation (React + Vite, TypeScript)

### 3.1 File/Folder layout

```
/src
  /bridge
    crypto.ts        // PBKDF2, AES-GCM, HMAC
    storage.ts       // File System Access API + fallbacks
    bridgeTypes.ts   // TS types
    bridgeStore.ts   // Load/unlock, CRUD, search, import/export
    piiGuard.ts      // Dev-safety: blocks outbound PII
  /hooks
    useBridge.ts     // React hook to access bridge API
  /components
    BridgeManager.tsx    // UI for create/import/export, roster grid
    AddStudentModal.tsx
    ImportCsvModal.tsx
  /utils
    uuid.ts          // crypto.randomUUID() wrapper
  /net
    apiClient.ts     // fetch wrapper (UUID-only checks)
```

### 3.2 Core modules

#### `crypto.ts`

* `deriveKey(passphrase: string, salt: Uint8Array, iterations=210000): CryptoKey`
* `encryptJson(obj: any, passphrase: string): Promise<{ciphertext: Uint8Array, iv: Uint8Array, meta...}>`
* `decryptJson(...)`
* `hmac(payloadString, keyMaterial): Promise<string>`

Use WebCrypto (built-in): `window.crypto.subtle`.

#### `storage.ts`

* **Primary**: File System Access API

  * `chooseBridgeFile(): Promise<FileSystemFileHandle | null>`
  * `saveEncryptedBridge(handle, data: Uint8Array): Promise<void>`
  * `openEncryptedBridge(handle): Promise<Uint8Array>`
* **Fallback** (Safari/locked envs):

  * Encrypted bytes kept in **IndexedDB** (`idb-keyval` or small custom wrapper).
  * Manual **Export** (download Blob) / **Import** (file input) UX.

#### `bridgeStore.ts`

* In-memory unlocked state (never persisted unencrypted).
* `createNewBridge(meta): Promise<void>`
* `unlockBridge(passphrase): Promise<void>`
* `lockBridge(): void` (zeroize memory)
* `addStudent({name, localId}): {uuid}`

  * generates `uuid = crypto.randomUUID()`
  * ensures **no duplicates** by `localId` (and optionally `(name, localId)`).
* `bulkImportCsv(file: File): ImportReport`

  * CSV columns: `name,localId`
  * Validates; creates UUIDs; dedupes.
* `findByLocalId(localId): {uuid, name} | null`
* `findByName(name): [{uuid, localId}]`
* `exportEncrypted(handle | download): Promise<void>`
* `rotatePassphrase(oldPass, newPass): Promise<void>`

#### `piiGuard.ts` (dev safeguard, optional but recommended)

* Wrap `fetch` / `apiClient` to **reject** requests whose body contains obvious PII keys (`name`, `localId`) or matches `/[A-Z][a-z]+ [A-Z][a-z]+/`.
* Ship disabled in production by default; leave a feature flag to enable in districts that want it.

#### `apiClient.ts`

* Only accepts payloads typed as **UUID-safe**:

```ts
type UUID = string & { __brand: 'uuid' };
type CloudPayload = { uuid: UUID; [k: string]: unknown };

export async function postScore(p: CloudPayload) { /* fetch(...) */ }
```

* Narrowing helper ensures only values that pass `isUuid()` can be assigned.

### 3.3 React Hook & UI

#### `useBridge.ts`

* Exposes `{ locked, create, unlock, lock, add, importCsv, findByLocalId, findByName, export }`
* Emits events so UI updates roster tables.

#### `BridgeManager.tsx`

* **States:** `locked` (passphrase dialog), `unlocked` (toolbar + grid).
* **Toolbar actions:** Create New | Import Encrypted | Export Encrypted | Rotate Passphrase | Lock
* **Roster grid:** columns `[Local ID, Name, UUID, Updated]` with add/search.
* **Import CSV Modal:** drag-and-drop CSV; preview diffs; dedupe prompts.

#### `AddStudentModal.tsx`

* Form: `localId`, `name`
* On submit → `addStudent()`; show UUID; copy-to-clipboard.

---

## 4) Netlify / Neon Integration

### 4.1 Cloud contract (UUID-only) - AI-EssayGrader Functions

**All Netlify Function handlers must validate payloads:**
* Reject request if any PII keys appear: `student_name`, `name`, `localId`, `studentName`, `fullName`, `district_student_id`
* Validate `student_id` is valid UUID format
* Update `IngestRequestSchema` to remove `student_name` field

**Modified Functions:**

#### `netlify/functions/ingest.ts` (BEFORE)
```ts
// CURRENT - Accepts student_name
const { student_name, student_id, assignment_id, ... } = validation.data;

let studentResult = await sql`
  SELECT id FROM grader.students 
  WHERE student_name = ${student_name} 
  AND (student_id = ${student_id || null} OR student_id IS NULL)
`;
```

#### `netlify/functions/ingest.ts` (AFTER)
```ts
import type { Handler } from '@netlify/functions';
import { sql } from './db';
import { IngestRequestSchema } from '../../src/lib/schema';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body = JSON.parse(event.body || '{}');
  
  // PII Guard - Reject if PII keys present
  const PII_KEYS = ['student_name', 'name', 'localId', 'studentName', 'fullName', 'district_student_id'];
  const foundPII = PII_KEYS.filter(k => k in body);
  if (foundPII.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'PII not allowed in cloud requests',
        forbidden_keys: foundPII 
      })
    };
  }
  
  // Validate request - now expects student_id (UUID) only
  const validation = IngestRequestSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request', details: validation.error.format() })
    };
  }

  const { student_id, assignment_id, teacher_criteria, verbatim_text, source_type } = validation.data;

  // Verify student exists (UUID only)
  const studentResult = await sql`
    SELECT student_id FROM grader.students 
    WHERE student_id = ${student_id}
  `;

  if (studentResult.length === 0) {
    // Create student record (UUID only, no PII)
    await sql`
      INSERT INTO grader.students (student_id, created_at)
      VALUES (${student_id}, NOW())
    `;
  }

  // Rest of submission logic...
};

export { handler };
```

### 4.2 Migration Script for AI-EssayGrader

**File**: `schema_migration_remove_pii.sql`

```sql
-- Migration: Remove PII from grader.students table
-- Run this AFTER backing up existing data

-- Step 1: Create backup table with PII (for local bridge generation)
CREATE TABLE grader.students_backup AS 
SELECT student_id, student_name, district_student_id, created_at 
FROM grader.students;

-- Step 2: Drop PII columns from students table
ALTER TABLE grader.students DROP COLUMN IF EXISTS student_name;
ALTER TABLE grader.students DROP COLUMN IF EXISTS district_student_id;

-- Step 3: Remove unique constraint that included student_name
ALTER TABLE grader.students DROP CONSTRAINT IF EXISTS students_district_student_id_student_name_key;

-- Step 4: Verify schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'grader' AND table_name = 'students'
ORDER BY ordinal_position;

-- Expected result: Only student_id (uuid) and created_at (timestamptz)

-- Note: Keep students_backup table temporarily for generating initial bridge file
-- After bridge file is created and verified, drop backup:
-- DROP TABLE grader.students_backup;
```

### 4.3 `netlify.toml`

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@neondatabase/serverless"]

[[headers]]
  for = "/*"
  [headers.values]
  Content-Security-Policy = "default-src 'self'; connect-src 'self' https://*.netlify.app;"

# Optional: block accidental PII endpoints
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## 5) Security & Privacy Controls

* **Encryption at rest (local):** AES-GCM (256-bit) with PBKDF2-SHA256 (≥210k iterations) salt per file.
* **Passphrase:** never stored; require unlock per session. Optionally cache in memory for N minutes with explicit “Remember until tab closes”.
* **Zeroization:** Overwrite decrypted payload and passphrase buffers on lock/navigation.
* **Logs:** Never log PII. Add a lint rule: `no-console-pii` (simple ESLint custom rule checking prohibited keys).
* **Network guard:** `apiClient` refuses payloads if keys like `name`/`localId` exist.
* **Headers/filenames hygiene:** When teachers upload essays to cloud, auto-rename files to `{uuid}-{assignmentId}.pdf` and strip EXIF/metadata on client (for supported formats).

---

## 6) Browser Support & Fallbacks

* **Preferred:** Chromium/Edge with File System Access API → seamless “Choose folder once, save automatically”.
* **Fallback (Safari/older):** Encrypted bridge bytes in **IndexedDB** + manual **Export/Import**.
* **Offline:** App shell cached; bridge works offline (all local). Cloud ops queue until online (UUID-only).

---

## 7) Developer “Done” Checklist

* [ ] No cloud code path accepts or logs PII.
* [ ] Bridge encrypt/decrypt unit tests pass.
* [ ] CSV import: dedupe by `localId`, validation errors surfaced.
* [ ] E2E: Add student → get UUID → submit score to cloud (UUID-only).
* [ ] Manual: Open DevTools → Network tab shows **no** PII anywhere.
* [ ] Threat model notes committed (see below).

---

## 8) Threat Model (abbrev)

* **Risk:** Teacher exports unencrypted CSV of roster.

  * **Mitigation:** Only export **encrypted**; warn/block plaintext export.
* **Risk:** Screenshots/support logs leak names.

  * **Mitigation:** Redact UI by default in support mode; never attach decrypted payload to error reporting.
* **Risk:** Malicious extension scrapes DOM.

  * **Mitigation:** “Privacy Mode” that masks names in UI, showing only localIds; teacher can toggle to view actual names.

---

## 9) Minimal Code Stubs

**`src/bridge/uuid.ts`**

```ts
export const newUuid = () => (crypto.randomUUID?.() ?? pseudoV4());
function pseudoV4() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
```

**`src/bridge/bridgeTypes.ts`**

```ts
// AI-EssayGrader Bridge Types

export type BridgeEntry = {
  uuid: string;           // student_id from grader.students
  localId: string;        // district_student_id (teacher's local ID)
  name: string;           // student_name (never sent to cloud)
  createdAt: string;      // ISO timestamp
  updatedAt: string;      // ISO timestamp
};

export type BridgePayload = {
  district?: string;      // e.g., "Mansfield ISD"
  school?: string;        // e.g., "Asa Low Intermediate"
  teacherName?: string;   // Optional: teacher who created bridge
  roster: BridgeEntry[];  // Array of student mappings
};

export type BridgeMetadata = {
  version: string;        // Bridge file format version
  createdAt: string;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    saltB64: string;
    iterations: number;   // 210000 recommended
  };
  cipher: {
    name: 'AES-GCM';
  };
};

export type EncryptedBridge = BridgeMetadata & {
  payload: BridgePayload;
  integrity: {
    hmac: string;
    algo: 'HMAC-SHA256';
  };
};
```

**`src/bridge/crypto.ts`** (sketch)

```ts
export async function deriveKey(pass: string, salt: Uint8Array, iterations = 210000) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey','deriveBits']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt','decrypt']
  );
}

export async function encryptJson(obj: unknown, pass: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(pass, salt);
  const data = enc.encode(JSON.stringify(obj));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  return { ciphertext, iv, salt };
}
```

**`src/lib/api/client.ts`** (AI-EssayGrader API guard)

```ts
// PII Guard for AI-EssayGrader API calls

const PII_KEYS = new Set([
  'name',
  'localId', 
  'studentName',
  'student_name',  // AI-EssayGrader specific
  'fullName',
  'district_student_id'  // AI-EssayGrader specific
]);

export const isUuid = (s: string): boolean => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export class PIIViolationError extends Error {
  constructor(public forbiddenKeys: string[]) {
    super(`PII keys not allowed in cloud requests: ${forbiddenKeys.join(', ')}`);
    this.name = 'PIIViolationError';
  }
}

// Deep scan for PII in nested objects
function scanForPII(obj: any, path: string = ''): string[] {
  const violations: string[] = [];
  
  if (obj === null || obj === undefined) return violations;
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      // Check if key itself is PII
      if (PII_KEYS.has(key)) {
        violations.push(fullPath);
      }
      
      // Recursively check nested objects
      if (typeof value === 'object') {
        violations.push(...scanForPII(value, fullPath));
      }
    }
  }
  
  return violations;
}

export async function apiPost<T = any>(
  url: string, 
  body: Record<string, unknown>
): Promise<T> {
  // PII Guard - scan entire payload
  const piiViolations = scanForPII(body);
  if (piiViolations.length > 0) {
    throw new PIIViolationError(piiViolations);
  }
  
  // Validate student_id is UUID if present
  if ('student_id' in body && !isUuid(body.student_id as string)) {
    throw new Error('student_id must be a valid UUID');
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
```

**`src/components/BridgeManager.tsx`** (outline)

```tsx
export default function BridgeManager() {
  // locked/unlocked state, handlers for create/import/export/add
  // render passphrase modal when locked
  // render toolbar + roster grid when unlocked
  return <div className="p-6 space-y-4">{/* ... */}</div>;
}
```

---

## 10) Developer Tasks (Windsurf-ready)

1. **Scaffold**

   * `pnpm create vite myapp --template react-ts`
   * Add `src/bridge/*`, `src/hooks/useBridge.ts`, `src/components/BridgeManager.tsx`.
   * Add `eslint` rule to block PII keys in `/src/net/*`.

2. **Crypto & Storage**

   * Implement `crypto.ts` (PBKDF2/AES-GCM/HMAC).
   * Implement `storage.ts` with FS Access API + IndexedDB fallback.

3. **Bridge Store & Hook**

   * Implement `bridgeStore.ts` CRUD, import/export, passphrase lock.
   * Implement `useBridge.ts` to expose stateful operations.

4. **UI**

   * Build `BridgeManager` UI (Create/Import/Export/Rotate/Lock + Grid).
   * Add `AddStudentModal`, `ImportCsvModal` with validation & dedupe.

5. **Network Guards**

   * Implement `apiClient.ts` and replace all fetches.
   * In Netlify Functions, assert UUID-only; reject PII keys.

6. **Neon**

   * Create `student_scores` and `assignments` tables (UUID-keyed).
   * Provide one demo function `writeScore` that only takes `{uuid, assignmentId, score}`.

7. **Testing**

   * Unit tests for `encryptJson/decryptJson`, CSV import, duplicate detection.
   * E2E manual: DevTools Network → verify no PII in requests.

8. **Docs**

   * Add `README_BRIDGE.md` with teacher instructions (passphrase, backup/restore, **never upload** bridge file).

---

## 11) Teacher UX Flow

1. Open app → **Bridge locked** → enter passphrase or **Create New Bridge**.
2. Add students (name, localId) or **Import CSV**.
3. When grading/creating work:

   * App resolves UUID locally via `findByLocalId()` or `findByName()`.
   * Calls cloud with **UUID only**.
4. When finished → **Export Encrypted** to local folder for backup.

---

## 12) Acceptance Criteria

* ✅ Without unlocking, app cannot resolve any UUIDs.
* ✅ No network request ever includes `name` or `localId`.
* ✅ Bridge can be exported/imported, remains encrypted at rest.
* ✅ Cloud writes/readbacks succeed using UUID keys only.
* ✅ A new machine with only the encrypted file + passphrase can fully restore mappings.

---

If you want, I can turn this into a **repo skeleton** (with actual TS files and minimal UI) or produce a single **`README_BRIDGE.md`** for immediate drop-in to Windsurf.

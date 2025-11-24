# Class Period Organization Implementation Plan

**Branch:** `feature/class-period-organization`
**Start Date:** November 24, 2025
**Goal:** Allow teachers to organize students into class periods/groups for easier management.

## 📋 Task List

### 1. Database Schema Updates
- [x] **Migration:** Create `migrations/add_class_period_to_students.sql`
  - Add `class_period` column (TEXT, nullable) to `grader.students` table
  - Add index on `class_period` for filtering performance
- [x] **User Action:** Run the SQL script manually in Neon Console
  - **When:** After step 1 is complete (file created)
  - **Instructions:** I will provide the SQL content or point to the file. You will run it and paste a screenshot of the success message.
- [x] **Documentation:** Update `db_ref.md` with new schema (After user confirms execution)

### 2. Backend API Updates
- [x] **New Endpoint:** Create `netlify/functions/update-student.ts`
  - Allow updating non-PII fields (`class_period`)
  - Validate input
  - Update database record
- [x] **List Submissions:** Update `netlify/functions/list.ts`
  - Accept `class_period` query parameter ✅
  - Added to schema validation ✅
  - Added to all 7 query branches ✅
  - Returns `class_period` in response ✅
- [x] **Client Library:** Update `src/lib/api.ts`
  - Add `updateStudent(studentId, data)` function

### 3. Bridge Data Structure (Frontend)
- [x] **Type Definition:** Update `BridgeEntry` in `src/bridge/bridgeTypes.ts` (Done)
- [x] **Class List:** Add `classPeriods` array to `BridgePayload` type
  - To store the list of available periods (e.g., ["Period 1", "Period 2"])
- [x] **Store Logic:** Update `BridgeStore`
  - Add `addClassPeriod(name)`
  - Add `removeClassPeriod(name)`
  - Add `getClassPeriods()`
- [x] **Hook Updates:** Update `useBridge` hook
  - Expose class period management methods
  - Update `addStudent` and `updateStudent` signatures

### 4. UI Components Updates

#### Class Period Management
- [x] **Bridge Manager:** Add "Manage Classes" section
  - List existing classes ✅
  - Add new class input ✅
  - Delete class button ✅
  - Auto-save on add/remove ✅

#### Student Forms
- [x] **Add Student Modal:** Add class period dropdown
  - Dropdown populated from `classPeriods` array
  - Optional field
- [x] **Edit Student Modal:** Add class period dropdown
  - Same as add modal
  - Pre-populate with current value

#### Roster Display
- [x] **Bridge Manager Table:** Add "Class" column
  - Display class period for each student
  - Show "—" if no class assigned

#### Dashboard
- [x] **Filter Interface:** Add Class Period filter dropdown to Dashboard header
  - Shows only when Bridge is unlocked and has class periods ✅
  - Dropdown next to search bar ✅
- [x] **Filter Logic:**
  - Update `useQuery` key to include class period ✅
  - Pass `class_period` to `listSubmissions` API ✅
  - Resets page when filter changes ✅
- [ ] **View Options:** Add "Group by Class" view mode (OPTIONAL - Future enhancement)

### 5. Data Syncing Logic
- [ ] **Sync on Update:** When student class period is updated in Bridge:
  - Update local IndexedDB (Bridge)
  - Call `api.updateStudent(uuid, { class_period })` to sync with backend
  - Handle offline/error states (optimistic UI or retry)

### 6. Data Import/Export
- [ ] **CSV Export:** Include `classPeriod` column in `exportToCSV`
- [ ] **CSV Import:** Update `importFromCsv` to parse "Class" or "Period" column

## 🧪 Testing Plan
1. **Database:** Verify column creation and indexing
2. **API:** Verify `update-student` updates the DB
3. **UI:**
   - Create class periods ("Period 1", "Period 2")
   - Assign student to "Period 1"
   - Verify DB updates via API
   - Verify Dashboard filter "Period 1" shows only relevant submissions
4. **Privacy Check:** Ensure NO student names are sent to the backend, only `class_period` (generic) and `student_id`.

## 📝 Implementation Order
1. Database Migration & API (Backend foundation)
2. Bridge Store & Types (Data layer)
3. Class Management UI (Configuration)
4. Student Add/Edit UI (Assignment)
5. Dashboard Filtering (Usage)

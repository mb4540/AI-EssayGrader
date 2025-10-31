# Dashboard Refactor Plan

**Created:** October 31, 2025 - 8:15 AM  
**Branch:** `feature/ui-polish-and-enhancements`  
**Goal:** Refactor Dashboard.tsx to support "By Student" grouped view and clean up old Dashboard files

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Safety First - Backup](#2-safety-first---backup)
3. [File Cleanup - Archive Old Dashboards](#3-file-cleanup---archive-old-dashboards)
4. [Current State Analysis](#4-current-state-analysis)
5. [Refactor Strategy](#5-refactor-strategy)
6. [Implementation Plan](#6-implementation-plan)
7. [Testing Checklist](#7-testing-checklist)
8. [Rollback Plan](#8-rollback-plan)

---

## 1) Prerequisites

### Completed UI Enhancements:
- ✅ **Detached header card** - Separate Card component (matches Submit page style)
- ✅ **Header styling** - Gradient background (from-slate-50 to-blue-50)
- ✅ **Emoji + Title layout** - 📚 Dashboard with circular badge
- ✅ **Buttons in header** - Export CSV | By Student | By Assignment
- ✅ **Removed top toolbar** - Deleted 3-button row (Export CSV, New Assignment, New Submission)
- ✅ **Search bar separated** - Standalone between header and content
- ✅ **Content card separated** - Clean Card for submissions table
- ✅ **Visual separator** - Vertical line between Export CSV and view buttons
- ✅ **Consistent spacing** - mb-6 between sections
- ✅ "By Assignment" grouped view working

### What's NOT Done Yet:
- ❌ "List View" → "By Student" conversion incomplete
- ❌ Button renamed to "By Student" with User icon, but view still shows flat table
- ❌ Need to replace flat table with grouped accordion (like By Assignment)

### Current Issues:
- Dashboard.tsx was restored to clean state (git checkout)
- Previous refactor attempt got corrupted during edit
- Need clean, systematic refactor approach
- Must preserve all completed UI enhancements

---

## 2) Safety First - Backup

### 2.1 Create Backup

```bash
# Set timestamp
REFACTOR_TS="$(date +%Y%m%d-%H%M%S)"
ARCHIVE=".archive/${REFACTOR_TS}"

# Create archive structure
mkdir -p "${ARCHIVE}/refactor_backups/src/pages"

# Backup current Dashboard.tsx
cp -a "src/pages/Dashboard.tsx" "${ARCHIVE}/refactor_backups/src/pages/Dashboard.tsx"

# Backup old Dashboard files before archiving
cp -a "src/pages/DashboardOld.tsx" "${ARCHIVE}/refactor_backups/src/pages/DashboardOld.tsx" 2>/dev/null || true
cp -a "src/pages/Dashboard_HealthCheck.tsx" "${ARCHIVE}/refactor_backups/src/pages/Dashboard_HealthCheck.tsx" 2>/dev/null || true

echo "✅ Backups created in ${ARCHIVE}/refactor_backups"
```

### 2.2 Git Checkpoint

```bash
# Ensure clean state
git status

# If uncommitted changes, commit them
git add -A
git commit -m "checkpoint: before Dashboard refactor [${REFACTOR_TS}]"

# Tag for easy rollback
git tag -a "pre-dashboard-refactor-${REFACTOR_TS}" -m "Checkpoint before Dashboard refactor"

echo "✅ Git checkpoint created"
```

---

## 3) File Cleanup - Archive Old Dashboards

### 3.1 Identify Old Dashboard Files

**Files to Archive:**
- `src/pages/DashboardOld.tsx` - Old version, no longer used
- `src/pages/Dashboard_HealthCheck.tsx` - Temporary health check version

**Verification:**
```bash
# Check if files are imported anywhere
grep -r "DashboardOld" src/ --include="*.tsx" --include="*.ts"
grep -r "Dashboard_HealthCheck" src/ --include="*.tsx" --include="*.ts"
grep -r "DashboardOld" src/App.tsx
```

**Expected:** No imports found (safe to archive)

### 3.2 Move to Archive

```bash
# Create archive location
mkdir -p "src/archive/pages"

# Move old files (soft delete)
git mv "src/pages/DashboardOld.tsx" "src/archive/pages/DashboardOld.tsx"
git mv "src/pages/Dashboard_HealthCheck.tsx" "src/archive/pages/Dashboard_HealthCheck.tsx"

# Commit archive
git add -A
git commit -m "chore: archive old Dashboard variants [${REFACTOR_TS}]"

echo "✅ Old Dashboard files archived to src/archive/pages/"
```

### 3.3 Update .gitignore (if needed)

```bash
# Add archive folder to .gitignore if not already there
if ! grep -q "src/archive" .gitignore; then
  echo "" >> .gitignore
  echo "# Archived components" >> .gitignore
  echo "src/archive/" >> .gitignore
  git add .gitignore
  git commit -m "chore: add src/archive to .gitignore"
fi
```

---

## 4) Current State Analysis

### 4.1 Dashboard.tsx Structure

**Current File Size:** ~600 lines

**Main Sections:**
1. **Imports** (lines 1-12)
2. **Type Definitions** (lines 14-15)
3. **Component Function** (lines 17-598)
   - State management (lines 22-31)
   - Data fetching (lines 37-44)
   - Mutations (lines 47-58)
   - Event handlers (lines 60-120)
   - Sorting logic (lines 122-150)
   - Grouping logic (lines 152-160)
   - JSX Return (lines 162-598)

**Current JSX Structure (Completed UI Enhancements):**
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
  <div className="container mx-auto px-4 py-6">
    
    {/* 1. Dashboard Header Card - DETACHED */}
    <Card className="shadow-xl border-t-4 border-t-indigo-500 bg-white mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Emoji + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100">
              <span className="text-2xl">📚</span>
            </div>
            <CardTitle className="text-2xl text-gray-900">Dashboard</CardTitle>
          </div>
          
          {/* Right: Export CSV | By Student | By Assignment */}
          <div className="flex gap-2">
            <Button onClick={handleExport}>Export CSV</Button>
            <div className="w-px h-8 bg-gray-300 mx-2" /> {/* Separator */}
            <Button onClick={() => setViewMode('list')}>By Student</Button>
            <Button onClick={() => setViewMode('grouped')}>By Assignment</Button>
          </div>
        </div>
      </CardHeader>
    </Card>

    {/* 2. Search Bar - STANDALONE */}
    <div className="mb-6">
      <Input placeholder="Search by student name or ID..." />
    </div>

    {/* 3. Submissions Content Card - SEPARATE */}
    <Card className="shadow-xl bg-white">
      <CardContent className="p-0">
        {/* View mode content here */}
      </CardContent>
    </Card>
    
  </div>
</div>
```

**Current View Modes:**
- `viewMode === 'list'` → Flat table (needs to become "By Student" accordion)
- `viewMode === 'grouped'` → "By Assignment" accordion (working)

**Key Style Patterns (Match Submit Page):**
- Detached header card with `mb-6` spacing
- Gradient header: `bg-gradient-to-r from-slate-50 to-blue-50`
- Border top: `border-t-4 border-t-indigo-500`
- Circular emoji badge: `w-10 h-10 rounded-full bg-indigo-100`
- Visual separator: `w-px h-8 bg-gray-300 mx-2`
- Standalone search between header and content
- Separate content card with `p-0` (no padding on CardContent)

### 4.2 Required Changes

**Button Updates:**
- ✅ Icon: `List` → `User` (done)
- ✅ Text: "List View" → "By Student" (done)
- ❌ View: Flat table → Grouped accordion (NOT done)

**New Grouping Logic Needed:**
```typescript
// Group submissions by student
const groupedByStudent = sortedSubmissions.reduce((acc, submission) => {
  const student = submission.student_id ? bridge.findByUuid(submission.student_id) : null;
  const studentKey = student?.name || 'Unknown';
  if (!acc[studentKey]) {
    acc[studentKey] = {
      studentId: student?.localId || '',
      submissions: []
    };
  }
  acc[studentKey].submissions.push(submission);
  return acc;
}, {} as Record<string, { studentId: string; submissions: typeof sortedSubmissions }>);
```

**New JSX Structure:**
```typescript
viewMode === 'list' ? (
  // By Student - Accordion grouped by student name
  <Accordion type="multiple">
    {Object.entries(groupedByStudent).map(([studentName, data]) => (
      <AccordionItem key={studentName}>
        <AccordionTrigger>
          <User icon /> {studentName} • {data.submissions.length} submissions
        </AccordionTrigger>
        <AccordionContent>
          <table>
            {/* Assignment, AI Grade, Teacher Grade, Date, Actions */}
          </table>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
) : (
  // By Assignment - Accordion grouped by assignment title
  <Accordion type="multiple">
    {/* Existing working code */}
  </Accordion>
)
```

---

## 5) Refactor Strategy

### 5.1 Component Extraction (Optional - Future)

**Potential Components to Extract:**
- `SubmissionTable` - Reusable table for both views
- `SubmissionRow` - Individual submission row
- `StudentAccordionItem` - Student group accordion
- `AssignmentAccordionItem` - Assignment group accordion

**Decision:** Keep in single file for now, extract later if needed

### 5.2 Code Organization

**Follow frontend-components.md rules:**
1. ✅ Type Safety - All props typed
2. ✅ Component Composition - Small, reusable pieces
3. ✅ Accessibility - Semantic HTML, ARIA labels
4. ✅ Performance - useMemo for expensive operations
5. ✅ Consistency - shadcn/ui + Tailwind

### 5.3 Refactor Approach

**Method:** Surgical Edit (not full rewrite)

**Steps:**
1. Restore clean Dashboard.tsx from git
2. Add groupedByStudent logic (after groupedSubmissions)
3. Replace flat table JSX with By Student accordion
4. Keep By Assignment accordion unchanged
5. Test incrementally

---

## 6) Implementation Plan

### 6.1 Restore Clean State

```bash
# Restore Dashboard.tsx to last known good state
git checkout HEAD -- src/pages/Dashboard.tsx

# Verify it compiles
npm run build

echo "✅ Dashboard.tsx restored to clean state"
```

### 6.2 Add Imports

**File:** `src/pages/Dashboard.tsx`

**Change:**
```typescript
// OLD
import { Download, Search, ChevronUp, ChevronDown, Trash2, List, FolderOpen } from 'lucide-react';

// NEW
import { Download, Search, ChevronUp, ChevronDown, Trash2, User, FolderOpen } from 'lucide-react';
```

**Reason:** Replace `List` icon with `User` icon for "By Student" view

### 6.3 Add Grouping Logic

**File:** `src/pages/Dashboard.tsx`  
**Location:** After `groupedSubmissions` definition (~line 160)

**Add:**
```typescript
// Group submissions by student
const groupedByStudent = sortedSubmissions.reduce((acc, submission) => {
  const student = submission.student_id ? bridge.findByUuid(submission.student_id) : null;
  const studentKey = student?.name || 'Unknown';
  if (!acc[studentKey]) {
    acc[studentKey] = {
      studentId: student?.localId || '',
      submissions: []
    };
  }
  acc[studentKey].submissions.push(submission);
  return acc;
}, {} as Record<string, { studentId: string; submissions: typeof sortedSubmissions }>);
```

### 6.4 Update Button Text and Icon

**File:** `src/pages/Dashboard.tsx`  
**Location:** View mode buttons (~line 211)

**Change:**
```typescript
// OLD
<Button
  variant={viewMode === 'list' ? 'default' : 'outline'}
  size="sm"
  onClick={() => setViewMode('list')}
  className={viewMode === 'list' ? 'bg-indigo-600' : ''}
>
  <List className="w-4 h-4 mr-2" />
  List View
</Button>

// NEW
<Button
  variant={viewMode === 'list' ? 'default' : 'outline'}
  size="sm"
  onClick={() => setViewMode('list')}
  className={viewMode === 'list' ? 'bg-indigo-600' : ''}
>
  <User className="w-4 h-4 mr-2" />
  By Student
</Button>
```

### 6.5 Replace Flat Table with By Student Accordion

**File:** `src/pages/Dashboard.tsx`  
**Location:** View mode conditional (~line 237)

**Find:**
```typescript
) : viewMode === 'list' ? (
  <>
    {/* List View - Header Table */}
    <div ref={headerScrollRef} onScroll={handleHeaderScroll} className="overflow-x-auto">
      <table className="w-full table-fixed">
        {/* ... large flat table ... */}
      </table>
    </div>
    {/* ... pagination ... */}
  </>
```

**Replace with:**
```typescript
) : viewMode === 'list' ? (
  /* By Student View - Accordion by Student */
  <Accordion type="multiple" className="w-full">
    {Object.entries(groupedByStudent).map(([studentName, data]) => (
      <AccordionItem key={studentName} value={studentName} className="border-b">
        <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100">
          <div className="flex items-center justify-between gap-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg text-gray-900">
                  {studentName}
                </div>
                <div className="text-sm text-gray-500">
                  {data.submissions.length} submission{data.submissions.length !== 1 ? 's' : ''}
                  {data.studentId && ` • ID: ${data.studentId}`}
                </div>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Assignment</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">AI Grade</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Teacher Grade</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.map((submission) => (
                  <tr key={submission.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {submission.assignment_title || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        {submission.ai_grade ? `${submission.ai_grade}/100` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {submission.teacher_grade ? (
                        <span className="font-semibold text-blue-600">
                          {submission.teacher_grade}/100
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/submission/${submission.id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(submission.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
```

### 6.6 Verify Build After Each Step

```bash
# After each change, verify it compiles
npm run build

# If errors, fix immediately before proceeding
# If success, commit
git add src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): add By Student grouped view"
```

---

## 7) Testing Checklist

### 7.1 Compilation

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### 7.2 Visual Testing

**By Student View:**
- [ ] Button shows "By Student" with User icon
- [ ] Accordion groups appear for each student
- [ ] Student name displayed correctly
- [ ] Submission count shown
- [ ] Student ID shown (if available)
- [ ] Table shows: Assignment, AI Grade, Teacher Grade, Date, Actions
- [ ] View button navigates to submission
- [ ] Delete button shows confirmation

**By Assignment View:**
- [ ] Button shows "By Assignment" with Folder icon
- [ ] Accordion groups appear for each assignment
- [ ] Assignment title displayed correctly
- [ ] Submission count shown
- [ ] Table shows: Student, AI Grade, Teacher Grade, Date, Actions
- [ ] All existing functionality works

**General:**
- [ ] Export CSV button works
- [ ] Search filters both views
- [ ] Switching between views works smoothly
- [ ] No console errors
- [ ] Responsive on mobile/tablet

### 7.3 Data Testing

- [ ] Students with multiple submissions grouped correctly
- [ ] Students with single submission display correctly
- [ ] Unknown students (no bridge entry) handled gracefully
- [ ] Empty state shows when no submissions
- [ ] Loading state shows while fetching

### 7.4 Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces accordion state
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

---

## 8) Rollback Plan

### 8.1 Full Rollback (if major issues)

```bash
# Reset to pre-refactor state
git reset --hard "pre-dashboard-refactor-${REFACTOR_TS}"

echo "✅ Rolled back to pre-refactor state"
```

### 8.2 Partial Rollback (restore specific file)

```bash
# Restore Dashboard.tsx from backup
cp -a "${ARCHIVE}/refactor_backups/src/pages/Dashboard.tsx" "src/pages/Dashboard.tsx"

git add src/pages/Dashboard.tsx
git commit -m "revert: restore Dashboard.tsx from backup [${REFACTOR_TS}]"

echo "✅ Dashboard.tsx restored from backup"
```

### 8.3 Restore Archived Files (if needed)

```bash
# Restore old Dashboard files
git mv "src/archive/pages/DashboardOld.tsx" "src/pages/DashboardOld.tsx"
git mv "src/archive/pages/Dashboard_HealthCheck.tsx" "src/pages/Dashboard_HealthCheck.tsx"

git commit -m "revert: restore archived Dashboard files"

echo "✅ Archived files restored"
```

---

## 9) Success Criteria

### Must Have:
- ✅ Dashboard.tsx compiles without errors
- ✅ "By Student" view shows grouped accordions
- ✅ "By Assignment" view still works
- ✅ All buttons and navigation functional
- ✅ No regressions in existing features

### Nice to Have:
- ✅ Old Dashboard files archived cleanly
- ✅ Code follows frontend-components.md patterns
- ✅ Accessible and responsive
- ✅ Performance optimized

---

## 10) Post-Refactor Tasks

### 10.1 Documentation

- [ ] Update NEXT_ENHANCEMENTS_PLAN.md - Mark "By Student" view as complete
- [ ] Update MASTER_PLAN.md - Note Dashboard refactor completion
- [ ] Add comments to Dashboard.tsx explaining grouping logic

### 10.2 Commit Strategy

```bash
# Commit with descriptive message
git add -A
git commit -m "feat(dashboard): implement By Student grouped view

- Replace flat table with accordion grouped by student
- Add groupedByStudent logic using bridge
- Update button text and icon (List → User)
- Archive old Dashboard variants to src/archive/
- Maintain By Assignment view functionality

Closes: Dashboard refactor
Ref: DashboardRefactor.md"
```

### 10.3 Testing in Dev

```bash
# Start dev server
npm run dev

# Test all scenarios:
# 1. By Student view with multiple students
# 2. By Assignment view (ensure no regression)
# 3. Search functionality
# 4. Export CSV
# 5. Navigation to submissions
# 6. Delete submissions
```

---

## 11) Notes

### Why This Approach?

1. **Safety First** - Backup before any changes
2. **Incremental** - Small, testable changes
3. **Reversible** - Easy rollback at any step
4. **Clean** - Archive old files properly
5. **Documented** - Clear plan to follow

### Lessons Learned from Previous Attempt:

1. ❌ **Don't** try to edit large sections at once
2. ❌ **Don't** mix multiple changes in one edit
3. ✅ **Do** restore to clean state first
4. ✅ **Do** make small, focused changes
5. ✅ **Do** test after each change
6. ✅ **Do** commit frequently

### Key Principles from REFACTOR.md:

- **Backup → Edit → Test** cycle
- Soft-delete (archive) unused files
- Keep commits small and focused
- Test rollback mechanism
- Document everything

### Key Principles from frontend-components.md:

- Type safety (TypeScript interfaces)
- Component composition
- Accessibility (semantic HTML, ARIA)
- Performance (useMemo, useCallback)
- Consistency (shadcn/ui + Tailwind)

---

## 12) Execution Checklist

- [ ] Section 1: Prerequisites verified
- [ ] Section 2: Backups created
- [ ] Section 3: Old files archived
- [ ] Section 4: Current state analyzed
- [ ] Section 5: Strategy defined
- [ ] Section 6.1: Clean state restored
- [ ] Section 6.2: Imports updated
- [ ] Section 6.3: Grouping logic added
- [ ] Section 6.4: Button updated
- [ ] Section 6.5: Accordion view implemented
- [ ] Section 6.6: Build verified
- [ ] Section 7: Testing completed
- [ ] Section 10: Post-refactor tasks done

---

**Ready to execute!** Follow sections 1-12 in order. 🚀

**Estimated Time:** 30-45 minutes

**Risk Level:** Low (with proper backups and incremental approach)

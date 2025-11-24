# Dashboard Refactoring Plan

**Created:** November 24, 2025  
**Status:** 📋 **PLANNING**  
**Priority:** 🟡 **MEDIUM-HIGH**  
**Estimated Effort:** 4-6 hours  
**Branch:** `refactor/dashboard-structure`

---

## 📊 Current State Analysis

### Problems:
- **File Size:** 735 lines (too large)
- **Responsibilities:** 10+ different concerns in one file
- **State Management:** 11 useState hooks, complex derived state
- **View Logic:** 3 completely different view modes with duplicate code
- **Testability:** Difficult to test due to tight coupling
- **Extensibility:** Hard to add new features without breaking existing code

### Metrics:
- Lines of Code: 735
- State Variables: 14
- View Modes: 3 (each ~200 lines)
- Duplicate Table Code: 3 instances
- Complexity Score: HIGH

---

## 🎯 Goals

### Primary Goals:
1. **Reduce file size** - Main Dashboard.tsx should be ~150 lines
2. **Separate concerns** - Data, UI, and business logic in separate files
3. **Eliminate duplication** - Shared components for common UI patterns
4. **Improve testability** - Each piece testable in isolation
5. **Enable extensibility** - Easy to add new features without touching existing code

### Success Criteria:
- ✅ Main Dashboard.tsx < 200 lines
- ✅ Each view component < 150 lines
- ✅ Shared table component eliminates duplication
- ✅ Custom hooks handle all data logic
- ✅ All existing functionality preserved
- ✅ No visual changes to user
- ✅ All tests pass

---

## 📁 Proposed Structure

```
src/pages/Dashboard/
├── Dashboard.tsx                    (~150 lines) - Main orchestrator
├── index.ts                         - Clean exports
│
├── hooks/
│   ├── useDashboardData.ts         - Data fetching & caching
│   ├── useDashboardFilters.ts      - Search, class period, pagination
│   ├── useDashboardGrouping.ts     - Group by student/assignment/class
│   ├── useDashboardActions.ts      - Delete, export, modal management
│   └── index.ts                     - Export all hooks
│
├── components/
│   ├── DashboardHeader.tsx         - Title, actions, view switcher
│   ├── DashboardFilters.tsx        - Search bar, class filter
│   ├── SubmissionTable.tsx         - Shared table component
│   ├── DeleteConfirmModal.tsx      - Delete confirmation UI
│   │
│   └── views/
│       ├── ByStudentView.tsx       - Student accordion view
│       ├── ByAssignmentView.tsx    - Assignment accordion view
│       ├── ByClassView.tsx         - Class → Student → Assignment view
│       └── index.ts                 - Export all views
│
├── types.ts                         - Shared TypeScript types
└── utils.ts                         - Helper functions (if needed)
```

---

## 🔄 Refactoring Phases

### **PHASE 1: Setup & Preparation** ⏱️ 30 minutes

**Goal:** Create structure and ensure safety net

**Tasks:**
- [ ] Create `src/pages/Dashboard/` directory
- [ ] Create all subdirectories (hooks, components, components/views)
- [ ] Create empty files with TODO comments
- [ ] Create `types.ts` with all existing types
- [ ] Run tests to establish baseline
- [ ] Commit: "refactor(dashboard): create directory structure"

**Files Created:**
- `Dashboard/index.ts`
- `Dashboard/types.ts`
- `Dashboard/hooks/index.ts`
- `Dashboard/components/index.ts`
- `Dashboard/components/views/index.ts`

**Safety Check:**
- [ ] All tests still pass
- [ ] Application still runs
- [ ] No broken imports

---

### **PHASE 2: Extract Custom Hooks** ⏱️ 1.5 hours

**Goal:** Move all data logic out of main component

#### 2A: Data Fetching Hook
**File:** `hooks/useDashboardData.ts`

**Extract:**
- `useQuery` for submissions
- `useQuery` for assignments
- `useMutation` for delete
- Query invalidation logic

**Interface:**
```typescript
export function useDashboardData(filters: DashboardFilters) {
  return {
    submissions: Submission[],
    assignments: Assignment[],
    isLoading: boolean,
    deleteSubmission: (id: string) => void,
    deleteAssignment: (title: string) => void,
    isDeleting: boolean
  }
}
```

**Tasks:**
- [ ] Create `useDashboardData.ts`
- [ ] Move useQuery hooks
- [ ] Move useMutation hooks
- [ ] Add proper TypeScript types
- [ ] Test hook in isolation
- [ ] Update Dashboard.tsx to use hook
- [ ] Commit: "refactor(dashboard): extract data fetching hook"

#### 2B: Filters Hook
**File:** `hooks/useDashboardFilters.ts`

**Extract:**
- Search query state
- Class period filter state
- Page state
- Filter change handlers

**Interface:**
```typescript
export function useDashboardFilters() {
  return {
    searchQuery: string,
    setSearchQuery: (query: string) => void,
    classPeriodFilter: string,
    setClassPeriodFilter: (period: string) => void,
    page: number,
    setPage: (page: number) => void,
    resetFilters: () => void
  }
}
```

**Tasks:**
- [ ] Create `useDashboardFilters.ts`
- [ ] Move filter state
- [ ] Add reset functionality
- [ ] Update Dashboard.tsx to use hook
- [ ] Commit: "refactor(dashboard): extract filters hook"

#### 2C: Grouping Hook
**File:** `hooks/useDashboardGrouping.ts`

**Extract:**
- `groupedByStudent` logic
- `groupedSubmissions` logic
- `groupedByClass` logic
- Sorting logic (currently unused)

**Interface:**
```typescript
export function useDashboardGrouping(submissions: Submission[], bridge: Bridge) {
  return {
    groupedByStudent: Record<string, StudentGroup>,
    groupedByAssignment: Record<string, Submission[]>,
    groupedByClass: Record<string, Record<string, StudentGroup>>,
    sortedSubmissions: Submission[]
  }
}
```

**Tasks:**
- [ ] Create `useDashboardGrouping.ts`
- [ ] Move grouping logic
- [ ] Move sorting logic
- [ ] Add memoization with useMemo
- [ ] Update Dashboard.tsx to use hook
- [ ] Commit: "refactor(dashboard): extract grouping hook"

#### 2D: Actions Hook
**File:** `hooks/useDashboardActions.ts`

**Extract:**
- Modal state management
- Delete confirmation state
- Export CSV logic
- Navigation helpers

**Interface:**
```typescript
export function useDashboardActions() {
  return {
    // Modal
    isAssignmentModalOpen: boolean,
    openAssignmentModal: () => void,
    closeAssignmentModal: () => void,
    modalMode: 'create' | 'edit',
    editingAssignment: Assignment | null,
    setEditMode: (assignment: Assignment) => void,
    
    // Delete
    deleteId: string | null,
    deleteAssignmentTitle: string | null,
    handleDelete: (id: string) => void,
    handleDeleteAssignment: (title: string) => void,
    cancelDelete: () => void,
    
    // Export
    handleExport: (submissions: Submission[], bridge: Bridge) => void
  }
}
```

**Tasks:**
- [ ] Create `useDashboardActions.ts`
- [ ] Move modal state
- [ ] Move delete state
- [ ] Move export logic
- [ ] Update Dashboard.tsx to use hook
- [ ] Commit: "refactor(dashboard): extract actions hook"

**Phase 2 Checkpoint:**
- [ ] All hooks created and tested
- [ ] Dashboard.tsx reduced to ~300 lines
- [ ] All tests pass
- [ ] Application works identically

---

### **PHASE 3: Extract Shared Components** ⏱️ 1 hour

#### 3A: Dashboard Header
**File:** `components/DashboardHeader.tsx`

**Extract:**
- PageHeader with actions
- View mode buttons
- Export CSV button

**Props:**
```typescript
interface DashboardHeaderProps {
  viewMode: ViewMode,
  setViewMode: (mode: ViewMode) => void,
  onExport: () => void,
  hasClassPeriods: boolean,
  submissionCount: number
}
```

**Tasks:**
- [ ] Create `DashboardHeader.tsx`
- [ ] Move header JSX
- [ ] Add prop types
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract header component"

#### 3B: Dashboard Filters
**File:** `components/DashboardFilters.tsx`

**Extract:**
- Search input
- Class period dropdown

**Props:**
```typescript
interface DashboardFiltersProps {
  searchQuery: string,
  onSearchChange: (query: string) => void,
  classPeriodFilter: string,
  onClassPeriodChange: (period: string) => void,
  classPeriods: string[],
  showClassFilter: boolean
}
```

**Tasks:**
- [ ] Create `DashboardFilters.tsx`
- [ ] Move filter JSX
- [ ] Add prop types
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract filters component"

#### 3C: Submission Table
**File:** `components/SubmissionTable.tsx`

**Extract:**
- Shared table structure used in all views
- Table headers
- Table rows
- Action buttons (View, Delete)

**Props:**
```typescript
interface SubmissionTableProps {
  submissions: Submission[],
  onView: (id: string) => void,
  onDelete: (id: string) => void,
  showStudentColumn?: boolean,
  showAssignmentColumn?: boolean
}
```

**Tasks:**
- [ ] Create `SubmissionTable.tsx`
- [ ] Extract common table structure
- [ ] Make columns configurable
- [ ] Update views to use shared table
- [ ] Commit: "refactor(dashboard): extract shared table component"

#### 3D: Delete Confirm Modal
**File:** `components/DeleteConfirmModal.tsx`

**Extract:**
- Delete submission modal
- Delete assignment modal
- Shared confirmation UI

**Props:**
```typescript
interface DeleteConfirmModalProps {
  isOpen: boolean,
  type: 'submission' | 'assignment',
  onConfirm: () => void,
  onCancel: () => void,
  isDeleting: boolean,
  itemName?: string
}
```

**Tasks:**
- [ ] Create `DeleteConfirmModal.tsx`
- [ ] Move modal JSX
- [ ] Support both submission and assignment delete
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract delete modal component"

**Phase 3 Checkpoint:**
- [ ] All shared components extracted
- [ ] Dashboard.tsx reduced to ~200 lines
- [ ] No duplicate code
- [ ] All tests pass

---

### **PHASE 4: Extract View Components** ⏱️ 1.5 hours

#### 4A: By Student View
**File:** `components/views/ByStudentView.tsx`

**Extract:**
- Student accordion structure
- Student grouping display
- Submission table per student

**Props:**
```typescript
interface ByStudentViewProps {
  groupedByStudent: Record<string, StudentGroup>,
  onView: (id: string) => void,
  onDelete: (id: string) => void
}
```

**Tasks:**
- [ ] Create `ByStudentView.tsx`
- [ ] Move student view JSX
- [ ] Use shared SubmissionTable
- [ ] Add prop types
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract by-student view"

#### 4B: By Assignment View
**File:** `components/views/ByAssignmentView.tsx`

**Extract:**
- Assignment accordion structure
- Assignment grouping display
- Submission table per assignment
- Edit/Delete assignment buttons

**Props:**
```typescript
interface ByAssignmentViewProps {
  assignments: Assignment[],
  groupedSubmissions: Record<string, Submission[]>,
  bridge: Bridge,
  onView: (id: string) => void,
  onDelete: (id: string) => void,
  onEditAssignment: (assignment: Assignment) => void,
  onDeleteAssignment: (title: string) => void
}
```

**Tasks:**
- [ ] Create `ByAssignmentView.tsx`
- [ ] Move assignment view JSX
- [ ] Use shared SubmissionTable
- [ ] Add prop types
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract by-assignment view"

#### 4C: By Class View
**File:** `components/views/ByClassView.tsx`

**Extract:**
- Class → Student → Assignment hierarchy
- 3-level nested accordion
- Class period grouping display

**Props:**
```typescript
interface ByClassViewProps {
  groupedByClass: Record<string, Record<string, StudentGroup>>,
  onView: (id: string) => void,
  onDelete: (id: string) => void
}
```

**Tasks:**
- [ ] Create `ByClassView.tsx`
- [ ] Move class view JSX
- [ ] Use shared SubmissionTable
- [ ] Add prop types
- [ ] Update Dashboard.tsx to use component
- [ ] Commit: "refactor(dashboard): extract by-class view"

**Phase 4 Checkpoint:**
- [ ] All view components extracted
- [ ] Dashboard.tsx is now ~150 lines
- [ ] Each view is independent and testable
- [ ] All tests pass
- [ ] No visual changes

---

### **PHASE 5: Final Cleanup & Polish** ⏱️ 45 minutes

**Tasks:**
- [ ] Remove commented-out code from Dashboard.tsx
- [ ] Add JSDoc comments to all exported functions
- [ ] Ensure all files have proper imports/exports
- [ ] Create barrel exports (index.ts files)
- [ ] Update any imports in other files
- [ ] Run full test suite
- [ ] Manual testing of all features
- [ ] Check for any console warnings
- [ ] Update documentation if needed
- [ ] Commit: "refactor(dashboard): final cleanup and documentation"

**Barrel Exports:**

`Dashboard/index.ts`:
```typescript
export { default } from './Dashboard';
export * from './types';
```

`Dashboard/hooks/index.ts`:
```typescript
export * from './useDashboardData';
export * from './useDashboardFilters';
export * from './useDashboardGrouping';
export * from './useDashboardActions';
```

`Dashboard/components/views/index.ts`:
```typescript
export { default as ByStudentView } from './ByStudentView';
export { default as ByAssignmentView } from './ByAssignmentView';
export { default as ByClassView } from './ByClassView';
```

**Final Checklist:**
- [ ] Dashboard.tsx < 200 lines
- [ ] No duplicate code
- [ ] All hooks properly extracted
- [ ] All components properly extracted
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Application works identically to before
- [ ] Performance is same or better

---

### **PHASE 6: Testing & Validation** ⏱️ 30 minutes

**Unit Tests:**
- [ ] Test `useDashboardData` hook
- [ ] Test `useDashboardFilters` hook
- [ ] Test `useDashboardGrouping` hook
- [ ] Test `useDashboardActions` hook
- [ ] Test `SubmissionTable` component
- [ ] Test each view component

**Integration Tests:**
- [ ] Test view switching
- [ ] Test filtering
- [ ] Test search
- [ ] Test delete operations
- [ ] Test export functionality

**Manual Testing:**
- [ ] Load Dashboard
- [ ] Switch between all 3 views
- [ ] Test search functionality
- [ ] Test class period filter
- [ ] Test pagination
- [ ] Test delete submission
- [ ] Test delete assignment
- [ ] Test export CSV
- [ ] Test create assignment modal
- [ ] Test edit assignment modal

**Performance Testing:**
- [ ] Check bundle size (should be same or smaller)
- [ ] Check render performance
- [ ] Check memory usage

**Commit:** "test(dashboard): add tests for refactored components"

---

## 📊 Before & After Comparison

### Before Refactoring:
```
src/pages/Dashboard.tsx (735 lines)
├── 14 state variables
├── 3 view modes (inline)
├── Duplicate table code (3x)
├── Mixed concerns
└── Hard to test
```

### After Refactoring:
```
src/pages/Dashboard/
├── Dashboard.tsx (150 lines) ✅
├── hooks/ (4 files, ~400 lines total)
│   ├── useDashboardData.ts (~100 lines)
│   ├── useDashboardFilters.ts (~50 lines)
│   ├── useDashboardGrouping.ts (~150 lines)
│   └── useDashboardActions.ts (~100 lines)
├── components/ (7 files, ~500 lines total)
│   ├── DashboardHeader.tsx (~80 lines)
│   ├── DashboardFilters.tsx (~60 lines)
│   ├── SubmissionTable.tsx (~100 lines)
│   ├── DeleteConfirmModal.tsx (~60 lines)
│   └── views/
│       ├── ByStudentView.tsx (~80 lines)
│       ├── ByAssignmentView.tsx (~100 lines)
│       └── ByClassView.tsx (~120 lines)
└── types.ts (~50 lines)

Total: ~1100 lines (but organized and maintainable!)
```

**Key Improvements:**
- ✅ Single Responsibility Principle
- ✅ Easy to test each piece
- ✅ No duplicate code
- ✅ Clear separation of concerns
- ✅ Easy to add new features
- ✅ Better TypeScript support
- ✅ Improved developer experience

---

## 🚀 Execution Strategy

### Recommended Approach:
1. **Do NOT refactor and add features simultaneously**
2. **Complete all phases in order**
3. **Commit after each phase**
4. **Test thoroughly after each phase**
5. **If something breaks, revert and fix before continuing**

### Branch Strategy:
```bash
# Create feature branch
git checkout -b refactor/dashboard-structure

# After each phase
git add .
git commit -m "refactor(dashboard): [phase description]"

# After all phases complete
git push origin refactor/dashboard-structure
# Create PR for review
# Merge to main after approval
```

### Rollback Plan:
If refactoring causes issues:
```bash
# Revert to last working commit
git reset --hard <last-good-commit>

# Or revert specific commit
git revert <problematic-commit>
```

---

## 📝 Notes & Considerations

### Things to Watch Out For:
1. **Bridge Integration** - Ensure useBridge hook works in all new components
2. **React Query** - Don't break query invalidation logic
3. **Navigation** - Preserve all navigation functionality
4. **Modal State** - Keep modal open/close behavior identical
5. **Performance** - Watch for unnecessary re-renders

### Future Enhancements (After Refactor):
Once refactored, these features will be much easier to add:
- ✨ Sorting options
- ✨ Statistics summary card
- ✨ Date range filter
- ✨ Bulk operations
- ✨ Advanced search
- ✨ Custom views
- ✨ Export options

### Success Metrics:
- **Code Quality:** Reduced complexity, better organization
- **Maintainability:** Easier to understand and modify
- **Testability:** Each piece testable in isolation
- **Extensibility:** New features don't require touching existing code
- **Developer Experience:** Faster development, fewer bugs

---

## ✅ Definition of Done

- [ ] All 6 phases completed
- [ ] Dashboard.tsx < 200 lines
- [ ] All hooks extracted and working
- [ ] All components extracted and working
- [ ] No duplicate code
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Application works identically to before
- [ ] Code reviewed and approved
- [ ] Merged to main
- [ ] Deployed to production

---

**Status:** 📋 **READY TO EXECUTE**  
**Next Step:** Create branch and begin Phase 1

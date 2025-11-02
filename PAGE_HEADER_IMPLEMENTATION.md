# Page Header Implementation Plan

## 🎯 Goal
Move "Add Assignment" and "Lock/Unlock Students" buttons from navigation to page headers for faster access.

## Design Philosophy
Following the core mission: **Speed First** and **Minimize Clicks**

1. **Speed First** - Put critical actions where teachers need them
2. **Minimize Clicks** - Reduce navigation required to perform common tasks
3. **Simplicity Over Features** - Clean, focused UI

## ✅ Completed

### 1. PageHeader Component Created
**File:** `src/components/PageHeader.tsx`

**Features:**
- Reusable component for consistent page headers
- Icon + Title + Subtitle layout
- Optional "Add Assignment" button
- Optional "Lock/Unlock Students" button with status indicator
- Support for custom action buttons
- Integrates with `useBridge` hook for lock status

**Props:**
```typescript
interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;          // Custom action buttons
  showAddAssignment?: boolean;         // Show Add Assignment button
  showBridgeLock?: boolean;           // Show Lock/Unlock Students button
}
```

## 📋 TODO: Implementation Steps

### Step 1: Update Navigation Component
**File:** `src/components/Navigation.tsx`

**Changes:**
- Remove "Add Assignment" button from navigation
- Keep only: Dashboard, Grade, Students, Help, Settings, User Menu

### Step 2: Update Dashboard Page
**File:** `src/pages/Dashboard.tsx`

**Replace this:**
```tsx
<Card className="shadow-xl border-t-4 border-t-indigo-500 bg-white mb-6">
  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <CardTitle className="text-2xl text-gray-900">Dashboard</CardTitle>
      </div>
      <div className="flex gap-2">
        {/* Export CSV, By Student, By Assignment buttons */}
      </div>
    </div>
  </CardHeader>
</Card>
```

**With this:**
```tsx
<PageHeader
  icon={<span className="text-2xl">📚</span>}
  title="Dashboard"
  showAddAssignment={true}
  showBridgeLock={true}
  actions={
    <>
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <div className="w-px h-8 bg-gray-300 mx-2" />
      <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
        <User className="w-4 h-4 mr-2" />
        By Student
      </Button>
      <Button variant={viewMode === 'grouped' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grouped')}>
        <FolderOpen className="w-4 h-4 mr-2" />
        By Assignment
      </Button>
    </>
  }
/>
```

### Step 3: Update Submission Page
**File:** `src/pages/Submission.tsx`

**Find the header section and replace with:**
```tsx
<PageHeader
  icon={<span className="text-2xl">✏️</span>}
  title="Grade Submission"
  showAddAssignment={true}
  showBridgeLock={true}
  actions={
    <>
      <Button onClick={() => {/* New Submission logic */}} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        New Submission
      </Button>
      <Button onClick={() => {/* Single Essay logic */}} variant="default">
        <FileText className="w-4 h-4 mr-2" />
        Single Essay
      </Button>
      <Button onClick={() => {/* Draft Comparison logic */}} variant="outline">
        <GitCompare className="w-4 h-4 mr-2" />
        Draft Comparison
      </Button>
    </>
  }
/>
```

### Step 4: Update Help Page
**File:** `src/pages/Help.tsx`

**Replace the existing Card header with:**
```tsx
<PageHeader
  icon={<BookOpen className="w-6 h-6" />}
  title="Help Guide"
  subtitle="Simple guide for teachers"
  showAddAssignment={true}
  showBridgeLock={true}
/>
```

## 🎨 Visual Design

### Button States

**Add Assignment Button:**
- Blue background (`bg-blue-600`)
- White text
- Plus icon on left
- Always visible when `showAddAssignment={true}`

**Lock/Unlock Students Button:**
- **Locked State:**
  - Red border (`border-red-500`)
  - Red text (`text-red-600`)
  - Red lock icon
  - Text: "Unlock Students"
  
- **Unlocked State:**
  - Green border (`border-green-500`)
  - Green text (`text-green-600`)
  - Green unlock icon
  - Text: "Lock Students"

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Icon] Title                    [Add Assignment] [Lock/Unlock]  │
│         Subtitle                 [Custom Actions...]             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Implementation Notes

### Import PageHeader
```typescript
import PageHeader from '@/components/PageHeader';
```

### Remove from Navigation
In `Navigation.tsx`, remove:
```typescript
<button
  onClick={() => {
    const event = new CustomEvent('openAssignmentModal');
    window.dispatchEvent(event);
  }}
  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
>
  Add Assignment
</button>
```

### Bridge Lock Behavior
- Clicking "Lock Students" or "Unlock Students" navigates to `/bridge` page
- The button shows current lock status from `useBridge()` hook
- Visual feedback with color-coded borders and icons

## ✅ Testing Checklist

After implementation:
- [ ] Dashboard shows Add Assignment + Lock/Unlock buttons
- [ ] Submission page shows Add Assignment + Lock/Unlock buttons
- [ ] Help page shows Add Assignment + Lock/Unlock buttons
- [ ] Navigation no longer has Add Assignment button
- [ ] Lock/Unlock button shows correct status (red when locked, green when unlocked)
- [ ] Add Assignment button opens modal correctly
- [ ] Lock/Unlock button navigates to bridge page
- [ ] All existing page functionality still works
- [ ] Responsive design works on mobile

## 📊 Benefits

### Speed First ✅
- Teachers don't need to navigate to top menu
- Actions are right where they're working
- Reduces eye movement and cognitive load

### Minimize Clicks ✅
- One less click to add assignment (no menu navigation)
- One less click to manage students (no menu navigation)
- Common actions always visible

### Consistency ✅
- Same header pattern across all pages
- Predictable button locations
- Unified visual design

## 🚀 Next Steps

1. Update Navigation.tsx (remove Add Assignment button)
2. Update Dashboard.tsx (use PageHeader)
3. Update Submission.tsx (use PageHeader)
4. Update Help.tsx (use PageHeader)
5. Test all pages
6. Commit and deploy

**Estimated Time:** 30-45 minutes

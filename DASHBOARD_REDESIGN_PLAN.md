# Dashboard Redesign Plan

## Overview
Redesign the Dashboard page (`/src/pages/Dashboard.tsx`) to match the prior version's functionality, focusing on the Submissions table with two view modes (List View and By Assignment) and the New Assignment modal.

## Current State Analysis

### Current Dashboard (`/src/pages/Dashboard.tsx`)
- Simple health check page
- Shows Netlify Functions and Neon Database connection status
- No submissions table or data management
- Basic welcome/feature display

### Target Dashboard (`/src/pages/Dashboard_Target.tsx`)
- Full submissions management interface
- Two view modes: List View and By Assignment (grouped)
- Search functionality
- Sorting capabilities
- Delete operations (individual submissions and entire assignments)
- Export to CSV
- New Assignment modal integration
- Settings modal integration

### Existing Components
- ✅ `CreateAssignmentModal.tsx` - Already exists with grading criteria
- ✅ `CriteriaInput.tsx` - Shared grading criteria component
- ❓ Settings modal - Need to verify if exists

## Goals

1. **Replace current Dashboard** with submissions table functionality
2. **Implement two view modes**:
   - List View: Flat table of all submissions
   - By Assignment: Grouped accordion view
3. **Ensure New Assignment modal** uses shared grading criteria component
4. **Maintain consistency** with existing design patterns

## Implementation Steps

### Phase 1: Component Audit & Preparation

#### 1.1 Verify Existing Components
- [ ] Check if `SettingsModal.tsx` exists
  - Location: `/src/components/SettingsModal.tsx`
  - If missing, create based on reference in `Dashboard_Target.tsx`
  
- [ ] Verify API functions exist
  - `listSubmissions()` - with pagination, search
  - `deleteSubmission()` - single submission delete
  - `createAssignment()` - already used in CreateAssignmentModal
  - `exportToCSV()` - CSV export utility

- [ ] Check UI components availability
  - `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger`
  - `Card`, `CardContent`, `CardHeader`, `CardTitle`
  - `Button`, `Input`
  - All from shadcn/ui

#### 1.2 Identify Shared Grading Criteria Component
- [x] `CriteriaInput.tsx` exists at `/src/components/CriteriaInput.tsx`
- [x] `CreateAssignmentModal.tsx` already has grading criteria section
- [ ] **Decision needed**: Should `CreateAssignmentModal` use `CriteriaInput` component?
  - Current: Modal has its own textarea with "Enhance With AI" button
  - Target: Modal screenshot shows similar functionality
  - **Recommendation**: Extract shared logic into `CriteriaInput` and use in both:
    - `CreateAssignmentModal` (New Assignment)
    - `Submission` page (Grade Submission)

### Phase 2: Create Shared Grading Criteria Component

#### 2.1 Refactor CriteriaInput Component
- [ ] Review `CriteriaInput.tsx` current implementation
  - Already has "Enhance With AI" functionality
  - Has proper styling and layout
  - Uses Card wrapper

- [ ] Make CriteriaInput more flexible
  - Add optional `showCard` prop (default: true)
  - Add optional `title` prop (default: "Grading Criteria")
  - Add optional `required` prop (default: true)
  - Add optional `className` prop for custom styling
  - Keep all existing functionality:
    - AI enhancement
    - Example placeholder
    - Tip section

#### 2.2 Update CreateAssignmentModal
- [ ] Replace inline grading criteria textarea with `CriteriaInput` component
  - Remove duplicate "Enhance With AI" logic
  - Remove duplicate state management for enhancement
  - Use `CriteriaInput` with `showCard={false}` to maintain modal layout
  - Pass `value={criteria}` and `onChange={setCriteria}`

- [ ] Verify modal matches screenshot:
  - Assignment Title field (required)
  - Description field (optional)
  - Grading Criteria section with "Enhance With AI" button
  - Cancel and "Create Assignment" buttons

### Phase 3: Implement Dashboard Redesign

#### 3.1 Update Dashboard Page Structure
- [ ] Replace current health check content with submissions table
- [ ] **Update header structure** (based on screenshots):
  - **Keep top navigation bar** (white background):
    - FastAI Grader logo/title (left)
    - Navigation links: Dashboard, Submit, Students, Help (center)
    - User profile: "Mike Berry" with icon (right)
  - **Remove secondary header** (blue gradient header from `Dashboard_Target.tsx`):
    - Do NOT include the blue gradient section with "FastAI Grader" title
    - Do NOT include subtitle "6th Grade Essay Grading Assistant"
    - Do NOT include header buttons (Settings, HELP, Export CSV, New Assignment, New Submission)
  - **Move action buttons** to submissions card header or toolbar:
    - Export CSV button
    - New Assignment button
    - New Submission button
    - Settings button (if needed)

#### 3.2 Implement Submissions Table Card
- [ ] Create main Card component for submissions
- [ ] Add toolbar section above card (or in card header):
  - Action buttons row:
    - Export CSV button (left side)
    - New Assignment button
    - New Submission button (primary/highlighted)
- [ ] Add card header section:
  - Title: "Submissions" with emoji icon 📚 (left)
  - View mode toggle buttons (right):
    - List View (default)
    - By Assignment
- [ ] Add search section:
  - Search input with icon below title
  - Full-width search bar

#### 3.3 Implement List View
- [ ] Create table structure:
  - Columns: Student, Assignment, AI Grade, Teacher Grade, Date, Actions
  - Sortable columns (click to sort)
  - Sort indicators (chevron up/down icons)
  - Fixed header with synchronized horizontal scrolling
  - Scrollable body (max-height: 500px)

- [ ] Implement sorting functionality:
  - Sort by: student_name, assignment_title, ai_grade, teacher_grade, created_at
  - Toggle asc/desc on column click
  - Visual indicators for active sort

- [ ] Add row actions:
  - View button (navigate to submission detail)
  - Delete button (trash icon, red color)

- [ ] Implement pagination:
  - Show "X to Y of Z submissions"
  - Previous/Next buttons
  - Page size: 20 items

#### 3.4 Implement By Assignment View
- [ ] Create accordion-based grouped view:
  - Group submissions by assignment_title
  - Show "No Assignment" for submissions without assignment
  - Accordion header shows:
    - Assignment title
    - Submission count
    - Delete assignment button (deletes all submissions)

- [ ] Accordion content table:
  - Columns: Student, AI Grade, Teacher Grade, Date, Actions
  - Same row structure as List View
  - No sorting (inherits from parent)

#### 3.5 Implement Search Functionality
- [ ] Add search input in card header
- [ ] Search by student name or student ID
- [ ] Reset to page 0 on search
- [ ] Debounce search input (optional, for performance)

#### 3.6 Implement Delete Functionality
- [ ] Single submission delete:
  - Show confirmation modal
  - "Delete Submission?" title
  - Warning message
  - Cancel and Delete buttons
  - Call `deleteSubmission()` API

- [ ] Assignment delete (all submissions):
  - Show confirmation modal
  - "Delete Assignment?" title
  - Show assignment name in red
  - Show count of submissions to be deleted
  - Warning about permanent deletion
  - Cancel and "Delete All" buttons
  - Loop through and delete all submissions

#### 3.7 Implement Export to CSV
- [ ] Add Export CSV button in header
- [ ] Disable when no submissions
- [ ] Export all current submissions (respecting search filter)
- [ ] Filename: `submissions-YYYY-MM-DD.csv`
- [ ] Include columns: student_name, student_id, assignment_title, teacher_grade, ai_grade, created_at, updated_at

### Phase 4: Modal Integration

#### 4.1 New Assignment Modal
- [x] Already exists as `CreateAssignmentModal.tsx`
- [ ] Verify it opens from header button
- [ ] Verify it uses shared `CriteriaInput` component (after Phase 2)
- [ ] Test create assignment flow
- [ ] Verify it refreshes submissions list after creation

#### 4.2 Settings Modal
- [ ] Check if `SettingsModal.tsx` exists
- [ ] If missing, create based on `Dashboard_Target.tsx` reference
- [ ] Verify it opens from Settings button in header
- [ ] Implement settings functionality (AI model selection, etc.)

### Phase 5: Styling & Polish

#### 5.1 Match Design System
- [ ] **Top navigation bar** (white background):
  - Clean, minimal design
  - Border bottom for separation
  - Consistent with screenshots
- [ ] **Page background**: Light gradient or solid color (NOT blue gradient)
  - Use: `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50` or similar
- [ ] **Card styling**: shadow-xl, border-t-4 border-t-indigo-500
- [ ] **Button colors**:
  - Primary: indigo-600 or blue-600
  - Danger: red-600
  - Ghost: subtle hover effects
- [ ] **Table styling**:
  - Header: gradient from-slate-100 to-blue-100
  - Hover: bg-muted/50
  - Borders: border-b
- [ ] **Remove** blue gradient header section entirely

#### 5.2 Responsive Design
- [ ] Ensure table is horizontally scrollable on mobile
- [ ] Synchronized header/body scrolling
- [ ] Responsive button layout in header
- [ ] Mobile-friendly modals

#### 5.3 Loading & Empty States
- [ ] Loading state: "Loading..." centered
- [ ] Empty state: "No submissions found. Create your first submission to get started."
- [ ] Disable buttons during mutations (delete, create)

### Phase 6: Testing & Validation

#### 6.1 Functionality Testing
- [ ] Test List View:
  - Sorting on all columns
  - Pagination
  - Search
  - Delete individual submission
  - View submission navigation

- [ ] Test By Assignment View:
  - Accordion expand/collapse
  - Delete entire assignment
  - View submission navigation
  - Correct submission grouping

- [ ] Test Modals:
  - New Assignment creation
  - Settings (if implemented)
  - Delete confirmations
  - Escape key to close
  - Click outside to close (if desired)

#### 6.2 Integration Testing
- [ ] Create new assignment → appears in dropdown
- [ ] Create new submission → appears in table
- [ ] Delete submission → removed from table
- [ ] Delete assignment → all submissions removed
- [ ] Export CSV → correct data format
- [ ] Search → filters correctly
- [ ] Sort → correct order

#### 6.3 Edge Cases
- [ ] No submissions (empty state)
- [ ] No assignments (dropdown empty)
- [ ] Submissions without assignment ("No Assignment" group)
- [ ] Very long student names (truncation)
- [ ] Very long assignment titles (truncation)
- [ ] Null/undefined grades (show "-")
- [ ] Pagination at boundaries (first/last page)

## File Changes Summary

### Files to Modify
1. **`/src/pages/Dashboard.tsx`** - Complete redesign
   - Replace health check with submissions table
   - Add List View and By Assignment views
   - Add search, sort, pagination
   - Add delete functionality
   - Add export to CSV

2. **`/src/components/CriteriaInput.tsx`** - Make more flexible
   - Add optional props for customization
   - Keep existing functionality

3. **`/src/components/CreateAssignmentModal.tsx`** - Use shared component
   - Replace inline criteria textarea with `CriteriaInput`
   - Remove duplicate enhancement logic

### Files to Create (if missing)
1. **`/src/components/SettingsModal.tsx`** - Settings modal
   - AI model selection
   - Custom rubric prompt
   - Other settings

### Files to Reference (DO NOT MODIFY)
1. **`/src/pages/Dashboard_Target.tsx`** - Reference only
   - Code patterns
   - Component structure
   - Styling examples

## API Requirements

### Required API Functions
Verify these exist in `/src/lib/api.ts`:

1. **`listSubmissions(params)`**
   - Parameters: `{ search?: string, page?: number, limit?: number }`
   - Returns: `{ submissions: Submission[], total: number }`

2. **`deleteSubmission(id: string)`**
   - Deletes single submission
   - Returns: success confirmation

3. **`createAssignment(data)`**
   - Parameters: `{ title: string, description?: string, grading_criteria?: string }`
   - Returns: created assignment

4. **`listAssignments()`**
   - Returns: `{ assignments: Assignment[] }`

5. **`exportToCSV(data, filename)`** (utility function)
   - May be in `/src/lib/csv.ts`
   - Converts data to CSV and downloads

## Design Tokens

### Colors
- Primary: indigo-600, blue-600
- Danger: red-600, red-700
- Success: green-500
- Muted: gray-400, gray-500
- Navigation: white background with subtle border

### Gradients
- **Page background**: `from-slate-50 via-blue-50 to-indigo-50` (subtle)
- **Card header**: `from-slate-50 to-blue-50`
- **Table header**: `from-slate-100 to-blue-100`
- **NO blue gradient header** (removed from design)

### Spacing
- Card padding: p-6
- Table cell padding: py-3 px-4
- Button gaps: gap-2, gap-3

### Typography
- Page title: text-3xl font-bold
- Card title: text-2xl
- Table headers: font-semibold
- Body text: text-sm, text-base

## Dependencies

### UI Components (shadcn/ui)
- Accordion
- Button
- Card
- Input
- Select
- Tabs (for future use)
- Label
- Textarea

### Icons (lucide-react)
- Plus, Download, Search, FolderPlus, Settings
- ChevronUp, ChevronDown, Trash2, Info
- List, FolderOpen
- X, Loader2, Sparkles

### State Management
- React Query (@tanstack/react-query)
  - useQuery for data fetching
  - useMutation for mutations
  - queryClient for cache invalidation

### Routing
- React Router
  - useNavigate for navigation
  - useParams for URL params

## Migration Strategy

### Option 1: In-Place Replacement (Recommended)
1. Backup current `Dashboard.tsx` as `Dashboard_HealthCheck.tsx`
2. Replace `Dashboard.tsx` with new implementation
3. Test thoroughly
4. Remove backup if successful

### Option 2: Gradual Migration
1. Create `Dashboard_New.tsx` with new implementation
2. Update routes to use new dashboard
3. Test thoroughly
4. Delete old `Dashboard.tsx`
5. Rename `Dashboard_New.tsx` to `Dashboard.tsx`

## Success Criteria

- [ ] Dashboard displays submissions table with both view modes
- [ ] List View shows all submissions with sorting and pagination
- [ ] By Assignment View groups submissions correctly
- [ ] Search filters submissions by student name/ID
- [ ] Delete operations work for both single submissions and assignments
- [ ] Export to CSV generates correct file
- [ ] New Assignment modal opens and creates assignments
- [ ] Grading criteria component is shared between modal and submission page
- [ ] All buttons and actions work as expected
- [ ] Design matches screenshots and reference implementation
- [ ] No console errors or warnings
- [ ] Responsive on mobile and desktop

## Notes

- **DO NOT modify** `Dashboard_Target.tsx` - it's reference only
- **DO modify** current `Dashboard.tsx` - complete redesign
- **Header structure**: Use simple top navigation bar (white), NOT blue gradient header
- **Action buttons**: Move from header to card toolbar/header area
- **Shared component** for grading criteria is key to consistency
- **Test thoroughly** before considering complete
- **Follow existing patterns** from the codebase (React Query, shadcn/ui, etc.)
- **Reference screenshots** for correct header layout (top nav only)

## Questions to Resolve

1. Should Settings modal be implemented or just a placeholder?
2. Should we add debouncing to search input?
3. Should modals close on click outside or only via buttons?
4. Should we add keyboard shortcuts (e.g., Escape to close)?
5. Should pagination be server-side or client-side?
6. Should we add bulk delete functionality (checkboxes)?

## Timeline Estimate

- Phase 1 (Audit): 30 minutes
- Phase 2 (Shared Component): 1 hour
- Phase 3 (Dashboard): 3-4 hours
- Phase 4 (Modals): 1 hour
- Phase 5 (Styling): 1 hour
- Phase 6 (Testing): 2 hours

**Total: 8-9 hours**

## Next Steps

1. Review this plan with user
2. Get approval on approach
3. Begin Phase 1 (Component Audit)
4. Proceed sequentially through phases
5. Test after each phase
6. Deploy when all phases complete

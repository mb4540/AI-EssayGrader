# Draft Comparison Feature

## Overview

Added ability to compare rough drafts vs. final drafts to show student improvement over time.

## What Was Added

### 1. Database Changes
**File:** `schema_migration_drafts.sql`

New columns in `grader.submissions`:
- `draft_mode` - 'single' or 'comparison'
- `rough_draft_text` - First version of essay
- `final_draft_text` - Revised version of essay

**To apply:** Run `schema_migration_drafts.sql` in your Neon SQL Editor

### 2. UI Components

**New Component:** `src/components/DraftComparison.tsx`
- Side-by-side text areas for rough and final drafts
- Word count for each draft
- Color-coded labels (orange for rough, green for final)

**Updated Component:** `src/components/GradePanel.tsx`
- Shows improvement analysis section
- Growth percentage progress bar
- Lists areas improved (green)
- Lists areas still needing work (orange)

**Updated Page:** `src/pages/Submission.tsx`
- Mode toggle: Single Essay vs. Draft Comparison
- Conditional rendering based on mode
- Updated validation logic

### 3. Backend Updates

**Updated:** `netlify/functions/ingest.ts`
- Accepts `draft_mode`, `rough_draft_text`, `final_draft_text`
- Stores both drafts in database

**Updated:** `netlify/functions/grade.ts`
- New `buildComparisonPrompt()` function
- Detects draft mode and uses appropriate prompt
- Returns additional comparison fields

### 4. Schema Updates

**File:** `src/lib/schema.ts`

New `FeedbackSchema` fields:
- `improvement_summary` - Overall growth narrative
- `areas_improved` - List of improvements made
- `areas_still_need_work` - Remaining issues
- `growth_percentage` - 0-100 improvement score

Updated `IngestRequestSchema`:
- `draft_mode` field
- Conditional validation (single needs verbatim_text, comparison needs both drafts)

## How It Works

### Single Essay Mode (Default)
1. Teacher uploads/pastes one essay
2. AI grades it normally
3. Shows standard feedback

### Draft Comparison Mode
1. Teacher toggles to "Draft Comparison"
2. Enters rough draft in left panel
3. Enters final draft in right panel
4. AI compares both versions
5. Shows:
   - Grade for final draft
   - Improvement summary
   - Growth percentage
   - Specific areas improved
   - Areas still needing work
   - Standard feedback for final draft

## AI Prompt Strategy

### Comparison Prompt
The AI receives:
- Teacher criteria
- Rough draft text
- Final draft text

The AI is instructed to:
- Grade the FINAL draft (not the rough)
- Identify specific improvements
- Calculate growth percentage
- Note what still needs work
- Be encouraging about progress

## Usage Example

```typescript
// Single mode (existing behavior)
{
  draft_mode: 'single',
  verbatim_text: 'Student essay...',
  // ... other fields
}

// Comparison mode (new)
{
  draft_mode: 'comparison',
  rough_draft_text: 'First attempt...',
  final_draft_text: 'Revised version...',
  // ... other fields
}
```

## UI Flow

1. **Toggle Mode**
   - Click "Draft Comparison" tab at top of page
   - UI switches to show two text areas

2. **Enter Drafts**
   - Paste rough draft on left
   - Paste final draft on right
   - Word counts update automatically

3. **Grade**
   - Click "Run Grade"
   - AI analyzes both versions
   - Shows improvement metrics

4. **Review Feedback**
   - See growth percentage bar
   - Review areas improved (green checkmarks)
   - Review areas still needing work (orange warnings)
   - Read improvement summary
   - Standard feedback for final draft

## Benefits

- **Track Progress**: See how students improve between drafts
- **Targeted Feedback**: Know what worked and what didn't
- **Motivation**: Students see their growth quantified
- **Efficiency**: Grade both drafts in one pass
- **Insights**: Understand revision effectiveness

## Database Migration

**Before using this feature, run:**

```sql
-- In Neon SQL Editor
-- Copy and paste contents of schema_migration_drafts.sql
```

This adds the necessary columns to support draft comparison.

## API Changes

### POST /api/ingest
Now accepts:
```json
{
  "draft_mode": "single" | "comparison",
  "verbatim_text": "string (if single)",
  "rough_draft_text": "string (if comparison)",
  "final_draft_text": "string (if comparison)",
  // ... other fields
}
```

### POST /api/grade
Response now includes (when in comparison mode):
```json
{
  "improvement_summary": "string",
  "areas_improved": ["string"],
  "areas_still_need_work": ["string"],
  "growth_percentage": number,
  // ... standard feedback fields
}
```

## Future Enhancements

Potential additions:
- Visual diff highlighting between drafts
- Timeline view for multiple draft versions
- Revision history tracking
- Automated suggestions based on rough draft
- Peer comparison (anonymized)
- Progress charts over multiple assignments

## Testing Checklist

- [ ] Run database migration
- [ ] Restart `netlify dev`
- [ ] Toggle between modes
- [ ] Submit single essay (existing behavior)
- [ ] Submit draft comparison
- [ ] Verify improvement metrics appear
- [ ] Check growth percentage calculation
- [ ] Verify final grade is for final draft
- [ ] Test with real student work

## Notes

- Draft mode is stored with submission for audit trail
- Both drafts are preserved in database
- Growth percentage is AI-estimated (not calculated)
- Final grade applies to final draft only
- Rough draft is for comparison context only

---

**Feature Status:** ✅ Complete - Ready for testing
**Database Migration Required:** Yes
**Breaking Changes:** None (backward compatible)

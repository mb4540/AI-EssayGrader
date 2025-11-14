# Populate Rubric JSON for Existing Assignments

## Overview

This script parses the `grading_criteria` text from existing assignments and saves structured rubric data (with max_points per criterion) to the `rubric_json` column.

## Why This Matters

**Problem:** The LLM doesn't return max_points for each criterion, only the points awarded.

**Solution:** Store the rubric structure with max_points in the database so we always have it available.

## Benefits

✅ **Bulletproof Display** - Max points always available, never relying on LLM  
✅ **Consistent Grading** - Same rubric used for all submissions in an assignment  
✅ **Better UX** - Shows "10.5/15 pts" instead of just "10.5 pts"  
✅ **Future-Proof** - Rubric can be edited independently of criteria text

## Running the Script

### 1. Set Environment Variable

```bash
export DATABASE_URL="your-neon-database-url"
# or
export NEON_DATABASE_URL="your-neon-database-url"
```

### 2. Run the Script

```bash
npx tsx scripts/populate-rubric-json.ts
```

### 3. Expected Output

```
🔄 Starting rubric_json population...

Found 3 assignments with grading criteria

📝 Processing: "Personal Narrative E"
   Assignment ID: 4e46a54f-6480-46b8-8525-d6228752a487
   Total Points: 80
   ✅ Parsed 7 criteria:
      - Focus and Theme: 15 pts (4 levels)
      - Conflict and Resolution: 15 pts (4 levels)
      - Character and Setting Development: 10 pts (4 levels)
      - Narrative Techniques: 10 pts (4 levels)
      - Structure and Organization: 15 pts (4 levels)
      - Point of View: 5 pts (4 levels)
      - Language Conventions: 10 pts (4 levels)
   💾 Saved rubric_json to database

============================================================
📊 Summary:
   ✅ Successfully processed: 3
   ⏭️  Skipped (already done): 0
   ❌ Errors: 0
   📝 Total assignments: 3
============================================================
```

## What It Does

1. **Fetches** all assignments with `grading_criteria` but no `rubric_json`
2. **Parses** the criteria text using `rubricParser.ts`
3. **Validates** the parsed rubric structure
4. **Saves** the structured rubric to `rubric_json` column
5. **Reports** success/failure for each assignment

## After Running

### Verify in Database

```sql
SELECT 
  assignment_id,
  title,
  rubric_json IS NOT NULL as has_rubric,
  jsonb_array_length(rubric_json->'criteria') as criteria_count,
  (rubric_json->'scale'->>'total_points')::numeric as total_points
FROM grader.assignments
WHERE grading_criteria IS NOT NULL
ORDER BY created_at DESC;
```

### Check Rubric Structure

```sql
SELECT 
  title,
  rubric_json->'criteria' as criteria
FROM grader.assignments
WHERE assignment_id = 'your-assignment-id';
```

## Troubleshooting

### Script Fails to Parse

If an assignment fails to parse:

1. Check the `grading_criteria` format
2. Ensure it follows the expected pattern:
   ```
   **Category Name (XX pts):**
   - XX pts: Description
   - XX pts: Description
   ```
3. Manually fix the criteria text in the database
4. Re-run the script

### Missing Max Points in UI

If max points still don't show after running the script:

1. Check browser console for rubric structure
2. Verify `rubric_json` has `criteria` array with `max_points`
3. Grade a new submission to test
4. Check Netlify function logs for rubric parsing

## Future Assignments

**New assignments automatically get rubric_json!**

The `assignments.ts` endpoint now:
- Parses `grading_criteria` on creation
- Saves `rubric_json` automatically
- No manual script needed

## Related Files

- `scripts/populate-rubric-json.ts` - Population script
- `migrations/populate_rubric_json.sql` - SQL queries
- `netlify/functions/assignments.ts` - Auto-parsing on create
- `src/lib/calculator/rubricParser.ts` - Parsing logic
- `src/components/GradePanel.tsx` - Display logic

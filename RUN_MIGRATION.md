# Run Background Tasks Migration

## Quick Start

Run this command to create the `background_tasks` table:

```bash
psql "$NEON_DATABASE_URL" -f migrations/add_background_tasks.sql
```

## Verify Migration

Check that the table was created:

```sql
-- Connect to database
psql "$NEON_DATABASE_URL"

-- Check table exists
\dt grader.background_tasks

-- View table structure
\d grader.background_tasks

-- Exit
\q
```

## Expected Output

You should see:
- Table `grader.background_tasks` created
- 5 indexes created
- 2 constraints added
- Comments added

## After Migration

1. **Test locally:**
   ```bash
   npm run dev
   ```

2. **Upload a submission and click "Grade with AI"**

3. **Check background_tasks table:**
   ```sql
   SELECT * FROM grader.background_tasks ORDER BY created_at DESC LIMIT 5;
   ```

4. **Deploy to production:**
   ```bash
   git add .
   git commit -m "Add background grading to avoid timeouts"
   git push
   ```

## Rollback (if needed)

If you need to undo the migration:

```sql
DROP TABLE IF EXISTS grader.background_tasks CASCADE;
```

## Next Steps

After successful migration:
1. Test grading locally
2. Verify no timeout errors
3. Check Netlify function logs
4. Deploy to production
5. Monitor background_tasks table for job status

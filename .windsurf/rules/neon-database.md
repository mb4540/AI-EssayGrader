---
trigger: model_decision
---

# Neon Database Connection Rules

## Overview

This project uses **Neon Postgres** as the database backend. We leverage the **Neon Local Connect extension** for local development, which provides a static localhost connection string that routes to your Neon branch in the cloud.

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ VS Code 1.85.0+ (or Cursor, Windsurf, or other VS Code-compatible editor)
- ✅ Neon account with project created
- ✅ Neon API key (for ephemeral branches)

## Installation

### 1. Install Neon Local Connect Extension

**For VS Code:**
- Open VS Code Extensions Marketplace
- Search for "Neon Local Connect"
- Click Install

**For Cursor/Windsurf:**
- Open OpenVSX Registry
- Search for "Neon Local Connect"
- Follow your editor's installation process

### 2. Sign In to Neon

1. Open the Neon Local Connect panel in the sidebar
2. Click "Sign in"
3. Authenticate with Neon in your browser

## Connection Configuration

### Project Details

- **Organization**: Your Neon organization
- **Project**: `ai-essaygrader`
- **Database**: `ai-essaygrader`
- **Schema**: `grader`

### Connection String Format

Use this **static** connection string in your `.env` file:

```env
DATABASE_URL="postgres://neon:npg@localhost:5432/ai-essaygrader"
```

**Important:** This connection string never changes, even when switching branches. Neon Local handles all routing automatically.

## Branch Strategy

### Development Workflow

We use two types of branches:

#### 1. Existing Branches (Persistent)
Use for ongoing development and collaboration:
- **main** - Production branch (protected)
- **development** - Main development branch
- **feature/*** - Feature branches (e.g., `feature/new-grading-algorithm`)
- **bugfix/*** - Bug fix branches (e.g., `bugfix/submission-validation`)

#### 2. Ephemeral Branches (Temporary)
Use for testing, experiments, and CI:
- Automatically created when you connect
- Automatically deleted when you disconnect
- Perfect for isolated testing without cleanup scripts

### Creating a New Branch

**Via Extension:**
1. Open Neon Local Connect panel
2. Click "Create new branch..."
3. Enter branch name (e.g., `feature/user-authentication`)
4. Choose parent branch (e.g., `development`)
5. Extension connects you immediately

**Naming Convention:**
- Features: `feature/descriptive-name`
- Bug fixes: `bugfix/issue-description`
- Experiments: `experiment/test-name`
- Hotfixes: `hotfix/critical-fix`

## Database Schema

### Schema Structure

All tables are in the `grader` schema:

```
grader.students              - Student information
grader.assignments           - Assignment definitions
grader.submissions           - Essay submissions
grader.submission_versions   - Audit trail for edits
```

### Initial Setup

**Run once per new branch:**

1. Open Neon SQL Editor (via extension or browser)
2. Copy contents of `schema.sql`
3. Execute to create all tables and triggers

**Verify schema:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'grader'
ORDER BY table_name;
```

Expected result: 4 tables

## Development Rules

### 1. Connection Management

**DO:**
- ✅ Use the static `localhost:5432` connection string
- ✅ Connect to appropriate branch for your work
- ✅ Use ephemeral branches for testing
- ✅ Keep Docker Desktop running during development

**DON'T:**
- ❌ Hardcode production connection strings
- ❌ Commit `.env` files with real credentials
- ❌ Work directly on `main` branch
- ❌ Forget to disconnect from ephemeral branches (wastes resources)

### 2. Branch Switching

When switching branches:
1. Your app keeps using the same connection string
2. Neon Local automatically routes to the new branch
3. No need to restart your dev server
4. Schema changes are immediately reflected

### 3. Schema Changes

**For schema modifications:**
1. Create a new migration file: `schema_migration_<description>.sql`
2. Test on a feature branch first
3. Document changes in migration file
4. Apply to `development` branch
5. After testing, apply to `main`

**Example migration file:**
```sql
-- schema_migration_add_teacher_notes.sql
-- Adds teacher_notes column to submissions table

ALTER TABLE grader.submissions 
ADD COLUMN teacher_notes TEXT;
```

### 4. Data Safety

**Before destructive operations:**
- Create a branch from current state
- Test on the branch first
- Use transactions for multi-step operations
- Keep backups of important data

**Dangerous operations (use with caution):**
```sql
TRUNCATE TABLE grader.submissions;  -- Removes all rows
DROP TABLE grader.submissions;      -- Deletes entire table
```

## Using Extension Features

### Database Schema View

**Access:** Neon Local Connect sidebar panel

**What you can do:**
- Browse databases, schemas, tables, columns
- See data types, constraints, relationships
- View primary and foreign keys
- Right-click tables for quick actions

**Quick Actions:**
- **Query Table** - Opens pre-filled SELECT query
- **View Table Data** - Opens spreadsheet-like editor
- **Truncate Table** - Remove all rows
- **Drop Table** - Delete table

### Built-in SQL Editor

**Open:** 
- Right-click table → "Query Table"
- Command Palette → "Neon: Open SQL Editor"
- Extension panel → "Open SQL Editor"

**Features:**
- Execute with `Ctrl+Enter` or Execute button
- View results in tabular format
- Sort, filter, export to CSV/JSON
- Performance statistics
- Error highlighting

**Example queries:**
```sql
-- Get all submissions for a student
SELECT * FROM grader.submissions 
WHERE student_ref = (
  SELECT id FROM grader.students 
  WHERE student_name = 'John Doe'
);

-- Get average grades by assignment
SELECT 
  a.title,
  AVG(s.teacher_grade) as avg_grade,
  COUNT(*) as submission_count
FROM grader.submissions s
JOIN grader.assignments a ON s.assignment_ref = a.id
GROUP BY a.title;
```

### Table Data Editor

**Access:** Right-click table → "View Table Data"

**Features:**
- Paginated display for large datasets
- Edit rows inline (requires primary key)
- Insert new rows
- Delete rows (requires primary key)
- Sort and filter columns
- Visual NULL indicators

**Note:** Editing requires tables to have primary keys defined.

### PSQL Shell

**Launch:** 
- Extension panel → "Launch PSQL"
- Right-click database → "Launch PSQL"

**Use for:**
- Complex queries
- Bulk operations
- Database administration
- Debugging

**Example:**
```bash
# In integrated terminal
\dt grader.*          # List all tables in grader schema
\d grader.submissions # Describe submissions table
\q                    # Quit psql
```

## Environment Configuration

### Local Development (.env)

```env
# Neon Local Connect (static localhost)
DATABASE_URL="postgres://neon:npg@localhost:5432/ai-essaygrader"

# Other required variables
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
ALLOW_BLOB_STORAGE=false
APP_BASE_URL=http://localhost:8888
```

### Production (Netlify)

Use the **actual Neon connection string** from Neon dashboard:

```env
DATABASE_URL="postgresql://[user]:[password]@[host].neon.tech/ai-essaygrader?sslmode=require"
```

**Set in Netlify:**
1. Go to Site settings → Environment variables
2. Add `DATABASE_URL` with full Neon connection string
3. Never use localhost in production

## Common Commands

### Via Command Palette (Cmd+Shift+P / Ctrl+Shift+P)

```
Neon Local Connect: Import API Key       - Add Neon API key
Neon Local Connect: Launch PSQL          - Open psql shell
Neon Local Connect: Open SQL Editor      - Launch SQL editor
Neon Local Connect: Open Table View      - Browse in Neon Console
Neon Local Connect: Disconnect           - Stop local proxy
Neon Local Connect: Clear Authentication - Remove stored tokens
```

### Branch Management

**Reset Branch:**
1. Right-click branch in Database Schema view
2. Select "Reset from Parent Branch"
3. Branch instantly reverts to parent's current state

**Use case:** Quickly discard all changes and start fresh

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to localhost:5432
- ✅ Ensure Docker Desktop is running
- ✅ Check Neon Local Connect extension is active
- ✅ Verify you're connected to a branch in the extension
- ✅ Restart the extension or VS Code

**Problem:** "Database does not exist"
- ✅ Verify database name is `ai-essaygrader`
- ✅ Check you're connected to the correct project
- ✅ Ensure branch has been initialized with schema

**Problem:** "Schema 'grader' does not exist"
- ✅ Run `schema.sql` on the current branch
- ✅ Verify schema creation with: `\dn` in psql

### Performance Issues

**Slow queries:**
- Check query execution plan: `EXPLAIN ANALYZE <query>`
- Add indexes if needed
- Use ephemeral branch for testing

**Connection timeouts:**
- Neon free tier may sleep after inactivity
- Wake up database by running a simple query
- Consider upgrading plan for always-on databases

### Data Issues

**Missing data:**
- Verify you're on the correct branch
- Check if data exists in parent branch
- Use branch reset if needed

**Unexpected data:**
- Confirm branch isolation
- Check if ephemeral branch was auto-deleted
- Review recent migrations

## Best Practices

### 1. Branch Hygiene
- Use ephemeral branches for experiments
- Delete feature branches after merging
- Keep `main` and `development` clean
- Regular branch resets for testing branches

### 2. Query Optimization
- Use indexes for frequently queried columns
- Avoid `SELECT *` in production code
- Use prepared statements to prevent SQL injection
- Monitor query performance

### 3. Data Management
- Regular backups of important branches
- Test migrations on feature branches first
- Use transactions for multi-step operations
- Document schema changes

### 4. Security
- Never commit real connection strings
- Use environment variables for all credentials
- Rotate API keys periodically
- Limit access to production branches

## Integration with Application

### Netlify Functions

All database operations go through Netlify Functions:

```typescript
// netlify/functions/db.ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);
```

**In development:** Uses `localhost:5432` (Neon Local)
**In production:** Uses actual Neon connection string

### Health Check

Test database connectivity:

```bash
# Local
curl http://localhost:8888/api/health-check

# Production
curl https://ai-essaygrader.netlify.app/api/health-check
```

Expected response includes database connection status and schema validation.

## Resources

- **Neon Documentation**: https://neon.tech/docs
- **Neon Local Connect**: https://neon.tech/docs/guides/neon-local
- **Branching Guide**: https://neon.tech/docs/guides/branching
- **API Reference**: https://neon.tech/docs/reference/api-reference
- **Discord Support**: https://discord.gg/neon

## Quick Reference Card

| Task | Action |
|------|--------|
| Connect to branch | Neon panel → Select org/project/branch |
| Create branch | Neon panel → "Create new branch..." |
| Switch branch | Neon panel → Select different branch |
| View schema | Neon panel → Database Schema view |
| Run query | Right-click table → "Query Table" |
| Edit data | Right-click table → "View Table Data" |
| Open psql | Neon panel → "Launch PSQL" |
| Reset branch | Right-click branch → "Reset from Parent" |
| Disconnect | Command Palette → "Neon: Disconnect" |

---

**Remember:** The beauty of Neon Local Connect is the static connection string. Set it once, switch branches freely, and never update your app config again!

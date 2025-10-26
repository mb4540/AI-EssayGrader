# FastAI Grader - Setup Guide

This guide will help you initialize your FastAI Grader project with Netlify and Neon database.

## Prerequisites

- Node.js 18+ installed
- Netlify account (free tier available)
- Neon Postgres account (free tier available)
- OpenAI API key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Neon Database

### 2.1 Get Database Connection String

From your Neon dashboard screenshot, you should have:
- **Project ID**: `3c7c0483-dcd0-4411-b740-2921f8d8dc3`
- **Connection String**: Available in the "Connection Details" section

### 2.2 Run Database Schema

1. Open your Neon SQL Editor (https://console.neon.tech)
2. Select your database: `ai-essaygrader`
3. Copy the contents of `schema.sql` from this project
4. Paste and execute in the SQL Editor

This will create:
- `grader.students` table
- `grader.assignments` table
- `grader.submissions` table
- `grader.submission_versions` table (for audit trail)

### 2.3 Verify Tables Created

Run this query in Neon SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'grader';
```

You should see 4 tables listed.

## Step 3: Configure Environment Variables

### 3.1 Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual credentials:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   OPENAI_MODEL=gpt-4o-mini
   DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/ai-essaygrader?sslmode=require
   ALLOW_BLOB_STORAGE=false
   APP_BASE_URL=http://localhost:8888
   ```

   **Get your DATABASE_URL from Neon:**
   - Go to Neon Dashboard → Your Project → Connection Details
   - Copy the connection string
   - It should look like: `postgresql://[user]:[password]@ep-[xxx].us-east-2.aws.neon.tech/ai-essaygrader?sslmode=require`

### 3.2 Netlify Production

From your Netlify dashboard screenshot, you need to set environment variables:

1. Go to: https://app.netlify.com/sites/ai-essaygrader/configuration
2. Navigate to: **Site settings → Environment variables**
3. Add the following variables:

   | Variable Name | Value | Notes |
   |--------------|-------|-------|
   | `DATABASE_URL` | Your Neon connection string | From Neon dashboard |
   | `OPENAI_API_KEY` | Your OpenAI API key | From OpenAI dashboard |
   | `OPENAI_MODEL` | `gpt-4o-mini` | Or your preferred model |
   | `ALLOW_BLOB_STORAGE` | `false` | Set to `true` if using Netlify Blobs |
   | `APP_BASE_URL` | `https://ai-essaygrader.netlify.app` | Your Netlify domain |

4. Click **Save** after adding each variable

## Step 4: Test Local Development

### 4.1 Install Netlify CLI (if not already installed)

```bash
npm install -g netlify-cli
```

### 4.2 Link to Netlify Site

```bash
netlify link
```

Select your existing site: `ai-essaygrader`

### 4.3 Start Development Server

```bash
netlify dev
```

This will:
- Start Vite dev server (frontend)
- Start Netlify Functions (backend)
- Make the app available at `http://localhost:8888`

### 4.4 Verify Connection

1. Open browser to `http://localhost:8888`
2. You should see the FastAI Grader home page
3. Check the status cards:
   - **Netlify Functions**: Should show green checkmark
   - **Neon Database**: Should show green checkmark

If you see red X marks, check:
- Environment variables are set correctly in `.env`
- Database schema has been run in Neon
- Database connection string is correct

## Step 5: Deploy to Netlify

### 5.1 Build and Deploy

```bash
netlify deploy --prod
```

Or push to GitHub and let Netlify auto-deploy:

```bash
git add .
git commit -m "Initial setup complete"
git push origin main
```

### 5.2 Verify Production Deployment

1. Go to: https://app.netlify.com/sites/ai-essaygrader/deploys
2. Wait for deployment to complete
3. Visit your site: `https://ai-essaygrader.netlify.app`
4. Verify both status cards show green checkmarks

## Step 6: Test the Health Check Endpoint

You can test the health check directly:

**Local:**
```bash
curl http://localhost:8888/api/health-check
```

**Production:**
```bash
curl https://ai-essaygrader.netlify.app/api/health-check
```

Expected response:
```json
{
  "status": "ok",
  "message": "Database connected successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Database Connection Errors

**Error:** `DATABASE_URL environment variable is not set`
- **Solution:** Make sure `.env` file exists locally or environment variables are set in Netlify dashboard

**Error:** `Connection refused` or `timeout`
- **Solution:** Check that your Neon database is active (free tier may sleep after inactivity)
- Go to Neon dashboard and wake up the database

**Error:** `schema "grader" does not exist`
- **Solution:** Run the `schema.sql` file in Neon SQL Editor

### Netlify Function Errors

**Error:** `404 Not Found` on `/api/health-check`
- **Solution:** Make sure functions are built and deployed
- Check `netlify.toml` configuration is correct
- Verify `netlify/functions/` directory exists

**Error:** Functions work locally but not in production
- **Solution:** Verify environment variables are set in Netlify dashboard (not just `.env`)

### Build Errors

**Error:** `Module not found`
- **Solution:** Run `npm install` to ensure all dependencies are installed

**Error:** TypeScript compilation errors
- **Solution:** Run `npm run build` locally to see detailed errors

## Next Steps

Once your setup is complete and both status cards show green:

1. **Explore the codebase:**
   - `src/pages/Dashboard.tsx` - Simple home page (current)
   - `src/pages/DashboardOld.tsx` - Full dashboard with submissions list
   - `src/pages/Submission.tsx` - Essay grading page
   - `netlify/functions/` - Backend API functions

2. **Start building features:**
   - You can gradually bring back features from `DashboardOld.tsx`
   - Add new pages and functionality
   - Customize the UI to your needs

3. **Test the full application:**
   - Try creating a submission
   - Test the AI grading functionality
   - Verify data is persisted in Neon database

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Netlify function logs: https://app.netlify.com/sites/ai-essaygrader/logs
3. Check Neon database logs in the Neon dashboard
4. Review the main README.md for additional documentation

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Keep your OpenAI API key secure
- Rotate database credentials if they're exposed
- Use environment variables for all sensitive data

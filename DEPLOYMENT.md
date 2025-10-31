# Deployment Guide

**Last Updated:** October 31, 2025  
**Status:** Production Ready - FERPA Compliant

---

## 🚀 Quick Deploy to Netlify

### Prerequisites

- [ ] Neon Postgres database created
- [ ] OpenAI API key obtained
- [ ] Code pushed to Git repository
- [ ] Netlify account created

### Step 1: Database Setup

1. **Create Neon Database**:
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your connection string

2. **Run Migrations**:
   - Open Neon SQL Editor
   - Run migrations in order:
     ```sql
     -- 1. Main schema (if not exists)
     -- Run: migrations/schema_migration_ferpa_compliance.sql
     
     -- 2. FERPA migration
     -- Run: migrations/FERPA_MIGRATION_SIMPLE.sql
     
     -- 3. Version table fix
     -- Run: migrations/fix_submission_versions_table.sql
     
     -- 4. Missing columns
     -- Run: migrations/add_missing_submission_columns.sql
     
     -- 5. Grading criteria
     -- Run: migrations/add_grading_criteria_to_assignments.sql
     ```

### Step 2: Deploy to Netlify

#### Option A: Netlify UI (Recommended)

1. **Connect Repository**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

2. **Configure Build Settings**:
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `dist` (auto-detected)
   - Functions directory: `netlify/functions` (auto-detected)

3. **Add Environment Variables**:
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     OPENAI_API_KEY=sk-...
     OPENAI_MODEL=gpt-4o-mini
     DATABASE_URL=postgres://...
     ```

4. **Deploy**:
   - Click "Deploy site"
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at `https://[random-name].netlify.app`

#### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set OPENAI_API_KEY "sk-..."
netlify env:set OPENAI_MODEL "gpt-4o-mini"
netlify env:set DATABASE_URL "postgres://..."

# Deploy to production
netlify deploy --prod
```

### Step 3: Post-Deployment Setup

1. **Set Custom Domain** (Optional):
   - Go to Site settings → Domain management
   - Add custom domain
   - Configure DNS

2. **Test Deployment**:
   - Visit your site URL
   - Navigate to Students page
   - Create a new bridge
   - Add test students
   - Create a test submission
   - Run grading
   - Verify everything works

3. **Create First Assignment**:
   - Click "New Assignment"
   - Enter title: "Personal Narrative"
   - Add grading criteria
   - Save

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `DATABASE_URL` | Neon Postgres connection string | `postgres://user:pass@host/db` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_MAX_TOKENS` | Max tokens for AI response | `2000` |
| `OPENAI_TEMPERATURE` | AI creativity (0-2) | `0.7` |

---

## 📊 Database Schema

### Tables Created

1. **grader.students**
   - `student_id` (uuid, PK) - Anonymous UUID
   - `tenant_id` (uuid) - Multi-tenancy support
   - `created_at` (timestamptz)
   - **NO PII** - Names stored locally only

2. **grader.submissions**
   - `submission_id` (uuid, PK)
   - `student_id` (uuid, FK)
   - `assignment_id` (uuid, FK)
   - `tenant_id` (uuid)
   - `source_type` (text)
   - `verbatim_text` (text)
   - `draft_mode` (text)
   - `rough_draft_text` (text)
   - `final_draft_text` (text)
   - `teacher_criteria` (text)
   - `ai_grade` (numeric)
   - `ai_feedback` (jsonb)
   - `teacher_grade` (numeric)
   - `teacher_feedback` (text)
   - `image_url` (text)
   - `original_file_url` (text)
   - `created_at`, `updated_at` (timestamptz)

3. **grader.assignments**
   - `assignment_id` (uuid, PK)
   - `tenant_id` (uuid)
   - `title` (text)
   - `description` (text)
   - `grading_criteria` (text)
   - `created_at` (timestamptz)

4. **grader.submission_versions**
   - `version_id` (uuid, PK)
   - `submission_id` (uuid, FK)
   - `ai_grade`, `ai_feedback`
   - `teacher_grade`, `teacher_feedback`
   - `draft_mode`, `rough_draft_text`, `final_draft_text`
   - `changed_by` (uuid)
   - `snapshot_at` (timestamptz)

---

## 🔍 Verification Checklist

After deployment, verify:

### Functionality
- [ ] Site loads without errors
- [ ] Students page accessible
- [ ] Can create/unlock bridge
- [ ] Can add students to bridge
- [ ] Dashboard loads
- [ ] Can create assignment
- [ ] Can create submission
- [ ] AI grading works
- [ ] Teacher feedback saves
- [ ] Can view submission
- [ ] Can delete submission
- [ ] CSV export works

### FERPA Compliance
- [ ] No student names in database (check Neon)
- [ ] Only UUIDs in submissions table
- [ ] Bridge file encrypted locally
- [ ] Names resolve from bridge
- [ ] Network requests contain no PII (check DevTools)

### Performance
- [ ] Page load < 3 seconds
- [ ] AI grading < 15 seconds
- [ ] Dashboard loads < 2 seconds
- [ ] No console errors

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Module not found`
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error:** `TypeScript errors`
```bash
# Check TypeScript
npm run type-check
```

### Functions Fail

**Error:** `Database connection failed`
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Test connection in Neon SQL Editor

**Error:** `OpenAI API error`
- Verify `OPENAI_API_KEY` is valid
- Check API quota in OpenAI dashboard
- Verify model name is correct

### Runtime Errors

**Error:** `Student not found`
- Ensure bridge is unlocked
- Check student exists in bridge
- Verify UUID matches

**Error:** `Column does not exist`
- Run all migrations in order
- Check database schema matches expected

---

## 📈 Monitoring

### Netlify Dashboard

Monitor your deployment:
- **Functions**: View function logs and errors
- **Analytics**: Track usage and performance
- **Bandwidth**: Monitor data transfer
- **Build logs**: Debug build issues

### Database Monitoring

Monitor your Neon database:
- **Queries**: View slow queries
- **Storage**: Track database size
- **Connections**: Monitor active connections

---

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Pull latest changes
git pull origin main

# Test locally
netlify dev

# Deploy to production
netlify deploy --prod
```

### Database Migrations

When adding new migrations:
1. Test locally first
2. Backup production database
3. Run migration in Neon SQL Editor
4. Verify with test queries
5. Deploy code changes

### Rollback Procedure

If deployment fails:
1. Go to Netlify dashboard
2. Deploys → Select previous working deploy
3. Click "Publish deploy"
4. Investigate issue before redeploying

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] FERPA compliance verified
- [ ] All features tested
- [ ] No console errors
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Backup bridge file created
- [ ] Documentation reviewed
- [ ] Team trained on usage

---

## 📞 Support

For deployment issues:
- Check Netlify build logs
- Check function logs
- Review database logs
- See `TROUBLESHOOTING.md` for common issues
- See `FUTURE_WORK.md` for planned enhancements

---

**Congratulations! Your FERPA-compliant AI grading assistant is now live!** 🎉

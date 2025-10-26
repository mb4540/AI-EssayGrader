# FastAIGrader Deployment Checklist

Use this checklist to ensure successful deployment.

## Pre-Deployment

### Database Setup
- [ ] Neon account created
- [ ] New Neon project created
- [ ] Connection string copied
- [ ] `schema.sql` executed in Neon SQL Editor
- [ ] All 4 tables created successfully:
  - [ ] grader.students
  - [ ] grader.assignments
  - [ ] grader.submissions
  - [ ] grader.submission_versions
- [ ] Trigger function created (touch_updated_at)

### API Keys
- [ ] OpenAI account created
- [ ] OpenAI API key generated
- [ ] API key has available credits/quota
- [ ] Tested API key with a simple curl request (optional)

### Local Environment
- [ ] `.env` file created (from `.env.example`)
- [ ] `OPENAI_API_KEY` set in `.env`
- [ ] `DATABASE_URL` set in `.env`
- [ ] `OPENAI_MODEL` set (or using default gpt-4o-mini)
- [ ] No trailing spaces or quotes in `.env` values

### Dependencies
- [ ] Node.js 18+ installed (`node --version`)
- [ ] All npm packages installed (`npm install`)
- [ ] No critical vulnerabilities (`npm audit`)
- [ ] Netlify CLI installed (`netlify --version`)

## Local Testing

### Basic Functionality
- [ ] `netlify dev` starts without errors
- [ ] Frontend loads at http://localhost:8888
- [ ] No console errors in browser
- [ ] Can navigate between pages

### Database Connection
- [ ] Functions can connect to Neon database
- [ ] Check Netlify Dev logs for connection errors
- [ ] Test a simple query (via function)

### Core Features
- [ ] Can create submission (text input)
- [ ] Can run AI grading
- [ ] AI returns structured feedback
- [ ] Can save teacher edits
- [ ] Dashboard loads submissions
- [ ] Can export to CSV

### File Upload Features
- [ ] Image upload works (OCR processing)
- [ ] DOCX upload works (text extraction)
- [ ] Progress indicators show during processing

## Netlify Deployment

### Account Setup
- [ ] Netlify account created
- [ ] GitHub/GitLab/Bitbucket connected (if using Git deploy)
- [ ] Repository pushed to Git (if using Git deploy)

### Site Configuration
- [ ] New site created in Netlify
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Functions directory: `netlify/functions`
- [ ] Node version: 18

### Environment Variables (Netlify Dashboard)
- [ ] Navigate to Site settings → Environment variables
- [ ] Add `OPENAI_API_KEY` (production key)
- [ ] Add `DATABASE_URL` (Neon connection string)
- [ ] Add `OPENAI_MODEL` (optional)
- [ ] Add `APP_BASE_URL` (your Netlify URL)
- [ ] Variables set for "Production" context

### Initial Deploy
- [ ] Deploy triggered (via CLI or Git push)
- [ ] Build completes successfully
- [ ] No build errors in deploy log
- [ ] Functions deployed successfully
- [ ] Site is live at Netlify URL

## Post-Deployment Testing

### Production Smoke Tests
- [ ] Site loads at production URL
- [ ] No console errors
- [ ] Can create a test submission
- [ ] AI grading works in production
- [ ] Can save edits
- [ ] Dashboard displays data
- [ ] CSV export works

### Performance
- [ ] Page load time < 3 seconds
- [ ] AI grading completes < 15 seconds
- [ ] No timeout errors
- [ ] Images/assets load correctly

### Database
- [ ] Check Neon dashboard for new records
- [ ] Verify data is being saved correctly
- [ ] Check submission_versions for audit trail
- [ ] No connection pool errors

## Security Review

### Environment Variables
- [ ] No API keys in source code
- [ ] `.env` file in `.gitignore`
- [ ] Production keys different from development
- [ ] Keys rotated if accidentally exposed

### Database
- [ ] Connection string uses SSL
- [ ] No public database access
- [ ] Only Netlify Functions can access DB

### Privacy
- [ ] `ALLOW_BLOB_STORAGE` set to `false` (default)
- [ ] No student files stored permanently
- [ ] Only text and grades persisted

## Optional Enhancements

### Domain Setup
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] DNS records updated

### Monitoring
- [ ] Netlify Analytics enabled (optional)
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring (optional)

### Backups
- [ ] Neon automatic backups enabled
- [ ] Export schedule for CSV data (optional)

## Troubleshooting

### If deployment fails:
1. Check Netlify deploy logs for errors
2. Verify all environment variables are set
3. Ensure `netlify.toml` is in root directory
4. Check Node version compatibility

### If functions fail:
1. Check function logs in Netlify dashboard
2. Verify DATABASE_URL is correct
3. Test database connection from Neon dashboard
4. Check OpenAI API key is valid

### If grading fails:
1. Verify OpenAI API key has credits
2. Check function timeout (default 10s, may need increase)
3. Review OpenAI API status page
4. Check function logs for error details

## Success Criteria

✅ **MVP is complete when:**
- Teacher can upload/paste student work
- AI provides structured feedback in < 15 seconds
- Teacher can edit and save grades
- All submissions viewable in dashboard
- CSV export includes all data
- No critical errors in production

## Next Steps After Deployment

1. **User Testing**: Have a teacher test with real submissions
2. **Feedback Collection**: Gather input on grading accuracy
3. **Rubric Refinement**: Adjust criteria based on results
4. **Performance Monitoring**: Track response times
5. **Feature Requests**: Plan next iteration

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Production URL:** _____________

**Notes:**

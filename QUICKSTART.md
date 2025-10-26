# FastAIGrader - Quick Start Guide

Get your AI grading assistant running in 15 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Neon account ([sign up free](https://neon.tech))

## Step 1: Database Setup (5 minutes)

1. **Create Neon Database**
   - Go to https://neon.tech
   - Sign up/login and create a new project
   - Copy your connection string (looks like: `postgres://user:pass@host/db`)

2. **Run Schema**
   - In Neon dashboard, click "SQL Editor"
   - Open `schema.sql` from this project
   - Copy all contents and paste into SQL Editor
   - Click "Run" to create tables

## Step 2: Configure Environment (2 minutes)

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your credentials
# OPENAI_API_KEY=sk-...
# DATABASE_URL=postgres://...
```

## Step 3: Install Dependencies (2 minutes)

```bash
npm install
```

## Step 4: Test Locally (1 minute)

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Start development server
netlify dev
```

Open http://localhost:8888 in your browser!

## Step 5: Try It Out

1. **Create a submission:**
   - Click "New Submission" or go to main page
   - Choose input method (Text/Image/DOCX)
   - Enter student name: "John Doe"
   - Paste or upload student work
   - Enter grading criteria (or use the example)
   - Click "Run Grade"

2. **Review AI feedback:**
   - See overall grade (0-100)
   - Review grammar, spelling, structure findings
   - Read supportive summary

3. **Edit and save:**
   - Adjust grade if needed
   - Modify feedback
   - Click "Save"

4. **View dashboard:**
   - Click "Dashboard"
   - See all submissions
   - Export to CSV

## Deploy to Production (5 minutes)

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

**Important:** Add environment variables in Netlify dashboard:
1. Go to Site settings → Environment variables
2. Add `OPENAI_API_KEY`
3. Add `DATABASE_URL`
4. Add `OPENAI_MODEL` (optional, defaults to gpt-4o-mini)

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` in `.env`
- Ensure Neon database is active (may sleep on free tier)
- Verify schema was run successfully

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is correct
- Check you have credits in OpenAI account
- Ensure no extra spaces in `.env` file

### "Port already in use"
- Stop other dev servers
- Or specify different port: `netlify dev --port 8889`

### OCR not working
- Ensure image is clear and high contrast
- Try with typed text first to verify setup
- Check browser console for errors

## Example Grading Criteria

```
Scoring (100 pts total):
- Organization (20): clear intro, body, conclusion
- Evidence/Examples (20): supports main idea
- Grammar & Mechanics (25): capitalization, punctuation, subject-verb
- Spelling (15)
- Clarity & Style (20): precise words, transitions

Penalties:
- Off-topic: -10
- Too short (< 200 words): -10
```

## What's Next?

- Customize grading criteria for your class
- Create assignments to organize submissions
- Export grades to CSV for your gradebook
- Review version history for any submission

## Need Help?

- Check the full [README.md](./README.md) for detailed documentation
- Review [PROJECT_STATUS.md](./PROJECT_STATUS.md) for architecture details
- Open an issue on GitHub

---

**Privacy Note:** By default, no files are stored. Only text and grades are persisted in your Neon database. You control all data.

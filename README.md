# FastAIGrader

A privacy-conscious, production-ready web application that dramatically reduces grading time for 6th-grade ELA teachers using AI-powered feedback.

## Features

- 📝 **Multiple Input Methods**: Upload handwritten photos (OCR), DOCX files, or paste plain text
- 🤖 **AI-Powered Grading**: OpenAI integration with structured feedback (grammar, spelling, structure, evidence)
- ✏️ **Teacher Override**: Edit AI suggestions with full version history
- 📊 **Dashboard**: Search, filter, and export submissions to CSV
- 🔒 **FERPA Compliant**: Student names encrypted locally, only UUIDs stored in cloud
- 🛡️ **Student Identity Bridge**: Secure local storage of student information
- ⚡ **Fast**: Sub-10s grading target with streaming UI status

## Tech Stack

- **Frontend**: React + Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Netlify Functions (serverless)
- **Database**: Neon Postgres (serverless)
- **AI**: OpenAI (gpt-4o-mini or configurable)
- **OCR**: tesseract.js (client-side)
- **DOCX**: mammoth (client-side)

## Prerequisites

- Node.js 18+
- npm or yarn
- Neon Postgres account (free tier available)
- OpenAI API key
- Netlify account (for deployment)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd FastAIGrader
npm install
```

### 2. Database Setup

1. Create a free Neon Postgres database at [neon.tech](https://neon.tech)
2. Copy your connection string (it should look like: `postgres://USER:PASSWORD@HOST/db`)
3. Run the SQL schema:
   - Open the Neon SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Execute the script

### 3. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   DATABASE_URL=postgres://USER:PASSWORD@HOST/db
   ALLOW_BLOB_STORAGE=false
   APP_BASE_URL=http://localhost:8888
   ```

### 4. Local Development

Install Netlify CLI if you haven't already:
```bash
npm install -g netlify-cli
```

Start the development server:
```bash
netlify dev
```

This will start:
- Frontend dev server (Vite) on port 5173
- Netlify Functions on port 8888
- Access the app at `http://localhost:8888`

### 5. Deploy to Netlify

#### Option A: Deploy via Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Deploy via Git

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Configure build settings (should auto-detect from `netlify.toml`)
6. Add environment variables in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add: `OPENAI_API_KEY`, `OPENAI_MODEL`, `DATABASE_URL`

## Usage

### Creating a Submission

1. Navigate to the main grading page
2. Choose input method:
   - **Text**: Paste student work directly
   - **Image**: Upload photo of handwritten work (OCR will extract text)
   - **DOCX**: Upload Word document
3. Enter student name/ID
4. (Optional) Select or create an assignment
5. Enter grading criteria/rubric
6. Click "Run Grade"

### Reviewing and Editing Grades

1. AI feedback appears in the right panel with:
   - Overall grade (0-100)
   - Grammar, spelling, structure, and evidence findings
   - Top 3 suggestions for improvement
   - Supportive summary
2. Edit the grade or feedback as needed
3. Click "Save" to persist teacher edits
4. All changes are versioned for audit trail

### Dashboard and Export

1. Navigate to Dashboard
2. Search by student name or filter by assignment
3. Click "Export CSV" to download all submissions
4. CSV includes: student info, assignment, grades, feedback, timestamps

## Project Structure

```
FastAIGrader/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── FileDrop.tsx     # File upload with OCR
│   │   ├── CriteriaInput.tsx
│   │   ├── VerbatimViewer.tsx
│   │   └── GradePanel.tsx
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── schema.ts        # Zod validation schemas
│   │   ├── ocr.ts           # Tesseract.js helpers
│   │   ├── docx.ts          # Mammoth helpers
│   │   └── csv.ts           # CSV export
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── Submission.tsx
│   ├── App.tsx
│   └── main.tsx
├── netlify/
│   └── functions/
│       ├── db.ts            # Database connection
│       ├── ingest.ts        # Create submission
│       ├── grade.ts         # AI grading
│       ├── save-teacher-edits.ts
│       ├── list.ts          # List submissions
│       └── get-submission.ts
├── schema.sql               # Database schema
├── netlify.toml             # Netlify configuration
└── .env.example             # Environment template
```

## API Endpoints

All endpoints are available at `/.netlify/functions/` or `/api/` (via redirect):

- **POST /api/ingest** - Create new submission
- **POST /api/grade** - Grade a submission with AI
- **POST /api/save-teacher-edits** - Save teacher modifications
- **GET /api/list** - List submissions (with filters)
- **GET /api/get-submission** - Get single submission by ID

## Grading Rubric Example

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

## FERPA Compliance & Privacy

### Student Identity Bridge
FastAIGrader implements a **Student Identity Bridge** pattern to ensure FERPA compliance:

- **Zero PII in Cloud**: Student names and district IDs are NEVER sent to the cloud database
- **Local Encryption**: Student information is encrypted locally using AES-256-GCM
- **UUID-Only Storage**: Only anonymous UUIDs are stored in the database
- **Local Resolution**: Student names are resolved locally from the encrypted bridge file
- **Secure Passphrase**: Bridge file protected by teacher-chosen passphrase

### Setting Up the Student Bridge

1. **First Time Setup**:
   - Navigate to the "Students" page
   - Click "Create New Bridge"
   - Enter a secure passphrase (you'll need this every session)
   - Add your students with names and local IDs

2. **Daily Use**:
   - Navigate to "Students" page
   - Click "Unlock Bridge"
   - Enter your passphrase
   - Bridge remains unlocked for your session

3. **Backup Your Bridge**:
   - Click "Export" to download your encrypted bridge file
   - Store securely (this file contains student names)
   - Never commit to Git or share publicly

### Additional Security

- **No file storage**: By default, only text and grades are persisted
- **Minimal metadata**: No third-party analytics
- **Parameterized SQL**: Protection against SQL injection
- **Environment variables**: Sensitive credentials never in code
- **Version history**: Immutable audit trail of all grade changes

## Troubleshooting

### OCR not working
- Ensure image is clear and high contrast
- Try preprocessing image (increase contrast, convert to grayscale)
- tesseract.js works best with printed or clear handwriting

### Database connection errors
- Verify `DATABASE_URL` is correct in environment variables
- Check Neon database is active (free tier may sleep after inactivity)
- Ensure schema has been run (`schema.sql`)

### OpenAI API errors
- Verify `OPENAI_API_KEY` is valid
- Check API quota/billing in OpenAI dashboard
- Ensure `OPENAI_MODEL` is a valid model name

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Contributing

This is a production application for educational use. Contributions welcome!

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
# FastAI Grader - Command Reference

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Start local development server
netlify dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Netlify CLI
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to existing site
netlify link

# Deploy to production
netlify deploy --prod

# View site in browser
netlify open

# View function logs
netlify functions:log health-check
```

### Database Management
```bash
# Connect to Neon database (use connection string from dashboard)
psql "postgresql://user:password@host.neon.tech/ai-essaygrader?sslmode=require"

# Run schema
psql "YOUR_DATABASE_URL" < schema.sql

# Run migrations (if needed)
psql "YOUR_DATABASE_URL" < schema_migration_*.sql
```

### Git Commands
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

## Environment Setup

### Create .env file
```bash
cp .env.example .env
```

### Required Environment Variables
- `DATABASE_URL` - Neon Postgres connection string
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)
- `APP_BASE_URL` - Application URL
- `ALLOW_BLOB_STORAGE` - Enable file storage (default: false)

## Testing Endpoints

### Health Check
```bash
# Local
curl http://localhost:8888/api/health-check

# Production
curl https://ai-essaygrader.netlify.app/api/health-check
```

### List Submissions
```bash
# Local
curl http://localhost:8888/api/list

# Production
curl https://ai-essaygrader.netlify.app/api/list
```

## Useful URLs

### Local Development
- **App**: http://localhost:8888
- **Vite Dev Server**: http://localhost:5173
- **Functions**: http://localhost:8888/.netlify/functions

### Production (Update with your domain)
- **App**: https://ai-essaygrader.netlify.app
- **Netlify Dashboard**: https://app.netlify.com/sites/ai-essaygrader
- **Neon Dashboard**: https://console.neon.tech

## Troubleshooting Commands

### Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Node version
```bash
node --version  # Should be 18+
```

### Check Netlify CLI version
```bash
netlify --version
```

### View Netlify environment variables
```bash
netlify env:list
```

### Set Netlify environment variable
```bash
netlify env:set VARIABLE_NAME "value"
```

## File Structure Reference

```
AI-EssayGrader/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx      # Simple home page (NEW)
│   │   ├── DashboardOld.tsx   # Full dashboard (backup)
│   │   ├── Submission.tsx     # Essay grading page
│   │   └── Help.tsx           # Help page
│   ├── components/            # UI components
│   ├── lib/                   # Utilities and API
│   └── main.tsx              # App entry point
├── netlify/
│   └── functions/            # Backend API functions
├── schema.sql                # Database schema
├── netlify.toml              # Netlify configuration
├── .env.example              # Environment template
├── SETUP_GUIDE.md            # Detailed setup instructions
└── QUICKSTART.md             # Quick start guide
```

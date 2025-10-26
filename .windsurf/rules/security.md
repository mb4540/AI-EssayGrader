# Security Best Practices

## Overview
Security guidelines and best practices for the FastAI Grader project to protect sensitive data and prevent vulnerabilities.

## Table of Contents
- [Environment Variables](#environment-variables)
- [API Keys and Secrets](#api-keys-and-secrets)
- [Input Validation](#input-validation)
- [SQL Injection Prevention](#sql-injection-prevention)
- [Data Sanitization](#data-sanitization)
- [Error Messages](#error-messages)
- [CORS Configuration](#cors-configuration)

## Core Principles

1. **Never trust user input** - Validate and sanitize everything
2. **Secrets stay secret** - Never commit or log sensitive data
3. **Least privilege** - Only access what's needed
4. **Defense in depth** - Multiple layers of security
5. **Fail securely** - Errors shouldn't expose system details

## Environment Variables

### Storage

**DO:**
- ✅ Store in `.env` file (local development)
- ✅ Store in Netlify dashboard (production)
- ✅ Use `.env.example` as template (no real values)
- ✅ Add `.env` to `.gitignore`

**DON'T:**
- ❌ Commit `.env` files to Git
- ❌ Hardcode secrets in code
- ❌ Share `.env` files via email/Slack
- ❌ Store secrets in frontend code

### Access Pattern

```typescript
// Check if required variables exist
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Use with fallback defaults (non-sensitive only)
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const port = process.env.PORT || 8888;
```

### Validation

```typescript
// Validate format of sensitive variables
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
  throw new Error('Invalid DATABASE_URL format');
}

// Validate API key format
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY.startsWith('sk-')) {
  throw new Error('Invalid OPENAI_API_KEY format');
}
```

## API Keys and Secrets

### Never Log Secrets

**DON'T:**
```typescript
// NEVER do this
console.log('API Key:', process.env.OPENAI_API_KEY);
console.log('Database URL:', process.env.DATABASE_URL);
console.log('Request:', JSON.stringify(request));  // May contain secrets
```

**DO:**
```typescript
// Log safely
console.log('API Key:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('Database:', process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT CONFIGURED');

// Sanitize before logging
const sanitized = {
  ...request,
  apiKey: '[REDACTED]',
  password: '[REDACTED]',
};
console.log('Request:', JSON.stringify(sanitized));
```

### Never Expose in Responses

**DON'T:**
```typescript
return {
  statusCode: 500,
  body: JSON.stringify({
    error: 'Database connection failed',
    connectionString: process.env.DATABASE_URL,  // ❌ NEVER
  }),
};
```

**DO:**
```typescript
return {
  statusCode: 500,
  body: JSON.stringify({
    error: 'Database connection failed',
    configured: !!process.env.DATABASE_URL,  // ✅ Safe
  }),
};
```

### Rotation

- Rotate API keys quarterly
- Rotate immediately if exposed
- Use different keys for dev/staging/production
- Document rotation process

## Input Validation

### Always Validate

**DO:**
```typescript
import { z } from 'zod';

const SubmissionSchema = z.object({
  student_name: z.string().min(1).max(255),
  essay_text: z.string().min(1).max(50000),
  grade: z.number().min(0).max(100),
  email: z.string().email().optional(),
});

const validation = SubmissionSchema.safeParse(input);
if (!validation.success) {
  return {
    statusCode: 400,
    body: JSON.stringify({ 
      error: 'Invalid input',
      details: validation.error.format() 
    }),
  };
}

const data = validation.data;  // Type-safe and validated
```

### Sanitize User Input

```typescript
// Remove dangerous characters
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove HTML tags
    .substring(0, 10000);  // Limit length
}

// Sanitize before storing
const cleanText = sanitizeInput(userInput);
```

### File Upload Validation

```typescript
// Validate file type
const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  return { statusCode: 400, body: JSON.stringify({ error: 'Invalid file type' }) };
}

// Validate file size (5MB max)
const maxSize = 5 * 1024 * 1024;
if (file.size > maxSize) {
  return { statusCode: 400, body: JSON.stringify({ error: 'File too large' }) };
}

// Validate file name
const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
```

## SQL Injection Prevention

### Use Parameterized Queries

**DO:**
```typescript
// Neon serverless SQL - automatically parameterized
const result = await sql`
  SELECT * FROM grader.submissions 
  WHERE student_id = ${studentId}
  AND assignment_id = ${assignmentId}
`;

// Safe - parameters are escaped
const search = userInput;
const results = await sql`
  SELECT * FROM grader.students
  WHERE student_name ILIKE ${`%${search}%`}
`;
```

**DON'T:**
```typescript
// NEVER concatenate user input into SQL
const query = `SELECT * FROM grader.submissions WHERE student_id = '${studentId}'`;
await sql.unsafe(query);  // ❌ SQL INJECTION RISK

// NEVER use string interpolation
const results = await sql.unsafe(`
  SELECT * FROM grader.students 
  WHERE student_name LIKE '%${userInput}%'
`);  // ❌ SQL INJECTION RISK
```

### Validate UUIDs

```typescript
import { z } from 'zod';

// Validate UUID format
const uuidSchema = z.string().uuid();

const validation = uuidSchema.safeParse(submissionId);
if (!validation.success) {
  return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ID format' }) };
}

// Now safe to use
const submission = await sql`
  SELECT * FROM grader.submissions 
  WHERE submission_id = ${submissionId}
`;
```

## Data Sanitization

### Output Encoding

```typescript
// Sanitize before sending to frontend
function sanitizeForDisplay(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Use when displaying user-generated content
const safeText = sanitizeForDisplay(submission.verbatim_text);
```

### JSON Response Sanitization

```typescript
// Remove sensitive fields before sending
function sanitizeSubmission(submission: any) {
  const { internal_notes, api_key, ...safe } = submission;
  return safe;
}

return {
  statusCode: 200,
  body: JSON.stringify(sanitizeSubmission(submission)),
};
```

## Error Messages

### Don't Expose System Details

**DON'T:**
```typescript
catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: error.stack,  // ❌ Exposes code structure
      query: sqlQuery,     // ❌ Exposes database schema
      env: process.env,    // ❌ Exposes secrets
    }),
  };
}
```

**DO:**
```typescript
catch (error) {
  // Log detailed error server-side
  console.error('Submission error:', {
    error: error instanceof Error ? error.message : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Return generic error to client
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to process submission',
      // Only include safe details
      code: 'SUBMISSION_ERROR',
    }),
  };
}
```

### User-Friendly Messages

```typescript
// Map technical errors to user-friendly messages
function getUserFriendlyError(error: Error): string {
  if (error.message.includes('unique constraint')) {
    return 'This submission already exists';
  }
  if (error.message.includes('foreign key')) {
    return 'Invalid student or assignment reference';
  }
  if (error.message.includes('connection')) {
    return 'Database temporarily unavailable. Please try again.';
  }
  return 'An unexpected error occurred';
}
```

## CORS Configuration

### Development vs Production

```typescript
// Development - allow all origins
const devHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Production - restrict to your domain
const prodHeaders = {
  'Access-Control-Allow-Origin': 'https://ai-essaygrader.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const headers = process.env.NODE_ENV === 'production' ? prodHeaders : devHeaders;
```

### Handle Preflight Requests

```typescript
const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }
  
  // ... rest of handler
};
```

## Authentication (Future)

### Placeholder for Future Auth

```typescript
// When adding authentication
function verifyToken(token: string): { userId: string } | null {
  try {
    // Verify JWT or session token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

const handler: Handler = async (event) => {
  // Extract token from header
  const token = event.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' }),
    };
  }
  
  const user = verifyToken(token);
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }
  
  // User is authenticated
  // ... rest of handler
};
```

## Rate Limiting (Future)

### Placeholder for Rate Limiting

```typescript
// When adding rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number = 100): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

const handler: Handler = async (event) => {
  const ip = event.headers['x-forwarded-for'] || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too many requests' }),
    };
  }
  
  // ... rest of handler
};
```

## Checklist

Before deploying:

- [ ] No secrets in code or Git
- [ ] Environment variables validated
- [ ] All user input validated with Zod
- [ ] SQL queries use parameterized syntax
- [ ] Error messages don't expose system details
- [ ] Sensitive data not logged
- [ ] CORS configured appropriately
- [ ] File uploads validated (type, size)
- [ ] UUIDs validated before use
- [ ] Output sanitized for display
- [ ] Rate limiting considered (if needed)
- [ ] Authentication planned (if needed)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Netlify Security](https://docs.netlify.com/security/secure-access-to-sites/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- Related: `.windsurf/rules/api-design.md`
- Related: `.windsurf/rules/database-design.md`

---
trigger: model_decision
---

# API Design Rules - Netlify Functions

## Overview
Standards for designing and implementing Netlify Functions (serverless backend) for the FastAI Grader project.

## Table of Contents
- [Function Structure](#function-structure)
- [Request Handling](#request-handling)
- [Response Patterns](#response-patterns)
- [Error Handling](#error-handling)
- [Database Operations](#database-operations)
- [Validation](#validation)
- [CORS and Headers](#cors-and-headers)

## Core Principles

1. **Consistency** - All functions follow the same patterns
2. **Type Safety** - Use TypeScript for all functions
3. **Validation** - Validate all inputs with Zod schemas
4. **Error Handling** - Graceful error responses with details
5. **Security** - Never expose sensitive data in responses

## Function Structure

### Standard Function Template

```typescript
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { sql } from './db';
import { YourRequestSchema } from '../../src/lib/schema';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 2. Parse and validate input
    const body = JSON.parse(event.body || '{}');
    const validation = YourRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.format() 
        }),
      };
    }

    // 3. Business logic
    const result = await performOperation(validation.data);

    // 4. Success response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    // 5. Error handling
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
```

### File Naming

**Pattern:** `kebab-case.ts`

**Examples:**
- ✅ `health-check.ts`
- ✅ `get-submission.ts`
- ✅ `save-teacher-edits.ts`
- ❌ `healthCheck.ts`
- ❌ `getSubmission.ts`

### Function Organization

```
netlify/functions/
├── db.ts                      # Database connection (shared)
├── health-check.ts            # Health/status endpoints
├── ingest.ts                  # Create operations
├── get-submission.ts          # Read operations
├── save-teacher-edits.ts      # Update operations
├── delete-submission.ts       # Delete operations
├── list.ts                    # List/search operations
└── grade.ts                   # AI/processing operations
```

## Request Handling

### HTTP Method Validation

**DO:**
```typescript
// Check method first
if (event.httpMethod !== 'POST') {
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}
```

**Supported Methods:**
- `GET` - Read operations, list, search
- `POST` - Create, complex operations
- `PUT` - Update operations
- `DELETE` - Delete operations

### Query Parameters (GET)

```typescript
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Parse query parameters
  const params = event.queryStringParameters || {};
  
  const validation = ListRequestSchema.safeParse({
    assignment_id: params.assignment_id,
    student_id: params.student_id,
    search: params.search,
    page: params.page ? parseInt(params.page) : undefined,
    limit: params.limit ? parseInt(params.limit) : undefined,
  });

  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.format() 
      }),
    };
  }

  const { assignment_id, student_id, search, page = 1, limit = 20 } = validation.data;
  // ... rest of logic
};
```

### Request Body (POST/PUT)

```typescript
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Parse JSON body
    const body = JSON.parse(event.body || '{}');
    
    // Validate with Zod schema
    const validation = IngestRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validation.error.format() 
        }),
      };
    }

    const data = validation.data;
    // ... rest of logic
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' }),
      };
    }
    throw error;
  }
};
```

## Response Patterns

### Success Responses

**Single Resource:**
```typescript
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: result.submission_id,
    student_name: result.student_name,
    ai_grade: result.ai_grade,
    created_at: result.created_at,
  }),
};
```

**List/Collection:**
```typescript
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissions: results,
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    },
  }),
};
```

**Created Resource:**
```typescript
return {
  statusCode: 201,  // 201 for created
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submission_id: newSubmission.submission_id,
    message: 'Submission created successfully',
  }),
};
```

**No Content:**
```typescript
return {
  statusCode: 204,  // 204 for successful delete
  body: '',
};
```

### Status Codes

| Code | Usage | Example |
|------|-------|---------|
| 200 | Success | GET, PUT successful |
| 201 | Created | POST created new resource |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing/invalid auth (future) |
| 403 | Forbidden | No permission (future) |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Unexpected error |

## Error Handling

### Standard Error Response

```typescript
{
  error: string,           // Short error message
  message?: string,        // Detailed message
  details?: object,        // Validation errors, etc.
  code?: string           // Error code for client handling
}
```

### Error Handling Pattern

```typescript
try {
  // Business logic
  const result = await performOperation();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
} catch (error) {
  console.error('Function error:', error);
  
  // Handle specific error types
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Validation failed',
        details: error.details 
      }),
    };
  }
  
  if (error instanceof NotFoundError) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Resource not found',
        message: error.message 
      }),
    };
  }
  
  // Generic error
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }),
  };
}
```

### Logging

**DO:**
```typescript
// Log errors with context
console.error('Function error:', {
  function: 'ingest',
  error: error instanceof Error ? error.message : error,
  stack: error instanceof Error ? error.stack : undefined,
  input: sanitizedInput,  // Remove sensitive data
});
```

**DON'T:**
```typescript
// Don't log sensitive data
console.log('Request body:', body);  // May contain student data
console.log('API key:', process.env.OPENAI_API_KEY);  // Never log secrets
```

## Database Operations

### Using Neon Serverless SQL

```typescript
import { sql } from './db';

// Simple query
const result = await sql`
  SELECT * FROM grader.submissions 
  WHERE submission_id = ${submissionId}
`;

// Insert with RETURNING
const newSubmission = await sql`
  INSERT INTO grader.submissions (
    student_id,
    assignment_id,
    verbatim_text,
    teacher_criteria
  )
  VALUES (${studentId}, ${assignmentId}, ${text}, ${criteria})
  RETURNING submission_id, created_at
`;

// Update
await sql`
  UPDATE grader.submissions 
  SET teacher_grade = ${grade}, teacher_feedback = ${feedback}
  WHERE submission_id = ${submissionId}
`;

// Delete
await sql`
  DELETE FROM grader.submissions 
  WHERE submission_id = ${submissionId}
`;
```

### Transaction Pattern

```typescript
// For multi-step operations
try {
  // Step 1: Find or create student
  let student = await sql`
    SELECT student_id FROM grader.students 
    WHERE student_name = ${name}
  `;
  
  if (student.length === 0) {
    student = await sql`
      INSERT INTO grader.students (student_name)
      VALUES (${name})
      RETURNING student_id
    `;
  }
  
  // Step 2: Create submission
  const submission = await sql`
    INSERT INTO grader.submissions (student_id, ...)
    VALUES (${student[0].student_id}, ...)
    RETURNING submission_id
  `;
  
  return submission[0];
} catch (error) {
  // Neon handles rollback automatically on error
  throw error;
}
```

### Query Patterns

**Pagination:**
```typescript
const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const submissions = await sql`
  SELECT * FROM grader.submissions
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;

const countResult = await sql`
  SELECT COUNT(*) as total FROM grader.submissions
`;
```

**Search:**
```typescript
const searchPattern = `%${search}%`;

const results = await sql`
  SELECT * FROM grader.submissions s
  JOIN grader.students st ON s.student_id = st.student_id
  WHERE st.student_name ILIKE ${searchPattern}
     OR s.verbatim_text ILIKE ${searchPattern}
`;
```

## Validation

### Zod Schemas

Define all request schemas in `src/lib/schema.ts`:

```typescript
import { z } from 'zod';

export const IngestRequestSchema = z.object({
  student_name: z.string().min(1).max(255),
  student_id: z.string().optional(),
  assignment_id: z.string().uuid().optional(),
  assignment_title: z.string().optional(),
  teacher_criteria: z.string().min(1),
  verbatim_text: z.string().min(1),
  source_type: z.enum(['text', 'docx', 'image', 'pdf']),
});

export const ListRequestSchema = z.object({
  assignment_id: z.string().uuid().optional(),
  student_id: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});
```

### Validation in Functions

```typescript
const validation = IngestRequestSchema.safeParse(body);

if (!validation.success) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      error: 'Invalid request', 
      details: validation.error.format() 
    }),
  };
}

// Type-safe data
const data = validation.data;
```

## CORS and Headers

### Standard Headers

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',  // Adjust for production
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

return {
  statusCode: 200,
  headers,
  body: JSON.stringify(result),
};
```

### OPTIONS Handler (CORS Preflight)

```typescript
const handler: Handler = async (event: HandlerEvent) => {
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

## Environment Variables

### Accessing Environment Variables

```typescript
// Check if required env vars are set
if (!process.env.DATABASE_URL) {
  return {
    statusCode: 500,
    body: JSON.stringify({ 
      error: 'Configuration error',
      message: 'DATABASE_URL not configured' 
    }),
  };
}

if (!process.env.OPENAI_API_KEY) {
  return {
    statusCode: 500,
    body: JSON.stringify({ 
      error: 'Configuration error',
      message: 'OPENAI_API_KEY not configured' 
    }),
  };
}

// Use environment variables
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
```

## Common Patterns

### Health Check

```typescript
const handler: Handler = async () => {
  try {
    // Check database
    const dbResult = await sql`SELECT NOW()`;
    
    // Check environment
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    };
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        database: { connected: true },
        environment: envCheck,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
```

### Find or Create Pattern

```typescript
// Find existing or create new
let student = await sql`
  SELECT student_id FROM grader.students 
  WHERE student_name = ${name}
  LIMIT 1
`;

if (student.length === 0) {
  student = await sql`
    INSERT INTO grader.students (student_name, district_student_id)
    VALUES (${name}, ${districtId})
    RETURNING student_id
  `;
}

const studentId = student[0].student_id;
```

## Checklist

Before deploying a function:

- [ ] TypeScript types are correct
- [ ] HTTP method is validated
- [ ] Input is validated with Zod schema
- [ ] Errors are caught and logged
- [ ] Error responses include helpful messages
- [ ] Success responses follow standard format
- [ ] Status codes are appropriate
- [ ] Headers include Content-Type
- [ ] Environment variables are checked
- [ ] Database queries use parameterized queries (SQL injection safe)
- [ ] Sensitive data is not logged or exposed
- [ ] Function is tested locally with `netlify dev`

## Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Zod Documentation](https://zod.dev/)
- Related: `.windsurf/rules/database-design.md`
- Related: `.windsurf/rules/security.md`

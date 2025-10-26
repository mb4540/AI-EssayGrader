---
trigger: model_decision
---

# Code Style Conventions

## Overview
TypeScript and general coding standards for the FastAI Grader project.

## Core Principles

1. **Consistency** - Follow the same patterns throughout
2. **Readability** - Code is read more than written
3. **Simplicity** - Prefer simple solutions over clever ones
4. **Type Safety** - Leverage TypeScript's type system
5. **Self-Documenting** - Code should explain itself

## Naming Conventions

### Variables and Functions

**Pattern:** camelCase

```typescript
// ✅ Good
const studentName = 'John Doe';
const submissionCount = 10;
function calculateGrade() {}
function getSubmissionById() {}

// ❌ Bad
const StudentName = 'John Doe';
const submission_count = 10;
function CalculateGrade() {}
function get_submission_by_id() {}
```

### Constants

**Pattern:** UPPER_SNAKE_CASE for true constants

```typescript
// ✅ Good
const MAX_GRADE = 100;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// ❌ Bad
const maxGrade = 100;
const apiBaseUrl = 'https://api.example.com';
```

### Types and Interfaces

**Pattern:** PascalCase

```typescript
// ✅ Good
interface Submission {
  submission_id: string;
  student_name: string;
}

type GradeResult = {
  grade: number;
  feedback: string;
};

// ❌ Bad
interface submission {}
type gradeResult = {};
```

### Enums

**Pattern:** PascalCase for enum, UPPER_SNAKE_CASE for values

```typescript
// ✅ Good
enum SourceType {
  TEXT = 'text',
  DOCX = 'docx',
  IMAGE = 'image',
  PDF = 'pdf',
}

// ❌ Bad
enum sourceType {
  text = 'text',
  Docx = 'docx',
}
```

### Files and Folders

**Pattern:** kebab-case for files, PascalCase for components

```typescript
// ✅ Good
api-client.ts
database-utils.ts
GradePanel.tsx
SubmissionForm.tsx

// ❌ Bad
apiClient.ts
database_utils.ts
gradePanel.tsx
submission-form.tsx
```

## TypeScript Best Practices

### Type Annotations

```typescript
// ✅ Good - Explicit types for function parameters and return
function calculateGrade(essay: string, criteria: string): number {
  return 85;
}

// ✅ Good - Type inference for simple cases
const count = 10;  // inferred as number
const name = 'John';  // inferred as string

// ❌ Bad - Using 'any'
function processData(data: any): any {
  return data;
}
```

### Interfaces vs Types

```typescript
// ✅ Use interfaces for object shapes
interface Submission {
  submission_id: string;
  student_name: string;
  ai_grade: number | null;
}

// ✅ Use types for unions, intersections, primitives
type Status = 'pending' | 'graded' | 'reviewed';
type ID = string | number;
type SubmissionWithMeta = Submission & { metadata: Record<string, unknown> };
```

### Null and Undefined

```typescript
// ✅ Good - Explicit null/undefined handling
function getGrade(submission: Submission): number | null {
  return submission.ai_grade ?? null;
}

// ✅ Good - Optional chaining
const grade = submission?.ai_grade;
const name = student?.profile?.name;

// ✅ Good - Nullish coalescing
const displayGrade = submission.ai_grade ?? 'Not graded';
const limit = params.limit ?? 20;
```

### Type Guards

```typescript
// ✅ Good - Type guards for runtime checks
function isSubmission(obj: unknown): obj is Submission {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'submission_id' in obj &&
    'student_name' in obj
  );
}

if (isSubmission(data)) {
  // TypeScript knows data is Submission here
  console.log(data.submission_id);
}
```

## Import Organization

### Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button';
import { getSubmission } from '@/lib/api';

// 3. Relative imports
import { calculateGrade } from './utils';
import type { Submission } from './types';

// 4. CSS/Assets
import './styles.css';
```

### Named vs Default Exports

```typescript
// ✅ Prefer named exports
export function calculateGrade() {}
export const MAX_GRADE = 100;

// ✅ Use default export for main component
export default function Dashboard() {}

// ❌ Avoid mixing in same file
export function helper() {}
export default function Component() {}  // Confusing
```

## Function Style

### Arrow Functions vs Function Declarations

```typescript
// ✅ Use arrow functions for callbacks and short functions
const double = (n: number) => n * 2;
const handleClick = () => console.log('clicked');

// ✅ Use function declarations for named functions
function calculateGrade(essay: string): number {
  // Complex logic here
  return grade;
}

// ✅ Use arrow functions for React components
export const GradePanel = ({ grade }: { grade: number }) => {
  return <div>{grade}</div>;
};
```

### Function Length

```typescript
// ✅ Good - Short, focused functions
function validateSubmission(data: unknown): boolean {
  return isValidFormat(data) && hasRequiredFields(data);
}

// ❌ Bad - Too long, does too much
function processSubmission(data: unknown) {
  // 100+ lines of code
  // Multiple responsibilities
}
```

### Parameters

```typescript
// ✅ Good - Use object for multiple parameters
function createSubmission({
  studentName,
  essayText,
  criteria,
}: {
  studentName: string;
  essayText: string;
  criteria: string;
}) {
  // ...
}

// ❌ Bad - Too many positional parameters
function createSubmission(
  studentName: string,
  essayText: string,
  criteria: string,
  sourceType: string,
  assignmentId: string
) {}
```

## Async/Await

### Error Handling

```typescript
// ✅ Good - Try/catch with async/await
async function fetchSubmission(id: string): Promise<Submission | null> {
  try {
    const response = await fetch(`/api/get-submission?id=${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// ❌ Bad - Unhandled promise rejection
async function fetchSubmission(id: string) {
  const response = await fetch(`/api/get-submission?id=${id}`);
  return await response.json();  // May throw
}
```

### Promise Patterns

```typescript
// ✅ Good - Parallel execution
const [submissions, students] = await Promise.all([
  fetchSubmissions(),
  fetchStudents(),
]);

// ❌ Bad - Sequential when parallel is possible
const submissions = await fetchSubmissions();
const students = await fetchStudents();
```

## Comments

### When to Comment

```typescript
// ✅ Good - Explain WHY, not WHAT
// Use exponential backoff to avoid rate limiting
await retryWithBackoff(apiCall);

// ✅ Good - Document complex algorithms
/**
 * Calculates grade using weighted rubric.
 * Grammar: 25%, Content: 50%, Structure: 25%
 */
function calculateGrade(essay: Essay): number {
  // ...
}

// ❌ Bad - Obvious comments
// Set count to 0
const count = 0;

// ❌ Bad - Commented-out code
// const oldFunction = () => {};
// return oldValue;
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches a submission by ID
 * @param id - The submission UUID
 * @returns The submission or null if not found
 * @throws {Error} If the API request fails
 */
export async function getSubmission(id: string): Promise<Submission | null> {
  // ...
}
```

## Error Handling

### Custom Errors

```typescript
// ✅ Good - Custom error classes
class ValidationError extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

throw new ValidationError('Invalid input', { field: 'email' });
```

### Error Messages

```typescript
// ✅ Good - Descriptive error messages
throw new Error(`Failed to fetch submission ${id}: ${error.message}`);

// ❌ Bad - Vague error messages
throw new Error('Error');
throw new Error('Something went wrong');
```

## Code Organization

### File Structure

```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Constants
const MAX_LENGTH = 100;

// 4. Helper functions
function helper() {}

// 5. Main component/function
export function Component({ title }: Props) {
  // ...
}

// 6. Exports
export { helper };
```

### Avoid Magic Numbers

```typescript
// ✅ Good - Named constants
const MAX_GRADE = 100;
const MIN_GRADE = 0;
const DEFAULT_PAGE_SIZE = 20;

if (grade > MAX_GRADE) {
  // ...
}

// ❌ Bad - Magic numbers
if (grade > 100) {
  // ...
}
```

## Formatting

### Line Length

- Max 100 characters per line
- Break long lines logically

```typescript
// ✅ Good
const result = await fetchSubmissions({
  assignmentId,
  studentId,
  page,
  limit,
});

// ❌ Bad
const result = await fetchSubmissions({ assignmentId, studentId, page, limit, sortBy, sortOrder });
```

### Spacing

```typescript
// ✅ Good - Consistent spacing
function calculate(a: number, b: number): number {
  const result = a + b;
  return result;
}

// ❌ Bad - Inconsistent spacing
function calculate(a:number,b:number):number{
  const result=a+b;
  return result;
}
```

## Checklist

Before committing code:

- [ ] Follows naming conventions
- [ ] TypeScript types are explicit where needed
- [ ] No 'any' types (unless absolutely necessary)
- [ ] Imports are organized
- [ ] Functions are short and focused
- [ ] Error handling is present
- [ ] No magic numbers
- [ ] Comments explain WHY, not WHAT
- [ ] No console.logs (except in error handlers)
- [ ] Code is formatted consistently
- [ ] No unused imports or variables

## Tools

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- Related: `.windsurf/rules/frontend-components.md`
- Related: `.windsurf/rules/api-design.md`

---
trigger: always_on
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

## User-Centric Design Principles

### Primary User: Teachers

**Core Mission:** Enable teachers to grade student written assignments with quality, fidelity, speed, and minimal effort.

### Design Philosophy

1. **Speed First** - Every feature must optimize for teacher efficiency
2. **Minimize Clicks** - Reduce the number of interactions required to complete tasks
3. **Simplicity Over Features** - A simple, fast workflow beats a feature-rich, slow one
4. **Quality & Fidelity** - Speed should never compromise grading accuracy
5. **Student Learning** - Secondary goal: provide fair grades and constructive feedback to students

### Implementation Guidelines

#### Minimize User Actions
\`\`\`typescript
// ✅ Good - Single action
<Button onClick={handleGradeAndSave}>Grade & Save</Button>
// ❌ Bad - Multiple steps
<Button onClick={handleGrade}>Grade</Button>
<Button onClick={handleSave}>Save</Button>
\`\`\`

#### Default to Smart Behaviors
\`\`\`typescript
// ✅ Auto-save every 30 seconds
useEffect(() => {
  const interval = setInterval(() => saveDraft(), 30000);
  return () => clearInterval(interval);
}, []);
\`\`\`

#### Optimize Common Workflows
\`\`\`typescript
// ✅ Keyboard shortcuts for power users
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
\`\`\`

#### Progressive Disclosure
Show essential options first, advanced options on demand.

#### Provide Immediate Feedback
\`\`\`typescript
const [status, setStatus] = useState<'idle' | 'grading' | 'done'>('idle');
<Button onClick={handleGrade} disabled={status === 'grading'}>
  {status === 'grading' ? 'Grading...' : 'Grade Essay'}
</Button>
\`\`\`

#### Reduce Cognitive Load
Use clear, action-oriented labels: "Grade This Essay" not "Execute"

### UI/UX Checklist

- [ ] Can this be done in fewer clicks?
- [ ] Can we auto-fill or pre-select common values?
- [ ] Does this save the teacher time?
- [ ] Is the most common action the most prominent?
- [ ] Does it provide immediate visual feedback?
- [ ] Can the teacher recover easily from mistakes?

### Performance Targets

- **Page Load:** < 2 seconds
- **Grading Operation:** < 5 seconds
- **Search/Filter:** < 500ms
- **Form Submission:** < 1 second

**Remember:** Teachers grade dozens/hundreds of essays. Every second saved multiplies across their workload.

## Naming Conventions

### Variables and Functions
**Pattern:** camelCase
\`\`\`typescript
const studentName = 'John'; // ✅
const StudentName = 'John'; // ❌
\`\`\`

### Constants
**Pattern:** UPPER_SNAKE_CASE
\`\`\`typescript
const MAX_GRADE = 100; // ✅
const maxGrade = 100; // ❌
\`\`\`

### Types and Interfaces
**Pattern:** PascalCase
\`\`\`typescript
interface Submission { submission_id: string; } // ✅
interface submission {} // ❌
\`\`\`

### Enums
**Pattern:** PascalCase for enum, UPPER_SNAKE_CASE for values
\`\`\`typescript
enum SourceType { TEXT = 'text', DOCX = 'docx' } // ✅
\`\`\`

### Files and Folders
**Pattern:** kebab-case for files, PascalCase for components
\`\`\`
api-client.ts, GradePanel.tsx // ✅
apiClient.ts, gradePanel.tsx // ❌
\`\`\`

## TypeScript Best Practices

### Type Annotations
\`\`\`typescript
// ✅ Explicit types for parameters/return
function calculateGrade(essay: string): number { return 85; }
// ❌ Using 'any'
function processData(data: any): any { return data; }
\`\`\`

### Interfaces vs Types
- Use **interfaces** for object shapes
- Use **types** for unions, intersections, primitives

### Null and Undefined
\`\`\`typescript
// ✅ Optional chaining & nullish coalescing
const grade = submission?.ai_grade ?? 'Not graded';
\`\`\`

### Type Guards
\`\`\`typescript
function isSubmission(obj: unknown): obj is Submission {
  return typeof obj === 'object' && obj !== null && 'submission_id' in obj;
}
\`\`\`

## Import Organization

\`\`\`typescript
// 1. External libraries
import { useState } from 'react';
// 2. Internal modules
import { Button } from '@/components/ui/button';
// 3. Relative imports
import { calculateGrade } from './utils';
// 4. CSS/Assets
import './styles.css';
\`\`\`

**Prefer named exports** over default exports (except main component).

## Function Style

### Arrow Functions vs Declarations
- Arrow functions for callbacks and short functions
- Function declarations for named functions
- Arrow functions for React components

### Function Length
Keep functions short and focused (< 50 lines).

### Parameters
Use object for multiple parameters (> 3).

## Async/Await

### Error Handling
\`\`\`typescript
async function fetchSubmission(id: string): Promise<Submission | null> {
  try {
    const response = await fetch(\`/api/get-submission?id=\${id}\`);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}
\`\`\`

### Promise Patterns
Use `Promise.all()` for parallel execution when possible.

## Comments

### When to Comment
- Explain WHY, not WHAT
- Document complex algorithms
- Use JSDoc for public APIs

\`\`\`typescript
// ✅ Good
// Use exponential backoff to avoid rate limiting
await retryWithBackoff(apiCall);

// ❌ Bad - Obvious
const count = 0; // Set count to 0
\`\`\`

## Error Handling

### Custom Errors
\`\`\`typescript
class ValidationError extends Error {
  constructor(message: string, public details: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}
\`\`\`

### Error Messages
Be descriptive: `Failed to fetch submission ${id}: ${error.message}`

## Code Organization

### File Structure
1. Imports
2. Types/Interfaces
3. Constants
4. Helper functions
5. Main component/function
6. Exports

### Avoid Magic Numbers
Use named constants: `const MAX_GRADE = 100;`

## Formatting

- **Line Length:** Max 100 characters
- **Spacing:** Consistent spacing around operators and braces
- Break long lines logically

## Checklist

Before committing:
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

## Tools

### ESLint
\`\`\`json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
\`\`\`

### Prettier
\`\`\`json
{ "semi": true, "singleQuote": true, "tabWidth": 2, "printWidth": 100 }
\`\`\`

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Related: `.windsurf/rules/frontend-components.md`, `.windsurf/rules/api-design.md`

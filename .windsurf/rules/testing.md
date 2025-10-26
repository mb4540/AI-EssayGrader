---
trigger: model_decision
---

# Testing Guidelines

## Overview
Testing standards and practices for the FastAI Grader project to ensure code quality and reliability.

## Core Principles

1. **Test Early** - Write tests before or alongside code
2. **Test Coverage** - Aim for 80%+ coverage on critical paths
3. **Test Isolation** - Each test should be independent
4. **Test Clarity** - Tests should be easy to read and understand
5. **Test Speed** - Keep tests fast to encourage frequent running

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\     - Full user flows
     /      \    - Critical paths only
    /________\   
   /          \  Integration Tests (Some)
  /____________\ - API + Database
 /              \ - Component + API
/________________\ Unit Tests (Many)
                   - Functions
                   - Components
                   - Utilities
```

## Unit Testing

### Test File Organization

```
src/
├── lib/
│   ├── api.ts
│   └── api.test.ts           # Co-located with source
├── components/
│   ├── GradePanel.tsx
│   └── GradePanel.test.tsx
└── pages/
    ├── Dashboard.tsx
    └── Dashboard.test.tsx
```

### Naming Convention

**Pattern:** `*.test.ts` or `*.spec.ts`

```typescript
// ✅ Good
api.test.ts
GradePanel.test.tsx
utils.spec.ts

// ❌ Bad
api-test.ts
test-api.ts
apiTests.ts
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('calculateGrade', () => {
  it('should return 100 for perfect essay', () => {
    const result = calculateGrade({ /* perfect essay */ });
    expect(result).toBe(100);
  });

  it('should return 0 for empty essay', () => {
    const result = calculateGrade({ text: '' });
    expect(result).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(calculateGrade(null)).toBe(0);
    expect(calculateGrade(undefined)).toBe(0);
  });
});
```

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GradePanel } from './GradePanel';

describe('GradePanel', () => {
  it('renders grade correctly', () => {
    render(<GradePanel grade={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('calls onSave when save button clicked', () => {
    const onSave = vi.fn();
    render(<GradePanel grade={85} onSave={onSave} />);
    
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(85);
  });

  it('shows loading state', () => {
    render(<GradePanel grade={85} isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## Integration Testing

### API + Database Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from '../netlify/functions/db';

describe('Submission API', () => {
  let testStudentId: string;

  beforeAll(async () => {
    // Create test data
    const student = await sql`
      INSERT INTO grader.students (student_name)
      VALUES ('Test Student')
      RETURNING student_id
    `;
    testStudentId = student[0].student_id;
  });

  afterAll(async () => {
    // Clean up test data
    await sql`
      DELETE FROM grader.students 
      WHERE student_id = ${testStudentId}
    `;
  });

  it('should create submission', async () => {
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: 'Test Student',
        verbatim_text: 'Test essay',
        teacher_criteria: 'Test criteria',
        source_type: 'text',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.submission_id).toBeDefined();
  });
});
```

### Using Neon Branches for Testing

```bash
# Create ephemeral test branch
neon branches create --name test-$(date +%s)

# Run tests against test branch
DATABASE_URL="postgres://neon:npg@localhost:5432/neondb" npm test

# Branch auto-deletes when disconnected
```

## E2E Testing (Future)

### Playwright Setup

```typescript
import { test, expect } from '@playwright/test';

test.describe('Submission Flow', () => {
  test('should create and grade submission', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8888');

    // Fill form
    await page.fill('[name="studentName"]', 'John Doe');
    await page.fill('[name="essayText"]', 'This is a test essay...');
    await page.fill('[name="criteria"]', 'Test criteria');

    // Submit
    await page.click('button:has-text("Run Grade")');

    // Wait for results
    await expect(page.locator('.grade-result')).toBeVisible();
    await expect(page.locator('.grade-value')).toContainText(/\d+/);
  });
});
```

## Mock Data

### Creating Test Fixtures

```typescript
// test/fixtures/submissions.ts
export const mockSubmission = {
  submission_id: '123e4567-e89b-12d3-a456-426614174000',
  student_name: 'Test Student',
  verbatim_text: 'This is a test essay.',
  teacher_criteria: 'Test criteria',
  ai_grade: 85,
  teacher_grade: 90,
  created_at: new Date('2024-01-01'),
};

export const mockSubmissions = [
  mockSubmission,
  { ...mockSubmission, submission_id: '223e4567-e89b-12d3-a456-426614174001' },
];
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ submission_id: '123' }),
  })
);

// Test
it('should fetch submission', async () => {
  const result = await getSubmission('123');
  expect(fetch).toHaveBeenCalledWith('/api/get-submission?id=123');
  expect(result.submission_id).toBe('123');
});
```

## Coverage Requirements

### Minimum Coverage

- **Critical Functions**: 90%+
- **API Endpoints**: 80%+
- **Components**: 70%+
- **Utilities**: 80%+
- **Overall**: 75%+

### Running Coverage

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/index.html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Best Practices

### DO:
- ✅ Write tests for new features
- ✅ Test edge cases and error conditions
- ✅ Use descriptive test names
- ✅ Keep tests simple and focused
- ✅ Clean up test data after tests
- ✅ Use test fixtures for consistency
- ✅ Mock external dependencies

### DON'T:
- ❌ Test implementation details
- ❌ Write tests that depend on each other
- ❌ Leave console.logs in tests
- ❌ Skip cleanup in afterEach/afterAll
- ❌ Test third-party library code
- ❌ Make tests too complex

## Checklist

Before merging code:

- [ ] All new code has tests
- [ ] All tests pass locally
- [ ] Coverage meets minimum requirements
- [ ] No skipped tests without reason
- [ ] Test data is cleaned up
- [ ] Mocks are properly configured
- [ ] Edge cases are tested
- [ ] Error conditions are tested

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- Related: `.windsurf/rules/api-design.md`

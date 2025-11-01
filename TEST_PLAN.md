# FastAI Grader - Comprehensive Test Plan

**Version:** 1.0  
**Created:** November 1, 2025  
**Status:** 🟡 In Progress

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Coverage Goals](#test-coverage-goals)
3. [Test Environment Setup](#test-environment-setup)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [E2E Tests](#e2e-tests)
7. [Test Data & Fixtures](#test-data--fixtures)
8. [CI/CD Integration](#cicd-integration)
9. [Testing Workflow](#testing-workflow)

---

## Testing Philosophy

Following `.windsurf/rules/testing.md` principles:

### Test Pyramid Strategy
```
        /\
       /  \      E2E Tests (5%)
      /____\     - Critical user flows
     /      \    - Password reset flow
    /________\   - Submission grading flow
   /          \  Integration Tests (15%)
  /____________\ - API + Database
 /              \ - Component + Context
/________________\ Unit Tests (80%)
                   - Pure functions
                   - Components
                   - Utilities
```

### Coverage Goals
- **Critical Functions**: 90%+ (grading, auth, annotations)
- **API Endpoints**: 80%+ (all Netlify functions)
- **Components**: 70%+ (UI components)
- **Utilities**: 80%+ (lib functions)
- **Overall**: 75%+

---

## Test Environment Setup

### 1. Install Dependencies
```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  fake-indexeddb
```

### 2. Vitest Configuration

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/archive/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Test Setup File

Create `src/test/setup.ts`:
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

### 4. Test Database Setup

Use Neon branching for isolated test databases:
```bash
# Create test branch
neon branches create --name test-$(date +%s)

# Set DATABASE_URL for tests
export TEST_DATABASE_URL="your-test-branch-url"
```

---

## Unit Tests

### Priority 1: Core Utilities (Critical)

#### 1.1 BulletProof Calculator
**File:** `src/lib/calculator/calculator.test.ts` ✅ (Already exists)

**Additional Tests Needed:**
- [ ] Edge cases: NaN, Infinity, negative values
- [ ] Rounding modes (HALF_UP, HALF_EVEN, HALF_DOWN)
- [ ] Scale conversion (percent <-> points)
- [ ] Error handling for invalid rubrics

#### 1.2 Annotation Normalizer
**File:** `src/lib/annotations/normalizer.test.ts`

```typescript
describe('Annotation Normalizer', () => {
  it('should normalize line numbers correctly', () => {
    // Test line number calculation
  });

  it('should handle offset calculations', () => {
    // Test character offsets
  });

  it('should merge overlapping annotations', () => {
    // Test annotation merging logic
  });

  it('should preserve annotation integrity', () => {
    // Test data integrity
  });
});
```

**Test Cases:**
- [ ] Line number calculation accuracy
- [ ] Character offset precision
- [ ] Overlapping annotation handling
- [ ] Edge case: empty text
- [ ] Edge case: multi-line annotations
- [ ] Unicode character handling

#### 1.3 PII Guard
**File:** `src/lib/api/piiGuard.test.ts`

```typescript
describe('PII Guard', () => {
  it('should detect email addresses', () => {
    // Test email detection
  });

  it('should detect phone numbers', () => {
    // Test phone detection
  });

  it('should detect social security numbers', () => {
    // Test SSN detection
  });

  it('should allow safe content', () => {
    // Test false positives
  });
});
```

**Test Cases:**
- [ ] Email address detection
- [ ] Phone number patterns (various formats)
- [ ] SSN patterns
- [ ] Credit card numbers
- [ ] False positive handling
- [ ] Performance with large texts

#### 1.4 CSV Parser
**File:** `src/lib/csv.test.ts`

**Test Cases:**
- [ ] Parse valid CSV data
- [ ] Handle malformed CSV
- [ ] Handle empty cells
- [ ] Handle special characters
- [ ] Handle large files
- [ ] Handle Unicode/UTF-8

#### 1.5 Authentication Utilities
**File:** `netlify/functions/lib/auth.test.ts`

```typescript
describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('should use 12 rounds', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toContain('$12$');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword('password123');
      const isValid = await verifyPassword('password123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('password123');
      const isValid = await verifyPassword('wrong', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const token = generateToken({ user_id: '123', email: 'test@test.com' });
      expect(token).toBeDefined();
    });
  });
});
```

---

### Priority 2: React Components

#### 2.1 GradePanel
**File:** `src/components/GradePanel.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GradePanel } from './GradePanel';

describe('GradePanel', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('renders AI grade correctly', () => {
    render(<GradePanel aiGrade={85} />, { wrapper });
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('renders teacher grade when present', () => {
    render(<GradePanel aiGrade={85} teacherGrade={90} />, { wrapper });
    expect(screen.getByText(/90/)).toBeInTheDocument();
  });

  it('shows edit mode when editing', () => {
    render(<GradePanel aiGrade={85} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSave with new grade', async () => {
    const onSave = vi.fn();
    render(<GradePanel aiGrade={85} onSave={onSave} />, { wrapper });
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '95' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(onSave).toHaveBeenCalledWith(95);
  });
});
```

**Test Cases:**
- [ ] Renders AI grade
- [ ] Renders teacher grade override
- [ ] Edit mode toggle
- [ ] Save grade mutation
- [ ] Grade validation (0-100)
- [ ] Loading states
- [ ] Error states

#### 2.2 AnnotatedTextViewer
**File:** `src/components/AnnotatedTextViewer.test.tsx`

**Test Cases:**
- [ ] Renders text with annotations
- [ ] Highlights selected annotation
- [ ] Annotation click handling
- [ ] Approve annotation action
- [ ] Reject annotation action
- [ ] Edit annotation action
- [ ] Approve all functionality
- [ ] Print functionality

#### 2.3 FileDrop
**File:** `src/components/FileDrop.test.tsx`

**Test Cases:**
- [ ] Accepts valid file types
- [ ] Rejects invalid file types
- [ ] Shows drag overlay
- [ ] Calls onDrop callback
- [ ] Validates file size
- [ ] Shows file preview
- [ ] Error messaging

#### 2.4 Auth Pages
**Files:**
- `src/pages/Login.test.tsx`
- `src/pages/Register.test.tsx`
- `src/pages/ForgotPassword.test.tsx`
- `src/pages/ResetPassword.test.tsx`

**Login Test Cases:**
- [ ] Renders login form
- [ ] Validates email format
- [ ] Validates password length
- [ ] Submits credentials
- [ ] Shows error messages
- [ ] Navigates after login
- [ ] Shows loading state

**ForgotPassword Test Cases:**
- [ ] Renders email form
- [ ] Validates email format
- [ ] Shows generic success message
- [ ] Handles API errors
- [ ] Shows security notice

**ResetPassword Test Cases:**
- [ ] Parses token from URL
- [ ] Validates password match
- [ ] Validates password length
- [ ] Submits new password
- [ ] Redirects after success
- [ ] Handles invalid/expired tokens

---

## Integration Tests

### Priority 1: API Endpoints + Database

#### 3.1 Submission Flow
**File:** `tests/integration/submission.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from '@neondatabase/serverless';

describe('Submission Integration', () => {
  let testStudentId: string;
  let testSubmissionId: string;

  beforeAll(async () => {
    // Create test student
    const student = await sql`
      INSERT INTO grader.students DEFAULT VALUES
      RETURNING student_id
    `;
    testStudentId = student[0].student_id;
  });

  afterAll(async () => {
    // Cleanup
    await sql`DELETE FROM grader.students WHERE student_id = ${testStudentId}`;
  });

  it('should create submission via API', async () => {
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: testStudentId,
        verbatim_text: 'Test essay content',
        teacher_criteria: 'Test criteria',
        source_type: 'text',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.submission_id).toBeDefined();
    testSubmissionId = data.submission_id;
  });

  it('should grade submission', async () => {
    const response = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: testSubmissionId,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ai_grade).toBeGreaterThanOrEqual(0);
    expect(data.ai_grade).toBeLessThanOrEqual(100);
  });

  it('should save teacher edits', async () => {
    const response = await fetch('/api/save-teacher-edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: testSubmissionId,
        teacher_grade: 95,
        teacher_comments: 'Great work!',
      }),
    });

    expect(response.status).toBe(200);
  });

  it('should retrieve submission with edits', async () => {
    const response = await fetch(`/api/get-submission?id=${testSubmissionId}`);
    const data = await response.json();

    expect(data.teacher_grade).toBe(95);
    expect(data.teacher_comments).toBe('Great work!');
  });
});
```

**Test Scenarios:**
- [ ] Create submission (text)
- [ ] Create submission (DOCX upload)
- [ ] Create submission (image OCR)
- [ ] Grade submission
- [ ] Save teacher edits
- [ ] List submissions
- [ ] Delete submission
- [ ] Submission versions tracking

#### 3.2 Authentication Flow
**File:** `tests/integration/auth.test.ts`

**Test Scenarios:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Protected route access (401)
- [ ] JWT token validation
- [ ] Token expiration handling

#### 3.3 Password Reset Flow
**File:** `tests/integration/password-reset.test.ts`

```typescript
describe('Password Reset Integration', () => {
  it('should request password reset', async () => {
    const response = await fetch('/api/auth-send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    expect(response.status).toBe(200);
  });

  it('should create reset token in database', async () => {
    // Verify token exists in password_reset_tokens table
  });

  it('should complete password reset with valid token', async () => {
    // Test password reset completion
  });

  it('should reject expired token', async () => {
    // Test token expiration (> 15 minutes)
  });

  it('should reject already-used token', async () => {
    // Test single-use enforcement
  });

  it('should log all reset events to audit table', async () => {
    // Verify audit trail
  });
});
```

#### 3.4 Annotations Workflow
**File:** `tests/integration/annotations.test.ts`

**Test Scenarios:**
- [ ] Create AI-generated annotations
- [ ] Fetch annotations for submission
- [ ] Update annotation status (approve/reject)
- [ ] Edit annotation content
- [ ] Delete annotation
- [ ] Annotation event tracking

---

## E2E Tests

### Critical User Flows (Playwright)

#### 4.1 Complete Grading Flow
**File:** `tests/e2e/grading-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete Grading Flow', () => {
  test('teacher can grade essay end-to-end', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('http://localhost:8888');

    // 2. Login
    await page.fill('[name="email"]', 'teacher@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // 3. Create new submission
    await page.click('button:has-text("New Submission")');
    await page.fill('[name="studentName"]', 'John Doe');
    await page.fill('[name="essayText"]', 'This is a test essay about literature...');
    await page.fill('[name="criteria"]', 'Grade based on grammar and content');

    // 4. Submit for grading
    await page.click('button:has-text("Run Grade")');

    // 5. Wait for AI grading
    await expect(page.locator('.ai-grade')).toBeVisible({ timeout: 30000 });

    // 6. Review and edit grade
    await page.click('button:has-text("Edit Grade")');
    await page.fill('[name="teacherGrade"]', '95');
    await page.click('button:has-text("Save")');

    // 7. Add comments
    await page.fill('[name="comments"]', 'Excellent work!');

    // 8. Review annotations
    await page.click('text:has-text("Inline Annotations")');
    await expect(page.locator('.annotation')).toBeVisible();

    // 9. Approve annotations
    await page.click('button:has-text("Approve All")');

    // 10. Print annotated essay
    await page.click('button:has-text("Print")');

    // 11. Verify dashboard updates
    await page.goto('/');
    await expect(page.locator('text:has-text("John Doe")')).toBeVisible();
  });
});
```

#### 4.2 Password Reset Flow
**File:** `tests/e2e/password-reset.spec.ts`

```typescript
test('user can reset password', async ({ page }) => {
  // 1. Go to login
  await page.goto('/login');

  // 2. Click forgot password
  await page.click('text:has-text("Forgot password?")');

  // 3. Enter email
  await page.fill('[name="email"]', 'teacher@example.com');
  await page.click('button:has-text("Send Reset Link")');

  // 4. Verify success message
  await expect(page.locator('text:has-text("reset link has been sent")')).toBeVisible();

  // 5. Simulate clicking reset link (extract token from test email)
  // Note: In real test, would need Mailgun testing or email intercept
  const testToken = 'test-reset-token-123';
  await page.goto(`/reset-password?token=${testToken}`);

  // 6. Enter new password
  await page.fill('[name="password"]', 'newPassword123');
  await page.fill('[name="confirmPassword"]', 'newPassword123');
  await page.click('button:has-text("Reset Password")');

  // 7. Verify redirect and success
  await expect(page).toHaveURL('/login');
  await expect(page.locator('text:has-text("successfully")')).toBeVisible();

  // 8. Login with new password
  await page.fill('[name="email"]', 'teacher@example.com');
  await page.fill('[name="password"]', 'newPassword123');
  await page.click('button:has-text("Sign In")');

  // 9. Verify successful login
  await expect(page).toHaveURL('/');
});
```

#### 4.3 File Upload Flow
**File:** `tests/e2e/file-upload.spec.ts`

**Test Scenarios:**
- [ ] Upload DOCX file
- [ ] Upload image (OCR)
- [ ] Drag-and-drop file
- [ ] Reject invalid file types
- [ ] Handle large files

---

## Test Data & Fixtures

### Shared Test Data
**File:** `src/test/fixtures/index.ts`

```typescript
export const mockStudent = {
  student_id: '123e4567-e89b-12d3-a456-426614174000',
};

export const mockSubmission = {
  submission_id: '223e4567-e89b-12d3-a456-426614174001',
  student_id: mockStudent.student_id,
  verbatim_text: 'This is a test essay about literature and writing.',
  teacher_criteria: 'Grade based on grammar, structure, and content.',
  source_type: 'text',
  ai_grade: 85,
  teacher_grade: null,
  created_at: new Date('2024-01-01'),
};

export const mockAnnotation = {
  annotation_id: '323e4567-e89b-12d3-a456-426614174002',
  submission_id: mockSubmission.submission_id,
  line_number: 1,
  start_offset: 0,
  end_offset: 10,
  quote: 'This is a',
  category: 'grammar',
  suggestion: 'Consider revising this sentence.',
  status: 'ai_suggested',
};

export const mockUser = {
  user_id: '423e4567-e89b-12d3-a456-426614174003',
  email: 'teacher@example.com',
  full_name: 'Test Teacher',
  role: 'teacher',
  is_active: true,
};
```

### Test Helpers
**File:** `src/test/helpers.ts`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export function mockFetch(data: any, status = 200) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    } as Response)
  );
}
```

---

## CI/CD Integration

### GitHub Actions Workflow
**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, 'feature/**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:run

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        if: github.event_name == 'pull_request'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          lcov-file: ./coverage/lcov.info

  integration:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Create test database branch
        run: |
          # Create Neon branch for testing
          # Set TEST_DATABASE_URL
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}

  e2e:
    runs-on: ubuntu-latest
    needs: [test, integration]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Testing Workflow

### Development Workflow

```bash
# 1. Run tests in watch mode during development
npm run test

# 2. Run tests with UI
npm run test:ui

# 3. Run tests once (CI mode)
npm run test:run

# 4. Generate coverage report
npm run test:coverage

# 5. View coverage in browser
open coverage/index.html
```

### Pre-Commit Checklist
- [ ] All tests pass (`npm run test:run`)
- [ ] No linting errors (`npm run lint`)
- [ ] Coverage meets minimums
- [ ] New features have tests
- [ ] Test data cleaned up

### Pre-Merge Checklist
- [ ] All CI checks pass
- [ ] Integration tests pass
- [ ] E2E critical flows pass
- [ ] Coverage report reviewed
- [ ] No skipped tests without explanation

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Setup Vitest configuration
- [ ] Create test fixtures and helpers
- [ ] Write calculator tests
- [ ] Write auth utility tests
- [ ] Setup CI/CD pipeline

### Phase 2: Components (Week 2)
- [ ] GradePanel tests
- [ ] AnnotatedTextViewer tests
- [ ] FileDrop tests
- [ ] Auth page tests
- [ ] Dashboard tests

### Phase 3: Integration (Week 3)
- [ ] Submission API tests
- [ ] Auth API tests
- [ ] Password reset tests
- [ ] Annotations API tests
- [ ] Database integration tests

### Phase 4: E2E (Week 4)
- [ ] Setup Playwright
- [ ] Grading flow test
- [ ] Password reset flow test
- [ ] File upload flow test
- [ ] Annotation workflow test

---

## Success Metrics

### Coverage Targets
- ✅ Unit Tests: 80%+ coverage
- ✅ Integration Tests: 15% of codebase
- ✅ E2E Tests: 3-5 critical flows
- ✅ Overall: 75%+ coverage

### Quality Metrics
- 🎯 Zero flaky tests
- 🎯 All tests run in < 5 minutes
- 🎯 Clear test failure messages
- 🎯 No skipped tests without documentation

### Maintenance
- 📝 Update tests with feature changes
- 📝 Review test coverage monthly
- 📝 Refactor slow tests
- 📝 Update fixtures as schema changes

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- Project Rules: `.windsurf/rules/testing.md`

---

**Status Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⚠️ Blocked

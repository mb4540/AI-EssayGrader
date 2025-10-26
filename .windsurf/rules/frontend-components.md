---
trigger: model_decision
---

# Frontend Components Rules - React Patterns

## Overview
Standards for React component development in the FastAI Grader project using TypeScript, Tailwind CSS, and shadcn/ui.

## Core Principles

1. **Component Composition** - Build small, reusable components
2. **Type Safety** - Use TypeScript interfaces for all props
3. **Accessibility** - Follow WCAG guidelines
4. **Performance** - Optimize re-renders and bundle size
5. **Consistency** - Use shadcn/ui components and Tailwind utilities

## Component Structure

### File Organization

```
src/
├── components/
│   ├── AnnotationOverlay.tsx      # Feature components
│   ├── GradePanel.tsx
│   ├── FileDrop.tsx
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── dialog.tsx
├── pages/
│   ├── Dashboard.tsx              # Page components
│   ├── Submission.tsx
│   └── Help.tsx
└── lib/
    ├── api.ts                     # API functions
    ├── schema.ts                  # Zod schemas
    └── utils.ts                   # Utilities
```

### Component Template

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentNameProps {
  title: string;
  onSubmit: (data: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ComponentName({ 
  title, 
  onSubmit, 
  isLoading = false,
  className 
}: ComponentNameProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </Button>
    </div>
  );
}
```

## Naming Conventions

### Components

**Pattern:** PascalCase

```typescript
// ✅ Good
export function GradePanel() {}
export function AnnotationOverlay() {}
export function FileDrop() {}

// ❌ Bad
export function gradePanel() {}
export function annotation_overlay() {}
```

### Props Interfaces

**Pattern:** `ComponentNameProps`

```typescript
// ✅ Good
interface GradePanelProps {
  submission: Submission;
  onSave: (grade: number) => void;
}

// ❌ Bad
interface Props {}
interface IGradePanel {}
type GradePanelProperties = {};
```

### Event Handlers

**Pattern:** `handle[Event]` or `on[Event]`

```typescript
// ✅ Good
const handleSubmit = () => {};
const handleChange = (e: ChangeEvent) => {};
const onClick = () => {};

// ❌ Bad
const submit = () => {};
const change = () => {};
const clickHandler = () => {};
```

## TypeScript Patterns

### Props with Children

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={className}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
```

### Optional Props with Defaults

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  disabled = false 
}: ButtonProps) {
  // ...
}
```

### Event Handler Types

```typescript
import { ChangeEvent, FormEvent, MouseEvent } from 'react';

interface FormProps {
  onSubmit: (data: FormData) => void;
  onChange: (value: string) => void;
}

export function Form({ onSubmit, onChange }: FormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ...
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // ...
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## State Management

### Local State

```typescript
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Complex State

```typescript
interface FormState {
  studentName: string;
  essayText: string;
  grade: number | null;
}

export function SubmissionForm() {
  const [form, setForm] = useState<FormState>({
    studentName: '',
    essayText: '',
    grade: null,
  });

  const updateField = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <input 
      value={form.studentName}
      onChange={(e) => updateField('studentName', e.target.value)}
    />
  );
}
```

### useEffect

```typescript
import { useEffect, useState } from 'react';

export function SubmissionView({ id }: { id: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(`/api/get-submission?id=${id}`);
        const json = await response.json();
        
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Fetch error:', error);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

## Tailwind CSS

### Utility Classes

```typescript
// ✅ Good - Use Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
    Click
  </button>
</div>

// ❌ Bad - Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Title</h2>
</div>
```

### Conditional Classes

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ variant, disabled }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
    >
      Click me
    </button>
  );
}
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>

<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
  Responsive Heading
</h1>
```

## shadcn/ui Integration

### Using shadcn Components

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Content here</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
```

### Customizing shadcn Components

```typescript
import { Button } from '@/components/ui/button';

export function CustomButton() {
  return (
    <Button 
      variant="outline" 
      size="lg"
      className="bg-gradient-to-r from-blue-500 to-purple-600"
    >
      Custom Styled Button
    </Button>
  );
}
```

## Accessibility

### Semantic HTML

```typescript
// ✅ Good
<button onClick={handleClick}>Submit</button>
<nav><a href="/dashboard">Dashboard</a></nav>
<main><h1>Page Title</h1></main>

// ❌ Bad
<div onClick={handleClick}>Submit</div>
<div><span onClick={navigate}>Dashboard</span></div>
```

### ARIA Attributes

```typescript
<button
  aria-label="Close dialog"
  aria-pressed={isActive}
  aria-disabled={isDisabled}
>
  <X className="h-4 w-4" />
</button>

<input
  aria-label="Student name"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="name-error"
/>
{hasError && <span id="name-error">Name is required</span>}
```

### Keyboard Navigation

```typescript
export function Modal({ onClose }: { onClose: () => void }) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <div>...</div>;
}
```

## Performance

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

export function ExpensiveComponent({ data }: { data: Item[] }) {
  // Memoize expensive calculations
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Memoize callbacks
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {sortedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Common Patterns

### Loading States

```typescript
export function SubmissionList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return <div>{/* Render submissions */}</div>;
}
```

### Form Handling

```typescript
export function SubmissionForm() {
  const [formData, setFormData] = useState({
    studentName: '',
    essayText: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentName) newErrors.studentName = 'Name is required';
    if (!formData.essayText) newErrors.essayText = 'Essay is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.studentName}
        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
      />
      {errors.studentName && <span className="text-red-600">{errors.studentName}</span>}
    </form>
  );
}
```

## Checklist

Before committing a component:

- [ ] TypeScript interfaces defined for all props
- [ ] Component follows naming conventions
- [ ] Uses Tailwind CSS utilities (no inline styles)
- [ ] Accessible (semantic HTML, ARIA attributes)
- [ ] Handles loading and error states
- [ ] Event handlers properly typed
- [ ] No console.logs left in code
- [ ] Responsive design considered
- [ ] Performance optimized (memo, useCallback if needed)
- [ ] Uses shadcn/ui components where appropriate

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- Related: `.windsurf/rules/code-style.md`

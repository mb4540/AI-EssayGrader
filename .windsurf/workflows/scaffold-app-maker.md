---
description: Generate a ready-to-deploy monorepo web application with React/FastAPI (App Maker)
---

User input: $ARGUMENTS

## Execution Steps

### 1. Verify Environment

Check that the following are available:
- Node.js >= 18
- Python >= 3.11
- npm (with workspaces support)

### 2. Parse Input
Extract from $ARGUMENTS: project name, description, list of frontend apps (at least one), features needed, database choice (PostgreSQL/SQLite/None), authentication requirement (yes/no), CI/CD requirement (GitHub Actions yes/no), brand color palette (or use defaults), environment config strategy (multi/single). Request clarification if incomplete.

### 3. Validate Constraints
Check against hard-stop rules:
- ✘ Refuse if database credentials would be hardcoded
- ✘ Refuse if missing input validation requirements
- ✘ Refuse if accessibility requirements omitted
If violated, explain clearly and suggest compliant alternative.

### 4. Generate Monorepo Project Structure

Create a monorepo using **npm workspaces**. The root contains:
- `apps/` — One subdirectory per frontend UI (React + TypeScript + TailwindCSS)
- `packages/common/` — Shared components, hooks, utilities, and types used across all apps
- `backend/` — FastAPI + Python API server

```
<project-name>/
├── apps/
│ ├── <app-1>/              # Primary frontend app
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── app/              # Routes and pages
│ │ │ ├── components/
│ │ │ │ ├── ui/             # shadcn/ui components
│ │ │ │ ├── features/       # App-specific feature components
│ │ │ │ └── layouts/        # Layout components
│ │ │ ├── lib/
│ │ │ │ ├── api/            # API client
│ │ │ │ └── hooks/          # App-specific hooks
│ │ │ ├── styles/
│ │ │ │ └── globals.css     # TailwindCSS + brand styles
│ │ │ └── types/            # App-specific TypeScript types
│ │ ├── tests/
│ │ │ ├── unit/
│ │ │ ├── integration/
│ │ │ └── e2e/
│ │ ├── package.json        # Depends on @<project>/common
│ │ ├── tsconfig.json
│ │ ├── tailwind.config.js
│ │ ├── vite.config.ts
│ │ └── .env.example
│ └── <app-2>/              # Additional frontend app (same shape)
│     └── ...
├── packages/
│ └── common/               # Shared across all apps
│     ├── src/
│     │ ├── components/     # Shared UI components
│     │ ├── hooks/          # Shared custom hooks
│     │ ├── utils/          # Shared utilities
│     │ └── types/          # Shared TypeScript types
│     ├── index.ts          # Barrel export
│     ├── package.json      # Name: @<project>/common
│     └── tsconfig.json
├── backend/
│ ├── app/
│ │ ├── api/
│ │ │ └── v1/              # API version 1
│ │ │   ├── endpoints/
│ │ │   └── dependencies.py
│ │ ├── core/
│ │ │ ├── config.py        # Settings
│ │ │ ├── security.py      # Auth & security
│ │ │ └── logging.py
│ │ ├── models/            # Database models
│ │ ├── schemas/           # Pydantic schemas
│ │ ├── services/          # Business logic
│ │ └── main.py            # FastAPI app
│ ├── tests/
│ │ ├── unit/
│ │ └── integration/
│ ├── requirements.txt
│ ├── Dockerfile
│ └── .env.example
├── package.json             # Root — npm workspaces config
├── tsconfig.base.json       # Shared TS config extended by apps & packages
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

### 5. Generate Root Monorepo Config

**A. Root package.json (npm workspaces)**:
```json
{
  "name": "<project-name>",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=apps/<app-1>",
    "dev:all": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  }
}
```

**B. Shared tsconfig.base.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 6. Generate Shared Package (packages/common)

**A. packages/common/package.json**:
```json
{
  "name": "@<project>/common",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**B. packages/common/src/index.ts** (barrel export):
```typescript
// Components
export * from './components';
// Hooks
export * from './hooks';
// Utilities
export * from './utils';
// Types
export * from './types';
```

### 7. Generate Frontend App Code

For each app under `apps/`, generate:

**A. App package.json** (references common):
```json
{
  "name": "@<project>/<app-name>",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "test": "vitest run"
  },
  "dependencies": {
    "@<project>/common": "*",
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-error-boundary": "^4.0.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

**B. TailwindCSS Config** (customize brand colors per project):
```javascript
// apps/<app-name>/tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/common/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-dark': '#1E40AF',
        accent: '#10B981',
        'accent-light': '#6EE7B7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**C. Global Styles**:
```css
/* apps/<app-name>/src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-900 bg-white antialiased;
  }
  h1, h2, h3 {
    @apply text-primary font-bold;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors;
  }
}
```

**D. API Client Setup**:
```typescript
// apps/<app-name>/src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**E. Main App Component**:
```typescript
// apps/<app-name>/src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        {/* Router and routes */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 8. Generate Backend Code

**A. FastAPI Main App**:
```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

**B. Configuration**:
```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    DATABASE_URL: str | None = None
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    class Config:
        env_file = ".env"

settings = Settings()
```

**C. Input Validation Example**:
```python
# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8)

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
```

**D. Requirements.txt with Tested Versions**:
```python
# backend/requirements.txt
# Web Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database ORM (compatible with Pydantic 2.9.x)
sqlalchemy==2.0.35
aiosqlite==0.19.0

# Data Validation (compatible with SQLAlchemy 2.0.35)
pydantic==2.9.2
pydantic-settings==2.5.2
python-json-logger==2.0.7

# Testing
pytest
pytest-asyncio
httpx

# Version compatibility verified: FastAPI 0.104.1 + Pydantic 2.9.2 + SQLAlchemy 2.0.35
```

### 8.5. Validate Python Dependencies

// turbo
Run `pip install --dry-run -r backend/requirements.txt` to verify all dependencies resolve without conflicts.

### 9. Post-Scaffold Checklist

After generation, verify:
- [ ] `npm install` succeeds at monorepo root (installs all workspaces)
- [ ] `npm run dev` starts the primary app
- [ ] `npm run build` builds all apps and packages without errors
- [ ] Each app can import from `@<project>/common`
- [ ] Backend starts with `uvicorn app.main:app --reload`
- [ ] All `.env.example` files document required variables
- [ ] README.md includes monorepo setup and per-app dev instructions
---
description: Generate ready-to-deploy web application with React/FastAPI following AT&T brand guidelines (App Maker)
---

User input: $ARGUMENTS

## Execution Steps

### 1. Verify Environment

Check that the following are available:
- Node.js >= 18
- Python >= 3.11
- npm or yarn

### 2. Parse Input
Extract from $ARGUMENTS: project name, description, features needed, database choice (PostgreSQL/SQLite/None), authentication requirement (Entra ID yes/no), CI/CD requirement (GitHub Actions yes/no), telemetry requirement (Azure App Insights yes/no), environment config strategy (multi/single). Request clarification if incomplete.

### 4. Validate Constraints
Check against hard-stop rules:
- ✘ Refuse if database credentials would be hardcoded
- ✘ Refuse if non-ATT fonts specified
- ✘ Refuse if AT&T Blue not dominant color
- ✘ Refuse if missing input validation requirements
- ✘ Refuse if accessibility requirements omitted
If violated, explain clearly and suggest compliant alternative.

### 5. Generate Project Structure

Create complete project with structure: frontend (React + TypeScript + TailwindCSS), backend (FastAPI + Python), database setup if requested, authentication integration if enabled, CI/CD pipeline if enabled, telemetry integration if enabled.

**Frontend Structure** (src/):
```
frontend/
├── public/
├── src/
│ ├── app/ # Routes and pages
│ ├── components/
│ │ ├── ui/ # shadcn/ui components
│ │ ├── features/ # Feature components
│ │ └── layouts/ # Layout components
│ ├── lib/
│ │ ├── api/ # API client
│ │ ├── hooks/ # Custom hooks
│ │ └── utils/ # Utilities
│ ├── styles/
│ │ └── globals.css # TailwindCSS + ATT styles
│ ├── assets/
│ │ └── fonts/
│ │ └── att-brand/ # ATT Aleck fonts
│ └── types/ # TypeScript types
├── tests/
│ ├── unit/
│ ├── integration/
│ └── e2e/
├── package.json
├── tsconfig.json
├── tailwind.config.js # ATT colors configured
├── vite.config.ts # or next.config.js
├── .eslintrc.json
├── .prettierrc
└── .env.example
```

**Backend Structure** (backend/):
```
backend/
├── app/
│ ├── api/
│ │ └── v1/ # API version 1
│ │ ├── endpoints/
│ │ └── dependencies.py
│ ├── core/
│ │ ├── config.py # Settings
│ │ ├── security.py # Auth & security
│ │ └── logging.py
│ ├── models/ # Database models
│ ├── schemas/ # Pydantic schemas
│ ├── services/ # Business logic
│ └── main.py # FastAPI app
├── tests/
│ ├── unit/
│ └── integration/
├── requirements.txt
├── Dockerfile
└── .env.example
```

### 6. Generate Frontend Code

**A. TailwindCSS Config with AT&T Colors**:
```javascript
// tailwind.config.js
module.exports = {
content: ['./src/**/*.{js,jsx,ts,tsx}'],
theme: {
extend: {
colors: {
'att-blue': '#009FDB',
'att-cobalt': '#00388F',
'att-lime': '#91DC00',
'att-mint': '#49EEDC',
},
fontFamily: {
sans: ['ATT Aleck Sans', 'system-ui', 'sans-serif'],
},
},
},
plugins: [],
};
```

**B. Global Styles with ATT Typography**:
```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
font-family: 'ATT Aleck Sans';
src: url('../../assets/fonts/att-brand/ATTAleckSans-Regular.woff2') format('woff2');
font-weight: 400;
font-style: normal;
}

@layer base {
body {
@apply font-sans text-black bg-white;
}
h1, h2, h3 {
@apply text-att-blue font-bold;
}
}

@layer components {
.btn-primary {
@apply bg-att-cobalt text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity;
}
}
```

**C. API Client Setup**:
```typescript
// src/lib/api/client.ts
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

**D. Main App Component**:
```typescript
// src/App.tsx
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

### 7. Generate Backend Code

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

### 7.5. Validate Python Dependencies

// turbo
Run `pip install --dry-run -r backend/requirements.txt` to verify all dependencies resolve without conflicts.
# Agent Coding Guidelines

## Build & Development Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)

# Build
npm run build        # Production build to ./dist
npm run preview      # Preview production build locally
```

**Note**: No test or lint commands are configured in this project. When adding features, manually verify functionality in the browser.

## Project Structure

```
├── components/       # React components
│   ├── Login.tsx           # Login page with phone/WeChat
│   ├── WeChatCallback.tsx # WeChat OAuth callback handler
│   └── ShareModal.tsx      # Share modal for quota
├── services/         # Service layer
│   ├── apiService.ts        # HTTP API service (backend communication)
│   ├── authService.ts      # Authentication service
│   ├── databaseService.ts    # Database service (LocalStorage fallback)
│   ├── tencentSmsService.ts # Tencent Cloud SMS service
│   └── glmService.ts        # GLM API integration
├── backend/          # Backend API server
│   ├── server.js            # Express server
│   ├── package.json         # Backend dependencies
│   └── README.md            # Backend documentation
├── database/         # Database files
│   └── schema.sql            # MySQL table structures
├── api/             # API routes (Vercel/serverless)
├── App.tsx          # Main application component
├── types.ts         # TypeScript interfaces and types
├── constants.ts     # Constants and system prompts
└── index.tsx        # Entry point with BrowserRouter
```
├── components/       # React components
│   ├── Login.tsx           # Login page with phone/WeChat
│   └── WeChatCallback.tsx # WeChat OAuth callback handler
├── services/         # API service functions
│   ├── authService.ts      # Authentication service
│   └── glmService.ts      # GLM API integration
├── api/             # API routes (Vercel/serverless)
├── App.tsx          # Main application component with routing
├── types.ts         # TypeScript interfaces and types
├── constants.ts     # Constants and system prompts
└── index.tsx        # Entry point with BrowserRouter
```

## Code Style Guidelines

### TypeScript
- **Strict mode**: All TypeScript strict rules enabled
- **Component typing**: Use `React.FC<Props>` for functional components
- **Interface over type**: Prefer interfaces for component props and data structures
- **Explicit types**: Never use `any`; define proper types in types.ts when needed
- **Generics**: Use sparingly, only when necessary (e.g., generic event handlers)

```tsx
// ✅ Good
interface ComponentProps {
  data: KLinePoint[];
  isLoading: boolean;
  onSubmit: (value: string) => void;
}
const MyComponent: React.FC<ComponentProps> = ({ data, isLoading, onSubmit }) => { ... };

// ❌ Bad
const MyComponent = ({ data, isLoading, onSubmit }: any) => { ... };
```

### React Patterns
- **Functional components only**: No class components
- **Hooks**: Use useState, useEffect, useMemo, useCallback as appropriate
- **Prop drilling**: For shallow component trees. For deep nesting, consider context
- **Event handlers**: Define as arrow functions or use useCallback for memoization
- **State updates**: Use functional setState for derived state

```tsx
// ✅ Good - functional state update
const [items, setItems] = useState<Item[]>([]);
const addItem = (item: Item) => setItems(prev => [...prev, item]);

// ✅ Good - useCallback for handlers passed to children
const handleSubmit = useCallback((data: FormData) => { ... }, [deps]);
```

### Imports & Dependencies
- **React imports**: Import specific hooks/components: `import React, { useState, useEffect } from 'react'`
- **Named imports preferred**: Use named imports from libraries (e.g., `import { ArrowRight } from 'lucide-react'`)
- **Local imports**: Use relative paths with explicit file extensions: `import { LifeDestinyResult } from './types'`
- **Order**: External deps → local components → services → types → utils

```tsx
// ✅ Good
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { KLinePoint } from '../types';
import { generateAnalysis } from '../services/glmService';
import LifeKLineChart from './LifeKLineChart';

// ❌ Bad
import * as React from 'react';
import ArrowRight from 'lucide-react';
```

### Naming Conventions
- **Components**: PascalCase (e.g., `LifeKLineChart`, `AnalysisResult`)
- **Functions/Variables**: camelCase (e.g., `handleSubmit`, `formData`, `isLoading`)
- **Types/Interfaces**: PascalCase (e.g., `UserInput`, `LifeDestinyResult`)
- **Constants**: UPPER_SNAKE_CASE for global constants (e.g., `API_STATUS`, `BAZI_SYSTEM_INSTRUCTION`)
- **Files**: camelCase for components, PascalCase for utilities if exported (e.g., `baziForm.tsx`, `types.ts`)

### Styling (TailwindCSS)
- **Utility-first**: Use Tailwind classes for all styling
- **Responsive**: Mobile-first approach (`md:` prefix for larger screens)
- **Dark mode**: Not currently implemented, but use `dark:` prefix when adding
- **Custom CSS**: Avoid inline styles; use Tailwind or CSS-in-JS only for dynamic values
- **Spacing**: Use Tailwind's spacing scale (p-4, m-2, gap-3, etc.)

```tsx
// ✅ Good
<div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Title</h2>
</div>

// ❌ Bad
<div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
```

### Error Handling
- **Try-catch**: Wrap all API calls and async operations
- **Error messages**: Provide descriptive, user-friendly error messages
- **Error states**: Display error UI to users (not just console.error)
- **Type safety**: Use proper error types or error objects

```tsx
// ✅ Good
try {
  const result = await fetchData();
  setData(result);
} catch (error: any) {
  console.error('Failed to fetch data:', error);
  setError(`Failed to load data: ${error.message}`);
  // Show error UI
}
```

### API Integration
- **Services**: All API calls go through `/services/` directory
- **Streaming responses**: Handle Server-Sent Events for AI responses (see `glmService.ts`)
- **JSON parsing**: Model responses may need cleanup; handle markdown code blocks and parse errors
- **Environment variables**: Use `import.meta.env.VITE_*` for client-side env vars
- **API keys**: Never commit API keys. Use `.env` file (gitignored)
- **Auth service**: `authService` handles login, logout, token management via LocalStorage
- **SMS service**: `tencentSmsService` handles Tencent Cloud SMS for verification codes
- **API service**: `apiService` handles HTTP requests to backend API
- **Database service**: `databaseService` manages quota and usage records (with LocalStorage fallback)

### Routing & Authentication
- **Router**: Uses React Router v6 (react-router-dom)
- **Protected routes**: Wrap protected components with `<ProtectedRoute>`
- **Login flow**: Unauthenticated users redirected to `/login`
- **WeChat callback**: `/wechat-callback` handles OAuth2.0 code exchange
- **Auth persistence**: Tokens stored in LocalStorage key `lifekline_auth`

### File Organization
- **One component per file**: Each `.tsx` file should export one main component
- **Related components**: Group in `components/` directory
- **Types**: Centralize in `types.ts` at root level
- **Services**: API calls and external integrations in `services/`
- **Backend**: Express server and MySQL connection in `backend/`
- **Database**: MySQL schemas and table structures in `database/`
- **Constants**: Static strings and configuration in `constants.ts`

## Backend API Architecture

### Recommended Setup
- **Frontend**: React + Vite (runs on http://localhost:5173)
- **Backend**: Node.js + Express (runs on http://localhost:3000)
- **Database**: MySQL (stores all user data and usage records)

### API Service Layer
- **`apiService.ts`**: HTTP client for backend API requests
- **`databaseService.ts`**: Database operations with LocalStorage fallback
- **`authService.ts`**: Integrates with database service for user creation

### Flow Example
```
User Login → authService.loginWithPhone()
              ↓
           databaseService.getUserByPhone()
              ↓
           apiService.getUserByPhone() → Backend API
              ↓
           MySQL Database
              ↓
           Create user → Initialize quota to 1
```

### Environment Variables
**Frontend (.env)**:
```env
VITE_API_BASE_URL=http://localhost:3000/api # Backend API endpoint
VITE_GLM_API_KEY=your_glm_api_key
VITE_WECHAT_APP_ID=your_wechat_app_id
```

**Backend (.env)**:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=lifekline
PORT=3000
```

### Comments & Documentation
- **Minimal comments**: Code should be self-documenting
- **Complex logic**: Add brief comments for non-obvious algorithms
- **Type annotations**: Let TypeScript document the code; add comments only for domain knowledge
- **Do not add**: Basic comments like "function to handle submit" - the function name should be clear

## Adding New Features

1. **Define types first**: Add/update interfaces in `types.ts`
2. **Create backend API** (if needed): Add API calls to `backend/server.js`
3. **Create service layer**: Add HTTP requests to `services/apiService.ts`
4. **Create database layer**: Add database operations to `services/databaseService.ts`
5. **Build components**: Create component in `components/` with proper TypeScript typing
6. **Integrate**: Import and use in `App.tsx` or parent component
7. **Test backend**: Start backend server with `cd backend && npm start`
8. **Test frontend**: Run `npm run dev` and verify functionality
9. **Build check**: Run `npm run build` to ensure TypeScript compilation passes

## Common Patterns

### Form Handling
```tsx
interface FormData {
  name: string;
  age: number;
}

const MyForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', age: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation and submission logic
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Data Fetching with Loading/Error States
```tsx
const [data, setData] = useState<Result | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await apiCall();
    setData(result);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Protected Route Pattern
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Usage in App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/*" element={<ProtectedRoute><MainContent /></ProtectedRoute>} />
</Routes>
```

### Authentication Check
```tsx
import { authService } from '../services/authService';

const MyComponent: React.FC = () => {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <div>Welcome, {user.nickname}</div>;
};
```

## Type Safety Rules
- **No `any`**: Always use proper types or `unknown` with type guards
- **Null checks**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Type guards**: Use `typeof`, `instanceof`, or custom guards for runtime checks
- **Strict equality**: Always use `===` and `!==`

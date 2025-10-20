# Design Document

## Overview

Design Kit MVP is a Next.js 14 application built with TypeScript, Tailwind CSS, and Supabase. The architecture follows a modern JAMstack approach with server-side rendering for SEO, client-side interactivity for tools, and Supabase for authentication and data persistence. The MVP focuses on delivering the Color Picker tool as the first client-side tool while establishing the foundation for future tools and premium features.

### Key Design Principles

1. **Privacy-First**: Client-side tools process files entirely in the browser without server upload
2. **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with client-side features
3. **Component Reusability**: Shared components (ToolWrapper, FileUploader) ensure consistency
4. **Type Safety**: Strict TypeScript configuration prevents runtime errors
5. **Performance**: Code splitting, lazy loading, and optimized images for fast load times

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js 14 App (React)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Pages      │  │  Components  │  │   Stores    │ │ │
│  │  │  (Routes)    │  │   (UI/Shared)│  │  (Zustand)  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         │                  │                 │         │ │
│  │         └──────────────────┴─────────────────┘         │ │
│  │                          │                              │ │
│  │                   ┌──────▼──────┐                      │ │
│  │                   │   Lib/Utils │                      │ │
│  │                   └──────┬──────┘                      │ │
│  └──────────────────────────┼───────────────────────────┘ │
└─────────────────────────────┼─────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼──────┐
            │   Supabase     │  │  Cloudflare │
            │  (Auth + DB)   │  │    Pages    │
            └────────────────┘  └─────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14.2+ (App Router)
- React 18.3+
- TypeScript 5.4+
- Tailwind CSS 3.4+
- shadcn/ui components
- Zustand 4.5+ (state management)
- Framer Motion 11+ (animations)

**Backend:**
- Supabase (PostgreSQL + Auth)
- Supabase Edge Functions (future API tools)

**Deployment:**
- Cloudflare Pages (hosting)
- Cloudflare CDN (assets)

**Development:**
- ESLint + Prettier (code quality)
- TypeScript strict mode
- Git + GitHub (version control)

## Components and Interfaces

### Component Hierarchy

```
app/
├── layout.tsx (Root Layout)
│   ├── Header
│   ├── {children}
│   └── Footer
│
├── page.tsx (Landing Page)
│   ├── Hero
│   ├── ToolsGrid
│   ├── Features
│   ├── Pricing
│   └── CTA
│
├── (auth)/
│   ├── login/page.tsx
│   │   └── LoginForm
│   └── signup/page.tsx
│       └── SignupForm
│
├── (tools)/
│   └── color-picker/page.tsx
│       ├── ToolWrapper
│       │   ├── ColorCanvas
│       │   ├── ColorDisplay
│       │   └── ColorHistory
│       └── FileUploader
│
└── (dashboard)/
    └── dashboard/page.tsx
        ├── UsageChart
        ├── PlanCard
        └── ActivityLog
```

### Core Components

#### 1. ToolWrapper Component

**Purpose**: Provides consistent layout and navigation for all tool pages

**Interface:**
```typescript
interface ToolWrapperProps {
  title: string
  description: string
  icon?: string
  children: ReactNode
  showBackButton?: boolean
  infoContent?: ReactNode
}
```

**Features:**
- Back navigation to tools grid
- Tool title and description
- Optional info modal
- Privacy notice footer
- Responsive layout

#### 2. FileUploader Component

**Purpose**: Handles file selection via drag-and-drop or browse

**Interface:**
```typescript
interface FileUploaderProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  description?: string
  multiple?: boolean
}
```

**Features:**
- Drag and drop zone
- File type validation
- Size validation
- Visual feedback (drag active state)
- Selected file display with clear option

#### 3. ColorCanvas Component

**Purpose**: Renders image on HTML5 canvas and handles color picking

**Interface:**
```typescript
interface ColorCanvasProps {
  imageSrc: string
  onColorPick: (color: Color) => void
  onImageReset: () => void
}

interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}
```

**Features:**
- Canvas rendering with image scaling
- Click-to-pick color extraction
- Zoom controls (0.5x to 3x)
- Reset image functionality
- Crosshair cursor
- Pixel-perfect color reading

**Implementation Details:**
```typescript
// Canvas context configuration
const ctx = canvas.getContext('2d', { 
  willReadFrequently: true  // Optimize for frequent pixel reads
})

// Image scaling algorithm
const maxWidth = 800
const scale = img.width > maxWidth ? maxWidth / img.width : 1
canvas.width = img.width * scale
canvas.height = img.height * scale

// Color extraction
const imageData = ctx.getImageData(x, y, 1, 1)
const [r, g, b] = imageData.data

// RGB to HSL conversion
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}
```

#### 4. ColorDisplay Component

**Purpose**: Shows current color with all format representations

**Interface:**
```typescript
interface ColorDisplayProps {
  color: Color | null
  onCopy: (format: 'hex' | 'rgb' | 'hsl') => void
}
```

**Features:**
- Color preview swatch
- HEX, RGB, HSL values
- Copy buttons for each format
- Visual feedback on copy (checkmark)
- Empty state when no color selected

#### 5. ColorHistory Component

**Purpose**: Displays recently picked colors and export functionality

**Interface:**
```typescript
interface ColorHistoryProps {
  colors: Color[]
  onColorSelect: (color: Color) => void
  onExport: () => void
  onClear: () => void
}
```

**Features:**
- Grid of color swatches (max 10)
- Click to re-select color
- Export palette as JSON
- Clear history with confirmation
- Empty state

### Shared UI Components (shadcn/ui)

All UI components follow shadcn/ui patterns for consistency:

- **Button**: Primary, secondary, outline, ghost variants
- **Card**: Container with padding and border
- **Input**: Text input with validation states
- **Label**: Form labels with proper accessibility
- **Select**: Dropdown selection
- **Slider**: Range input for numeric values
- **Toast**: Notification system (react-hot-toast)
- **Dialog**: Modal dialogs
- **Tooltip**: Hover information

## Data Models

### User Profile

```typescript
interface Profile {
  id: string                    // UUID, references auth.users
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'premium' | 'pro'
  stripe_customer_id: string | null
  created_at: string            // ISO timestamp
  updated_at: string            // ISO timestamp
}
```

### Subscription

```typescript
interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: 'premium' | 'pro'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
```

### Tool Usage

```typescript
interface ToolUsage {
  id: string
  user_id: string
  tool_name: string
  is_api_tool: boolean
  file_size_mb: number | null
  processing_time_ms: number | null
  success: boolean
  error_message: string | null
  created_at: string
}
```

### Daily Limit

```typescript
interface DailyLimit {
  id: string
  user_id: string
  date: string                  // YYYY-MM-DD
  api_tools_count: number
  created_at: string
  updated_at: string
}
```

### Database Schema

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  plan TEXT CHECK (plan IN ('premium', 'pro')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tool usage table
CREATE TABLE tool_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  is_api_tool BOOLEAN DEFAULT FALSE,
  file_size_mb DECIMAL(10, 2),
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily limits table
CREATE TABLE daily_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  api_tools_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_tool_usage_user_date ON tool_usage(user_id, created_at);
CREATE INDEX idx_tool_usage_tool ON tool_usage(tool_name);
CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON tool_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
  ON tool_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own limits"
  ON daily_limits FOR SELECT
  USING (auth.uid() = user_id);
```

## State Management

### Zustand Stores

#### Auth Store

```typescript
// store/authStore.ts
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))
```

#### Tool Store

```typescript
// store/toolStore.ts
import { create } from 'zustand'

interface ToolState {
  currentTool: string | null
  history: any[]
  setCurrentTool: (tool: string) => void
  addToHistory: (item: any) => void
  clearHistory: () => void
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: null,
  history: [],
  
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  addToHistory: (item) => set((state) => ({
    history: [item, ...state.history].slice(0, 10)
  })),
  
  clearHistory: () => set({ history: [] })
}))
```

#### UI Store

```typescript
// store/uiStore.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'system',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme })
}))
```

## Error Handling

### Error Types

```typescript
// types/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Daily quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 403)
    this.name = 'QuotaExceededError'
  }
}

export class FileValidationError extends AppError {
  constructor(message: string) {
    super(message, 'FILE_VALIDATION_ERROR', 400)
    this.name = 'FileValidationError'
  }
}
```

### Error Handling Strategy

**Client-Side:**
```typescript
// User-friendly error messages
try {
  await processImage(file)
  toast.success('Image processed successfully!')
} catch (error) {
  if (error instanceof QuotaExceededError) {
    toast.error('Daily limit reached. Upgrade to continue.')
    showUpgradeModal()
  } else if (error instanceof FileValidationError) {
    toast.error(error.message)
  } else {
    toast.error('Something went wrong. Please try again.')
    console.error('Unexpected error:', error)
  }
}
```

**Server-Side:**
```typescript
// API route error handling
export async function POST(req: NextRequest) {
  try {
    // Process request
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

## Testing Strategy

### Unit Tests

**Tools:**
- Jest
- React Testing Library

**Coverage:**
- Utility functions (color conversion, file validation)
- Custom hooks (useAuth, useFileUpload)
- Pure components (ColorDisplay, ColorHistory)

**Example:**
```typescript
// __tests__/utils/colorConversion.test.ts
import { rgbToHsl, hexToRgb } from '@/lib/utils/colorConversion'

describe('Color Conversion', () => {
  test('converts RGB to HSL correctly', () => {
    const result = rgbToHsl(59, 130, 246)
    expect(result).toEqual({ h: 217, s: 91, l: 60 })
  })
  
  test('converts HEX to RGB correctly', () => {
    const result = hexToRgb('#3B82F6')
    expect(result).toEqual({ r: 59, g: 130, b: 246 })
  })
})
```

### Integration Tests

**Tools:**
- Playwright

**Coverage:**
- Authentication flows (signup, login, logout)
- Tool workflows (upload → process → download)
- Navigation and routing

**Example:**
```typescript
// e2e/color-picker.spec.ts
import { test, expect } from '@playwright/test'

test('Color Picker workflow', async ({ page }) => {
  await page.goto('/color-picker')
  
  // Upload image
  await page.setInputFiles('input[type="file"]', 'test-image.png')
  
  // Wait for canvas
  await page.waitForSelector('canvas')
  
  // Click on canvas
  await page.click('canvas', { position: { x: 100, y: 100 } })
  
  // Verify color display
  await expect(page.locator('[data-testid="hex-value"]')).toBeVisible()
  
  // Copy HEX value
  await page.click('[data-testid="copy-hex"]')
  await expect(page.locator('text=Copied')).toBeVisible()
})
```

### Manual Testing Checklist

**For Each Tool:**
- [ ] File upload (drag & drop and browse)
- [ ] File validation (size, type)
- [ ] Tool functionality
- [ ] Download/export
- [ ] Error states
- [ ] Loading states
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const ColorCanvas = dynamic(() => import('./ColorCanvas'), {
  loading: () => <LoadingSpinner />,
  ssr: false  // Client-side only
})
```

### Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Design Kit"
  width={200}
  height={50}
  priority  // For above-the-fold images
/>
```

### Bundle Size Optimization

- Tree-shaking unused code
- Lazy loading routes
- Minimize third-party dependencies
- Use native browser APIs when possible

### Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## Security Considerations

### Authentication

- Supabase Auth handles password hashing (bcrypt)
- JWT tokens for session management
- Secure HTTP-only cookies
- CSRF protection via SameSite cookies

### Input Validation

```typescript
// Zod schemas for validation
import { z } from 'zod'

const fileSchema = z.instanceof(File)
  .refine(file => file.size <= 10 * 1024 * 1024, 'File too large')
  .refine(
    file => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type),
    'Invalid file type'
  )
```

### Content Security Policy

```typescript
// middleware.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co;
`
```

### Row Level Security

All database tables use RLS policies to ensure users can only access their own data.

## Deployment Architecture

### Cloudflare Pages

```yaml
Build Configuration:
  Framework: Next.js
  Build Command: npm run build
  Output Directory: .next
  Node Version: 18.x

Environment Variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY

Features:
  - Automatic HTTPS
  - Global CDN
  - DDoS protection
  - Web Application Firewall
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Cloudflare Pages auto-deploys on push
```

## Monitoring and Analytics

### Error Tracking

**Sentry Integration:**
```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
})
```

### Analytics

**Plausible Analytics:**
```typescript
// app/layout.tsx
<script 
  defer 
  data-domain="designkit.com"
  src="https://plausible.io/js/script.js"
/>
```

**Custom Events:**
```typescript
// Track tool usage
plausible('Tool Used', { props: { tool: 'color-picker' } })

// Track conversions
plausible('Signup', { props: { method: 'email' } })
```

## Future Considerations

### Scalability

- **Database**: Supabase scales automatically
- **CDN**: Cloudflare handles global distribution
- **API Tools**: Will use Supabase Edge Functions for serverless scaling

### Extensibility

- **Plugin System**: Future tools follow same ToolWrapper pattern
- **API Access**: Pro users will get REST API access
- **Webhooks**: Event notifications for Pro users

### Internationalization

- **i18n Support**: Next.js built-in i18n
- **Language Files**: JSON files for translations
- **RTL Support**: Tailwind RTL plugin

## Conclusion

This design provides a solid foundation for the Design Kit MVP, focusing on the Color Picker tool while establishing patterns and infrastructure for future tools. The architecture prioritizes user privacy, performance, and developer experience, with clear separation of concerns and type safety throughout the application.

# Project Structure

## Directory Organization

```
design-kit/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                  # Auth pages (login, signup)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/             # User dashboard
│   │   ├── dashboard/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── (tools)/                 # Tool pages
│   │   ├── color-picker/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── image-cropper/
│   │   ├── image-resizer/
│   │   ├── format-converter/
│   │   ├── qr-generator/
│   │   ├── gradient-generator/
│   │   ├── image-compressor/
│   │   ├── background-remover/
│   │   ├── image-upscaler/
│   │   ├── mockup-generator/
│   │   └── layout.tsx
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── tools/
│   │   ├── stripe/
│   │   └── user/
│   ├── pricing/page.tsx
│   ├── globals.css
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── shared/                  # Reusable tool components
│   │   ├── ToolWrapper.tsx      # Common wrapper for all tools
│   │   ├── FileUploader.tsx     # Drag-and-drop file upload
│   │   ├── DownloadButton.tsx
│   │   ├── UsageIndicator.tsx
│   │   └── LoadingSpinner.tsx
│   ├── marketing/               # Landing page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ToolsGrid.tsx
│   │   └── Pricing.tsx
│   └── dashboard/               # Dashboard components
│       ├── UsageChart.tsx
│       ├── PlanCard.tsx
│       └── ActivityLog.tsx
│
├── lib/
│   ├── supabase/               # Supabase client & server
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── stripe/                 # Stripe integration
│   │   ├── client.ts
│   │   └── server.ts
│   ├── api-clients/            # External API clients
│   │   ├── removebg.ts
│   │   └── replicate.ts
│   ├── utils/                  # Utility functions
│   │   ├── cn.ts               # className merger
│   │   ├── image-processing.ts
│   │   ├── file-validation.ts
│   │   └── format-helpers.ts
│   └── hooks/                  # Custom React hooks
│       ├── useAuth.ts
│       ├── useUsage.ts
│       ├── useSubscription.ts
│       └── useFileUpload.ts
│
├── store/                       # Zustand state management
│   ├── authStore.ts            # User authentication state
│   ├── toolStore.ts            # Tool-specific state
│   └── uiStore.ts              # UI state (sidebar, theme)
│
├── types/                       # TypeScript types
│   ├── index.ts
│   ├── tools.ts
│   ├── user.ts
│   └── subscription.ts
│
├── config/                      # App configuration
│   ├── site.ts                 # Site metadata
│   ├── tools.ts                # Tool configurations
│   └── pricing.ts              # Pricing plans
│
├── public/                      # Static assets
│   ├── images/
│   └── mockup-templates/
│
├── .env.local                   # Environment variables (not committed)
├── .env.example                 # Example environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── components.json              # shadcn/ui configuration
```

## Key Architectural Patterns

### Route Groups
- `(auth)` - Authentication pages with shared auth layout
- `(dashboard)` - Protected dashboard pages requiring authentication
- `(tools)` - Tool pages with shared tool layout

### Component Organization
- **ui/** - Base UI components from shadcn/ui, reusable across the app
- **shared/** - Tool-specific shared components (ToolWrapper, FileUploader)
- **layout/** - App-wide layout components (Header, Footer)
- **marketing/** - Landing page specific components
- **dashboard/** - Dashboard specific components

### Tool Page Structure
Each tool follows this pattern:
```
(tools)/tool-name/
├── page.tsx              # Main tool page
└── components/           # Tool-specific components
    ├── ToolCanvas.tsx
    ├── ToolControls.tsx
    └── ToolPreview.tsx
```

### API Route Structure
```
api/
├── auth/                 # Authentication endpoints
├── tools/                # Tool processing endpoints
│   ├── background-remover/
│   ├── upscaler/
│   └── usage/
├── stripe/               # Payment endpoints
│   ├── create-checkout/
│   ├── webhook/
│   └── portal/
└── user/                 # User data endpoints
    ├── stats/
    └── plan/
```

## Naming Conventions

- **Components**: PascalCase (`ColorPicker.tsx`, `UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Pages**: lowercase with hyphens (`color-picker/page.tsx`)
- **Types**: PascalCase (`User.ts`, `ToolConfig.ts`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useFileUpload.ts`)
- **Stores**: camelCase with `Store` suffix (`authStore.ts`, `uiStore.ts`)

## Import Order Convention

```typescript
// 1. React & Next.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { toast } from 'react-hot-toast'
import { z } from 'zod'

// 3. Internal components
import { Button } from '@/components/ui/button'
import { ColorCanvas } from './components/ColorCanvas'

// 4. Utils & hooks
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/lib/hooks/useAuth'

// 5. Types
import type { Color } from '@/types'
```

## File Naming Patterns

- **Page files**: Always named `page.tsx` (Next.js App Router convention)
- **Layout files**: Always named `layout.tsx`
- **Component files**: Named after the component (`Button.tsx`, `ColorPicker.tsx`)
- **Utility files**: Descriptive names (`colorConversion.ts`, `fileValidation.ts`)
- **Test files**: Same name with `.test.ts` or `.spec.ts` suffix

## Documentation Location

Project documentation is organized in the root directory:
- `README.md` - Setup instructions and quick start
- `CLAUDE.md` - AI development guidelines
- `DesignKit_plan.md` - Complete project plan and architecture
- `business-rules.md` - Pricing, quotas, and business logic
- `security-guidelines.md` - Security best practices
- `user-roles.md` - User permissions and plan limits
- `api-documentation.md` - API reference
- `user-flows.md` - User journeys and workflows

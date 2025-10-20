# Technology Stack

## Core Technologies

**Framework**: Next.js 14.2+ (App Router)
**Language**: TypeScript 5.4+ (strict mode)
**Styling**: Tailwind CSS 3.4+
**UI Components**: shadcn/ui
**State Management**: Zustand v4
**Database**: Supabase (PostgreSQL)
**Authentication**: Supabase Auth
**Payments**: Stripe
**Deployment**: Cloudflare Pages

## Key Dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "typescript": "^5.4.0",
  "@supabase/supabase-js": "^2.43.0",
  "zustand": "^4.5.0",
  "stripe": "^15.0.0",
  "qrcode": "^1.5.3",
  "react-cropper": "^2.3.3",
  "browser-image-compression": "^2.0.2",
  "framer-motion": "^11.0.0",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.378.0"
}
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # TypeScript checking

# Database
npm run db:generate      # Generate Supabase types

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode
```

## Architecture Patterns

### Client-Side Processing
- Client-side tools use HTML5 Canvas API and browser-native APIs
- No file uploads to server for privacy-first tools
- Image processing happens entirely in browser

### Server-Side API Tools
- API routes in `app/api/` for server-side processing
- Quota checking middleware before processing
- Usage tracking after successful operations
- Integration with external APIs (Remove.bg, Replicate)

### Authentication Flow
- Supabase Auth handles password hashing and session management
- JWT tokens for session management
- OAuth support (Google, GitHub)
- Row Level Security (RLS) for data isolation

### State Management
- Zustand stores for global state (auth, UI, tool-specific)
- React useState for component-local state
- Session persistence via Supabase client

## Database Schema

Tables: `profiles`, `subscriptions`, `tool_usage`, `daily_limits`

All tables use Row Level Security (RLS) to ensure users can only access their own data.

Key functions:
- `can_use_api_tool(user_id)` - Check quota before processing
- `increment_api_usage(user_id)` - Update usage after processing
- `get_or_create_daily_limit(user_id)` - Get/create daily limit record

## Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, never expose)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key (server-only)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

Optional (for API tools):
- `REMOVE_BG_API_KEY` - Remove.bg API key
- `REPLICATE_API_KEY` - Replicate API key

## Performance Targets

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

## Security Practices

- All environment variables validated with Zod schemas
- Content Security Policy (CSP) headers enforced
- Row Level Security (RLS) on all database tables
- Input validation using Zod schemas
- HTTPS enforced in production
- API rate limiting (Upstash Redis)
- File upload validation (type, size, magic numbers)

## Build Configuration

Next.js configuration optimized for:
- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Static generation where possible
- Server-side rendering for SEO-critical pages
- Edge runtime for API routes (future)

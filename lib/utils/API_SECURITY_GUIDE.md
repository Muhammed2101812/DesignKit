# API Security Utilities Guide

This guide explains how to use the API security utilities to create secure API routes with authentication, rate limiting, and error handling.

## Overview

The `apiSecurity.ts` module provides a comprehensive set of utilities for securing API routes in the Design Kit application. It implements:

- **Authentication**: Automatic user authentication via Supabase
- **Rate Limiting**: Configurable rate limits based on user plans
- **Method Validation**: HTTP method whitelisting
- **Error Handling**: Consistent error responses with proper status codes
- **Plan Validation**: Check user subscription levels

## Requirements

This implementation satisfies the following requirements:
- **8.1**: Rate limiting on all API routes
- **8.2**: User-based and IP-based rate limiting
- **8.5**: File upload validation and security headers

## Quick Start

### Basic Authenticated Route

```typescript
// app/api/user/profile/route.ts
import { secureApiRoute } from '@/lib/utils/apiSecurity'

export const GET = secureApiRoute(async ({ user, supabase }) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return NextResponse.json({ profile })
})
```

### Public Route with Rate Limiting

```typescript
// app/api/public/stats/route.ts
import { secureApiRoute } from '@/lib/utils/apiSecurity'

export const GET = secureApiRoute(
  async ({ supabase }) => {
    const { data: stats } = await supabase
      .from('tool_usage')
      .select('count')
      .limit(10)

    return NextResponse.json({ stats })
  },
  {
    requireAuth: false,
    rateLimit: 'guest', // 30 requests per minute
  }
)
```

### Strict Rate Limiting for Sensitive Operations

```typescript
// app/api/auth/reset-password/route.ts
import { secureApiRoute, validateRequestBody, ValidationError } from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(
  async ({ request, supabase }) => {
    const body = await validateRequestBody(request, (data) => {
      if (!data.email) throw new ValidationError('Email is required')
      return data
    })

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(body.email)
    
    if (error) throw error

    return NextResponse.json({ message: 'Password reset email sent' })
  },
  {
    requireAuth: false,
    rateLimit: 'strict', // 5 requests per minute
    allowedMethods: ['POST'],
  }
)
```

## Configuration Options

### SecureApiRouteConfig

```typescript
interface SecureApiRouteConfig {
  requireAuth?: boolean              // Default: true
  rateLimit?: string | RateLimitConfig | false  // Default: 'free'
  allowedMethods?: string[]          // Default: ['GET', 'POST']
  errorMessages?: {
    unauthorized?: string
    methodNotAllowed?: string
    rateLimit?: string
  }
}
```

### Rate Limit Tiers

Predefined rate limit configurations:

| Tier | Requests/Minute | Use Case |
|------|----------------|----------|
| `guest` | 30 | Unauthenticated users |
| `free` | 60 | Free plan users |
| `premium` | 120 | Premium plan users |
| `pro` | 300 | Pro plan users |
| `strict` | 5 | Sensitive operations (auth, payments) |

### Custom Rate Limiting

```typescript
export const POST = secureApiRoute(
  async ({ user }) => {
    // Your logic
    return NextResponse.json({ success: true })
  },
  {
    rateLimit: {
      maxRequests: 100,
      windowSeconds: 60,
      errorMessage: 'Custom rate limit message',
    },
  }
)
```

## Error Handling

### Using handleApiError

```typescript
import { secureApiRoute, handleApiError } from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(async ({ user, supabase, request }) => {
  try {
    const body = await request.json()
    
    // Your processing logic
    const result = await processData(body)
    
    return NextResponse.json({ result })
  } catch (error) {
    return handleApiError(error, { 
      userId: user?.id,
      operation: 'processData' 
    })
  }
})
```

### Custom Error Classes

Use built-in error classes for specific HTTP status codes:

```typescript
import { 
  ValidationError,      // 400
  UnauthorizedError,    // 401
  ForbiddenError,       // 403
  NotFoundError,        // 404
  ConflictError,        // 409
  TooManyRequestsError, // 429
} from '@/lib/utils/apiSecurity'

// Example usage
if (!data.email) {
  throw new ValidationError('Email is required')
}

if (!resource) {
  throw new NotFoundError('Resource not found')
}
```

## Advanced Features

### Request Body Validation

```typescript
import { secureApiRoute, validateRequestBody, ValidationError } from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(async ({ request }) => {
  const body = await validateRequestBody(request, (data) => {
    if (!data.name || data.name.length < 3) {
      throw new ValidationError('Name must be at least 3 characters')
    }
    if (!data.email || !data.email.includes('@')) {
      throw new ValidationError('Valid email is required')
    }
    return data as { name: string; email: string }
  })

  // body is now typed and validated
  return NextResponse.json({ success: true })
})
```

### Plan-Based Access Control

```typescript
import { secureApiRoute, checkUserPlan, ForbiddenError } from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(async ({ user, supabase }) => {
  // Check if user has premium plan or higher
  if (!await checkUserPlan(user!, supabase, 'premium')) {
    throw new ForbiddenError('Premium plan required for this feature')
  }

  // Premium feature logic
  return NextResponse.json({ success: true })
})
```

### Success Response Helper

```typescript
import { secureApiRoute, createSuccessResponse } from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(async ({ user, supabase, request }) => {
  const body = await request.json()
  
  const { data } = await supabase
    .from('items')
    .insert(body)
    .select()
    .single()

  // Returns { success: true, data: {...}, timestamp: "..." }
  return createSuccessResponse(data, 201)
})
```

### Query Parameter Extraction

```typescript
import { secureApiRoute, getQueryParams } from '@/lib/utils/apiSecurity'

export const GET = secureApiRoute(async ({ request, supabase }) => {
  const { page, limit, sort } = getQueryParams(request, ['page', 'limit', 'sort'])
  
  const pageNum = parseInt(page || '1')
  const limitNum = parseInt(limit || '10')
  
  const { data } = await supabase
    .from('items')
    .select('*')
    .order(sort || 'created_at')
    .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)

  return NextResponse.json({ data })
})
```

## Complete Example: API Tool Route

Here's a complete example of an API-powered tool route with all security features:

```typescript
// app/api/tools/background-remover/route.ts
import { NextResponse } from 'next/server'
import { 
  secureApiRoute, 
  handleApiError,
  validateRequestBody,
  ValidationError,
  ForbiddenError,
} from '@/lib/utils/apiSecurity'

export const POST = secureApiRoute(
  async ({ user, supabase, request }) => {
    try {
      // 1. Validate request body
      const body = await validateRequestBody(request, (data) => {
        if (!data.imageUrl) {
          throw new ValidationError('Image URL is required')
        }
        return data as { imageUrl: string }
      })

      // 2. Check quota
      const { data: canUse, error: quotaError } = await supabase
        .rpc('can_use_api_tool', { user_id: user!.id })

      if (quotaError || !canUse) {
        throw new ForbiddenError('Daily quota exceeded')
      }

      // 3. Process image (your logic here)
      const result = await removeBackground(body.imageUrl)

      // 4. Increment usage
      await supabase.rpc('increment_api_usage', { 
        user_id: user!.id,
        tool_name: 'background-remover'
      })

      // 5. Return success
      return NextResponse.json({
        success: true,
        result,
      })
    } catch (error) {
      return handleApiError(error, {
        userId: user?.id,
        tool: 'background-remover',
      })
    }
  },
  {
    requireAuth: true,
    rateLimit: 'strict', // 5 requests per minute for API tools
    allowedMethods: ['POST'],
    errorMessages: {
      rateLimit: 'Too many background removal requests. Please wait a moment.',
    },
  }
)

// Mock function - replace with actual implementation
async function removeBackground(imageUrl: string) {
  // Your background removal logic
  return { processedImageUrl: imageUrl }
}
```

## Best Practices

### 1. Always Use secureApiRoute

Instead of manually implementing security checks, use `secureApiRoute`:

```typescript
// ❌ Don't do this
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... more manual checks
}

// ✅ Do this
export const POST = secureApiRoute(async ({ user, supabase }) => {
  // user is guaranteed to be authenticated
})
```

### 2. Use Custom Error Classes

Throw specific error types for better error handling:

```typescript
// ❌ Generic errors
throw new Error('Not found')

// ✅ Specific error classes
throw new NotFoundError('User not found')
```

### 3. Validate Input Early

Use `validateRequestBody` to catch validation errors early:

```typescript
const body = await validateRequestBody(request, (data) => {
  if (!data.email) throw new ValidationError('Email required')
  if (!data.password || data.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters')
  }
  return data
})
```

### 4. Choose Appropriate Rate Limits

- Use `'strict'` for authentication and payment endpoints
- Use `'guest'` for public endpoints
- Use plan-based limits (`'free'`, `'premium'`, `'pro'`) for user-specific endpoints
- Use custom limits for special cases

### 5. Provide Context in Error Handling

Always include relevant context when handling errors:

```typescript
catch (error) {
  return handleApiError(error, {
    userId: user?.id,
    operation: 'specificOperation',
    additionalContext: 'any relevant data',
  })
}
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { ValidationError, NotFoundError } from '@/lib/utils/apiSecurity'

describe('API Security', () => {
  it('should throw ValidationError for invalid input', () => {
    expect(() => {
      if (!data.email) throw new ValidationError('Email required')
    }).toThrow(ValidationError)
  })
})
```

### Integration Testing

```typescript
import { POST } from '@/app/api/example/route'
import { NextRequest } from 'next/server'

describe('API Route', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/example', {
      method: 'POST',
    })
    
    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

## Troubleshooting

### Rate Limiting Not Working

1. Check if Upstash Redis credentials are configured:
   ```bash
   UPSTASH_REDIS_URL=your_url
   UPSTASH_REDIS_TOKEN=your_token
   ```

2. Verify rate limit configuration is correct
3. Check if rate limiting is disabled (`rateLimit: false`)

### Authentication Failing

1. Verify Supabase credentials are correct
2. Check if user session is valid
3. Ensure RLS policies are configured correctly

### Custom Error Messages Not Showing

1. Check if error messages are configured in `errorMessages` option
2. Verify error is being thrown with correct error class
3. In production, generic messages are shown for 500 errors

## Related Documentation

- [Rate Limiting Guide](./RATE_LIMITING_GUIDE.md)
- [File Security Guide](./fileSecurity.ts)
- [Error Handling Documentation](../../docs/ERROR_HANDLING.md)

## Support

For issues or questions:
1. Check the examples in this guide
2. Review the inline documentation in `apiSecurity.ts`
3. Consult the project documentation

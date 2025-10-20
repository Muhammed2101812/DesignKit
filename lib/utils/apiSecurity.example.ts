/**
 * API Security Examples
 * 
 * This file contains practical examples of using the API security utilities.
 * Copy and adapt these examples for your own API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  secureApiRoute,
  handleApiError,
  validateRequestBody,
  checkUserPlan,
  createSuccessResponse,
  getQueryParams,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from './apiSecurity'

// ============================================================================
// Example 1: Simple Authenticated GET Route
// ============================================================================

/**
 * Basic authenticated route that returns user profile
 * - Requires authentication (default)
 * - Uses 'free' tier rate limiting (default)
 * - Allows GET and POST methods (default)
 */
export const getUserProfile = secureApiRoute(async ({ user, supabase }) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (error) {
    throw new NotFoundError('Profile not found')
  }

  return NextResponse.json({ profile })
})

// ============================================================================
// Example 2: Public Route with Guest Rate Limiting
// ============================================================================

/**
 * Public endpoint that doesn't require authentication
 * - No authentication required
 * - Guest rate limiting (30 req/min)
 * - Only allows GET requests
 */
export const getPublicStats = secureApiRoute(
  async ({ supabase }) => {
    const { data: stats } = await supabase
      .from('tool_usage')
      .select('tool_name, count')
      .order('count', { ascending: false })
      .limit(10)

    return createSuccessResponse({ stats })
  },
  {
    requireAuth: false,
    rateLimit: 'guest',
    allowedMethods: ['GET'],
  }
)

// ============================================================================
// Example 3: Strict Rate Limiting for Sensitive Operations
// ============================================================================

/**
 * Password reset endpoint with strict rate limiting
 * - No authentication (user might not be logged in)
 * - Strict rate limiting (5 req/min)
 * - Only POST method
 * - Custom error messages
 */
export const resetPassword = secureApiRoute(
  async ({ request, supabase }) => {
    // Validate request body
    const body = await validateRequestBody(request, (data) => {
      if (!data.email || !data.email.includes('@')) {
        throw new ValidationError('Valid email address is required')
      }
      return data as { email: string }
    })

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      throw error
    }

    return createSuccessResponse({
      message: 'Password reset email sent',
    })
  },
  {
    requireAuth: false,
    rateLimit: 'strict',
    allowedMethods: ['POST'],
    errorMessages: {
      rateLimit: 'Too many password reset attempts. Please try again in a few minutes.',
    },
  }
)

// ============================================================================
// Example 4: API Tool with Quota Checking
// ============================================================================

/**
 * Background remover API endpoint
 * - Requires authentication
 * - Strict rate limiting for API tools
 * - Checks user quota before processing
 * - Increments usage after success
 */
export const removeBackground = secureApiRoute(
  async ({ user, supabase, request }) => {
    try {
      // 1. Validate input
      const body = await validateRequestBody(request, (data) => {
        if (!data.imageUrl) {
          throw new ValidationError('Image URL is required')
        }
        if (typeof data.imageUrl !== 'string') {
          throw new ValidationError('Image URL must be a string')
        }
        return data as { imageUrl: string }
      })

      // 2. Check quota
      const { data: canUse, error: quotaError } = await supabase.rpc(
        'can_use_api_tool',
        { p_user_id: user!.id }
      )

      if (quotaError) {
        throw quotaError
      }

      if (!canUse) {
        throw new ForbiddenError(
          'Daily quota exceeded. Upgrade your plan for more API calls.'
        )
      }

      // 3. Process image (mock - replace with actual API call)
      const result = await mockRemoveBackground(body.imageUrl)

      // 4. Increment usage
      const { error: usageError } = await supabase.rpc('increment_api_usage', {
        p_user_id: user!.id,
        p_tool_name: 'background-remover',
      })

      if (usageError) {
        console.error('Failed to increment usage:', usageError)
      }

      // 5. Return result
      return createSuccessResponse({
        processedImageUrl: result.url,
        creditsRemaining: result.creditsRemaining,
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
    rateLimit: 'strict',
    allowedMethods: ['POST'],
    errorMessages: {
      rateLimit:
        'Too many background removal requests. Please wait a moment before trying again.',
    },
  }
)

// ============================================================================
// Example 5: Premium Feature with Plan Checking
// ============================================================================

/**
 * Batch processing endpoint (Premium+ only)
 * - Requires authentication
 * - Checks for Premium or Pro plan
 * - Premium rate limiting
 */
export const batchProcess = secureApiRoute(
  async ({ user, supabase, request }) => {
    try {
      // Check if user has premium plan or higher
      const hasPremium = await checkUserPlan(user!, supabase, 'premium')

      if (!hasPremium) {
        throw new ForbiddenError(
          'Batch processing is only available for Premium and Pro plans. Upgrade to access this feature.'
        )
      }

      // Validate batch request
      const body = await validateRequestBody(request, (data) => {
        if (!Array.isArray(data.images)) {
          throw new ValidationError('Images must be an array')
        }
        if (data.images.length === 0) {
          throw new ValidationError('At least one image is required')
        }
        if (data.images.length > 50) {
          throw new ValidationError('Maximum 50 images per batch')
        }
        return data as { images: string[] }
      })

      // Process batch (mock)
      const results = await mockBatchProcess(body.images)

      return createSuccessResponse({
        processed: results.length,
        results,
      })
    } catch (error) {
      return handleApiError(error, {
        userId: user?.id,
        operation: 'batch-process',
      })
    }
  },
  {
    requireAuth: true,
    rateLimit: 'premium',
    allowedMethods: ['POST'],
  }
)

// ============================================================================
// Example 6: Paginated List with Query Parameters
// ============================================================================

/**
 * Get user's tool usage history with pagination
 * - Requires authentication
 * - Supports pagination via query params
 * - Free tier rate limiting
 */
export const getUserUsageHistory = secureApiRoute(
  async ({ user, supabase, request }) => {
    // Extract query parameters
    const { page, limit, tool } = getQueryParams(request, [
      'page',
      'limit',
      'tool',
    ])

    const pageNum = parseInt(page || '1')
    const limitNum = Math.min(parseInt(limit || '20'), 100) // Max 100 per page

    // Build query
    let query = supabase
      .from('tool_usage')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    // Filter by tool if specified
    if (tool) {
      query = query.eq('tool_name', tool)
    }

    // Apply pagination
    const start = (pageNum - 1) * limitNum
    const end = start + limitNum - 1
    query = query.range(start, end)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return createSuccessResponse({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    })
  },
  {
    requireAuth: true,
    rateLimit: 'free',
    allowedMethods: ['GET'],
  }
)

// ============================================================================
// Example 7: Custom Rate Limiting Configuration
// ============================================================================

/**
 * File upload endpoint with custom rate limiting
 * - Requires authentication
 * - Custom rate limit: 20 uploads per hour
 * - Only POST method
 */
export const uploadFile = secureApiRoute(
  async ({ user, supabase, request }) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        throw new ValidationError('File is required')
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new ValidationError('File size must be less than 10MB')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        )
      }

      // Upload to storage (mock)
      const uploadResult = await mockUploadFile(file, user!.id)

      return createSuccessResponse(
        {
          fileId: uploadResult.id,
          url: uploadResult.url,
        },
        201
      )
    } catch (error) {
      return handleApiError(error, {
        userId: user?.id,
        operation: 'file-upload',
      })
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      maxRequests: 20,
      windowSeconds: 3600, // 1 hour
      errorMessage: 'Upload limit reached. You can upload 20 files per hour.',
    },
    allowedMethods: ['POST'],
  }
)

// ============================================================================
// Example 8: Admin-Only Endpoint
// ============================================================================

/**
 * Admin analytics endpoint
 * - Requires authentication
 * - Checks for admin role
 * - Pro tier rate limiting
 */
export const getAdminAnalytics = secureApiRoute(
  async ({ user, supabase }) => {
    // Check if user is admin
    // Note: Add 'role' column to profiles table if implementing admin features
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user!.id)
      .single()

    // For demo purposes, checking plan. In production, add a 'role' column
    if (!profile || profile.plan !== 'pro') {
      throw new ForbiddenError('Admin access required')
    }

    // Get analytics data
    const { data: analytics } = await supabase
      .from('tool_usage')
      .select('tool_name, count, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return createSuccessResponse({ analytics })
  },
  {
    requireAuth: true,
    rateLimit: 'pro',
    allowedMethods: ['GET'],
  }
)

// ============================================================================
// Example 9: Webhook Endpoint (No Auth, Custom Validation)
// ============================================================================

/**
 * Stripe webhook endpoint
 * - No authentication (uses webhook signature)
 * - Strict rate limiting by IP
 * - Only POST method
 */
export const stripeWebhook = secureApiRoute(
  async ({ request }) => {
    try {
      const body = await request.text()
      const signature = request.headers.get('stripe-signature')

      if (!signature) {
        throw new UnauthorizedError('Missing stripe signature')
      }

      // Verify webhook signature (mock)
      const event = await mockVerifyStripeWebhook(body, signature)

      // Process webhook event
      await processStripeEvent(event)

      return createSuccessResponse({ received: true })
    } catch (error) {
      return handleApiError(error, {
        operation: 'stripe-webhook',
      })
    }
  },
  {
    requireAuth: false,
    rateLimit: {
      maxRequests: 100,
      windowSeconds: 60,
      errorMessage: 'Too many webhook requests',
    },
    allowedMethods: ['POST'],
  }
)

// ============================================================================
// Mock Functions (Replace with actual implementations)
// ============================================================================

async function mockRemoveBackground(imageUrl: string) {
  return {
    url: imageUrl.replace('.jpg', '-no-bg.png'),
    creditsRemaining: 8,
  }
}

async function mockBatchProcess(images: string[]) {
  return images.map((img) => ({
    original: img,
    processed: img.replace('.jpg', '-processed.jpg'),
  }))
}

async function mockUploadFile(file: File, userId: string) {
  return {
    id: 'file_' + Math.random().toString(36).substr(2, 9),
    url: `https://storage.example.com/${userId}/${file.name}`,
  }
}

async function mockVerifyStripeWebhook(body: string, signature: string) {
  return {
    type: 'checkout.session.completed',
    data: { object: {} },
  }
}

async function processStripeEvent(event: any) {
  console.log('Processing Stripe event:', event.type)
}

// ============================================================================
// Usage in Actual Route Files
// ============================================================================

/**
 * To use these examples in your route files:
 * 
 * 1. Create a new route file (e.g., app/api/user/profile/route.ts)
 * 2. Import the secureApiRoute function
 * 3. Export your handler as GET, POST, PUT, DELETE, etc.
 * 
 * Example:
 * 
 * // app/api/user/profile/route.ts
 * import { secureApiRoute } from '@/lib/utils/apiSecurity'
 * 
 * export const GET = secureApiRoute(async ({ user, supabase }) => {
 *   // Your logic here
 * })
 * 
 * export const PUT = secureApiRoute(async ({ user, supabase, request }) => {
 *   // Your logic here
 * }, {
 *   allowedMethods: ['PUT']
 * })
 */

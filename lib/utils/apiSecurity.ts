/**
 * API Security Utilities
 * Provides secure API route wrappers with authentication, rate limiting, and error handling
 * 
 * Requirements: 8.1, 8.2, 8.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, type RateLimitConfig, getRateLimitConfig } from './rateLimit'
import type { User } from '@supabase/supabase-js'

/**
 * API route configuration options
 */
export interface SecureApiRouteConfig {
  /**
   * Require authentication for this route
   * @default true
   */
  requireAuth?: boolean
  
  /**
   * Rate limit configuration
   * Can be a predefined tier ('guest', 'free', 'premium', 'pro', 'strict')
   * or a custom RateLimitConfig object
   */
  rateLimit?: 'guest' | 'free' | 'premium' | 'pro' | 'strict' | RateLimitConfig | false
  
  /**
   * Allowed HTTP methods
   * @default ['GET', 'POST']
   */
  allowedMethods?: string[]
  
  /**
   * Custom error messages
   */
  errorMessages?: {
    unauthorized?: string
    methodNotAllowed?: string
    rateLimit?: string
  }
}

/**
 * API route context passed to handler
 */
export interface ApiRouteContext {
  /**
   * Authenticated user (null if requireAuth is false)
   */
  user: User | null
  
  /**
   * Supabase client instance
   */
  supabase: Awaited<ReturnType<typeof createClient>>
  
  /**
   * Original request object
   */
  request: NextRequest
}

/**
 * API route handler function type
 */
export type ApiRouteHandler = (
  context: ApiRouteContext
) => Promise<NextResponse> | NextResponse

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: any
  timestamp: string
}

/**
 * Creates a secure API route with authentication, rate limiting, and method validation
 * 
 * @param handler - The API route handler function
 * @param config - Security configuration options
 * @returns Wrapped API route handler
 * 
 * @example
 * ```typescript
 * // Simple authenticated route with default rate limiting
 * export const POST = secureApiRoute(async ({ user, supabase }) => {
 *   // Your logic here
 *   return NextResponse.json({ success: true })
 * })
 * 
 * // Custom configuration
 * export const POST = secureApiRoute(
 *   async ({ user, supabase, request }) => {
 *     const body = await request.json()
 *     // Your logic here
 *     return NextResponse.json({ data: result })
 *   },
 *   {
 *     requireAuth: true,
 *     rateLimit: 'strict',
 *     allowedMethods: ['POST'],
 *   }
 * )
 * 
 * // Public route without authentication
 * export const GET = secureApiRoute(
 *   async ({ supabase }) => {
 *     // Public data
 *     return NextResponse.json({ data: publicData })
 *   },
 *   {
 *     requireAuth: false,
 *     rateLimit: 'guest',
 *   }
 * )
 * ```
 */
export function secureApiRoute(
  handler: ApiRouteHandler,
  config: SecureApiRouteConfig = {}
): (request: NextRequest) => Promise<NextResponse> {
  // Default configuration
  const {
    requireAuth = true,
    rateLimit: rateLimitConfig = 'free',
    allowedMethods = ['GET', 'POST'],
    errorMessages = {},
  } = config

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Method validation
      if (!allowedMethods.includes(request.method)) {
        return NextResponse.json(
          {
            error: errorMessages.methodNotAllowed || 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
            timestamp: new Date().toISOString(),
          } as ApiErrorResponse,
          {
            status: 405,
            headers: {
              Allow: allowedMethods.join(', '),
            },
          }
        )
      }

      // 2. Rate limiting
      if (rateLimitConfig !== false) {
        const rateLimitOpts =
          typeof rateLimitConfig === 'string'
            ? getRateLimitConfig(rateLimitConfig)
            : rateLimitConfig

        const rateLimitResult = await rateLimit(request, {
          ...rateLimitOpts,
          errorMessage: errorMessages.rateLimit || rateLimitOpts.errorMessage,
        })

        if (!rateLimitResult.success && rateLimitResult.response) {
          return rateLimitResult.response
        }
      }

      // 3. Authentication
      const supabase = await createClient()
      let user: User | null = null

      if (requireAuth) {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          return NextResponse.json(
            {
              error: errorMessages.unauthorized || 'Unauthorized',
              code: 'UNAUTHORIZED',
              timestamp: new Date().toISOString(),
            } as ApiErrorResponse,
            { status: 401 }
          )
        }

        user = authUser
      }

      // 4. Execute handler
      const context: ApiRouteContext = {
        user,
        supabase,
        request,
      }

      return await handler(context)
    } catch (error) {
      // Handle unexpected errors
      return handleApiError(error)
    }
  }
}

/**
 * Handles API errors and returns appropriate error responses
 * Sanitizes error messages to prevent information leakage
 * 
 * @param error - The error to handle
 * @param context - Optional context information
 * @returns NextResponse with error details
 * 
 * @example
 * ```typescript
 * try {
 *   // Your logic
 * } catch (error) {
 *   return handleApiError(error, { operation: 'processImage' })
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, any>
): NextResponse {
  console.error('API Error:', error, context)

  // Determine error type and status code
  let statusCode = 500
  let errorMessage = 'Internal server error'
  let errorCode = 'INTERNAL_ERROR'
  let details: any = undefined

  if (error instanceof Error) {
    errorMessage = error.message

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400
      errorCode = 'VALIDATION_ERROR'
    } else if (error.name === 'NotFoundError') {
      statusCode = 404
      errorCode = 'NOT_FOUND'
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401
      errorCode = 'UNAUTHORIZED'
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403
      errorCode = 'FORBIDDEN'
    } else if (error.name === 'ConflictError') {
      statusCode = 409
      errorCode = 'CONFLICT'
    } else if (error.name === 'TooManyRequestsError') {
      statusCode = 429
      errorCode = 'RATE_LIMIT_EXCEEDED'
    }

    // In development, include stack trace
    if (process.env.NODE_ENV === 'development') {
      details = {
        stack: error.stack,
        context,
      }
    }
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  // Sanitize error message in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorMessage = 'An unexpected error occurred'
    details = undefined
  }

  const response: ApiErrorResponse = {
    error: errorMessage,
    code: errorCode,
    details,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Custom error classes for API routes
 */

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class TooManyRequestsError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message)
    this.name = 'TooManyRequestsError'
  }
}

/**
 * Validates request body against a schema
 * 
 * @param request - Next.js request object
 * @param validator - Validation function that throws ValidationError on failure
 * @returns Validated and parsed body
 * 
 * @example
 * ```typescript
 * const body = await validateRequestBody(request, (data) => {
 *   if (!data.email) throw new ValidationError('Email is required')
 *   if (!data.password) throw new ValidationError('Password is required')
 *   return data
 * })
 * ```
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  validator: (data: any) => T
): Promise<T> {
  try {
    const body = await request.json()
    return validator(body)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new ValidationError('Invalid request body', { error })
  }
}

/**
 * Checks if user has required plan level
 * 
 * @param user - Authenticated user
 * @param supabase - Supabase client
 * @param requiredPlan - Minimum required plan ('free', 'premium', 'pro')
 * @returns True if user has required plan or higher
 * 
 * @example
 * ```typescript
 * if (!await checkUserPlan(user, supabase, 'premium')) {
 *   throw new ForbiddenError('Premium plan required')
 * }
 * ```
 */
export async function checkUserPlan(
  user: User,
  supabase: Awaited<ReturnType<typeof createClient>>,
  requiredPlan: 'free' | 'premium' | 'pro'
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return false
  }

  const planHierarchy = { free: 0, premium: 1, pro: 2 }
  const userPlanLevel = planHierarchy[profile.plan as keyof typeof planHierarchy] ?? 0
  const requiredPlanLevel = planHierarchy[requiredPlan]

  return userPlanLevel >= requiredPlanLevel
}

/**
 * Creates a success response with consistent structure
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success data
 * 
 * @example
 * ```typescript
 * return createSuccessResponse({ user: userData }, 201)
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Extracts and validates query parameters
 * 
 * @param request - Next.js request object
 * @param params - Expected parameter names
 * @returns Object with query parameters
 * 
 * @example
 * ```typescript
 * const { page, limit } = getQueryParams(request, ['page', 'limit'])
 * ```
 */
export function getQueryParams(
  request: NextRequest,
  params: string[]
): Record<string, string | null> {
  const searchParams = request.nextUrl.searchParams
  const result: Record<string, string | null> = {}

  for (const param of params) {
    result[param] = searchParams.get(param)
  }

  return result
}

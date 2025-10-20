/**
 * Error logging utilities
 * Logs errors for debugging without exposing sensitive data
 * Integrates with Sentry for production error tracking
 */

import * as Sentry from '@sentry/nextjs'
import { sanitizeErrorForLogging } from './errors'
import { getBrowserInfo } from './browser-compat'

export interface ErrorLogEntry {
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, any>
  browser: ReturnType<typeof getBrowserInfo>
  url: string
  userAgent: string
}

export interface SentryUser {
  id: string
  email?: string
  username?: string
  plan?: string
}

/**
 * Log error to console in development
 */
export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Log')
    console.error('Error:', error)
    if (context) {
      console.log('Context:', sanitizeErrorForLogging(error, context))
    }
    console.log('Browser:', getBrowserInfo())
    console.groupEnd()
  }
}

/**
 * Create structured error log entry
 */
export function createErrorLogEntry(
  error: Error,
  context?: Record<string, any>
): ErrorLogEntry {
  const sanitized = sanitizeErrorForLogging(error, context)
  
  return {
    timestamp: new Date().toISOString(),
    error: {
      name: sanitized.name,
      message: sanitized.message,
      stack: sanitized.stack,
    },
    context: sanitized.context,
    browser: getBrowserInfo(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  }
}

/**
 * Report error to Sentry and log locally
 * This is the main function to use for error reporting throughout the app
 */
export async function reportError(
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  // Create sanitized log entry
  const logEntry = createErrorLogEntry(error, context)
  
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    logError(error, context)
  }
  
  // Send to Sentry in production (or if SENTRY_DEBUG is enabled)
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      // Capture exception with Sentry
      Sentry.captureException(error, {
        level: 'error',
        contexts: {
          error_details: {
            timestamp: logEntry.timestamp,
            url: logEntry.url,
            browser: logEntry.browser,
          },
        },
        extra: {
          context: logEntry.context,
        },
        tags: {
          tool_name: context?.toolName,
          error_type: error.name,
        },
      })
    } catch (sentryError) {
      // If Sentry fails, log to console but don't throw
      console.error('Failed to report error to Sentry:', sentryError)
      console.error('Original error:', logEntry)
    }
  }
  
  // Store for local debugging
  storeErrorForDebug(error, context)
}

/**
 * Set user context in Sentry
 * Call this after user logs in to associate errors with specific users
 */
export function setSentryUser(user: SentryUser): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      })
    } catch (error) {
      console.error('Failed to set Sentry user:', error)
    }
  }
}

/**
 * Clear user context in Sentry
 * Call this after user logs out
 */
export function clearSentryUser(): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setUser(null)
    } catch (error) {
      console.error('Failed to clear Sentry user:', error)
    }
  }
}

/**
 * Add breadcrumb to Sentry for debugging context
 * Breadcrumbs help understand what led to an error
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      })
    } catch (error) {
      console.error('Failed to add Sentry breadcrumb:', error)
    }
  }
}

/**
 * Set custom context in Sentry
 * Use this to add additional context that will be included with all errors
 */
export function setSentryContext(
  name: string,
  context: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.setContext(name, context)
    } catch (error) {
      console.error('Failed to set Sentry context:', error)
    }
  }
}

/**
 * Capture a message in Sentry (for non-error events)
 * Use this for important events that aren't errors but should be tracked
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG) {
    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      })
    } catch (error) {
      console.error('Failed to capture message in Sentry:', error)
    }
  }
}

/**
 * Store error in session storage for debugging
 */
export function storeErrorForDebug(
  error: Error,
  context?: Record<string, any>
): void {
  if (typeof window === 'undefined') return
  
  try {
    const logEntry = createErrorLogEntry(error, context)
    const key = `error_log_${Date.now()}`
    
    // Store in sessionStorage (cleared on tab close)
    sessionStorage.setItem(key, JSON.stringify(logEntry))
    
    // Keep only last 10 errors
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
      .sort()
    
    if (keys.length > 10) {
      keys.slice(0, keys.length - 10).forEach(k => {
        sessionStorage.removeItem(k)
      })
    }
  } catch (e) {
    // Ignore storage errors
    console.warn('Failed to store error log:', e)
  }
}

/**
 * Get all stored error logs
 */
export function getStoredErrors(): ErrorLogEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
      .sort()
    
    return keys.map(key => {
      const data = sessionStorage.getItem(key)
      return data ? JSON.parse(data) : null
    }).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Clear all stored error logs
 */
export function clearStoredErrors(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(sessionStorage)
      .filter(k => k.startsWith('error_log_'))
    
    keys.forEach(key => sessionStorage.removeItem(key))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    logError(error, { type: 'unhandledRejection' })
    storeErrorForDebug(error, { type: 'unhandledRejection' })
  })
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message)
    
    logError(error, {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
    storeErrorForDebug(error, {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}

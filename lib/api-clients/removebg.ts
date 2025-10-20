/**
 * Remove.bg API Client
 * 
 * Handles background removal using the Remove.bg API with error handling,
 * retry logic, and proper error types.
 * 
 * @see https://www.remove.bg/api
 */

import { env } from '@/lib/env'

// ============================================
// Types
// ============================================

export interface RemoveBgOptions {
  size?: 'auto' | 'preview' | 'full' | 'medium' | 'hd' | '4k'
  type?: 'auto' | 'person' | 'product' | 'car'
  format?: 'auto' | 'png' | 'jpg' | 'zip'
  channels?: 'rgba' | 'alpha'
  bgColor?: string
  bgImageUrl?: string
}

export interface RemoveBgResponse {
  data: Blob
  creditsCharged: number
  detectedType: string
  width: number
  height: number
}

export class RemoveBgError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'RemoveBgError'
  }
}

// ============================================
// Constants
// ============================================

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const TIMEOUT_MS = 60000 // 60 seconds

// ============================================
// Helper Functions
// ============================================

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Checks if error is retryable (network or rate limit)
 */
function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return true // Network errors are retryable
  
  // Retry on rate limits and server errors
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600)
}

/**
 * Parses error response from Remove.bg API
 */
async function parseErrorResponse(response: Response): Promise<RemoveBgError> {
  let errorMessage = 'Background removal failed'
  let errorCode: string | undefined
  
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const errorData = await response.json()
      errorMessage = errorData.errors?.[0]?.title || errorData.error || errorMessage
      errorCode = errorData.errors?.[0]?.code
    } else {
      errorMessage = await response.text() || errorMessage
    }
  } catch {
    // If parsing fails, use default message
  }
  
  return new RemoveBgError(errorMessage, response.status, errorCode)
}

// ============================================
// Main API Client
// ============================================

/**
 * Removes background from an image using Remove.bg API
 * 
 * @param imageFile - Image file to process (PNG, JPG, WEBP)
 * @param options - Optional processing parameters
 * @returns Promise resolving to processed image blob and metadata
 * @throws RemoveBgError if processing fails
 * 
 * @example
 * ```typescript
 * const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
 * const result = await removeBackground(file, { size: 'auto' })
 * console.log('Credits charged:', result.creditsCharged)
 * ```
 */
export async function removeBackground(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<RemoveBgResponse> {
  // Validate API key
  if (!env.REMOVE_BG_API_KEY) {
    throw new RemoveBgError(
      'Remove.bg API key is not configured. Please set REMOVE_BG_API_KEY environment variable.',
      undefined,
      'MISSING_API_KEY'
    )
  }
  
  // Validate file
  if (!imageFile || !(imageFile instanceof File)) {
    throw new RemoveBgError('Invalid image file provided', undefined, 'INVALID_FILE')
  }
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!validTypes.includes(imageFile.type)) {
    throw new RemoveBgError(
      `Invalid file type: ${imageFile.type}. Supported types: PNG, JPG, WEBP`,
      undefined,
      'INVALID_FILE_TYPE'
    )
  }
  
  // Validate file size (max 12MB for Remove.bg)
  const maxSizeMB = 12
  const fileSizeMB = imageFile.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    throw new RemoveBgError(
      `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      undefined,
      'FILE_TOO_LARGE'
    )
  }
  
  // Prepare form data
  const formData = new FormData()
  formData.append('image_file', imageFile)
  formData.append('size', options.size || 'auto')
  
  if (options.type) formData.append('type', options.type)
  if (options.format) formData.append('format', options.format)
  if (options.channels) formData.append('channels', options.channels)
  if (options.bgColor) formData.append('bg_color', options.bgColor)
  if (options.bgImageUrl) formData.append('bg_image_url', options.bgImageUrl)
  
  // Retry logic
  let lastError: RemoveBgError | null = null
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Add delay for retries (exponential backoff)
      if (attempt > 0) {
        const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        await delay(delayMs)
      }
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
      
      try {
        // Make API request
        const response = await fetch(REMOVE_BG_API_URL, {
          method: 'POST',
          headers: {
            'X-Api-Key': env.REMOVE_BG_API_KEY!,
          },
          body: formData,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // Handle success
        if (response.ok) {
          const blob = await response.blob()
          
          // Extract metadata from headers
          const creditsCharged = parseInt(
            response.headers.get('X-Credits-Charged') || '1',
            10
          )
          const detectedType = response.headers.get('X-Type') || 'unknown'
          const width = parseInt(response.headers.get('X-Width') || '0', 10)
          const height = parseInt(response.headers.get('X-Height') || '0', 10)
          
          return {
            data: blob,
            creditsCharged,
            detectedType,
            width,
            height,
          }
        }
        
        // Handle error response
        const error = await parseErrorResponse(response)
        
        // Check if we should retry
        if (isRetryableError(response.status) && attempt < MAX_RETRIES - 1) {
          lastError = error
          continue
        }
        
        throw error
      } catch (error) {
        clearTimeout(timeoutId)
        
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new RemoveBgError(
            'Request timed out. Please try again.',
            undefined,
            'TIMEOUT'
          )
          
          if (attempt < MAX_RETRIES - 1) {
            lastError = timeoutError
            continue
          }
          
          throw timeoutError
        }
        
        throw error
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof RemoveBgError) {
        throw error
      }
      
      const networkError = new RemoveBgError(
        'Network error. Please check your connection and try again.',
        undefined,
        'NETWORK_ERROR'
      )
      
      if (attempt < MAX_RETRIES - 1) {
        lastError = networkError
        continue
      }
      
      throw networkError
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw lastError || new RemoveBgError('Failed after multiple retries')
}

/**
 * Checks Remove.bg account credits (requires API key)
 * 
 * @returns Promise resolving to remaining credits
 * @throws RemoveBgError if check fails
 */
export async function checkCredits(): Promise<number> {
  if (!env.REMOVE_BG_API_KEY) {
    throw new RemoveBgError(
      'Remove.bg API key is not configured',
      undefined,
      'MISSING_API_KEY'
    )
  }
  
  try {
    const response = await fetch('https://api.remove.bg/v1.0/account', {
      method: 'GET',
      headers: {
        'X-Api-Key': env.REMOVE_BG_API_KEY,
      },
    })
    
    if (!response.ok) {
      throw await parseErrorResponse(response)
    }
    
    const data = await response.json()
    return data.data?.attributes?.credits?.total || 0
  } catch (error) {
    if (error instanceof RemoveBgError) {
      throw error
    }
    
    throw new RemoveBgError(
      'Failed to check credits',
      undefined,
      'CREDITS_CHECK_FAILED'
    )
  }
}

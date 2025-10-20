/**
 * Replicate API Client
 * 
 * Handles image upscaling using the Replicate API with polling mechanism,
 * progress tracking, error handling, and retry logic.
 * 
 * @see https://replicate.com/docs/reference/http
 */

import { env } from '@/lib/env'

// ============================================
// Types
// ============================================

export interface ReplicateUpscaleOptions {
  scale: 2 | 4 | 8
  model?: string
}

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: Record<string, unknown>
  output: string | string[] | null
  error: string | null
  logs: string
  metrics?: {
    predict_time?: number
  }
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface ReplicateUpscaleResult {
  imageUrl: string
  predictionId: string
  processingTime: number
}

export interface ProgressCallback {
  (progress: number, status: string): void
}

export class ReplicateError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public predictionId?: string
  ) {
    super(message)
    this.name = 'ReplicateError'
  }
}

// ============================================
// Constants
// ============================================

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

// Default upscaling model (Real-ESRGAN)
const DEFAULT_UPSCALE_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b'

const POLL_INTERVAL_MS = 2000 // Poll every 2 seconds
const MAX_POLL_TIME_MS = 300000 // 5 minutes max
const TIMEOUT_MS = 60000 // 60 seconds for initial request

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
 * Uploads image to temporary storage and returns URL
 * For Replicate, we need to provide a URL to the image
 */
async function uploadImageToDataUrl(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert image to data URL'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    
    reader.readAsDataURL(imageFile)
  })
}

/**
 * Parses error response from Replicate API
 */
async function parseErrorResponse(response: Response): Promise<ReplicateError> {
  let errorMessage = 'Image upscaling failed'
  let errorCode: string | undefined
  
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.error || errorMessage
      errorCode = errorData.code
    } else {
      errorMessage = await response.text() || errorMessage
    }
  } catch {
    // If parsing fails, use default message
  }
  
  return new ReplicateError(errorMessage, response.status, errorCode)
}

/**
 * Makes authenticated request to Replicate API
 */
async function replicateRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!env.REPLICATE_API_KEY) {
    throw new ReplicateError(
      'Replicate API key is not configured. Please set REPLICATE_API_KEY environment variable.',
      undefined,
      'MISSING_API_KEY'
    )
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${REPLICATE_API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Token ${env.REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  return response
}

// ============================================
// Main API Client
// ============================================

/**
 * Creates a prediction on Replicate
 */
async function createPrediction(
  imageUrl: string,
  options: ReplicateUpscaleOptions
): Promise<ReplicatePrediction> {
  const model = options.model || DEFAULT_UPSCALE_MODEL
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const response = await replicateRequest('/predictions', {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        version: model.split(':')[1], // Extract version from model string
        input: {
          image: imageUrl,
          scale: options.scale,
        },
      }),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw await parseErrorResponse(response)
    }
    
    const prediction: ReplicatePrediction = await response.json()
    return prediction
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ReplicateError(
        'Request timed out. Please try again.',
        undefined,
        'TIMEOUT'
      )
    }
    
    if (error instanceof ReplicateError) {
      throw error
    }
    
    throw new ReplicateError(
      'Failed to create prediction',
      undefined,
      'CREATE_PREDICTION_FAILED'
    )
  }
}

/**
 * Gets the status of a prediction
 */
async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  try {
    const response = await replicateRequest(`/predictions/${predictionId}`)
    
    if (!response.ok) {
      throw await parseErrorResponse(response)
    }
    
    const prediction: ReplicatePrediction = await response.json()
    return prediction
  } catch (error) {
    if (error instanceof ReplicateError) {
      throw error
    }
    
    throw new ReplicateError(
      'Failed to get prediction status',
      undefined,
      'GET_PREDICTION_FAILED',
      predictionId
    )
  }
}

/**
 * Polls a prediction until it completes or fails
 */
async function pollPrediction(
  predictionId: string,
  onProgress?: ProgressCallback
): Promise<ReplicatePrediction> {
  const startTime = Date.now()
  
  while (true) {
    // Check if we've exceeded max poll time
    if (Date.now() - startTime > MAX_POLL_TIME_MS) {
      throw new ReplicateError(
        'Processing timed out. Please try again with a smaller image.',
        undefined,
        'POLL_TIMEOUT',
        predictionId
      )
    }
    
    // Get prediction status
    const prediction = await getPrediction(predictionId)
    
    // Calculate progress (rough estimate based on status)
    let progress = 0
    let statusMessage = 'Processing...'
    
    switch (prediction.status) {
      case 'starting':
        progress = 10
        statusMessage = 'Starting...'
        break
      case 'processing':
        // Estimate progress based on time elapsed (rough heuristic)
        const elapsed = Date.now() - startTime
        progress = Math.min(10 + (elapsed / MAX_POLL_TIME_MS) * 80, 90)
        statusMessage = 'Processing image...'
        break
      case 'succeeded':
        progress = 100
        statusMessage = 'Complete!'
        onProgress?.(progress, statusMessage)
        return prediction
      case 'failed':
        throw new ReplicateError(
          prediction.error || 'Image upscaling failed',
          undefined,
          'PREDICTION_FAILED',
          predictionId
        )
      case 'canceled':
        throw new ReplicateError(
          'Processing was canceled',
          undefined,
          'PREDICTION_CANCELED',
          predictionId
        )
    }
    
    // Report progress
    onProgress?.(progress, statusMessage)
    
    // Wait before next poll
    await delay(POLL_INTERVAL_MS)
  }
}

/**
 * Cancels a running prediction
 */
export async function cancelPrediction(predictionId: string): Promise<void> {
  try {
    const response = await replicateRequest(`/predictions/${predictionId}/cancel`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw await parseErrorResponse(response)
    }
  } catch (error) {
    if (error instanceof ReplicateError) {
      throw error
    }
    
    throw new ReplicateError(
      'Failed to cancel prediction',
      undefined,
      'CANCEL_FAILED',
      predictionId
    )
  }
}

/**
 * Upscales an image using Replicate API
 * 
 * @param imageFile - Image file to upscale (PNG, JPG, WEBP)
 * @param options - Upscaling options (scale factor, model)
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to upscaled image URL and metadata
 * @throws ReplicateError if upscaling fails
 * 
 * @example
 * ```typescript
 * const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
 * const result = await upscaleImage(file, { scale: 4 }, (progress, status) => {
 *   console.log(`${progress}%: ${status}`)
 * })
 * console.log('Upscaled image URL:', result.imageUrl)
 * ```
 */
export async function upscaleImage(
  imageFile: File,
  options: ReplicateUpscaleOptions,
  onProgress?: ProgressCallback
): Promise<ReplicateUpscaleResult> {
  // Validate API key
  if (!env.REPLICATE_API_KEY) {
    throw new ReplicateError(
      'Replicate API key is not configured. Please set REPLICATE_API_KEY environment variable.',
      undefined,
      'MISSING_API_KEY'
    )
  }
  
  // Validate file
  if (!imageFile || !(imageFile instanceof File)) {
    throw new ReplicateError('Invalid image file provided', undefined, 'INVALID_FILE')
  }
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!validTypes.includes(imageFile.type)) {
    throw new ReplicateError(
      `Invalid file type: ${imageFile.type}. Supported types: PNG, JPG, WEBP`,
      undefined,
      'INVALID_FILE_TYPE'
    )
  }
  
  // Validate file size (max 10MB recommended for Replicate)
  const maxSizeMB = 10
  const fileSizeMB = imageFile.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    throw new ReplicateError(
      `File size (${fileSizeMB.toFixed(2)}MB) exceeds recommended size (${maxSizeMB}MB). Processing may be slow.`,
      undefined,
      'FILE_TOO_LARGE'
    )
  }
  
  // Validate scale factor
  if (![2, 4, 8].includes(options.scale)) {
    throw new ReplicateError(
      'Invalid scale factor. Must be 2, 4, or 8.',
      undefined,
      'INVALID_SCALE'
    )
  }
  
  const startTime = Date.now()
  
  try {
    // Report initial progress
    onProgress?.(0, 'Preparing image...')
    
    // Convert image to data URL
    const imageUrl = await uploadImageToDataUrl(imageFile)
    
    onProgress?.(5, 'Creating prediction...')
    
    // Create prediction
    const prediction = await createPrediction(imageUrl, options)
    
    onProgress?.(10, 'Processing started...')
    
    // Poll until complete
    const completedPrediction = await pollPrediction(prediction.id, onProgress)
    
    // Extract result URL
    let imageResultUrl: string
    
    if (typeof completedPrediction.output === 'string') {
      imageResultUrl = completedPrediction.output
    } else if (Array.isArray(completedPrediction.output) && completedPrediction.output.length > 0) {
      imageResultUrl = completedPrediction.output[0]
    } else {
      throw new ReplicateError(
        'No output image received from API',
        undefined,
        'NO_OUTPUT',
        prediction.id
      )
    }
    
    const processingTime = Date.now() - startTime
    
    return {
      imageUrl: imageResultUrl,
      predictionId: prediction.id,
      processingTime,
    }
  } catch (error) {
    if (error instanceof ReplicateError) {
      throw error
    }
    
    throw new ReplicateError(
      'Unexpected error during image upscaling',
      undefined,
      'UNKNOWN_ERROR'
    )
  }
}

/**
 * Gets the status of an upscaling operation
 * 
 * @param predictionId - Prediction ID from upscaleImage
 * @returns Promise resolving to prediction status
 */
export async function getUpscaleStatus(predictionId: string): Promise<ReplicatePrediction> {
  return getPrediction(predictionId)
}

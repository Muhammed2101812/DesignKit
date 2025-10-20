/**
 * API Route: Image Upscaler
 * 
 * Upscales images using Replicate API with Real-ESRGAN model.
 * Checks user quota before processing and increments usage after success.
 * 
 * @route POST /api/tools/image-upscaler
 * @auth Required
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upscaleImage, ReplicateError } from '@/lib/api-clients/replicate'
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rateLimit'
import { validateFileMagicNumber, sanitizeErrorForLogging } from '@/lib/utils/fileSecurity'

// ============================================
// Types
// ============================================

interface ErrorResponse {
  error: string
  code: string
}

interface SuccessResponse {
  imageUrl: string
  predictionId: string
  processingTime: number
  scaleFactor: number
}

// ============================================
// Constants
// ============================================

const MAX_FILE_SIZE_MB = 10
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const ALLOWED_SCALES = [2, 4, 8]

// ============================================
// Helper Functions
// ============================================

/**
 * Validates uploaded file with magic number validation
 */
async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Supported types: PNG, JPG, WEBP`,
    }
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds recommended size (${MAX_FILE_SIZE_MB}MB). Processing may be slow or fail.`,
    }
  }

  // Validate file magic numbers (file signature)
  const magicResult = await validateFileMagicNumber(file)
  if (!magicResult.valid) {
    return {
      valid: false,
      error: magicResult.error || 'File signature validation failed',
    }
  }

  return { valid: true }
}

/**
 * Validates scale factor
 */
function validateScale(scale: unknown): { valid: boolean; scale?: 2 | 4 | 8; error?: string } {
  const scaleNum = Number(scale)
  
  if (isNaN(scaleNum)) {
    return {
      valid: false,
      error: 'Invalid scale factor. Must be a number.',
    }
  }
  
  if (!ALLOWED_SCALES.includes(scaleNum)) {
    return {
      valid: false,
      error: `Invalid scale factor: ${scaleNum}. Must be 2, 4, or 8.`,
    }
  }
  
  return { valid: true, scale: scaleNum as 2 | 4 | 8 }
}

/**
 * Logs tool usage for analytics
 */
async function logToolUsage(
  supabase: any,
  userId: string,
  success: boolean,
  fileSizeMb: number,
  processingTimeMs: number,
  errorMessage?: string
) {
  try {
    await supabase.from('tool_usage').insert({
      user_id: userId,
      tool_name: 'image-upscaler',
      is_api_tool: true,
      file_size_mb: fileSizeMb,
      processing_time_ms: processingTimeMs,
      success,
      error_message: errorMessage,
    })
  } catch (error) {
    // Log error but don't fail the request
    console.error('Error logging tool usage:', error)
  }
}

// ============================================
// Route Handler
// ============================================

/**
 * POST /api/tools/image-upscaler
 * 
 * Upscales an image using AI-powered super-resolution
 * 
 * @body FormData with 'image' field (File) and 'scale' field (2 | 4 | 8)
 * @returns JSON with upscaled image URL and metadata
 * @throws 400 if file or scale is invalid
 * @throws 401 if user is not authenticated
 * @throws 403 if user has exceeded quota
 * @throws 500 if processing fails
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let fileSizeMb = 0

  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Apply rate limiting (strict for API tools)
    const rateLimitResult = await rateLimit(request, {
      ...RATE_LIMIT_CONFIGS.strict,
      identifier: async () => user.id, // Rate limit per user
    })

    if (!rateLimitResult.success) {
      return rateLimitResult.response!
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid form data',
          code: 'INVALID_FORM_DATA',
        },
        { status: 400 }
      )
    }

    // Get image file from form data
    const imageFile = formData.get('image')

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'No image file provided',
          code: 'NO_FILE',
        },
        { status: 400 }
      )
    }

    // Get scale factor from form data
    const scaleParam = formData.get('scale')
    
    const scaleValidation = validateScale(scaleParam)
    if (!scaleValidation.valid) {
      return NextResponse.json<ErrorResponse>(
        {
          error: scaleValidation.error!,
          code: 'INVALID_SCALE',
        },
        { status: 400 }
      )
    }
    
    const scale = scaleValidation.scale!

    // Validate file (including magic numbers)
    const validation = await validateFile(imageFile)
    if (!validation.valid) {
      return NextResponse.json<ErrorResponse>(
        {
          error: validation.error!,
          code: 'INVALID_FILE',
        },
        { status: 400 }
      )
    }

    fileSizeMb = imageFile.size / (1024 * 1024)

    // Check user quota
    const { data: canUseData, error: canUseError } = await supabase.rpc(
      'can_use_api_tool',
      { p_user_id: user.id }
    )

    if (canUseError) {
      console.error('Error checking quota:', canUseError)
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to check quota',
          code: 'QUOTA_CHECK_FAILED',
        },
        { status: 500 }
      )
    }

    const canUse = canUseData as boolean

    if (!canUse) {
      await logToolUsage(
        supabase,
        user.id,
        false,
        fileSizeMb,
        Date.now() - startTime,
        'Quota exceeded'
      )

      return NextResponse.json<ErrorResponse>(
        {
          error: 'Daily quota exceeded. Please upgrade your plan or try again tomorrow.',
          code: 'QUOTA_EXCEEDED',
        },
        { status: 403 }
      )
    }

    // Upscale image using Replicate API
    let result
    try {
      result = await upscaleImage(
        imageFile,
        { scale },
        (progress, status) => {
          // Progress updates are handled client-side via polling
          console.log(`Upscale progress: ${progress}% - ${status}`)
        }
      )
    } catch (error) {
      const processingTime = Date.now() - startTime

      // Handle Replicate specific errors
      if (error instanceof ReplicateError) {
        await logToolUsage(
          supabase,
          user.id,
          false,
          fileSizeMb,
          processingTime,
          error.message
        )

        // Don't increment quota on API errors
        return NextResponse.json<ErrorResponse>(
          {
            error: error.message,
            code: error.code || 'PROCESSING_FAILED',
          },
          { status: error.statusCode || 500 }
        )
      }

      // Handle generic errors
      await logToolUsage(
        supabase,
        user.id,
        false,
        fileSizeMb,
        processingTime,
        'Unknown error'
      )

      throw error
    }

    // Increment usage count (only after successful processing)
    const { error: incrementError } = await supabase.rpc(
      'increment_api_usage',
      { p_user_id: user.id }
    )

    if (incrementError) {
      console.error('Error incrementing usage:', incrementError)
      // Don't fail the request, user already got their result
    }

    // Log successful usage
    const processingTime = Date.now() - startTime
    await logToolUsage(supabase, user.id, true, fileSizeMb, processingTime)

    // Return upscaled image URL and metadata
    return NextResponse.json<SuccessResponse>(
      {
        imageUrl: result.imageUrl,
        predictionId: result.predictionId,
        processingTime: result.processingTime,
        scaleFactor: scale,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Processing-Time': processingTime.toString(),
        },
      }
    )
  } catch (error) {
    // Sanitize error for logging (remove sensitive data)
    const sanitizedError = sanitizeErrorForLogging(
      error instanceof Error ? error : new Error('Unknown error'),
      { fileSizeMb }
    )
    console.error('Unexpected error in image-upscaler:', sanitizedError)

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error. Please try again.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

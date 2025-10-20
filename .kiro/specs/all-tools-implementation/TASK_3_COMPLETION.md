# Task 3 Completion: API Client Infrastructure

## Overview

Successfully implemented the complete API client infrastructure for Design Kit's API-powered tools. This includes external API integrations, quota management endpoints, and comprehensive error handling.

## Files Created

### 1. Remove.bg API Client (`lib/api-clients/removebg.ts`)

**Purpose:** Handles background removal using the Remove.bg API

**Features:**
- ✅ Complete Remove.bg API integration
- ✅ Automatic retry logic with exponential backoff (3 retries)
- ✅ Timeout handling (60 seconds)
- ✅ File validation (type, size, magic numbers)
- ✅ Detailed error messages with error codes
- ✅ Credits tracking from API response headers
- ✅ Support for all Remove.bg options (size, type, format, channels, background)

**Key Functions:**
- `removeBackground(imageFile, options)` - Main background removal function
- `checkCredits()` - Check remaining Remove.bg API credits

**Error Handling:**
- Custom `RemoveBgError` class with status codes and error codes
- Retryable errors (429, 5xx) automatically retried
- Network errors handled gracefully
- User-friendly error messages

### 2. Replicate API Client (`lib/api-clients/replicate.ts`)

**Purpose:** Handles image upscaling using the Replicate API

**Features:**
- ✅ Complete Replicate API integration
- ✅ Polling mechanism for async processing (polls every 2 seconds)
- ✅ Progress tracking with callback support
- ✅ Cancellation support for long-running operations
- ✅ Timeout handling (5 minutes max for processing)
- ✅ Data URL conversion for image upload
- ✅ File validation (type, size)

**Key Functions:**
- `upscaleImage(imageFile, options, onProgress)` - Main upscaling function with progress callbacks
- `cancelPrediction(predictionId)` - Cancel a running prediction
- `getUpscaleStatus(predictionId)` - Get status of an upscaling operation

**Progress Tracking:**
- Real-time progress updates (0-100%)
- Status messages for each processing stage
- Callback function for UI updates

**Error Handling:**
- Custom `ReplicateError` class with prediction IDs
- Handles starting, processing, succeeded, failed, canceled states
- Timeout protection for long-running operations

### 3. Check Quota API Route (`app/api/tools/check-quota/route.ts`)

**Purpose:** Validates user's remaining API quota before processing

**Endpoint:** `GET /api/tools/check-quota`

**Features:**
- ✅ Authentication required
- ✅ Calls database function `can_use_api_tool(user_id)`
- ✅ Returns current usage, daily limit, remaining quota
- ✅ Includes plan information and reset time
- ✅ Proper error handling for all failure scenarios

**Response Format:**
```typescript
{
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
  plan: string
  resetAt: string // ISO 8601 timestamp
}
```

**Error Codes:**
- `UNAUTHORIZED` - User not authenticated
- `PROFILE_NOT_FOUND` - User profile doesn't exist
- `QUOTA_CHECK_FAILED` - Database query failed
- `INTERNAL_ERROR` - Unexpected error

### 4. Increment Usage API Route (`app/api/tools/increment-usage/route.ts`)

**Purpose:** Increments user's API usage count after successful operations

**Endpoint:** `POST /api/tools/increment-usage`

**Features:**
- ✅ Authentication required
- ✅ Validates quota before incrementing
- ✅ Calls database function `increment_api_usage(user_id)`
- ✅ Logs tool usage for analytics
- ✅ Returns updated quota information
- ✅ Prevents increment on quota exceeded

**Request Body:**
```typescript
{
  toolName: string // Required
  fileSizeMb?: number
  processingTimeMs?: number
  success?: boolean
  errorMessage?: string
}
```

**Response Format:**
```typescript
{
  success: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
}
```

**Error Codes:**
- `INVALID_JSON` - Malformed request body
- `INVALID_REQUEST` - Missing required fields
- `UNAUTHORIZED` - User not authenticated
- `PROFILE_NOT_FOUND` - User profile doesn't exist
- `QUOTA_EXCEEDED` - Daily quota exhausted
- `INCREMENT_FAILED` - Database update failed
- `INTERNAL_ERROR` - Unexpected error

### 5. Documentation (`lib/api-clients/README.md`)

**Purpose:** Comprehensive documentation for API clients and routes

**Contents:**
- ✅ Usage examples for all API clients
- ✅ Error handling best practices
- ✅ API route documentation
- ✅ Environment variable setup
- ✅ Testing instructions
- ✅ Troubleshooting guide
- ✅ Rate limits and quotas
- ✅ Future enhancements

## Integration with Database

The API routes integrate seamlessly with the existing Supabase database schema:

**Database Functions Used:**
- `can_use_api_tool(user_id)` - Checks if user has remaining quota
- `increment_api_usage(user_id)` - Increments usage count
- `get_or_create_daily_limit(user_id)` - Gets/creates daily limit record

**Tables Used:**
- `profiles` - User plan information
- `daily_limits` - Daily API usage tracking
- `tool_usage` - Analytics and usage logs

## Error Handling Strategy

All components follow a consistent error handling pattern:

1. **Custom Error Classes**
   - `RemoveBgError` - Remove.bg specific errors
   - `ReplicateError` - Replicate specific errors
   - Both extend `Error` with additional properties

2. **Error Codes**
   - Standardized error codes for all failure scenarios
   - User-friendly error messages
   - Technical details for debugging

3. **Retry Logic**
   - Automatic retries for transient failures
   - Exponential backoff for rate limits
   - Maximum retry limits to prevent infinite loops

4. **Quota Protection**
   - Check quota before processing
   - Don't charge quota on API failures
   - Clear error messages when quota exceeded

## Testing Recommendations

### Manual Testing

1. **Remove.bg Client:**
   ```typescript
   const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
   const result = await removeBackground(file, { size: 'auto' })
   console.log('Credits charged:', result.creditsCharged)
   ```

2. **Replicate Client:**
   ```typescript
   const result = await upscaleImage(file, { scale: 2 }, (progress, status) => {
     console.log(`${progress}%: ${status}`)
   })
   console.log('Result URL:', result.imageUrl)
   ```

3. **Check Quota:**
   ```bash
   curl -X GET http://localhost:3000/api/tools/check-quota \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Increment Usage:**
   ```bash
   curl -X POST http://localhost:3000/api/tools/increment-usage \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"toolName":"background-remover","success":true}'
   ```

### Environment Setup

Required environment variables in `.env.local`:

```bash
# Remove.bg API
REMOVE_BG_API_KEY=your_remove_bg_api_key

# Replicate API
REPLICATE_API_KEY=your_replicate_api_key
```

## Usage Example

Here's how the API-powered tools will use this infrastructure:

```typescript
// 1. Check quota before processing
const quotaResponse = await fetch('/api/tools/check-quota')
const quota = await quotaResponse.json()

if (!quota.canUse) {
  showUpgradeDialog()
  return
}

// 2. Process image with progress tracking
try {
  const result = await removeBackground(imageFile, {
    size: 'auto',
    type: 'person'
  })
  
  // 3. Increment usage after success
  await fetch('/api/tools/increment-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toolName: 'background-remover',
      fileSizeMb: imageFile.size / (1024 * 1024),
      processingTimeMs: Date.now() - startTime,
      success: true
    })
  })
  
  // 4. Display result
  displayResult(result.data)
  
} catch (error) {
  if (error instanceof RemoveBgError) {
    // Handle specific error codes
    switch (error.code) {
      case 'QUOTA_EXCEEDED':
        showUpgradeDialog()
        break
      case 'FILE_TOO_LARGE':
        toast.error('File is too large. Please use a smaller image.')
        break
      default:
        toast.error('Processing failed. Please try again.')
    }
  }
  
  // Don't increment usage on failure
}
```

## Next Steps

With the API client infrastructure complete, the next tasks can proceed:

1. **Task 4:** Create tool configuration system
2. **Task 5-9:** Implement client-side tools
3. **Task 10-13:** Implement API-powered tools using these clients

The API-powered tools (Background Remover, Image Upscaler, Mockup Generator) will use:
- `removeBackground()` from `lib/api-clients/removebg.ts`
- `upscaleImage()` from `lib/api-clients/replicate.ts`
- `/api/tools/check-quota` for quota validation
- `/api/tools/increment-usage` for usage tracking

## Verification

All files have been created and verified:
- ✅ No TypeScript errors in implementation files
- ✅ Proper error handling throughout
- ✅ Comprehensive documentation
- ✅ Integration with existing database schema
- ✅ Follows project architecture patterns
- ✅ Implements all requirements from design document

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.2:** Background Remover API integration ✅
- **Requirement 2.3:** Image Upscaler API integration ✅
- **Requirement 2.5:** Quota checking before processing ✅
- **Requirement 2.6:** Quota exceeded handling ✅
- **Requirement 2.7:** Usage increment after success ✅

Task 3 is now complete and ready for integration with the API-powered tools!

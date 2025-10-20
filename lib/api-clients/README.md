# API Clients

This directory contains client libraries for external APIs used by Design Kit's API-powered tools.

## Overview

API clients handle communication with external services, including:
- Error handling and retry logic
- Request/response transformation
- Progress tracking
- Type safety

## Available Clients

### Remove.bg Client (`removebg.ts`)

Handles background removal using the Remove.bg API.

**Features:**
- Automatic retry with exponential backoff
- Timeout handling (60 seconds)
- File validation (type, size)
- Detailed error messages
- Credits tracking

**Usage:**

```typescript
import { removeBackground, RemoveBgError } from '@/lib/api-clients/removebg'

try {
  const result = await removeBackground(imageFile, {
    size: 'auto',
    type: 'person',
  })
  
  console.log('Background removed:', result.data)
  console.log('Credits charged:', result.creditsCharged)
  console.log('Detected type:', result.detectedType)
} catch (error) {
  if (error instanceof RemoveBgError) {
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    console.error('Status:', error.statusCode)
  }
}
```

**Options:**

- `size`: Output size ('auto', 'preview', 'full', 'medium', 'hd', '4k')
- `type`: Subject type ('auto', 'person', 'product', 'car')
- `format`: Output format ('auto', 'png', 'jpg', 'zip')
- `channels`: Color channels ('rgba', 'alpha')
- `bgColor`: Background color (hex)
- `bgImageUrl`: Background image URL

**Error Codes:**

- `MISSING_API_KEY`: API key not configured
- `INVALID_FILE`: Invalid file provided
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds 12MB limit
- `TIMEOUT`: Request timed out
- `NETWORK_ERROR`: Network connection failed

### Replicate Client (`replicate.ts`)

Handles image upscaling using the Replicate API.

**Features:**
- Polling mechanism for async processing
- Progress tracking with callbacks
- Cancellation support
- Timeout handling (5 minutes max)
- Data URL conversion for image upload

**Usage:**

```typescript
import { upscaleImage, ReplicateError } from '@/lib/api-clients/replicate'

try {
  const result = await upscaleImage(
    imageFile,
    { scale: 4 },
    (progress, status) => {
      console.log(`${progress}%: ${status}`)
    }
  )
  
  console.log('Upscaled image URL:', result.imageUrl)
  console.log('Processing time:', result.processingTime, 'ms')
} catch (error) {
  if (error instanceof ReplicateError) {
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    console.error('Prediction ID:', error.predictionId)
  }
}
```

**Options:**

- `scale`: Upscale factor (2, 4, or 8)
- `model`: Custom model version (optional)

**Progress Callback:**

```typescript
type ProgressCallback = (progress: number, status: string) => void
```

- `progress`: 0-100 percentage
- `status`: Human-readable status message

**Error Codes:**

- `MISSING_API_KEY`: API key not configured
- `INVALID_FILE`: Invalid file provided
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds 10MB (recommended limit)
- `INVALID_SCALE`: Scale must be 2, 4, or 8
- `TIMEOUT`: Initial request timed out
- `POLL_TIMEOUT`: Processing exceeded 5 minutes
- `PREDICTION_FAILED`: Processing failed
- `PREDICTION_CANCELED`: Processing was canceled
- `NO_OUTPUT`: No output received from API

**Cancellation:**

```typescript
import { cancelPrediction } from '@/lib/api-clients/replicate'

await cancelPrediction(predictionId)
```

## API Routes

### Check Quota (`/api/tools/check-quota`)

Checks if user has remaining API quota for today.

**Method:** GET  
**Auth:** Required  
**Response:**

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

**Usage:**

```typescript
const response = await fetch('/api/tools/check-quota')
const quota = await response.json()

if (!quota.canUse) {
  alert(`Daily quota exceeded. Resets at ${quota.resetAt}`)
}
```

### Increment Usage (`/api/tools/increment-usage`)

Increments user's API tool usage count after successful operation.

**Method:** POST  
**Auth:** Required  
**Body:**

```typescript
{
  toolName: string // Required
  fileSizeMb?: number
  processingTimeMs?: number
  success?: boolean
  errorMessage?: string
}
```

**Response:**

```typescript
{
  success: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
}
```

**Usage:**

```typescript
const response = await fetch('/api/tools/increment-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toolName: 'background-remover',
    fileSizeMb: 2.5,
    processingTimeMs: 3500,
    success: true,
  }),
})

const result = await response.json()
console.log('Remaining quota:', result.remaining)
```

## Environment Variables

Required environment variables:

```bash
# Remove.bg API
REMOVE_BG_API_KEY=your_api_key_here

# Replicate API
REPLICATE_API_KEY=your_api_key_here
```

Get API keys:
- Remove.bg: https://www.remove.bg/api
- Replicate: https://replicate.com/account/api-tokens

## Error Handling

All API clients use custom error classes that extend `Error`:

```typescript
class RemoveBgError extends Error {
  statusCode?: number
  code?: string
}

class ReplicateError extends Error {
  statusCode?: number
  code?: string
  predictionId?: string
}
```

**Best Practices:**

1. Always catch errors and check instance type
2. Display user-friendly messages based on error codes
3. Log errors for debugging (without sensitive data)
4. Don't charge quota on API failures

**Example:**

```typescript
try {
  const result = await removeBackground(file)
} catch (error) {
  if (error instanceof RemoveBgError) {
    switch (error.code) {
      case 'QUOTA_EXCEEDED':
        showUpgradeDialog()
        break
      case 'FILE_TOO_LARGE':
        toast.error('File is too large. Please use a smaller image.')
        break
      case 'NETWORK_ERROR':
        toast.error('Network error. Please try again.', { action: 'Retry' })
        break
      default:
        toast.error('Processing failed. Please try again.')
    }
  }
}
```

## Testing

To test API clients locally:

1. Set environment variables in `.env.local`
2. Use test images from `public/test-images/`
3. Monitor API usage in respective dashboards

**Remove.bg Test:**

```typescript
import { removeBackground } from '@/lib/api-clients/removebg'

const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
const result = await removeBackground(file)
console.log('Success:', result.creditsCharged, 'credits charged')
```

**Replicate Test:**

```typescript
import { upscaleImage } from '@/lib/api-clients/replicate'

const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
const result = await upscaleImage(file, { scale: 2 }, (progress, status) => {
  console.log(`${progress}%: ${status}`)
})
console.log('Success:', result.imageUrl)
```

## Rate Limits

**Remove.bg:**
- Free tier: 50 API calls/month
- Paid plans: Varies by subscription

**Replicate:**
- Pay-per-use pricing
- No hard rate limits
- Concurrent prediction limits apply

## Best Practices

1. **Always check quota before processing**
   ```typescript
   const quota = await fetch('/api/tools/check-quota').then(r => r.json())
   if (!quota.canUse) {
     showUpgradeDialog()
     return
   }
   ```

2. **Increment usage after success**
   ```typescript
   try {
     const result = await removeBackground(file)
     await fetch('/api/tools/increment-usage', {
       method: 'POST',
       body: JSON.stringify({ toolName: 'background-remover', success: true })
     })
   } catch (error) {
     // Don't increment on failure
   }
   ```

3. **Show progress for long operations**
   ```typescript
   upscaleImage(file, { scale: 4 }, (progress, status) => {
     setProgress(progress)
     setStatusMessage(status)
   })
   ```

4. **Handle cancellation**
   ```typescript
   let predictionId: string | null = null
   
   const result = await upscaleImage(file, { scale: 4 })
   predictionId = result.predictionId
   
   // On cancel button click:
   if (predictionId) {
     await cancelPrediction(predictionId)
   }
   ```

5. **Validate files before API calls**
   ```typescript
   if (file.size > 12 * 1024 * 1024) {
     toast.error('File too large for background removal (max 12MB)')
     return
   }
   ```

## Troubleshooting

**"API key is not configured"**
- Ensure environment variables are set in `.env.local`
- Restart dev server after adding variables

**"Request timed out"**
- Check internet connection
- Try with smaller image
- Increase timeout in client code

**"Quota exceeded"**
- Check user's plan and daily limit
- Verify quota reset time
- Suggest upgrade to higher plan

**"File too large"**
- Compress image before upload
- Suggest using image compressor tool first
- Display file size limits clearly

## Future Enhancements

- [ ] Add caching for repeated operations
- [ ] Implement batch processing
- [ ] Add webhook support for async operations
- [ ] Implement request queuing
- [ ] Add more upscaling models
- [ ] Support custom Remove.bg parameters

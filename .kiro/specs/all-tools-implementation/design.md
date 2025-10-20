# Design Document

## Overview

This document outlines the technical design for implementing all 10 tools in the Design Kit application. The design follows the existing architecture established by the Color Picker tool, ensuring consistency across all tools while optimizing for performance, accessibility, and user experience.

### Design Principles

1. **Consistency**: All tools follow the same UI patterns and component structure
2. **Privacy-First**: Client-side tools process files entirely in the browser
3. **Performance**: Code splitting, lazy loading, and optimized image processing
4. **Accessibility**: WCAG 2.1 Level AA compliance with keyboard navigation and screen reader support
5. **Progressive Enhancement**: Core functionality works without JavaScript where possible
6. **Mobile-First**: Responsive design optimized for mobile devices

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React hooks (useState, useCallback, useRef)
- **Image Processing**: HTML5 Canvas API, browser-image-compression
- **File Handling**: FileReader API, Blob API
- **External APIs**: Remove.bg (background removal), Replicate (upscaling)

## Architecture

### Component Hierarchy

```
ToolPage (app/(tools)/[tool-name]/page.tsx)
├── ToolWrapper (shared layout)
│   ├── Header (title, description, back button, info dialog)
│   ├── Main Content Area
│   │   ├── FileUploader (if no file selected)
│   │   ├── Tool-Specific Canvas/UI
│   │   ├── Tool Controls (sidebar or bottom panel)
│   │   └── Preview/Output Display
│   └── Footer (privacy notice for client-side tools)
```


### Directory Structure

```
app/(tools)/
├── layout.tsx                    # Shared tools layout
├── color-picker/                 # ✅ Already implemented
├── image-cropper/
│   ├── page.tsx
│   └── components/
│       ├── CropCanvas.tsx
│       ├── AspectRatioSelector.tsx
│       └── CropControls.tsx
├── image-resizer/
│   ├── page.tsx
│   └── components/
│       ├── ResizeCanvas.tsx
│       ├── DimensionInputs.tsx
│       └── ResizePreview.tsx
├── format-converter/
│   ├── page.tsx
│   └── components/
│       ├── FormatSelector.tsx
│       ├── QualitySlider.tsx
│       └── ConversionPreview.tsx
├── qr-generator/
│   ├── page.tsx
│   └── components/
│       ├── QRCanvas.tsx
│       ├── QRCustomizer.tsx
│       └── QRPreview.tsx
├── gradient-generator/
│   ├── page.tsx
│   └── components/
│       ├── GradientCanvas.tsx
│       ├── ColorStopEditor.tsx
│       └── CSSCodeDisplay.tsx
├── image-compressor/
│   ├── page.tsx
│   └── components/
│       ├── CompressionCanvas.tsx
│       ├── QualityControls.tsx
│       └── CompressionStats.tsx
├── background-remover/
│   ├── page.tsx
│   └── components/
│       ├── RemovalPreview.tsx
│       ├── ComparisonSlider.tsx
│       └── UsageIndicator.tsx
├── image-upscaler/
│   ├── page.tsx
│   └── components/
│       ├── UpscalePreview.tsx
│       ├── ScaleFactorSelector.tsx
│       └── ProcessingStatus.tsx
└── mockup-generator/
    ├── page.tsx
    └── components/
        ├── MockupCanvas.tsx
        ├── TemplateSelector.tsx
        └── DesignPositioner.tsx

components/shared/
├── ToolWrapper.tsx               # ✅ Already implemented
├── FileUploader.tsx              # ✅ Already implemented
├── UsageIndicator.tsx            # 🆕 To be created
├── DownloadButton.tsx            # 🆕 To be created
├── ProcessingOverlay.tsx         # 🆕 To be created
└── ComparisonSlider.tsx          # 🆕 To be created

lib/utils/
├── imageProcessing.ts            # 🆕 Image manipulation utilities
├── canvasHelpers.ts              # 🆕 Canvas API helpers
├── colorConversion.ts            # ✅ Already exists (in color-picker)
├── fileDownload.ts               # 🆕 File download utilities
└── apiClients/
    ├── removebg.ts               # 🆕 Remove.bg API client
    └── replicate.ts              # 🆕 Replicate API client
```


## Components and Interfaces

### 1. Shared Components

#### UsageIndicator Component

Displays remaining API quota for authenticated users.

```typescript
interface UsageIndicatorProps {
  currentUsage: number
  dailyLimit: number
  planName: 'free' | 'premium' | 'pro'
  onUpgradeClick?: () => void
}
```

**Features:**
- Progress bar showing usage percentage
- Numerical display (e.g., "8/10 remaining")
- Color-coded: green (>50%), yellow (20-50%), red (<20%)
- Upgrade CTA when quota is low
- Real-time updates after tool usage

#### DownloadButton Component

Handles file downloads with progress indication.

```typescript
interface DownloadButtonProps {
  fileName: string
  fileData: Blob | string
  fileType: string
  disabled?: boolean
  onDownloadStart?: () => void
  onDownloadComplete?: () => void
}
```

**Features:**
- Generates download link from Blob or data URL
- Shows download progress for large files
- Success feedback with toast notification
- Keyboard accessible
- Supports multiple file formats

#### ProcessingOverlay Component

Shows loading state during API operations.

```typescript
interface ProcessingOverlayProps {
  isProcessing: boolean
  progress?: number
  message?: string
  onCancel?: () => void
}
```

**Features:**
- Full-screen overlay with backdrop
- Animated spinner or progress bar
- Status message updates
- Optional cancel button
- Prevents user interaction during processing

#### ComparisonSlider Component

Side-by-side image comparison with draggable slider.

```typescript
interface ComparisonSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
}
```

**Features:**
- Draggable vertical slider
- Touch-optimized for mobile
- Keyboard navigation (arrow keys)
- Labels for before/after
- Smooth animations


### 2. Client-Side Tools Design

#### Image Cropper

**Core Functionality:**
- Upload image and display on canvas
- Draggable crop area with resize handles
- Preset aspect ratios (1:1, 4:3, 16:9, custom)
- Zoom in/out for precision
- Download cropped image in original format

**State Management:**
```typescript
interface CropperState {
  imageSrc: string | null
  cropArea: { x: number; y: number; width: number; height: number }
  aspectRatio: number | null
  zoom: number
  rotation: number
}
```

**Canvas Operations:**
1. Load image to canvas
2. Draw crop overlay with handles
3. Handle mouse/touch events for dragging
4. Apply crop transformation
5. Export cropped region to new canvas
6. Convert to Blob and download

**Libraries:** react-cropper or custom Canvas implementation

---

#### Image Resizer

**Core Functionality:**
- Upload image and display preview
- Input width/height in pixels or percentage
- Maintain aspect ratio toggle
- Quality preservation options
- Download resized image

**State Management:**
```typescript
interface ResizerState {
  imageSrc: string | null
  originalDimensions: { width: number; height: number }
  targetDimensions: { width: number; height: number }
  maintainAspectRatio: boolean
  resizeMode: 'pixels' | 'percentage'
}
```

**Canvas Operations:**
1. Load image to canvas
2. Calculate target dimensions
3. Use drawImage() with scaling
4. Apply smoothing algorithms
5. Export to Blob and download

**Algorithm:** Bicubic interpolation for quality

---

#### Format Converter

**Core Functionality:**
- Upload image in any supported format
- Select target format (PNG, JPG, WEBP)
- Adjust quality for lossy formats (JPG, WEBP)
- Preview converted image
- Download in selected format

**State Management:**
```typescript
interface ConverterState {
  imageSrc: string | null
  sourceFormat: string
  targetFormat: 'png' | 'jpeg' | 'webp'
  quality: number // 0-100 for JPG/WEBP
  convertedBlob: Blob | null
}
```

**Canvas Operations:**
1. Load image to canvas
2. Use toBlob() with target MIME type
3. Apply quality parameter for lossy formats
4. Generate preview from Blob
5. Download converted file

---

#### QR Generator

**Core Functionality:**
- Text/URL input (max 500 characters)
- Customize size, colors, error correction
- Real-time preview
- Download as PNG or SVG

**State Management:**
```typescript
interface QRState {
  content: string
  size: number // 128, 256, 512, 1024
  foregroundColor: string
  backgroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  format: 'png' | 'svg'
}
```

**Implementation:**
- Library: qrcode npm package
- Generate QR code to canvas
- Export as PNG or SVG
- Validate input length and format

---

#### Gradient Generator

**Core Functionality:**
- Linear or radial gradient types
- Add/remove color stops (2-10)
- Adjust stop positions and colors
- Set gradient angle (linear)
- Copy CSS code
- Export as PNG image

**State Management:**
```typescript
interface GradientState {
  type: 'linear' | 'radial'
  angle: number // 0-360 for linear
  colorStops: Array<{ color: string; position: number }>
  cssCode: string
}
```

**Canvas Operations:**
1. Create gradient context
2. Add color stops
3. Fill canvas with gradient
4. Generate CSS code string
5. Export canvas as PNG

**CSS Generation:**
```css
background: linear-gradient(90deg, #ff0000 0%, #0000ff 100%);
background: radial-gradient(circle, #ff0000 0%, #0000ff 100%);
```


### 3. API-Powered Tools Design

#### Image Compressor

**Core Functionality:**
- Upload image
- Select compression quality (low, medium, high, custom)
- Display original vs compressed size
- Show compression ratio
- Download compressed image

**State Management:**
```typescript
interface CompressorState {
  imageSrc: string | null
  originalFile: File | null
  compressedBlob: Blob | null
  quality: number // 0-100
  originalSize: number
  compressedSize: number
  compressionRatio: number
}
```

**Implementation:**
- Library: browser-image-compression
- Client-side compression (no API call)
- Real-time preview
- No quota usage (client-side)

**Compression Options:**
```typescript
{
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  quality: 0.8
}
```

---

#### Background Remover

**Core Functionality:**
- Upload image
- Check user quota
- Send to Remove.bg API
- Display before/after comparison
- Download transparent PNG

**State Management:**
```typescript
interface BackgroundRemoverState {
  imageSrc: string | null
  processedImage: string | null
  isProcessing: boolean
  error: string | null
  remainingQuota: number
}
```

**API Integration:**
```typescript
// lib/api-clients/removebg.ts
async function removeBackground(imageFile: File): Promise<Blob> {
  const formData = new FormData()
  formData.append('image_file', imageFile)
  formData.append('size', 'auto')
  
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!
    },
    body: formData
  })
  
  if (!response.ok) throw new Error('Background removal failed')
  return response.blob()
}
```

**Quota Management:**
1. Check `can_use_api_tool(user_id)` before processing
2. Process image if quota available
3. Call `increment_api_usage(user_id)` after success
4. Update UI with new quota

---

#### Image Upscaler

**Core Functionality:**
- Upload image
- Select upscale factor (2x, 4x, 8x)
- Process via Replicate API
- Show processing status
- Download upscaled image

**State Management:**
```typescript
interface UpscalerState {
  imageSrc: string | null
  scaleFactor: 2 | 4 | 8
  processedImage: string | null
  isProcessing: boolean
  progress: number
  error: string | null
}
```

**API Integration:**
```typescript
// lib/api-clients/replicate.ts
async function upscaleImage(
  imageUrl: string,
  scale: number
): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'upscaler-model-version',
      input: { image: imageUrl, scale }
    })
  })
  
  const prediction = await response.json()
  return pollPrediction(prediction.id)
}
```

**Processing Flow:**
1. Upload image to temporary storage
2. Submit to Replicate API
3. Poll for completion (every 2 seconds)
4. Download result
5. Clean up temporary files

---

#### Mockup Generator

**Core Functionality:**
- Upload design image
- Select mockup template (device, print, apparel)
- Adjust design placement and scale
- Generate composite image
- Download high-res PNG

**State Management:**
```typescript
interface MockupState {
  designImage: string | null
  selectedTemplate: MockupTemplate
  designTransform: {
    x: number
    y: number
    scale: number
    rotation: number
  }
  generatedMockup: string | null
}

interface MockupTemplate {
  id: string
  name: string
  category: 'device' | 'print' | 'apparel'
  templateImage: string
  designArea: { x: number; y: number; width: number; height: number }
  perspective?: PerspectiveTransform
}
```

**Canvas Operations:**
1. Load template image
2. Load design image
3. Apply perspective transform if needed
4. Composite design onto template
5. Apply shadows/highlights for realism
6. Export high-resolution PNG

**Template Storage:**
- Store templates in `/public/mockup-templates/`
- JSON metadata for each template
- Lazy load templates on demand


## Data Models

### Tool Configuration

```typescript
// config/tools.ts
export interface ToolConfig {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: 'image-processing' | 'generators' | 'ai-powered'
  type: 'client-side' | 'api-powered'
  path: string
  isAvailable: boolean
  requiresAuth: boolean
  quotaUsage: number // 0 for client-side, 1 for API tools
}

export const TOOLS: ToolConfig[] = [
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Extract colors from images',
    icon: Palette,
    category: 'image-processing',
    type: 'client-side',
    path: '/tools/color-picker',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0
  },
  // ... other tools
]
```

### User Quota

```typescript
interface UserQuota {
  userId: string
  dailyLimit: number
  currentUsage: number
  resetAt: Date
  planType: 'free' | 'premium' | 'pro'
}

interface QuotaLimits {
  free: { daily: 10; fileSize: 10 }
  premium: { daily: 500; fileSize: 50 }
  pro: { daily: 2000; fileSize: 100 }
}
```

### Tool Usage Log

```typescript
interface ToolUsageLog {
  id: string
  userId: string
  toolId: string
  timestamp: Date
  fileSize: number
  processingTime: number
  success: boolean
  errorMessage?: string
}
```


## Error Handling

### Error Types and Recovery

```typescript
// Error handling strategy for each tool type

// Client-Side Tools
try {
  // Image processing
  const result = await processImage(file)
} catch (error) {
  if (error instanceof FileValidationError) {
    // Show file validation error
    toast.error(error.message)
  } else if (error instanceof BrowserCompatibilityError) {
    // Show browser upgrade message
    showBrowserWarning(error.feature)
  } else if (error instanceof ImageProcessingError) {
    // Show processing error with retry option
    toast.error(error.message, { action: 'Retry' })
  }
}

// API-Powered Tools
try {
  // Check quota first
  const hasQuota = await checkUserQuota()
  if (!hasQuota) {
    throw new QuotaExceededError()
  }
  
  // Process via API
  const result = await apiCall()
  
  // Increment usage
  await incrementUsage()
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Show upgrade prompt
    showUpgradeDialog()
  } else if (error instanceof NetworkError) {
    // Show retry option
    toast.error('Network error', { action: 'Retry' })
  } else if (error instanceof AuthenticationError) {
    // Redirect to login
    router.push('/login')
  } else {
    // Generic error - don't charge quota
    toast.error('Processing failed. Please try again.')
  }
}
```

### Error Messages

```typescript
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (size: number, limit: number) =>
    `File size (${size}MB) exceeds your plan limit (${limit}MB). Upgrade to process larger files.`,
  
  INVALID_FILE_TYPE: (accepted: string) =>
    `Invalid file type. Accepted formats: ${accepted}`,
  
  QUOTA_EXCEEDED: (plan: string) =>
    `Daily quota exhausted. Upgrade to ${plan} for more operations.`,
  
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  
  PROCESSING_FAILED: 'Processing failed. Your quota has not been used.',
  
  BROWSER_UNSUPPORTED: (feature: string) =>
    `Your browser doesn't support ${feature}. Please upgrade to a modern browser.`
}
```


## Testing Strategy

### Unit Tests

**Utility Functions:**
```typescript
// lib/utils/imageProcessing.test.ts
describe('imageProcessing', () => {
  test('resizeImage maintains aspect ratio', async () => {
    const result = await resizeImage(testImage, { width: 800, maintainAspectRatio: true })
    expect(result.width).toBe(800)
    expect(result.height).toBe(600) // Original was 1600x1200
  })
  
  test('convertFormat converts PNG to JPEG', async () => {
    const result = await convertFormat(pngBlob, 'jpeg', 90)
    expect(result.type).toBe('image/jpeg')
  })
})

// lib/utils/fileValidation.test.ts
describe('validateFile', () => {
  test('rejects files exceeding size limit', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png')
    const result = validateFile(largeFile, { maxSize: 10 })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('exceeds 10MB')
  })
})
```

### Integration Tests

**Tool Workflows:**
```typescript
// app/(tools)/image-cropper/page.test.tsx
describe('ImageCropper', () => {
  test('complete crop workflow', async () => {
    const { user } = render(<ImageCropperPage />)
    
    // Upload file
    const file = new File(['image'], 'test.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/upload/i), file)
    
    // Select aspect ratio
    await user.click(screen.getByText('1:1'))
    
    // Crop and download
    await user.click(screen.getByText(/crop/i))
    await user.click(screen.getByText(/download/i))
    
    expect(mockDownload).toHaveBeenCalled()
  })
})
```

### Accessibility Tests

```typescript
// Automated accessibility testing
describe('Accessibility', () => {
  test('tool page has no violations', async () => {
    const { container } = render(<ImageCropperPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('keyboard navigation works', async () => {
    const { user } = render(<ImageCropperPage />)
    
    // Tab through interactive elements
    await user.tab()
    expect(screen.getByRole('button', { name: /back/i })).toHaveFocus()
    
    await user.tab()
    expect(screen.getByRole('button', { name: /info/i })).toHaveFocus()
  })
})
```

### Visual Regression Tests

```typescript
// Using Playwright for visual testing
test('image cropper UI matches snapshot', async ({ page }) => {
  await page.goto('/tools/image-cropper')
  await expect(page).toHaveScreenshot('cropper-initial.png')
  
  // Upload image
  await page.setInputFiles('input[type="file"]', 'test-image.png')
  await expect(page).toHaveScreenshot('cropper-with-image.png')
})
```

### Performance Tests

```typescript
describe('Performance', () => {
  test('image processing completes within 2 seconds', async () => {
    const start = performance.now()
    await processImage(testImage)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(2000)
  })
  
  test('Lighthouse score > 90', async () => {
    const result = await lighthouse('/tools/image-cropper')
    expect(result.performance).toBeGreaterThan(90)
  })
})
```


## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
const ColorCanvas = dynamic(() => import('./components/ColorCanvas'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Canvas is client-side only
})

// Lazy load tool pages
const toolRoutes = {
  'image-cropper': dynamic(() => import('./image-cropper/page')),
  'image-resizer': dynamic(() => import('./image-resizer/page')),
  // ... other tools
}
```

### Image Optimization

```typescript
// Use Web Workers for heavy processing
// lib/workers/imageProcessor.worker.ts
self.addEventListener('message', async (e) => {
  const { type, imageData, options } = e.data
  
  switch (type) {
    case 'resize':
      const resized = await resizeImage(imageData, options)
      self.postMessage({ type: 'complete', data: resized })
      break
    
    case 'compress':
      const compressed = await compressImage(imageData, options)
      self.postMessage({ type: 'complete', data: compressed })
      break
  }
})

// Usage in component
const worker = new Worker(new URL('./imageProcessor.worker.ts', import.meta.url))
worker.postMessage({ type: 'resize', imageData, options })
worker.onmessage = (e) => {
  setProcessedImage(e.data.data)
}
```

### Canvas Optimization

```typescript
// Reuse canvas instances
const canvasPool = {
  canvas: null as HTMLCanvasElement | null,
  
  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
    }
    return this.canvas
  },
  
  releaseCanvas() {
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d')
      ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }
}

// Use OffscreenCanvas for better performance
const offscreen = new OffscreenCanvas(width, height)
const ctx = offscreen.getContext('2d')
```

### Memory Management

```typescript
// Clean up object URLs
useEffect(() => {
  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  }
}, [imageUrl])

// Limit canvas size for large images
function getOptimalCanvasSize(width: number, height: number) {
  const MAX_DIMENSION = 4096
  
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height }
  }
  
  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale)
  }
}
```

### Caching Strategy

```typescript
// Cache processed images in sessionStorage
const CACHE_KEY_PREFIX = 'tool_cache_'

function cacheResult(toolId: string, fileHash: string, result: Blob) {
  const key = `${CACHE_KEY_PREFIX}${toolId}_${fileHash}`
  // Store as base64 for sessionStorage
  const reader = new FileReader()
  reader.onload = () => {
    sessionStorage.setItem(key, reader.result as string)
  }
  reader.readAsDataURL(result)
}

function getCachedResult(toolId: string, fileHash: string): string | null {
  const key = `${CACHE_KEY_PREFIX}${toolId}_${fileHash}`
  return sessionStorage.getItem(key)
}
```


## Accessibility Implementation

### Keyboard Navigation

```typescript
// Keyboard shortcuts for tools
const KEYBOARD_SHORTCUTS = {
  'Escape': 'Cancel operation',
  'Enter': 'Confirm/Process',
  'Ctrl+Z': 'Undo',
  'Ctrl+S': 'Download result',
  'Ctrl+R': 'Reset tool',
  '+/-': 'Zoom in/out',
  'Arrow keys': 'Move/adjust'
}

// Implement keyboard handler
function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.ctrlKey ? `Ctrl+${e.key}` : e.key
      const handler = handlers[key]
      
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
```

### ARIA Labels and Roles

```typescript
// Canvas with proper ARIA attributes
<canvas
  ref={canvasRef}
  role="img"
  aria-label="Image preview with crop area"
  tabIndex={0}
  onKeyDown={handleCanvasKeyboard}
/>

// Interactive controls
<button
  aria-label="Crop image with current selection"
  aria-describedby="crop-instructions"
>
  Crop
</button>

<div id="crop-instructions" className="sr-only">
  Use arrow keys to adjust crop area, Enter to confirm, Escape to cancel
</div>

// Status announcements
<div role="status" aria-live="polite" className="sr-only">
  {statusMessage}
</div>
```

### Focus Management

```typescript
// Trap focus in modal dialogs
function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return
    
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    
    ref.current.addEventListener('keydown', handleTab)
    firstElement.focus()
    
    return () => ref.current?.removeEventListener('keydown', handleTab)
  }, [isActive, ref])
}
```

### Color Contrast

```typescript
// Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
const ACCESSIBLE_COLORS = {
  primary: '#2563eb', // Blue - 4.5:1 on white
  secondary: '#64748b', // Slate - 4.5:1 on white
  success: '#16a34a', // Green - 4.5:1 on white
  error: '#dc2626', // Red - 4.5:1 on white
  warning: '#ca8a04', // Yellow - 4.5:1 on white
}

// Check contrast programmatically
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
```

### Screen Reader Support

```typescript
// Announce processing status
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Usage
announceToScreenReader('Image uploaded successfully')
announceToScreenReader('Processing complete. Download button is now available.')
```


## Security Considerations

### File Upload Security

```typescript
// Validate file magic numbers (not just extensions)
const FILE_SIGNATURES = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
}

async function validateFileMagicNumber(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  const signature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES]
  if (!signature) return false
  
  return signature.every((byte, index) => bytes[index] === byte)
}

// Sanitize filenames
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.remove.bg https://api.replicate.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

### API Security

```typescript
// Rate limiting for API routes
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }
  
  // Process request
}

// Validate API keys server-side only
function validateApiKey(key: string | undefined): boolean {
  if (!key) return false
  
  // Check key format
  if (!/^[a-zA-Z0-9_-]{32,}$/.test(key)) return false
  
  // Verify against stored hash
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return hash === process.env.API_KEY_HASH
}
```

### Data Privacy

```typescript
// Ensure no file data is logged
function sanitizeErrorForLogging(error: Error, context: any) {
  const sanitized = { ...context }
  
  // Remove sensitive data
  delete sanitized.fileData
  delete sanitized.imageData
  delete sanitized.blob
  
  return {
    message: error.message,
    stack: error.stack,
    context: sanitized
  }
}

// Clear sensitive data from memory
function secureCleanup(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Overwrite canvas data
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  
  // Reset dimensions to free memory
  canvas.width = 0
  canvas.height = 0
}
```


## Implementation Phases

### Phase 1: Shared Infrastructure (Week 1)

**Priority: High**

1. Create shared utility functions
   - `lib/utils/imageProcessing.ts` - Core image manipulation
   - `lib/utils/canvasHelpers.ts` - Canvas API helpers
   - `lib/utils/fileDownload.ts` - File download utilities

2. Create shared components
   - `UsageIndicator` - Quota display
   - `DownloadButton` - File download handler
   - `ProcessingOverlay` - Loading states
   - `ComparisonSlider` - Before/after comparison

3. Set up API clients
   - `lib/api-clients/removebg.ts` - Remove.bg integration
   - `lib/api-clients/replicate.ts` - Replicate integration

4. Create tool configuration
   - `config/tools.ts` - Tool metadata and routing

### Phase 2: Client-Side Tools (Week 2-3)

**Priority: High**

Implement in this order (simplest to most complex):

1. **Image Resizer** (Simplest)
   - Basic canvas scaling
   - Dimension inputs
   - Aspect ratio lock

2. **Format Converter**
   - Canvas toBlob() with format
   - Quality slider
   - Format selector

3. **QR Generator**
   - qrcode library integration
   - Customization options
   - SVG/PNG export

4. **Gradient Generator**
   - Canvas gradient API
   - Color stop editor
   - CSS code generation

5. **Image Cropper** (Most Complex)
   - Draggable crop area
   - Aspect ratio presets
   - Zoom controls

### Phase 3: API-Powered Tools (Week 4-5)

**Priority: Medium**

1. **Image Compressor** (Client-side, no API)
   - browser-image-compression library
   - Quality controls
   - Size comparison

2. **Background Remover**
   - Remove.bg API integration
   - Quota checking
   - Before/after comparison

3. **Image Upscaler**
   - Replicate API integration
   - Progress polling
   - Scale factor selection

4. **Mockup Generator**
   - Template system
   - Design positioning
   - Perspective transforms

### Phase 4: Polish & Testing (Week 6)

**Priority: Medium**

1. Accessibility audit
   - Keyboard navigation
   - Screen reader testing
   - Color contrast verification

2. Performance optimization
   - Code splitting
   - Web Workers
   - Canvas pooling

3. Cross-browser testing
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)

4. Documentation
   - Tool usage guides
   - API documentation
   - Troubleshooting guides


## Design Decisions and Rationales

### 1. Why Canvas API over Libraries?

**Decision:** Use native Canvas API for most operations, libraries only when necessary.

**Rationale:**
- Smaller bundle size (no heavy dependencies)
- Better performance (no abstraction overhead)
- More control over processing pipeline
- Privacy-first (no external service calls)

**Exceptions:**
- QR Generator: Use `qrcode` library (complex algorithm)
- Image Compression: Use `browser-image-compression` (optimized)
- Image Cropper: Consider `react-cropper` if custom implementation is too complex

### 2. Why Client-Side Processing?

**Decision:** Process files in browser whenever possible.

**Rationale:**
- Privacy: Files never leave user's device
- Speed: No network latency
- Cost: No server processing costs
- Offline: Works without internet (after initial load)

**Trade-offs:**
- Limited by browser capabilities
- Slower on low-end devices
- Memory constraints for large files

### 3. Why Dynamic Imports?

**Decision:** Lazy load tool components with dynamic imports.

**Rationale:**
- Faster initial page load
- Smaller JavaScript bundles
- Better Core Web Vitals scores
- Users only download code for tools they use

**Implementation:**
```typescript
const ImageCropper = dynamic(() => import('./image-cropper/page'), {
  loading: () => <ToolLoadingSkeleton />,
  ssr: false
})
```

### 4. Why Session Storage for Cache?

**Decision:** Use sessionStorage for temporary caching, not localStorage.

**Rationale:**
- Automatic cleanup on tab close
- Prevents disk space issues
- Privacy-friendly (no persistent data)
- Faster than re-processing

**Limitations:**
- Lost on page refresh
- Limited to ~5-10MB
- Only for small results

### 5. Why Web Workers for Heavy Processing?

**Decision:** Use Web Workers for operations > 500ms.

**Rationale:**
- Prevents UI blocking
- Better user experience
- Utilizes multiple CPU cores
- Allows cancellation

**Use Cases:**
- Large image resizing
- Batch processing
- Complex filters
- Format conversion

### 6. Why Separate API Clients?

**Decision:** Create dedicated client modules for external APIs.

**Rationale:**
- Easier to mock in tests
- Centralized error handling
- Rate limiting in one place
- Easier to swap providers

**Structure:**
```typescript
// lib/api-clients/removebg.ts
export class RemoveBgClient {
  async removeBackground(file: File): Promise<Blob>
  async checkQuota(): Promise<number>
}
```

### 7. Why Quota Checking Before Processing?

**Decision:** Check quota before API calls, not after.

**Rationale:**
- Better user experience (fail fast)
- No wasted API calls
- Clear upgrade prompts
- Prevents partial charges

**Flow:**
1. Check quota → 2. Show upgrade if needed → 3. Process → 4. Increment usage

### 8. Why TypeScript Strict Mode?

**Decision:** Enable TypeScript strict mode for all tool code.

**Rationale:**
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

## Conclusion

This design provides a comprehensive blueprint for implementing all 10 tools in the Design Kit application. The architecture prioritizes:

1. **Consistency** - All tools follow the same patterns
2. **Performance** - Optimized for speed and efficiency
3. **Privacy** - Client-side processing where possible
4. **Accessibility** - WCAG 2.1 Level AA compliance
5. **Maintainability** - Clean, testable, well-documented code

The phased implementation approach allows for incremental delivery, with the simplest tools first to validate the architecture before tackling more complex features.

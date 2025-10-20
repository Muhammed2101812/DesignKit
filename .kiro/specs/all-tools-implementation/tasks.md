# Implementation Plan

This implementation plan breaks down the design into discrete, actionable coding tasks. Each task builds incrementally on previous tasks, with no orphaned code. Tasks are organized by phase and priority.

## Phase 1: Shared Infrastructure

- [x] 1. Create core utility functions





  - Create `lib/utils/imageProcessing.ts` with functions for resizing, format conversion, and canvas operations
  - Create `lib/utils/canvasHelpers.ts` with canvas pooling, dimension calculation, and drawing utilities
  - Create `lib/utils/fileDownload.ts` with blob download, filename sanitization, and format helpers
  - _Requirements: 1.6, 6.1, 6.2_
-

- [x] 2. Create shared UI components




  - Implement `components/shared/UsageIndicator.tsx` with quota display, progress bar, and upgrade CTA
  - Implement `components/shared/DownloadButton.tsx` with blob download, progress indication, and success feedback
  - Implement `components/shared/ProcessingOverlay.tsx` with loading state, progress bar, and cancel option
  - Implement `components/shared/ComparisonSlider.tsx` with draggable slider, touch support, and keyboard navigation
  - _Requirements: 2.5, 3.3, 3.4, 7.5_
-

- [x] 3. Set up API client infrastructure




  - Create `lib/api-clients/removebg.ts` with Remove.bg API integration, error handling, and retry logic
  - Create `lib/api-clients/replicate.ts` with Replicate API integration, polling mechanism, and progress tracking
  - Create API route `app/api/tools/check-quota/route.ts` for quota validation
  - Create API route `app/api/tools/increment-usage/route.ts` for usage tracking
  - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7_
- [x] 4. Create tool configuration system



















- [ ] 4. Create tool configuration system

  - Create `config/tools.ts` with tool metadata, categories, and routing configuration
  - Update landing page to display all tools from configuration
  - Create tools navigation menu component with category organization
  - _Requirements: 4.1, 4.2, 4.3_


## Phase 2: Client-Side Tools

- [x] 5. Implement Image Resizer tool





  - Create `app/(tools)/image-resizer/page.tsx` with file upload, dimension inputs, and preview
  - Create `app/(tools)/image-resizer/components/ResizeCanvas.tsx` for image display and processing
  - Create `app/(tools)/image-resizer/components/DimensionInputs.tsx` with width/height inputs and aspect ratio lock
  - Create `app/(tools)/image-resizer/components/ResizePreview.tsx` for before/after comparison
  - Implement resize logic using Canvas API with bicubic interpolation
  - Add download functionality with original format preservation
  - _Requirements: 1.2, 1.6, 1.7, 6.1, 6.2_

- [x] 6. Implement Format Converter tool





  - Create `app/(tools)/format-converter/page.tsx` with file upload and format selection
  - Create `app/(tools)/format-converter/components/FormatSelector.tsx` with PNG/JPG/WEBP options
  - Create `app/(tools)/format-converter/components/QualitySlider.tsx` for lossy format quality control
  - Create `app/(tools)/format-converter/components/ConversionPreview.tsx` for result preview
  - Implement format conversion using Canvas toBlob() with quality parameters
  - Add download functionality with selected format
  - _Requirements: 1.3, 1.6, 1.7, 6.1, 6.2_

- [x] 7. Implement QR Generator tool





  - Create `app/(tools)/qr-generator/page.tsx` with text input and customization options
  - Create `app/(tools)/qr-generator/components/QRCanvas.tsx` for QR code rendering
  - Create `app/(tools)/qr-generator/components/QRCustomizer.tsx` with size, color, and error correction controls
  - Create `app/(tools)/qr-generator/components/QRPreview.tsx` for real-time preview
  - Integrate qrcode npm package for QR generation
  - Implement PNG and SVG export options
  - Add input validation (max 500 characters)
  - _Requirements: 1.4, 6.1, 6.2, 7.1_

- [x] 8. Implement Gradient Generator tool





  - Create `app/(tools)/gradient-generator/page.tsx` with gradient type selection
  - Create `app/(tools)/gradient-generator/components/GradientCanvas.tsx` for gradient rendering
  - Create `app/(tools)/gradient-generator/components/ColorStopEditor.tsx` with add/remove/edit color stops
  - Create `app/(tools)/gradient-generator/components/CSSCodeDisplay.tsx` with copy-to-clipboard functionality
  - Implement linear and radial gradient rendering
  - Generate CSS code for gradients
  - Add PNG export functionality
  - _Requirements: 1.5, 6.1, 6.2, 7.5_

- [x] 9. Implement Image Cropper tool





  - Create `app/(tools)/image-cropper/page.tsx` with file upload and crop interface
  - Create `app/(tools)/image-cropper/components/CropCanvas.tsx` with draggable crop area and resize handles
  - Create `app/(tools)/image-cropper/components/AspectRatioSelector.tsx` with preset ratios (free, 1:1, 4:3, 16:9, custom)
  - Create `app/(tools)/image-cropper/components/CropControls.tsx` with zoom and rotation controls
  - Implement crop area dragging with mouse and touch support
  - Implement resize handles with aspect ratio constraints
  - Add zoom controls for precision cropping
  - Implement crop transformation and export
  - _Requirements: 1.1, 1.6, 1.7, 5.5, 6.1, 6.2_


## Phase 3: API-Powered Tools

- [x] 10. Implement Image Compressor tool





  - Create `app/(tools)/image-compressor/page.tsx` with file upload and quality controls
  - Create `app/(tools)/image-compressor/components/CompressionCanvas.tsx` for image display
  - Create `app/(tools)/image-compressor/components/QualityControls.tsx` with quality presets and custom slider
  - Create `app/(tools)/image-compressor/components/CompressionStats.tsx` showing original/compressed sizes and ratio
  - Integrate browser-image-compression library for client-side compression
  - Implement real-time compression preview
  - Add download functionality for compressed image
  - Note: This is client-side processing, no API quota usage
  - _Requirements: 2.1, 6.1, 6.2, 7.5_

- [x] 11. Implement Background Remover tool





  - Create `app/(tools)/background-remover/page.tsx` with file upload and quota display
  - Create `app/(tools)/background-remover/components/RemovalPreview.tsx` for result display
  - Create `app/(tools)/background-remover/components/ComparisonSlider.tsx` for before/after comparison
  - Integrate UsageIndicator component for quota display
  - Create API route `app/api/tools/background-remover/route.ts` for Remove.bg integration
  - Implement quota checking before processing
  - Implement background removal with Remove.bg API
  - Implement usage increment after successful processing
  - Add error handling for quota exceeded and API failures
  - Add download functionality for transparent PNG result
  - _Requirements: 2.2, 2.5, 2.6, 2.7, 7.2, 7.3, 7.4_

- [x] 12. Implement Image Upscaler tool





  - Create `app/(tools)/image-upscaler/page.tsx` with file upload and scale factor selection
  - Create `app/(tools)/image-upscaler/components/UpscalePreview.tsx` for result display
  - Create `app/(tools)/image-upscaler/components/ScaleFactorSelector.tsx` with 2x/4x/8x options
  - Create `app/(tools)/image-upscaler/components/ProcessingStatus.tsx` with progress indicator
  - Integrate UsageIndicator component for quota display
  - Create API route `app/api/tools/image-upscaler/route.ts` for Replicate integration
  - Implement quota checking before processing
  - Implement image upscaling with Replicate API
  - Implement polling mechanism for async processing
  - Implement usage increment after successful processing
  - Add progress updates during processing
  - Add error handling for quota exceeded and API failures
  - Add download functionality for upscaled image
  - _Requirements: 2.3, 2.5, 2.6, 2.7, 7.2, 7.3, 7.4_


- [x] 13. Implement Mockup Generator tool




  - Create `app/(tools)/mockup-generator/page.tsx` with design upload and template selection
  - Create `app/(tools)/mockup-generator/components/MockupCanvas.tsx` for composite rendering
  - Create `app/(tools)/mockup-generator/components/TemplateSelector.tsx` with template categories and previews
  - Create `app/(tools)/mockup-generator/components/DesignPositioner.tsx` with drag, scale, and rotation controls
  - Create mockup template system with JSON metadata
  - Add sample mockup templates to `/public/mockup-templates/`
  - Implement design positioning with transform controls
  - Implement perspective transformation for realistic placement
  - Implement composite rendering with shadows and highlights
  - Add download functionality for high-resolution PNG
  - _Requirements: 2.4, 6.1, 6.2, 10.3_


## Phase 4: Integration and Polish

- [x] 14. Implement tool navigation and discovery





  - Update landing page with tools grid displaying all 10 tools
  - Add tool type badges (Client-Side / API-Powered) to tool cards
  - Create tools navigation menu in header with category organization
  - Implement breadcrumb navigation on tool pages
  - Add "Related Tools" section on each tool page



  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 15. Implement accessibility features

  - Add keyboard navigation support to all tools (Tab, Enter, Escape, Arrow keys)
  - Add ARIA labels and roles to all interactive elements
  - Implement focus management for modals and overlays
  - Add screen reader announcements for status updates
  - Verify color contrast meets WCAG 2.1 Level AA (4.5:1 for normal text)
  - Add keyboard shortcuts documentation to tool info dialogs
  - Test with screen readers (NVDA, VoiceOver)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 10.2, 10.4_

- [x] 16. Implement responsive design





  - Ensure all tools work on mobile devices (320px minimum width)
  - Optimize touch controls for mobile (larger tap targets, swipe gestures)
  - Test responsive layouts across breakpoints (mobile, tablet, desktop, wide)
  - Optimize canvas rendering for mobile performance
  - Add mobile-specific UI adjustments (bottom sheets, full-screen modals)
  - _Requirements: 5.5, 5.6_

- [x] 17. Implement performance optimizations





  - Add dynamic imports for all tool pages
  - Implement Web Workers for heavy image processing operations
  - Add canvas pooling to reuse canvas instances
  - Implement image caching in sessionStorage for repeated operations
  - Optimize canvas size for large images (max 4096px)
  - Add lazy loading for tool preview images
  - Implement code splitting for tool-specific code
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Implement error handling and user feedback





  - Add comprehensive error messages for all failure scenarios
  - Implement toast notifications for success and error states
  - Add retry functionality for network errors
  - Implement browser compatibility checks and warnings
  - Add error logging for debugging (without sensitive data)
  - Ensure API errors don't decrement user quota
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_


- [x] 19. Implement security measures




  - Add file magic number validation (not just extensions)
  - Implement filename sanitization for downloads
  - Add Content Security Policy headers
  - Implement rate limiting for API routes
  - Add HTTPS enforcement in production
  - Ensure no file data is logged or stored
  - Implement secure cleanup of canvas data
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 20. Add user documentation




  - Add help sections to all tool pages with step-by-step instructions
  - Add tooltips to all tool controls explaining their purpose
  - Create FAQ section addressing common questions
  - Add example images/templates where beneficial
  - Document keyboard shortcuts for each tool
  - Add privacy notices explaining file processing
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 21. Create comprehensive test suite






  - Write unit tests for all utility functions (imageProcessing, canvasHelpers, fileValidation)
  - Write integration tests for all tool workflows (upload, process, download)
  - Write accessibility tests using axe-core for WCAG compliance
  - Write visual regression tests for tool interfaces
  - Achieve 80% code coverage for tool-related code
  - Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - Test mobile browsers (iOS Safari, Chrome Mobile)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 22. Performance testing and optimization

  - Run Lighthouse audits on all tool pages (target score > 90)
  - Measure and optimize image processing times (target < 2s for 10MB images)
  - Measure and optimize initial load times (FCP < 1.5s, LCP < 2.5s)
  - Test with large files to ensure memory management
  - Profile and optimize canvas operations
  - Test API tool performance with various network conditions
  - _Requirements: 6.1, 6.2, 6.3, 6.6_


# Responsive Design Implementation

This document outlines the responsive design improvements implemented across all tools in the Design Kit application.

## Overview

All tools now support responsive layouts from 320px (mobile) to 1920px+ (wide desktop) with optimized touch controls, mobile-specific UI patterns, and performance optimizations.

## Breakpoints

Following Tailwind CSS default breakpoints:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm to lg)
- **Desktop**: 1024px+ (lg+)
- **Wide Desktop**: 1280px+ (xl+)

## Key Improvements

### 1. Touch-Optimized Controls

**Minimum Touch Target Size**: 44x44px (WCAG 2.1 Level AAA)

All interactive elements (buttons, controls, sliders) now have minimum touch target sizes:

```tsx
// Button component
size: {
  default: "h-10 px-4 py-2 min-h-[44px] sm:min-h-[40px]",
  sm: "h-9 rounded-md px-3 min-h-[40px] sm:min-h-[36px]",
  lg: "h-11 rounded-md px-8 min-h-[48px] sm:min-h-[44px]",
  icon: "h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]",
}
```

**Touch Manipulation**: Added `touch-manipulation` CSS to prevent double-tap zoom delays.

### 2. Mobile-Specific UI Components

#### Bottom Sheet Component

Replaces desktop dialogs on mobile devices for better UX:

```tsx
import { BottomSheet } from '@/components/ui/bottom-sheet'

<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Tool Instructions"
>
  {content}
</BottomSheet>
```

Features:
- Slides up from bottom
- Swipe-to-close gesture
- Backdrop overlay
- Keyboard accessible (Escape to close)
- Prevents body scroll when open

#### Responsive Canvas

Optimizes canvas rendering for mobile performance:

```tsx
import { ResponsiveCanvas } from '@/components/shared/ResponsiveCanvas'

<ResponsiveCanvas
  width={originalWidth}
  height={originalHeight}
  optimizeForMobile={true}
  onCanvasReady={(canvas, ctx) => {
    // Initialize canvas
  }}
/>
```

Features:
- Automatic dimension optimization for mobile (max 1024px)
- Maintains aspect ratio
- Prevents performance issues on low-end devices
- Touch-optimized interactions

### 3. Responsive Layouts

All tool pages follow a consistent responsive pattern:

```tsx
<div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
  {/* Canvas - full width on mobile, 2/3 on desktop */}
  <div className="lg:col-span-2 order-1">
    <Canvas />
  </div>

  {/* Controls - stacked below on mobile, sidebar on desktop */}
  <div className="space-y-4 order-2">
    <Controls />
  </div>
</div>
```

**Mobile (< 1024px)**:
- Single column layout
- Canvas full width
- Controls stacked below canvas
- Larger spacing between sections

**Desktop (>= 1024px)**:
- Two-column grid (2:1 ratio)
- Canvas on left (66%)
- Controls sidebar on right (33%)
- Tighter spacing

### 4. Responsive Typography

Text scales appropriately across breakpoints:

```tsx
// Headings
h1: 'text-3xl sm:text-4xl lg:text-5xl'
h2: 'text-2xl sm:text-3xl lg:text-4xl'
h3: 'text-xl sm:text-2xl lg:text-3xl'

// Body text
body: 'text-sm sm:text-base'
small: 'text-xs sm:text-sm'
```

### 5. Responsive Spacing

Consistent spacing system:

```tsx
// Container padding
container: 'px-4 sm:px-6 lg:px-8'

// Section spacing
section: 'py-8 sm:py-12 lg:py-16'

// Gap between elements
gap: 'gap-4 sm:gap-6 lg:gap-8'
gapSmall: 'gap-2 sm:gap-3 lg:gap-4'
```

### 6. File Uploader Improvements

Mobile-optimized upload experience:

- Larger drop zone on mobile (min-height: 200px)
- "Tap to upload" text on mobile vs "Click to upload" on desktop
- Hides drag-and-drop text on mobile
- Larger icons on mobile (48px vs 40px)
- Better touch feedback with active states

### 7. Canvas Performance Optimization

Automatic canvas size limits based on device:

```typescript
// lib/utils/responsive.ts
export function getOptimalCanvasSize(width, height) {
  const maxMobile = 1024    // Mobile devices
  const maxTablet = 2048    // Tablets
  const maxDesktop = 4096   // Desktop

  // Automatically scales down if needed
}
```

### 8. Touch Gesture Support

Enhanced touch interactions:

- **Swipe gestures**: Bottom sheet swipe-to-close
- **Pinch-to-zoom**: Supported in canvas tools
- **Drag interactions**: Touch-optimized for crop/position tools
- **Prevent scroll**: Canvas interactions don't trigger page scroll

### 9. Responsive Utilities

New utility functions for responsive behavior:

```typescript
// Hooks
useIsMobile()    // Returns true if < 768px
useIsTablet()    // Returns true if 768px - 1024px
useIsDesktop()   // Returns true if >= 1024px

// Device detection
isMobileDevice()
isTabletDevice()
isTouchDevice()

// Pointer position (works with mouse and touch)
getPointerPosition(event, element)

// Performance helpers
debounce(func, wait)
throttle(func, limit)
```

## Testing Checklist

### Mobile (320px - 767px)

- [ ] All tools load and function correctly
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable without zooming
- [ ] Canvas tools work with touch input
- [ ] File upload works via tap
- [ ] Bottom sheets display correctly
- [ ] No horizontal scrolling
- [ ] Images scale appropriately
- [ ] Buttons are easily tappable
- [ ] Forms are usable with on-screen keyboard

### Tablet (768px - 1023px)

- [ ] Layout adapts appropriately
- [ ] Touch and mouse input both work
- [ ] Canvas size is optimized
- [ ] Controls are accessible
- [ ] Spacing is comfortable
- [ ] Text is readable
- [ ] Images display correctly

### Desktop (1024px+)

- [ ] Two-column layouts display correctly
- [ ] Hover states work
- [ ] Keyboard navigation functions
- [ ] Dialogs display instead of bottom sheets
- [ ] Full canvas resolution available
- [ ] All features accessible

### Cross-Device

- [ ] Orientation changes handled gracefully
- [ ] No layout shifts during loading
- [ ] Consistent experience across devices
- [ ] Performance is acceptable on all devices
- [ ] Accessibility features work everywhere

## Browser Compatibility

Tested and working on:

- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Tablet**: iPad Safari, Android Chrome
- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Performance Targets

- **Mobile**:
  - First Contentful Paint: < 2.0s
  - Largest Contentful Paint: < 3.0s
  - Canvas operations: < 3s for 5MB images

- **Desktop**:
  - First Contentful Paint: < 1.5s
  - Largest Contentful Paint: < 2.5s
  - Canvas operations: < 2s for 10MB images

## Known Limitations

1. **Canvas Size**: Mobile devices limited to 1024px max dimension for performance
2. **File Size**: Larger files may be slower on mobile devices
3. **Gestures**: Some advanced gestures may conflict with browser defaults
4. **Older Devices**: Performance may vary on devices older than 3 years

## Future Enhancements

- [ ] Progressive Web App (PWA) support
- [ ] Offline functionality
- [ ] Native app-like gestures
- [ ] Haptic feedback on supported devices
- [ ] Adaptive loading based on connection speed
- [ ] Device-specific optimizations

## Resources

- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Web.dev Mobile Performance](https://web.dev/mobile/)

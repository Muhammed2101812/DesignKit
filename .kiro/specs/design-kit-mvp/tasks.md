# Implementation Plan

- [x] 1. Project Setup and Configuration





  - Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Install and configure shadcn/ui with required components (button, card, input, label, select, slider, toast, dialog, tooltip)
  - Install additional dependencies (zustand, react-hot-toast, framer-motion, date-fns)
  - Create project folder structure following the design document hierarchy
  - Set up environment variables with Zod validation schema
  - Configure TypeScript with strict mode and path aliases
  - Set up ESLint and Prettier for code quality
  - _Requirements: 1.1, 1.2, 1.3, 1.4_




- [x] 2. Database Schema and Supabase Setup









  - Create Supabase project and obtain connection credentials
  - Run SQL migrations to create profiles, subscriptions, tool_usage, and daily_limits tables
  - Enable Row Level Security on all tables
  - Create RLS policies for user data isolation (users can only view/edit their own data)
  - Create database functions (can_use_api_tool, increment_api_usage, get_or_create_daily_limit) with SECURITY DEFINER


  - Create indexes for performance optimization (user_id, date, tool_name)
  - Test RLS policies to ensure proper data isolation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Supabase Client Configuration





  - Create Supabase client utilities for client-side and server-side usage



  - Implement environment variable validation for Supabase credentials


  - Set up Supabase Auth configuration with session management
  - Create TypeScript types from database schema using Supabase CLI
  - Test database connection and basic queries
  - _Requirements: 1.4, 2.1_

- [x] 4. Authentication System Implementation

  - [x] 4.1 Create authentication pages and layouts
    - Create (auth) route group with shared layout
    - Build signup page with email/password form
    - Build login page with email/password form
    - Implement password reset request page
    - Implement password reset confirmation page
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Implement signup flow
    - Create signup form with Zod validation (email format, password strength minimum 8 characters)
    - Implement email verification flow with Supabase Auth
    - Create verification email template
    - Build welcome screen for first-time users
    - Handle signup errors (email exists, weak password, etc.)
    - _Requirements: 3.1, 3.2_
  
  - [x] 4.3 Implement login flow
    - Create login form with email and password fields
    - Implement session creation with 7-day expiration
    - Add "Remember me" functionality
    - Implement account lockout after 5 failed attempts (15 minutes)
    - Handle login errors with user-friendly messages
    - _Requirements: 3.3, 3.4, 3.6_
  
  - [x] 4.4 Implement OAuth authentication
    - Configure Google OAuth provider in Supabase
    - Create OAuth callback handler
    - Implement automatic profile creation for OAuth users
    - Handle OAuth errors and edge cases
    - _Requirements: 3.5_
  
  - [x] 4.5 Implement password reset flow
    - Create password reset request form
    - Send reset email with 1-hour expiration link
    - Build password reset confirmation page
    - Validate new password strength
    - Handle expired or invalid reset tokens
    - _Requirements: 3.7_

- [x] 5. State Management with Zustand





  - Create authStore with user and profile state
  - Implement setUser, setProfile, and logout actions in authStore
  - Create toolStore for tool-specific state (currentTool, history)
  - Create uiStore for global UI state (sidebar, theme, modals)
  - Implement session persistence and restoration on app load
  - Test state updates and subscriptions across components
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 6. User Profile Management





  - Create profile page in (dashboard) route group
  - Display user information (email, full name, avatar, plan, creation date)
  - Implement profile update form with validation
  - Add avatar upload with file type (PNG, JPG, WEBP) and size (2MB) validation
  - Display current usage statistics for free plan users (X/10 operations)
  - Update updated_at timestamp on profile changes
  - Handle profile update errors with toast notifications
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Root Layout and Navigation





  - Create root layout with Header, main content area, and Footer
  - Build Header component with navigation links (Tools, Pricing, Sign Up/Login)
  - Implement conditional navigation (show Dashboard/Profile for authenticated users)
  - Add mobile responsive navigation with hamburger menu
  - Create Footer component with links and copyright
  - Implement theme toggle (light/dark mode)
  - _Requirements: 5.4, 5.5, 9.3_
- [x] 8. Landing Page
  - Create Hero section with value proposition and primary CTA
  - Build Features section highlighting client-side and API tools
  - Create ToolsGrid component showing available tools with icons
  - Build Pricing section with plan comparison
  - Create CTA section for conversion
  - Implement smooth scroll navigation
  - Optimize images and ensure fast loading
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Shared Components - ToolWrapper
  - Create ToolWrapper component with title, description, and icon props
  - Implement back navigation button to tools grid
  - Add optional info modal for tool instructions
  - Include privacy notice footer ("All processing happens in your browser")
  - Make layout responsive for mobile, tablet, and desktop
  - Add proper TypeScript interfaces
  - _Requirements: 14.1, 14.5_

- [x] 10. Shared Components - FileUploader
  - Create FileUploader component with drag-and-drop functionality
  - Implement file type validation based on accept prop
  - Add file size validation with configurable maxSize prop
  - Show visual feedback for drag active state
  - Display selected file with name, size, and clear button
  - Handle validation errors with inline error messages
  - Support both single and multiple file selection
  - _Requirements: 14.2, 14.3, 14.4_

- [x] 11. Color Picker - File Upload and Canvas Setup
  - Create color-picker page in (tools) route group
  - Integrate ToolWrapper with "Color Picker" title and description
  - Add FileUploader component accepting PNG, JPG, WEBP formats
  - Implement file size validation (max 10MB)
  - Create ColorCanvas component with HTML5 canvas element
  - Load uploaded image onto canvas with proper scaling (max 800px width, maintain aspect ratio)
  - Set canvas context with willReadFrequently option for optimized pixel reading
  - Display loading spinner while image loads
  - _Requirements: 6.1, 6.2, 6.7, 11.1_

- [x] 12. Color Picker - Color Extraction Logic




  - Implement click event handler on canvas to capture coordinates
  - Extract pixel color data using getImageData at click position
  - Convert RGB values to HEX format
  - Implement RGB to HSL conversion algorithm
  - Create Color interface with hex, rgb, hsl, and timestamp properties
  - Display extracted color within 100ms of click
  - Handle edge cases (clicks outside image bounds)
  - _Requirements: 6.3, 6.4, 11.2_
-

- [x] 13. Color Picker - ColorDisplay Component
  - Create ColorDisplay component to show current color
  - Display color preview swatch with extracted color
  - Show HEX value with copy button
  - Show RGB value in "rgb(r, g, b)" format with copy button
  - Show HSL value in "hsl(h, s%, l%)" format with copy button
  - Implement clipboard copy functionality for each format
  - Show success toast notification on copy
  - Display visual feedback (checkmark) for 2 seconds after copy
  - Show empty state when no color is selected
  - _Requirements: 7.1, 7.2, 7.3, 10.5_

- [x] 14. Color Picker - ColorHistory Component
  - Create ColorHistory component to display picked colors
  - Maintain array of last 10 picked colors
  - Add new colors to history on each pick
  - Display colors in grid layout with color swatches
  - Implement click handler to re-select color from history
  - Create "Export Palette" button to download JSON file
  - Implement "Clear History" button with confirmation dialog
  - Disable export button when history is empty
  - Store history in sessionStorage (cleared on tab close)
  - _Requirements: 6.5, 7.4, 7.5, 7.6_
- [x] 15. Color Picker - Canvas Controls
  - Add zoom in button to increase scale by 0.25x (max 3x)
  - Add zoom out button to decrease scale by 0.25x (min 0.5x)
  - Add reset zoom button to restore 1x scale
  - Implement "Reset Image" button to clear canvas and return to upload state
  - Maintain crosshair cursor during zoom
  - Update canvas transform for zoom while preserving image quality
  - Add keyboard shortcuts for zoom controls (+, -, 0 keys)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 16. Color Picker - Mobile Responsiveness
  - Implement responsive layout for viewport < 768px (stack canvas and display vertically)
  - Add touch event handlers for mobile tap-to-pick
  - Enable pinch-to-zoom on canvas for touch devices
  - Ensure all buttons are touch-friendly (min 44px tap target)
  - Test on various mobile devices and screen sizes
  - Optimize canvas rendering for mobile performance
  - _Requirements: 9.1, 9.2, 9.4, 9.5_


- [x] 17. Error Handling and User Feedback








  - Create custom error classes (ValidationError, FileValidationError, etc.)
  - Implement error toast notifications for file upload failures
  - Show loading spinner during image processing
  - Add browser compatibility check for HTML5 canvas
  - Implement fallback for clipboard API failures (show modal with value)
  - Handle network errors with retry option
  - Display user-friendly error me
ssages for all error scenarios
- [x] 18. Performance Optimization
  - Implement code splitting for ColorCanvas component using dynamic imports
  - Add loading states for lazy-loaded components
  - Optimize image rendering with canvas downsampling for large images
  - Use React.memo for ColorDisplay and ColorHistory to prevent unnecessary re-renders
  - Implement debouncing for rapid color picks
  - Measure and optimize First Contentful Paint (target < 1.5s)
  - Ensure color extraction responds within 100ms
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 19. Accessibility Implementation
  - Add keyboard navigation support for all interactive elements
  - Implement focus indicators with visible outline
  - Add ARIA labels to buttons and interactive elements
  - Announce color values to screen readers when extracted
  - Enable file upload via keyboard (Enter/Space on upload area)
  - Ensure color contrast meets WCAG AA standards (4.5:1 minimum)
  - Test with screen reader (NVDA or VoiceOver)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 20. Security and Privacy Implementation
  - Ensure all image processing happens client-side (no server upload)
  - Use sessionStorage for color history (cleared on tab close)
  - Implement Content Security Policy headers in middleware
  - Clear all session data on logout
  - Validate all user inputs with Zod schemas
  - Add CSRF protection for state-changing operations
  - Test that no image data persists after page close
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [-] 21. Testing and Quality Assurance


  - [x]* 21.1 Write unit tests for utility functions
    - Test RGB to HSL conversion with various color values
    - Test HEX to RGB conversion
    - Test file validation logic
    - Test color format conversions
    - Test sessionStorage utilities
    - _Requirements: 6.4, 6.6_
  
  - [x] 21.2 Write component tests






    - Test ColorDisplay rendering and copy functionality
    - Test ColorHistory add, select, export, and clear operations
    - Test FileUploader drag-and-drop and validation
    - Test ToolWrapper rendering and navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 14.1, 14.2_
  
  - [ ]* 21.3 Write integration tests
    - Test complete Color Picker workflow (upload → pick → copy → export)
    - Test authentication flows (signup → verify → login → logout)
    - Test navigation between pages
    - Test error scenarios and recovery
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 21.4 Perform manual testing



    - Test on Chrome, Firefox, Safari, and Edge browsers
    - Test on mobile devices (iOS and Android)
    - Test keyboard navigation throughout the app
    - Test with screen reader for accessibility
    - Verify all error states display correctly
    - Check responsive design at various breakpoints
    - _Requirements: 9.1, 9.2, 9.3, 12.1, 12.2, 12.3_
-

- [x] 22. Deployment Preparation




  - Configure Cloudflare Pages project
  - Set up environment variables in Cloudflare dashboard
  - Configure build settings (Next.js, npm run build, .next output)
  - Set up custom domain (if available)
  - Configure SSL certificate
  - Test production build locally (npm run build && npm run start)
  - Verify all environment variables are set correctly
  - _Requirements: 1.5_

- [x] 23. Monitoring and Analytics Setup






  - [ ]* 23.1 Set up Sentry for error tracking
    - Create Sentry project and obtain DSN
    - Install and configure @sentry/nextjs
    - Test error reporting in development
    - Configure error filtering to exclude sensitive data
    - _Requirements: 10.1, 10.4_
  
  - [ ]* 23.2 Set up Plausible Analytics
    - Add Plausible script to root layout
    - Configure custom events (Tool Used, Signup, etc.)
    - Test event tracking in development
    - Verify analytics dashboard shows data
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 24. Documentation and Polish




  - [x]* 24.1 Create README with setup instructions
    - Document prerequisites (Node.js, npm, Supabase account)
    - Provide step-by-step installation guide
    - List all environment variables with descriptions
    - Include development and deployment commands
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x]* 24.2 Add inline code documentation
    - Document complex algorithms (RGB to HSL conversion)
    - Add JSDoc comments to utility functions
    - Document component props and interfaces
    - Add comments for non-obvious logic
    - _Requirements: 6.4, 11.3_
  
  - [x] 24.3 Final UI polish


    - Review and refine all animations and transitions
    - Ensure consistent spacing and typography
    - Verify color scheme and theme consistency
    - Test dark mode appearance
    - Add loading skeletons where appropriate
    - _Requirements: 5.1, 5.2, 9.1, 9.2_

- [x] 25. Production Deployment





  - Run final production build and verify no errors
  - Deploy to Cloudflare Pages
  - Verify deployment is live and accessible
  - Test all functionality in production environment
  - Monitor error logs and analytics for first 24 hours
  - Create backup of database schema and data
  - _Requirements: 1.5, 22.1, 22.2_

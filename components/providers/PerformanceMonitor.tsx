'use client'

import { useEffect } from 'react'
import { initPerformanceMonitoring } from '@/lib/utils/performance'

/**
 * Performance monitoring component
 * Initializes Core Web Vitals tracking in development mode
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      initPerformanceMonitoring()
    }
  }, [])

  // This component doesn't render anything
  return null
}

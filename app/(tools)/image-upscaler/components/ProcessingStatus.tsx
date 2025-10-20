'use client'

import * as React from 'react'
import { Loader2, Sparkles, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

export interface ProcessingStatusProps {
  /**
   * Whether processing is currently active
   */
  isProcessing: boolean
  
  /**
   * Progress percentage (0-100)
   */
  progress: number
  
  /**
   * Status message to display
   */
  message: string
  
  /**
   * Estimated time remaining in seconds (optional)
   */
  estimatedTimeRemaining?: number
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ProcessingStatus displays a progress indicator with status message
 * for async image upscaling operations
 */
export function ProcessingStatus({
  isProcessing,
  progress,
  message,
  estimatedTimeRemaining,
  className,
}: ProcessingStatusProps) {
  if (!isProcessing) {
    return null
  }
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }
  
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 space-y-4',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Processing: ${message}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
          <Loader2
            className="h-6 w-6 text-primary animate-spin absolute inset-0"
            aria-hidden="true"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Upscaling Image</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={progress}
          className="h-2"
          aria-label={`${Math.round(progress)}% complete`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}% complete</span>
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTime(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
      </div>
      
      {/* Info Message */}
      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          AI-powered upscaling is processing your image. This may take 30-60 seconds depending on image size and scale factor.
        </p>
      </div>
    </div>
  )
}

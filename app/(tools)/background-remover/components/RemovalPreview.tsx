'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Eraser, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface RemovalPreviewProps {
  /**
   * Source image data URL
   */
  imageSrc: string
  
  /**
   * Whether background removal is in progress
   */
  isProcessing: boolean
  
  /**
   * Whether the user can process (has quota and is authenticated)
   */
  canProcess?: boolean
  
  /**
   * Callback when remove background button is clicked
   */
  onRemoveBackground: () => void
  
  /**
   * Callback when reset button is clicked
   */
  onImageReset: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * RemovalPreview displays the original image with controls to remove background
 */
export function RemovalPreview({
  imageSrc,
  isProcessing,
  canProcess = true,
  onRemoveBackground,
  onImageReset,
  className,
}: RemovalPreviewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Image Preview */}
      <Card className="relative overflow-hidden">
        <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Original image"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
          
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Removing Background...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRemoveBackground}
          disabled={!canProcess || isProcessing}
          className="flex-1 gap-2"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Eraser className="h-5 w-5" />
              Remove Background
            </>
          )}
        </Button>
        
        <Button
          onClick={onImageReset}
          disabled={isProcessing}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Reset
        </Button>
      </div>

      {/* Info Message */}
      {!canProcess && !isProcessing && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have reached your daily quota limit. Please upgrade your plan or try again tomorrow.
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Privacy:</strong> Your image is processed securely and deleted immediately after processing. 
          We do not store any images on our servers.
        </p>
      </div>
    </div>
  )
}

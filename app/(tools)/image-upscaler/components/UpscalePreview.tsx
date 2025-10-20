'use client'

import * as React from 'react'
import { Download, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DownloadButton } from '@/components/shared/DownloadButton'
import { cn } from '@/lib/utils/cn'

export interface UpscalePreviewProps {
  /**
   * Original image source (data URL or blob URL)
   */
  originalImage: string
  
  /**
   * Upscaled image source (data URL or blob URL)
   */
  upscaledImage: string | null
  
  /**
   * Scale factor used
   */
  scaleFactor: 2 | 4 | 8
  
  /**
   * Original image dimensions
   */
  originalDimensions: { width: number; height: number }
  
  /**
   * Callback to reset and upload new image
   */
  onReset: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * UpscalePreview displays the upscaled image result with download option
 */
export function UpscalePreview({
  originalImage,
  upscaledImage,
  scaleFactor,
  originalDimensions,
  onReset,
  className,
}: UpscalePreviewProps) {
  const [downloadBlob, setDownloadBlob] = React.useState<Blob | null>(null)
  const [isLoadingBlob, setIsLoadingBlob] = React.useState(false)
  
  // Convert upscaled image URL to Blob for download
  React.useEffect(() => {
    if (!upscaledImage) {
      setDownloadBlob(null)
      return
    }
    
    const fetchBlob = async () => {
      try {
        setIsLoadingBlob(true)
        const response = await fetch(upscaledImage)
        const blob = await response.blob()
        setDownloadBlob(blob)
      } catch (error) {
        console.error('Error converting image to blob:', error)
      } finally {
        setIsLoadingBlob(false)
      }
    }
    
    fetchBlob()
  }, [upscaledImage])
  
  const upscaledDimensions = {
    width: originalDimensions.width * scaleFactor,
    height: originalDimensions.height * scaleFactor,
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Result Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Upscaled Result</h3>
        </div>
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Upload new image"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Image
        </Button>
      </div>
      
      {/* Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Original</div>
          <div className="relative rounded-lg border bg-muted/50 overflow-hidden aspect-square">
            <img
              src={originalImage}
              alt="Original image"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {originalDimensions.width} × {originalDimensions.height} px
          </div>
        </div>
        
        {/* Upscaled Image */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-primary">Upscaled ({scaleFactor}x)</div>
          <div className="relative rounded-lg border border-primary/50 bg-muted/50 overflow-hidden aspect-square">
            {upscaledImage ? (
              <img
                src={upscaledImage}
                alt="Upscaled image"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {upscaledDimensions.width} × {upscaledDimensions.height} px
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{scaleFactor}x</div>
            <div className="text-xs text-muted-foreground">Scale Factor</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{scaleFactor * scaleFactor}x</div>
            <div className="text-xs text-muted-foreground">Pixel Count</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{upscaledDimensions.width}</div>
            <div className="text-xs text-muted-foreground">Width (px)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{upscaledDimensions.height}</div>
            <div className="text-xs text-muted-foreground">Height (px)</div>
          </div>
        </div>
      </div>
      
      {/* Download Button */}
      {upscaledImage && downloadBlob && (
        <DownloadButton
          fileName={`upscaled-${scaleFactor}x.png`}
          fileData={downloadBlob}
          fileType="image/png"
          disabled={isLoadingBlob}
          className="w-full"
          size="lg"
        />
      )}
    </div>
  )
}

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Download, RotateCcw } from 'lucide-react'
import { ComparisonSlider as SharedComparisonSlider } from '@/components/shared/ComparisonSlider'
import { toast } from '@/lib/hooks/use-toast'

export interface ComparisonSliderProps {
  /**
   * URL or data URL of the original image
   */
  beforeImage: string
  
  /**
   * URL or data URL of the processed image (background removed)
   */
  afterImage: string
  
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
 * ComparisonSlider for Background Remover with download functionality
 */
export function ComparisonSlider({
  beforeImage,
  afterImage,
  onImageReset,
  className,
}: ComparisonSliderProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Fetch the blob from the object URL
      const response = await fetch(afterImage)
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `background-removed-${Date.now()}.png`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Image downloaded successfully!',
      })
    } catch (error) {
      console.error('Error downloading image:', error)
      toast({
        title: 'Error',
        description: 'Failed to download image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Comparison Slider */}
        <SharedComparisonSlider
          beforeImage={beforeImage}
          afterImage={afterImage}
          beforeLabel="Original"
          afterLabel="Background Removed"
          beforeAlt="Original image with background"
          afterAlt="Image with background removed"
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 gap-2"
            size="lg"
          >
            <Download className="h-5 w-5" />
            {isDownloading ? 'Downloading...' : 'Download PNG'}
          </Button>
          
          <Button
            onClick={onImageReset}
            disabled={isDownloading}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Process Another
          </Button>
        </div>

        {/* Info Message */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Use the slider to compare the original and processed images. 
            The downloaded image will be in PNG format with a transparent background.
          </p>
        </div>
      </div>
    </div>
  )
}

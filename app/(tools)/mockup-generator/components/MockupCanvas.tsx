'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import type { MockupTemplate, DesignTransform } from '../page'

interface MockupCanvasProps {
  designImage: string
  template: MockupTemplate
  transform: DesignTransform
  onGenerate: (mockupDataUrl: string) => void
}

export function MockupCanvas({
  designImage,
  template,
  transform,
  onGenerate,
}: MockupCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // Update preview when transform changes
  React.useEffect(() => {
    updatePreview()
  }, [designImage, template, transform])

  const updatePreview = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Load template image
      const templateImg = await loadImage(template.templateImage)
      
      // Set canvas size to template size
      canvas.width = templateImg.width
      canvas.height = templateImg.height

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw template background
      ctx.drawImage(templateImg, 0, 0)

      // Load design image
      const designImg = await loadImage(designImage)

      // Calculate design placement
      const designArea = template.designArea
      const centerX = designArea.x + designArea.width / 2
      const centerY = designArea.y + designArea.height / 2

      // Save context state
      ctx.save()

      // Apply transformations
      ctx.translate(centerX + transform.x, centerY + transform.y)
      ctx.rotate((transform.rotation * Math.PI) / 180)
      ctx.scale(transform.scale, transform.scale)

      // Draw design image centered
      const drawWidth = designArea.width
      const drawHeight = (designImg.height / designImg.width) * drawWidth

      if (template.perspective) {
        // Apply perspective transformation
        drawWithPerspective(ctx, designImg, template.perspective, drawWidth, drawHeight)
      } else {
        // Simple centered draw
        ctx.drawImage(
          designImg,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        )
      }

      // Restore context state
      ctx.restore()

      // Update preview
      const dataUrl = canvas.toDataURL('image/png')
      setPreviewUrl(dataUrl)
    } catch (error) {
      console.error('Error updating preview:', error)
    }
  }

  const handleGenerate = async () => {
    if (!canvasRef.current) return

    setIsGenerating(true)

    try {
      // Generate high-resolution version
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Load template at full resolution
      const templateImg = await loadImage(template.templateImage)
      
      // Set canvas to high resolution (2x for retina displays)
      const scale = 2
      canvas.width = templateImg.width * scale
      canvas.height = templateImg.height * scale
      ctx.scale(scale, scale)

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw template
      ctx.drawImage(templateImg, 0, 0, templateImg.width, templateImg.height)

      // Load and draw design
      const designImg = await loadImage(designImage)
      const designArea = template.designArea
      const centerX = designArea.x + designArea.width / 2
      const centerY = designArea.y + designArea.height / 2

      ctx.save()
      ctx.translate(centerX + transform.x, centerY + transform.y)
      ctx.rotate((transform.rotation * Math.PI) / 180)
      ctx.scale(transform.scale, transform.scale)

      const drawWidth = designArea.width
      const drawHeight = (designImg.height / designImg.width) * drawWidth

      if (template.perspective) {
        drawWithPerspective(ctx, designImg, template.perspective, drawWidth, drawHeight)
      } else {
        ctx.drawImage(
          designImg,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        )
      }

      ctx.restore()

      // Get high-res data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      // Reset canvas to preview size
      await updatePreview()

      // Call onGenerate with the high-res image
      onGenerate(dataUrl)
    } catch (error) {
      console.error('Error generating mockup:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Canvas Preview */}
      <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Generating high-resolution mockup...</p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="lg"
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate Mockup
          </>
        )}
      </Button>
    </div>
  )
}

// Helper function to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Helper function to draw with perspective transformation
function drawWithPerspective(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  perspective: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  },
  width: number,
  height: number
) {
  // For simplicity, we'll use a basic perspective approximation
  // In a production app, you'd use a proper perspective transform library
  
  // Create a temporary canvas for the design
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  // Draw design to temp canvas
  tempCtx.drawImage(img, 0, 0, width, height)

  // Apply basic skew transformation
  // This is a simplified version - for production, use a proper perspective transform
  ctx.save()
  
  // Calculate skew based on perspective points
  const skewX = (perspective.topRight.x - perspective.topLeft.x) / width
  const skewY = (perspective.bottomLeft.y - perspective.topLeft.y) / height
  
  ctx.transform(skewX, 0, 0, skewY, -width / 2, -height / 2)
  ctx.drawImage(tempCanvas, 0, 0, width, height)
  
  ctx.restore()
}

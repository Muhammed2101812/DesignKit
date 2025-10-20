'use client'

import * as React from 'react'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { UsageIndicator } from '@/components/shared/UsageIndicator'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'
import { useAuthStore } from '@/store/authStore'
import { ScaleFactorSelector } from './components/ScaleFactorSelector'
import { ProcessingStatus } from './components/ProcessingStatus'
import { UpscalePreview } from './components/UpscalePreview'

interface QuotaInfo {
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
  plan: string
}

export default function ImageUpscalerPage() {
  const { user } = useAuthStore()
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [originalDimensions, setOriginalDimensions] = React.useState<{ width: number; height: number } | null>(null)
  const [scaleFactor, setScaleFactor] = React.useState<2 | 4 | 8>(4)
  const [upscaledImage, setUpscaledImage] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [statusMessage, setStatusMessage] = React.useState('')
  const [quotaInfo, setQuotaInfo] = React.useState<QuotaInfo | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = React.useState(true)

  // Fetch quota information on mount and when user changes
  React.useEffect(() => {
    if (user) {
      fetchQuotaInfo()
    } else {
      setIsLoadingQuota(false)
    }
  }, [user])

  const fetchQuotaInfo = async () => {
    try {
      setIsLoadingQuota(true)
      const response = await fetch('/api/tools/check-quota')
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota information')
      }
      
      const data = await response.json()
      setQuotaInfo(data)
    } catch (error) {
      console.error('Error fetching quota:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quota information. Please refresh the page.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingQuota(false)
    }
  }

  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file

    if (!selectedFile) return

    try {
      validateFileUpload(selectedFile)
      ensureFileReaderSupport()

      const reader = new FileReader()

      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImageSrc(result)
          setOriginalFile(selectedFile)
          setUpscaledImage(null)
          
          // Get image dimensions
          const img = new Image()
          img.onload = () => {
            setOriginalDimensions({ width: img.width, height: img.height })
          }
          img.src = result
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'ImageUpscaler.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'ImageUpscaler.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'ImageUpscaler.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setOriginalDimensions(null)
    setUpscaledImage(null)
    setProgress(0)
    setStatusMessage('')
  }, [])

  const handleUpscale = async () => {
    if (!originalFile || !user) return

    // Check quota before processing
    if (!quotaInfo?.canUse) {
      toast({
        title: 'Quota Exceeded',
        description: 'You have reached your daily quota limit. Please upgrade your plan or try again tomorrow.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Preparing image...')
    setUpscaledImage(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', originalFile)
      formData.append('scale', scaleFactor.toString())

      // Call API to upscale image
      const response = await fetch('/api/tools/image-upscaler', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upscale image')
      }

      // Parse response
      const data = await response.json()
      
      if (!data.imageUrl) {
        throw new Error('No image URL received from server')
      }

      // Set the upscaled image
      setUpscaledImage(data.imageUrl)
      setProgress(100)
      setStatusMessage('Complete!')

      // Refresh quota information
      await fetchQuotaInfo()

      toast({
        title: 'Success',
        description: 'Image upscaled successfully!',
      })
    } catch (error) {
      console.error('Error upscaling image:', error)
      handleErrorWithToast(error, toast, 'ImageUpscaler.handleUpscale')
    } finally {
      setIsProcessing(false)
    }
  }

  const canProcess = Boolean(user && quotaInfo?.canUse && !isProcessing && imageSrc)

  return (
    <ToolWrapper
      title="Image Upscaler"
      description="Enhance image resolution with AI-powered upscaling"
      icon={<Sparkles className="h-6 w-6" />}
      isClientSide={false}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Sign in to your account</li>
              <li>Upload an image (PNG, JPG, or WEBP format, max 10MB recommended)</li>
              <li>Select upscale factor (2x, 4x, or 8x)</li>
              <li>Click &quot;Upscale Image&quot; to process</li>
              <li>Wait for AI processing (30-60 seconds)</li>
              <li>Download the enhanced high-resolution result</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>AI-powered super-resolution</li>
              <li>2x, 4x, or 8x upscaling</li>
              <li>Preserves image quality and details</li>
              <li>Real-time progress tracking</li>
              <li>High-resolution PNG output</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Quota Usage:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Free:</strong> 10 operations per day</li>
              <li><strong>Premium:</strong> 500 operations per day</li>
              <li><strong>Pro:</strong> 2000 operations per day</li>
              <li>Quota resets daily at midnight UTC</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Start with 4x for best balance of quality and speed</li>
              <li>Use 2x for faster processing of large images</li>
              <li>Use 8x for maximum quality on small images</li>
              <li>Smaller source images process faster</li>
              <li>Processing takes 30-60 seconds depending on size</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quota Indicator */}
        {user && !isLoadingQuota && quotaInfo && (
          <UsageIndicator
            currentUsage={quotaInfo.currentUsage}
            dailyLimit={quotaInfo.dailyLimit}
            planName={quotaInfo.plan as 'free' | 'premium' | 'pro'}
          />
        )}

        {/* Authentication Required Message */}
        {!user && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please sign in to use the Image Upscaler tool. This is an API-powered tool that requires authentication.
            </p>
          </div>
        )}

        {/* File Upload Section */}
        {!imageSrc && user && (
          <FileUploader
            onFileSelect={handleFileSelect}
            accept="image/png,image/jpeg,image/webp"
            maxSize={10}
            description="Select a PNG, JPG, or WEBP image to upscale (max 10MB recommended)"
            multiple={false}
          />
        )}

        {/* Configuration and Processing */}
        {imageSrc && originalFile && user && !upscaledImage && (
          <div className="space-y-6">
            {/* Original Image Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Original Image</h3>
              <div className="relative rounded-lg border bg-muted/50 overflow-hidden max-h-96">
                <img
                  src={imageSrc}
                  alt="Original image to upscale"
                  className="w-full h-full object-contain"
                />
              </div>
              {originalDimensions && (
                <p className="text-xs text-muted-foreground text-center">
                  {originalDimensions.width} × {originalDimensions.height} px
                </p>
              )}
            </div>

            {/* Scale Factor Selector */}
            <ScaleFactorSelector
              value={scaleFactor}
              onChange={setScaleFactor}
              disabled={isProcessing}
            />

            {/* Processing Status */}
            {isProcessing && (
              <ProcessingStatus
                isProcessing={isProcessing}
                progress={progress}
                message={statusMessage}
              />
            )}

            {/* Action Buttons */}
            {!isProcessing && (
              <div className="flex gap-3">
                <Button
                  onClick={handleUpscale}
                  disabled={!canProcess}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Upscale Image
                </Button>
                <Button
                  onClick={handleImageReset}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Result Preview */}
        {upscaledImage && originalDimensions && (
          <UpscalePreview
            originalImage={imageSrc!}
            upscaledImage={upscaledImage}
            scaleFactor={scaleFactor}
            originalDimensions={originalDimensions}
            onReset={handleImageReset}
          />
        )}
      </div>
    </ToolWrapper>
  )
}

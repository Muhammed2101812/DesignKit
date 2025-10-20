'use client'

import * as React from 'react'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { UsageIndicator } from '@/components/shared/UsageIndicator'
import { Eraser, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'
import { useAuthStore } from '@/store/authStore'
import { RemovalPreview } from './components/RemovalPreview'
import { ComparisonSlider } from '@/app/(tools)/background-remover/components/ComparisonSlider'

interface QuotaInfo {
  canUse: boolean
  currentUsage: number
  dailyLimit: number
  remaining: number
  plan: string
}

export default function BackgroundRemoverPage() {
  const { user } = useAuthStore()
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [originalFile, setOriginalFile] = React.useState<File | null>(null)
  const [processedImage, setProcessedImage] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
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
          setProcessedImage(null)
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'BackgroundRemover.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'BackgroundRemover.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'BackgroundRemover.handleFileSelect')
    }
  }

  const handleImageReset = React.useCallback(() => {
    setImageSrc(null)
    setOriginalFile(null)
    setProcessedImage(null)
  }, [])

  const handleRemoveBackground = async () => {
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

    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', originalFile)

      // Call API to remove background
      const response = await fetch('/api/tools/background-remover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove background')
      }

      // Get the processed image blob
      const blob = await response.blob()
      const processedUrl = URL.createObjectURL(blob)
      setProcessedImage(processedUrl)

      // Refresh quota information
      await fetchQuotaInfo()

      toast({
        title: 'Success',
        description: 'Background removed successfully!',
      })
    } catch (error) {
      console.error('Error removing background:', error)
      handleErrorWithToast(error, toast, 'BackgroundRemover.handleRemoveBackground')
    } finally {
      setIsProcessing(false)
    }
  }

  const canProcess = Boolean(user && quotaInfo?.canUse && !isProcessing)

  return (
    <ToolWrapper
      title="Background Remover"
      description="Remove image backgrounds with AI-powered precision"
      icon={<Eraser className="h-6 w-6" />}
      isClientSide={false}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Sign in to your account</li>
              <li>Upload an image (PNG, JPG, or WEBP format, max 12MB)</li>
              <li>Click &quot;Remove Background&quot; to process</li>
              <li>Compare before and after with the slider</li>
              <li>Download the transparent PNG result</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>AI-powered background removal</li>
              <li>High-quality edge detection</li>
              <li>Transparent PNG output</li>
              <li>Before/after comparison slider</li>
              <li>Works with people, products, and objects</li>
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
              <li>Use high-contrast images for best results</li>
              <li>Ensure the subject is clearly visible</li>
              <li>Works best with single subjects</li>
              <li>Download as PNG to preserve transparency</li>
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
              Please sign in to use the Background Remover tool. This is an API-powered tool that requires authentication.
            </p>
          </div>
        )}

        {/* File Upload Section */}
        {!imageSrc && user && (
          <FileUploader
            onFileSelect={handleFileSelect}
            accept="image/png,image/jpeg,image/webp"
            maxSize={12}
            description="Select a PNG, JPG, or WEBP image to remove background"
            multiple={false}
          />
        )}

        {/* Processing Interface */}
        {imageSrc && originalFile && user && (
          <div className="space-y-4">
            {!processedImage ? (
              <RemovalPreview
                imageSrc={imageSrc}
                isProcessing={isProcessing}
                canProcess={canProcess}
                onRemoveBackground={handleRemoveBackground}
                onImageReset={handleImageReset}
              />
            ) : (
              <ComparisonSlider
                beforeImage={imageSrc}
                afterImage={processedImage}
                onImageReset={handleImageReset}
              />
            )}
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}

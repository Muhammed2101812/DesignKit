'use client'

import * as React from 'react'
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { FileUploader } from '@/components/shared/FileUploader'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'
import { ensureFileReaderSupport } from '@/lib/utils/browserCompat'
import { ImageProcessingError } from '@/types/errors'
import { handleErrorWithToast } from '@/lib/utils/errorHandling'
import { validateFileUpload } from '@/lib/utils/validation'
import { TemplateSelector } from './components/TemplateSelector'
import { DesignPositioner } from './components/DesignPositioner'
import { MockupCanvas } from './components/MockupCanvas'
import { downloadBlob } from '@/lib/utils/fileDownload'

export interface MockupTemplate {
  id: string
  name: string
  category: 'device' | 'print' | 'apparel'
  templateImage: string
  designArea: { x: number; y: number; width: number; height: number }
  perspective?: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  }
}

export interface DesignTransform {
  x: number
  y: number
  scale: number
  rotation: number
}

export default function MockupGeneratorPage() {
  const [designImage, setDesignImage] = React.useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = React.useState<MockupTemplate | null>(null)
  const [designTransform, setDesignTransform] = React.useState<DesignTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })
  const [generatedMockup, setGeneratedMockup] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

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
          setDesignImage(result)
          setGeneratedMockup(null)
        } else {
          const error = new ImageProcessingError('Invalid image data')
          handleErrorWithToast(error, toast, 'MockupGenerator.handleFileSelect')
        }
      }

      reader.onerror = () => {
        const error = new ImageProcessingError('Failed to read image file. Please try again.')
        handleErrorWithToast(error, toast, 'MockupGenerator.FileReader')
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      handleErrorWithToast(error, toast, 'MockupGenerator.handleFileSelect')
    }
  }

  const handleReset = React.useCallback(() => {
    setDesignImage(null)
    setSelectedTemplate(null)
    setDesignTransform({ x: 0, y: 0, scale: 1, rotation: 0 })
    setGeneratedMockup(null)
  }, [])

  const handleGenerateMockup = async (mockupDataUrl: string) => {
    setIsGenerating(true)
    try {
      setGeneratedMockup(mockupDataUrl)
      
      toast({
        title: 'Success',
        description: 'Mockup generated successfully!',
      })
    } catch (error) {
      handleErrorWithToast(error, toast, 'MockupGenerator.handleGenerateMockup')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedMockup) return

    try {
      // Convert data URL to blob
      fetch(generatedMockup)
        .then(res => res.blob())
        .then(blob => {
          const fileName = `mockup-${selectedTemplate?.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
          downloadBlob(blob, fileName)
          
          toast({
            title: 'Downloaded',
            description: 'Mockup saved successfully!',
          })
        })
        .catch(error => {
          handleErrorWithToast(error, toast, 'MockupGenerator.handleDownload')
        })
    } catch (error) {
      handleErrorWithToast(error, toast, 'MockupGenerator.handleDownload')
    }
  }

  const canGenerate = Boolean(designImage && selectedTemplate)

  return (
    <ToolWrapper
      title="Mockup Generator"
      description="Place your designs in realistic mockup templates"
      icon={<Layers className="h-6 w-6" />}
      isClientSide={true}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload your design image (logo, screenshot, artwork)</li>
              <li>Select a mockup template from the available categories</li>
              <li>Adjust the design position, scale, and rotation</li>
              <li>Click &quot;Generate Mockup&quot; to create the composite</li>
              <li>Download the high-resolution PNG result</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Device mockups (phones, tablets, laptops)</li>
              <li>Print materials (business cards, posters)</li>
              <li>Apparel mockups (t-shirts, hoodies)</li>
              <li>Drag, scale, and rotate controls</li>
              <li>Perspective transformation for realism</li>
              <li>High-resolution PNG export</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use transparent PNG designs for best results</li>
              <li>Adjust scale to fit your design in the template area</li>
              <li>Use rotation for dynamic compositions</li>
              <li>Preview before downloading to ensure proper placement</li>
              <li>Higher resolution designs produce better quality mockups</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step 1: Upload Design */}
        {!designImage && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Step 1: Upload Your Design</h3>
            <FileUploader
              onFileSelect={handleFileSelect}
              accept="image/png,image/jpeg,image/webp"
              maxSize={10}
              description="Select your design image (PNG, JPG, or WEBP, max 10MB)"
              multiple={false}
            />
          </div>
        )}

        {/* Step 2: Select Template */}
        {designImage && !selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Step 2: Select a Mockup Template</h3>
              <Button onClick={handleReset} variant="outline" size="sm">
                Change Design
              </Button>
            </div>
            <TemplateSelector
              onSelectTemplate={setSelectedTemplate}
            />
          </div>
        )}

        {/* Step 3: Position Design & Generate */}
        {designImage && selectedTemplate && !generatedMockup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Step 3: Position Your Design</h3>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedTemplate(null)} variant="outline" size="sm">
                  Change Template
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm">
                  Start Over
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Canvas Preview */}
              <div className="space-y-2">
                <MockupCanvas
                  designImage={designImage}
                  template={selectedTemplate}
                  transform={designTransform}
                  onGenerate={handleGenerateMockup}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <DesignPositioner
                  transform={designTransform}
                  onChange={setDesignTransform}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Download Result */}
        {generatedMockup && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Mockup is Ready!</h3>
              <Button onClick={handleReset} variant="outline" size="sm">
                Create Another
              </Button>
            </div>

            <div className="space-y-4">
              {/* Result Preview */}
              <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
                <img
                  src={generatedMockup}
                  alt="Generated mockup"
                  className="w-full h-auto"
                />
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full gap-2"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                Download Mockup
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}

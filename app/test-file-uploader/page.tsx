'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/shared/FileUploader'
import { toast } from '@/lib/hooks/use-toast'
import { Card } from '@/components/ui/card'

export default function TestFileUploaderPage() {
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [multipleFiles, setMultipleFiles] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSingleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    setSingleFile(selectedFile)
    
    toast({
      title: 'File uploaded',
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`,
    })
  }

  const handleMultipleFileSelect = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files]
    setMultipleFiles(fileArray)
    
    toast({
      title: 'Files uploaded',
      description: `${fileArray.length} file(s) selected`,
    })
  }

  const handleImageWithPreview = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
    
    toast({
      title: 'Image loaded',
      description: 'Preview generated successfully',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">FileUploader Component Test</h1>
      <p className="text-muted-foreground mb-8">
        Testing the FileUploader component with various configurations
      </p>

      <div className="space-y-8">
        {/* Example 1: Basic Image Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">1. Basic Image Upload (Single File)</h2>
          <FileUploader
            onFileSelect={handleSingleFileSelect}
            accept="image/png,image/jpeg,image/webp"
            maxSize={10}
            description="Upload an image to get started"
          />
          {singleFile && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Selected:</strong> {singleFile.name}
              </p>
            </div>
          )}
        </Card>

        {/* Example 2: Multiple Files */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">2. Multiple Files Upload</h2>
          <FileUploader
            onFileSelect={handleMultipleFileSelect}
            accept="image/*"
            maxSize={5}
            multiple
            description="Select multiple images"
          />
          {multipleFiles.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Selected Files:</p>
              <ul className="list-disc list-inside text-sm">
                {multipleFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Example 3: With Image Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">3. Image Upload with Preview</h2>
          <FileUploader
            onFileSelect={handleImageWithPreview}
            accept="image/png,image/jpeg,image/webp"
            maxSize={10}
            description="Upload an image to see preview"
          />
          {imagePreview && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Preview:</p>
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-auto rounded border"
              />
            </div>
          )}
        </Card>

        {/* Example 4: PDF Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">4. PDF Upload</h2>
          <FileUploader
            onFileSelect={(file) => {
              const selectedFile = Array.isArray(file) ? file[0] : file
              toast({
                title: 'PDF uploaded',
                description: selectedFile.name,
              })
            }}
            accept=".pdf,application/pdf"
            maxSize={20}
            description="Upload a PDF document"
          />
        </Card>

        {/* Example 5: Large File Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">5. Large File Upload (Video)</h2>
          <FileUploader
            onFileSelect={(file) => {
              const selectedFile = Array.isArray(file) ? file[0] : file
              toast({
                title: 'Large file uploaded',
                description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`,
              })
            }}
            accept="video/*"
            maxSize={100}
            description="Upload a video file (up to 100MB)"
          />
        </Card>

        {/* Example 6: Disabled State */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">6. Disabled State</h2>
          <FileUploader
            onFileSelect={() => {}}
            accept="image/*"
            disabled
            description="File upload is currently disabled"
          />
        </Card>
      </div>
    </div>
  )
}

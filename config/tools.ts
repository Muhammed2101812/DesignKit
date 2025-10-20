import { LucideIcon } from 'lucide-react'
import {
  Pipette,
  Crop,
  Maximize2,
  FileImage,
  QrCode,
  Palette,
  FileArchive,
  Eraser,
  Sparkles,
  Frame,
} from 'lucide-react'

export type ToolCategory = 'image-processing' | 'generators' | 'ai-powered'
export type ToolType = 'client-side' | 'api-powered'

export interface ToolConfig {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: ToolCategory
  type: ToolType
  path: string
  isAvailable: boolean
  requiresAuth: boolean
  quotaUsage: number // 0 for client-side, 1 for API tools
}

export const TOOLS: ToolConfig[] = [
  // Client-Side Tools - Image Processing
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Extract colors from any image',
    icon: Pipette,
    category: 'image-processing',
    type: 'client-side',
    path: '/color-picker',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    description: 'Crop with custom aspect ratios',
    icon: Crop,
    category: 'image-processing',
    type: 'client-side',
    path: '/image-cropper',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize with quality preservation',
    icon: Maximize2,
    category: 'image-processing',
    type: 'client-side',
    path: '/image-resizer',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
  {
    id: 'format-converter',
    name: 'Format Converter',
    description: 'Convert between PNG, JPG, WEBP',
    icon: FileImage,
    category: 'image-processing',
    type: 'client-side',
    path: '/format-converter',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },

  // Client-Side Tools - Generators
  {
    id: 'qr-generator',
    name: 'QR Generator',
    description: 'Create customizable QR codes',
    icon: QrCode,
    category: 'generators',
    type: 'client-side',
    path: '/qr-generator',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
  {
    id: 'gradient-generator',
    name: 'Gradient Generator',
    description: 'CSS gradient creator',
    icon: Palette,
    category: 'generators',
    type: 'client-side',
    path: '/gradient-generator',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },

  // API-Powered Tools
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Smart compression with quality control',
    icon: FileArchive,
    category: 'image-processing',
    type: 'client-side',
    path: '/image-compressor',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'AI-powered background removal',
    icon: Eraser,
    category: 'ai-powered',
    type: 'api-powered',
    path: '/background-remover',
    isAvailable: true,
    requiresAuth: true,
    quotaUsage: 1,
  },
  {
    id: 'image-upscaler',
    name: 'Image Upscaler',
    description: 'Enhance resolution up to 8x',
    icon: Sparkles,
    category: 'ai-powered',
    type: 'api-powered',
    path: '/image-upscaler',
    isAvailable: true,
    requiresAuth: true,
    quotaUsage: 1,
  },
  {
    id: 'mockup-generator',
    name: 'Mockup Generator',
    description: 'Place designs in realistic mockups',
    icon: Frame,
    category: 'generators',
    type: 'client-side',
    path: '/mockup-generator',
    isAvailable: true,
    requiresAuth: false,
    quotaUsage: 0,
  },
]

// Helper functions to filter tools
export const getToolsByType = (type: ToolType) => 
  TOOLS.filter((tool) => tool.type === type)

export const getToolsByCategory = (category: ToolCategory) => 
  TOOLS.filter((tool) => tool.category === category)

export const getAvailableTools = () => 
  TOOLS.filter((tool) => tool.isAvailable)

export const getToolById = (id: string) => 
  TOOLS.find((tool) => tool.id === id)

export const getToolByPath = (path: string) => 
  TOOLS.find((tool) => tool.path === path || path.startsWith(tool.path))

// Category metadata
export const TOOL_CATEGORIES = {
  'image-processing': {
    name: 'Image Processing',
    description: 'Edit and transform your images',
  },
  'generators': {
    name: 'Generators',
    description: 'Create designs and assets',
  },
  'ai-powered': {
    name: 'AI-Powered',
    description: 'Advanced AI-powered tools',
  },
} as const

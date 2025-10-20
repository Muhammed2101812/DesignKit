// Global TypeScript types and interfaces

// Color Picker Types
export interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}

// Re-export error types
export * from './errors'

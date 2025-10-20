/**
 * Canvas pooling utility to reuse canvas instances
 * Reduces memory allocation and improves performance
 */

interface CanvasPoolItem {
  canvas: HTMLCanvasElement
  inUse: boolean
  lastUsed: number
}

class CanvasPool {
  private pool: CanvasPoolItem[] = []
  private maxPoolSize = 5
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval to remove unused canvases
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000) // Every minute
    }
  }

  /**
   * Get a canvas from the pool or create a new one
   */
  getCanvas(width?: number, height?: number): HTMLCanvasElement {
    // Try to find an unused canvas
    const available = this.pool.find((item) => !item.inUse)

    if (available) {
      available.inUse = true
      available.lastUsed = Date.now()
      
      // Resize if dimensions provided
      if (width !== undefined && height !== undefined) {
        available.canvas.width = width
        available.canvas.height = height
      }
      
      return available.canvas
    }

    // Create new canvas if pool not full
    if (this.pool.length < this.maxPoolSize) {
      const canvas = document.createElement('canvas')
      
      if (width !== undefined && height !== undefined) {
        canvas.width = width
        canvas.height = height
      }
      
      const item: CanvasPoolItem = {
        canvas,
        inUse: true,
        lastUsed: Date.now(),
      }
      
      this.pool.push(item)
      return canvas
    }

    // Pool is full, create temporary canvas (not pooled)
    const canvas = document.createElement('canvas')
    if (width !== undefined && height !== undefined) {
      canvas.width = width
      canvas.height = height
    }
    return canvas
  }

  /**
   * Release a canvas back to the pool
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    const item = this.pool.find((i) => i.canvas === canvas)
    
    if (item) {
      // Clear the canvas
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      
      item.inUse = false
      item.lastUsed = Date.now()
    }
  }

  /**
   * Clean up old unused canvases
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    this.pool = this.pool.filter((item) => {
      if (!item.inUse && now - item.lastUsed > maxAge) {
        // Reset canvas to free memory
        item.canvas.width = 0
        item.canvas.height = 0
        return false
      }
      return true
    })
  }

  /**
   * Clear all canvases from the pool
   */
  clear(): void {
    this.pool.forEach((item) => {
      item.canvas.width = 0
      item.canvas.height = 0
    })
    this.pool = []
  }

  /**
   * Destroy the pool and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
let canvasPoolInstance: CanvasPool | null = null

/**
 * Get the canvas pool singleton instance
 */
export function getCanvasPool(): CanvasPool {
  if (!canvasPoolInstance) {
    canvasPoolInstance = new CanvasPool()
  }
  return canvasPoolInstance
}

/**
 * Hook for using canvas pool in React components
 */
export function useCanvasPool() {
  const pool = getCanvasPool()

  return {
    getCanvas: (width?: number, height?: number) => pool.getCanvas(width, height),
    releaseCanvas: (canvas: HTMLCanvasElement) => pool.releaseCanvas(canvas),
  }
}

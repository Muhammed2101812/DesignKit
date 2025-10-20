'use client'

import * as React from 'react'
import type { GradientConfig } from '../page'

interface GradientCanvasProps {
  config: GradientConfig
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export default function GradientCanvas({ config, canvasRef }: GradientCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Render gradient on canvas whenever config changes
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = 800
    const height = 600
    canvas.width = width
    canvas.height = height

    // Create gradient
    let gradient: CanvasGradient

    if (config.type === 'linear') {
      // Calculate gradient direction based on angle
      const angleRad = (config.angle * Math.PI) / 180
      const x1 = width / 2 - (Math.cos(angleRad) * width) / 2
      const y1 = height / 2 - (Math.sin(angleRad) * height) / 2
      const x2 = width / 2 + (Math.cos(angleRad) * width) / 2
      const y2 = height / 2 + (Math.sin(angleRad) * height) / 2

      gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    } else {
      // Radial gradient from center
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2

      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    }

    // Add color stops
    const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position)
    sortedStops.forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color)
    })

    // Fill canvas with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }, [config, canvasRef])

  return (
    <div ref={containerRef} className="border rounded-lg bg-card p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Preview</h3>
        <p className="text-sm text-muted-foreground">
          {config.type === 'linear' 
            ? `Linear gradient at ${config.angle}°` 
            : 'Radial gradient from center'}
        </p>
      </div>
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  )
}

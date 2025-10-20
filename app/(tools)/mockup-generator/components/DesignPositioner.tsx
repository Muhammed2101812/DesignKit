'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RotateCcw, Move, ZoomIn, RotateCw } from 'lucide-react'
import type { DesignTransform } from '../page'

interface DesignPositionerProps {
  transform: DesignTransform
  onChange: (transform: DesignTransform) => void
  disabled?: boolean
}

export function DesignPositioner({
  transform,
  onChange,
  disabled = false,
}: DesignPositionerProps) {
  const handlePositionXChange = (value: number[]) => {
    onChange({ ...transform, x: value[0] })
  }

  const handlePositionYChange = (value: number[]) => {
    onChange({ ...transform, y: value[0] })
  }

  const handleScaleChange = (value: number[]) => {
    onChange({ ...transform, scale: value[0] })
  }

  const handleRotationChange = (value: number[]) => {
    onChange({ ...transform, rotation: value[0] })
  }

  const handleReset = () => {
    onChange({ x: 0, y: 0, scale: 1, rotation: 0 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Design Controls</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position X */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="position-x" className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position X
            </Label>
            <span className="text-sm text-muted-foreground">{transform.x.toFixed(0)}px</span>
          </div>
          <Slider
            id="position-x"
            min={-200}
            max={200}
            step={1}
            value={[transform.x]}
            onValueChange={handlePositionXChange}
            disabled={disabled}
            aria-label="Horizontal position of design"
          />
        </div>

        {/* Position Y */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="position-y" className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position Y
            </Label>
            <span className="text-sm text-muted-foreground">{transform.y.toFixed(0)}px</span>
          </div>
          <Slider
            id="position-y"
            min={-200}
            max={200}
            step={1}
            value={[transform.y]}
            onValueChange={handlePositionYChange}
            disabled={disabled}
            aria-label="Vertical position of design"
          />
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="scale" className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Scale
            </Label>
            <span className="text-sm text-muted-foreground">{(transform.scale * 100).toFixed(0)}%</span>
          </div>
          <Slider
            id="scale"
            min={0.1}
            max={2}
            step={0.01}
            value={[transform.scale]}
            onValueChange={handleScaleChange}
            disabled={disabled}
            aria-label="Scale of design"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rotation" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Rotation
            </Label>
            <span className="text-sm text-muted-foreground">{transform.rotation.toFixed(0)}°</span>
          </div>
          <Slider
            id="rotation"
            min={-180}
            max={180}
            step={1}
            value={[transform.rotation]}
            onValueChange={handleRotationChange}
            disabled={disabled}
            aria-label="Rotation angle of design"
          />
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Adjustments</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...transform, scale: 0.5 })}
              disabled={disabled}
            >
              50% Size
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...transform, scale: 1.5 })}
              disabled={disabled}
            >
              150% Size
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...transform, rotation: -45 })}
              disabled={disabled}
            >
              -45° Tilt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...transform, rotation: 45 })}
              disabled={disabled}
            >
              +45° Tilt
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="mb-1"><strong>Tip:</strong> Adjust these controls to position your design perfectly within the mockup template.</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Use Position to move the design</li>
            <li>Use Scale to resize the design</li>
            <li>Use Rotation for dynamic angles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

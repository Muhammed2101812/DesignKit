'use client'

import * as React from 'react'
import { Maximize2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils/cn'

export interface ScaleFactorSelectorProps {
  /**
   * Currently selected scale factor
   */
  value: 2 | 4 | 8
  
  /**
   * Callback when scale factor changes
   */
  onChange: (scale: 2 | 4 | 8) => void
  
  /**
   * Whether the selector is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Additional CSS classes
   */
  className?: string
}

const SCALE_OPTIONS = [
  {
    value: 2,
    label: '2x',
    description: 'Double resolution',
    recommended: false,
  },
  {
    value: 4,
    label: '4x',
    description: 'Quadruple resolution',
    recommended: true,
  },
  {
    value: 8,
    label: '8x',
    description: 'Maximum quality',
    recommended: false,
  },
] as const

/**
 * ScaleFactorSelector provides options for selecting image upscale factor (2x, 4x, 8x)
 */
export function ScaleFactorSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ScaleFactorSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Maximize2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Label className="text-sm font-semibold">Upscale Factor</Label>
      </div>
      
      <RadioGroup
        value={value.toString()}
        onValueChange={(val: string) => onChange(Number(val) as 2 | 4 | 8)}
        disabled={disabled}
        className="space-y-2"
      >
        {SCALE_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={cn(
              'relative flex items-start space-x-3 rounded-lg border p-4 transition-colors',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RadioGroupItem
              value={option.value.toString()}
              id={`scale-${option.value}`}
              className="mt-0.5"
              disabled={disabled}
            />
            
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={`scale-${option.value}`}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium cursor-pointer',
                  disabled && 'cursor-not-allowed'
                )}
              >
                {option.label}
                {option.recommended && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Recommended
                  </span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
      
      <p className="text-xs text-muted-foreground">
        Higher scale factors produce larger images with more detail but take longer to process.
      </p>
    </div>
  )
}

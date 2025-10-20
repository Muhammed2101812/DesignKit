'use client'

import * as React from 'react'
import { TrendingUp, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'

export interface UsageIndicatorProps {
  /**
   * Current usage count for the day
   */
  currentUsage: number
  
  /**
   * Daily limit for the user's plan
   */
  dailyLimit: number
  
  /**
   * User's plan name
   */
  planName: 'free' | 'premium' | 'pro'
  
  /**
   * Callback when upgrade button is clicked
   */
  onUpgradeClick?: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Show compact version (smaller, inline)
   * @default false
   */
  compact?: boolean
}

/**
 * UsageIndicator displays remaining API quota for authenticated users
 * with a progress bar, numerical count, and upgrade CTA when needed.
 */
export function UsageIndicator({
  currentUsage,
  dailyLimit,
  planName,
  onUpgradeClick,
  className,
  compact = false,
}: UsageIndicatorProps) {
  const router = useRouter()
  const remaining = Math.max(0, dailyLimit - currentUsage)
  const usagePercentage = dailyLimit > 0 ? (currentUsage / dailyLimit) * 100 : 0
  
  // Determine color based on remaining quota
  const getStatusColor = () => {
    const remainingPercentage = (remaining / dailyLimit) * 100
    
    if (remainingPercentage > 50) return 'text-green-600 dark:text-green-400'
    if (remainingPercentage > 20) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  const getProgressColor = () => {
    const remainingPercentage = (remaining / dailyLimit) * 100
    
    if (remainingPercentage > 50) return 'bg-green-500'
    if (remainingPercentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      router.push('/pricing')
    }
  }
  
  const isLowQuota = remaining < dailyLimit * 0.2
  const isOutOfQuota = remaining === 0
  
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5',
          className
        )}
        role="status"
        aria-label={`API quota: ${remaining} of ${dailyLimit} remaining`}
      >
        <Zap className={cn('h-4 w-4', getStatusColor())} aria-hidden="true" />
        <span className={cn('text-sm font-medium', getStatusColor())}>
          {remaining}/{dailyLimit}
        </span>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        className
      )}
      role="region"
      aria-label="API usage quota information"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={cn('h-5 w-5', getStatusColor())} aria-hidden="true" />
          <h3 className="text-sm font-semibold">API Quota</h3>
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {planName} Plan
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={usagePercentage}
          className="h-2"
          aria-label={`${usagePercentage.toFixed(0)}% of daily quota used`}
        />
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-medium', getStatusColor())} role="status">
            {remaining} remaining
          </span>
          <span className="text-muted-foreground">
            {currentUsage} / {dailyLimit} used
          </span>
        </div>
      </div>
      
      {/* Warning Message */}
      {isLowQuota && !isOutOfQuota && (
        <div
          className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm text-yellow-800 dark:text-yellow-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>You&apos;re running low on API quota. Consider upgrading for more operations.</p>
        </div>
      )}
      
      {/* Out of Quota Message */}
      {isOutOfQuota && (
        <div
          className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p>You&apos;ve reached your daily quota limit. Upgrade to continue using API tools.</p>
        </div>
      )}
      
      {/* Upgrade CTA */}
      {(isLowQuota || isOutOfQuota) && planName !== 'pro' && (
        <Button
          onClick={handleUpgrade}
          className="w-full gap-2"
          variant={isOutOfQuota ? 'default' : 'outline'}
          aria-label="Upgrade your plan for more API quota"
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Upgrade Plan
        </Button>
      )}
      
      {/* Reset Info */}
      <p className="text-xs text-center text-muted-foreground">
        Quota resets daily at midnight UTC
      </p>
    </div>
  )
}

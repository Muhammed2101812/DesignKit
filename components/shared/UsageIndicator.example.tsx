/**
 * UsageIndicator Component Examples
 * 
 * This file demonstrates various usage patterns for the UsageIndicator component.
 */

import { UsageIndicator } from './UsageIndicator'

// Example 1: Free plan with low quota
export function FreePlanLowQuota() {
  return (
    <UsageIndicator
      currentUsage={8}
      dailyLimit={10}
      planName="free"
    />
  )
}

// Example 2: Premium plan with plenty of quota
export function PremiumPlanHighQuota() {
  return (
    <UsageIndicator
      currentUsage={50}
      dailyLimit={500}
      planName="premium"
    />
  )
}

// Example 3: Pro plan out of quota
export function ProPlanOutOfQuota() {
  return (
    <UsageIndicator
      currentUsage={2000}
      dailyLimit={2000}
      planName="pro"
    />
  )
}

// Example 4: Compact version
export function CompactVersion() {
  return (
    <UsageIndicator
      currentUsage={5}
      dailyLimit={10}
      planName="free"
      compact
    />
  )
}

// Example 5: With custom upgrade handler
export function WithCustomUpgrade() {
  const handleUpgrade = () => {
    console.log('Custom upgrade logic')
    // Could open a modal, navigate to pricing, etc.
  }
  
  return (
    <UsageIndicator
      currentUsage={9}
      dailyLimit={10}
      planName="free"
      onUpgradeClick={handleUpgrade}
    />
  )
}

// Example 6: In a tool page sidebar
export function InToolSidebar() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tool Settings</h2>
      
      <UsageIndicator
        currentUsage={3}
        dailyLimit={10}
        planName="free"
      />
      
      {/* Other tool controls */}
    </div>
  )
}

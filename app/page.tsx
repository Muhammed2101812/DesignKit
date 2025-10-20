import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { ToolsGrid } from '@/components/marketing/ToolsGrid'
import { Pricing } from '@/components/marketing/Pricing'
import { CTA } from '@/components/marketing/CTA'

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <ToolsGrid />
      <Pricing />
      <CTA />
    </div>
  )
}

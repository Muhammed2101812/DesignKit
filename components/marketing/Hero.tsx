import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Privacy-first design tools</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-slide-in-from-bottom" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            Professional Design Tools
            <span className="block text-primary">In Your Browser</span>
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-12 md:text-2xl animate-slide-in-from-bottom" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
            Process images, extract colors, and create designs without uploading files. 
            Your privacy matters—everything happens in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-in-from-bottom" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
            <Button asChild size="lg" className="w-full sm:w-auto transition-transform hover:scale-105">
              <Link href="#tools">
                Try Free Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto transition-transform hover:scale-105">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            No credit card required • Free tools available now
          </p>
        </div>
      </div>
    </section>
  )
}

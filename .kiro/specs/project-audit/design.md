# Tasarım Belgesi - Proje Eksiklikleri ve İyileştirmeler

## Genel Bakış

Bu belge, Design Kit projesindeki eksik özelliklerin teknik tasarımını detaylandırır. Mevcut mimari korunarak, eksik parçalar entegre edilecek ve sistem tam işlevsel hale getirilecektir.

### Tasarım İlkeleri

1. **Mevcut Mimariye Uyum**: Var olan Next.js 14 App Router, Supabase ve TypeScript yapısı korunacak
2. **Güvenlik Öncelikli**: Tüm ödeme ve kullanıcı verileri güvenli şekilde işlenecek
3. **Performans**: Lazy loading ve code splitting ile optimal yükleme süreleri
4. **Kullanıcı Deneyimi**: Kesintisiz akışlar ve anlaşılır hata mesajları
5. **Ölçeklenebilirlik**: Rate limiting ve caching ile yüksek trafik desteği

### Teknoloji Stack'i

- **Framework**: Next.js 14.2+ (App Router)
- **Ödeme**: Stripe (Checkout, Customer Portal, Webhooks)
- **Kimlik Doğrulama**: Supabase Auth
- **Rate Limiting**: Upstash Redis + @upstash/ratelimit
- **E-posta**: Resend veya SendGrid
- **Hata İzleme**: Sentry
- **Analytics**: Custom (Supabase queries)

## Mimari

### Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Landing  │  │ Pricing  │  │Dashboard │  │  Tools   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│              (Auth Check, Rate Limiting)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Stripe     │  │    Tools     │  │     User     │     │
│  │  Webhooks    │  │   (Quota)    │  │  (Profile)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│     Supabase         │    │      Stripe          │
│  - Auth              │    │  - Checkout          │
│  - Database (RLS)    │    │  - Subscriptions     │
│  - Functions         │    │  - Customer Portal   │
└──────────────────────┘    └──────────────────────┘
```


## Bileşenler ve Arayüzler

### 1. Stripe Entegrasyonu

#### Stripe Client Konfigürasyonu

```typescript
// lib/stripe/client.ts
import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}
```

#### Stripe Server Konfigürasyonu

```typescript
// lib/stripe/server.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Plan fiyat ID'leri
export const STRIPE_PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    amount: 900, // $9.00
    name: 'Premium',
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 2900, // $29.00
    name: 'Pro',
  },
} as const
```

#### Checkout Session Oluşturma

```typescript
// app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { plan } = await request.json()
  
  if (!plan || !(plan in STRIPE_PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  
  const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]
  
  // Stripe Customer oluştur veya bul
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()
  
  let customerId = profile?.stripe_customer_id
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }
  
  // Checkout session oluştur
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      user_id: user.id,
      plan: plan,
    },
  })
  
  return NextResponse.json({ sessionId: session.id, url: session.url })
}
```


#### Stripe Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      
      if (!userId || !plan) break
      
      // Subscription bilgilerini al
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      
      // Subscriptions tablosuna kaydet
      await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        plan: plan,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      
      // Profiles tablosunu güncelle
      await supabase
        .from('profiles')
        .update({ plan: plan })
        .eq('id', userId)
      
      break
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
      
      break
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      // Subscription'ı canceled olarak işaretle
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      
      // User'ı free plana düşür
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()
      
      if (sub) {
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', sub.user_id)
      }
      
      break
    }
  }
  
  return NextResponse.json({ received: true })
}
```

#### Customer Portal

```typescript
// app/api/stripe/create-portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No customer found' }, { status: 404 })
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
  
  return NextResponse.json({ url: session.url })
}
```


### 2. Kimlik Doğrulama Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Korumalı rotalar
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/background-remover',
  '/image-upscaler',
]

// Auth rotaları (giriş yapmış kullanıcılar erişemez)
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  
  // Korumalı rota kontrolü
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  if (isProtectedRoute && !user) {
    // Kullanıcı giriş yapmamış, login'e yönlendir
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('return_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  if (isAuthRoute && user) {
    // Kullanıcı zaten giriş yapmış, dashboard'a yönlendir
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3. Dashboard Bileşenleri

#### Dashboard Ana Sayfa

```typescript
// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { QuotaCard } from '@/components/dashboard/QuotaCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PlanCard } from '@/components/dashboard/PlanCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Kullanıcı profili ve plan bilgisi
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, full_name')
    .eq('id', user.id)
    .single()
  
  // Günlük kullanım
  const today = new Date().toISOString().split('T')[0]
  const { data: dailyLimit } = await supabase
    .from('daily_limits')
    .select('api_tools_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()
  
  // Son 7 günün kullanımı
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: weeklyUsage } = await supabase
    .from('daily_limits')
    .select('date, api_tools_count')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  // En çok kullanılan araçlar
  const { data: topTools } = await supabase
    .from('tool_usage')
    .select('tool_name, count')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('count', { ascending: false })
    .limit(5)
  
  // Son aktiviteler
  const { data: recentActivity } = await supabase
    .from('tool_usage')
    .select('tool_name, created_at, success')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const plan = profile?.plan || 'free'
  const currentUsage = dailyLimit?.api_tools_count || 0
  const dailyLimitValue = plan === 'free' ? 10 : plan === 'premium' ? 500 : 2000
  const usagePercentage = (currentUsage / dailyLimitValue) * 100
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Hoş geldin, {profile?.full_name || 'Kullanıcı'}
        </h1>
        <p className="text-muted-foreground">
          İşte bugünkü kullanım özetin
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuotaCard
          currentUsage={currentUsage}
          dailyLimit={dailyLimitValue}
          plan={plan}
        />
        
        <PlanCard plan={plan} />
        
        {usagePercentage > 80 && (
          <div className="col-span-full">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Kota Uyarısı</AlertTitle>
              <AlertDescription>
                Günlük kotanızın %{usagePercentage.toFixed(0)}'ini kullandınız.
                Daha fazla işlem için planınızı yükseltin.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <UsageChart data={weeklyUsage || []} />
        <RecentActivity activities={recentActivity || []} />
      </div>
    </div>
  )
}
```


#### Kota Kartı Bileşeni

```typescript
// components/dashboard/QuotaCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface QuotaCardProps {
  currentUsage: number
  dailyLimit: number
  plan: string
}

export function QuotaCard({ currentUsage, dailyLimit, plan }: QuotaCardProps) {
  const remaining = dailyLimit - currentUsage
  const percentage = (currentUsage / dailyLimit) * 100
  
  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Günlük API Kotası</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{remaining}</span>
            <span className="text-sm text-muted-foreground">
              / {dailyLimit} kalan
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentUsage} kullanıldı
            </span>
            <span className="text-muted-foreground">
              Sıfırlanma: Gece yarısı
            </span>
          </div>
          
          {plan === 'free' && (
            <Button asChild className="w-full" size="sm">
              <Link href="/pricing">
                Planı Yükselt
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Plan Kartı Bileşeni

```typescript
// components/dashboard/PlanCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap } from 'lucide-react'

interface PlanCardProps {
  plan: string
}

export function PlanCard({ plan }: PlanCardProps) {
  const planConfig = {
    free: {
      name: 'Free',
      icon: null,
      color: 'default',
      features: ['10 günlük API işlemi', '10MB dosya boyutu'],
    },
    premium: {
      name: 'Premium',
      icon: Crown,
      color: 'blue',
      features: ['500 günlük API işlemi', '50MB dosya boyutu', 'Batch işleme'],
    },
    pro: {
      name: 'Pro',
      icon: Zap,
      color: 'purple',
      features: ['2000 günlük API işlemi', '100MB dosya boyutu', 'REST API erişimi'],
    },
  }
  
  const config = planConfig[plan as keyof typeof planConfig] || planConfig.free
  const Icon = config.icon
  
  const handleManageSubscription = async () => {
    const response = await fetch('/api/stripe/create-portal', {
      method: 'POST',
    })
    const { url } = await response.json()
    window.location.href = url
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mevcut Plan</span>
          <Badge variant={config.color as any}>
            {Icon && <Icon className="mr-1 h-3 w-3" />}
            {config.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {config.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="mt-4 space-y-2">
          {plan !== 'free' && (
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={handleManageSubscription}
            >
              Aboneliği Yönet
            </Button>
          )}
          
          {plan !== 'pro' && (
            <Button asChild className="w-full" size="sm">
              <Link href="/pricing">
                {plan === 'free' ? 'Planı Yükselt' : 'Pro\'ya Geç'}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```


### 4. Pricing Sayfası

```typescript
// app/pricing/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PricingCard } from '@/components/marketing/PricingCard'
import { Check } from 'lucide-react'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let currentPlan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    currentPlan = profile?.plan || 'free'
  }
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Başlamak için mükemmel',
      features: [
        '10 günlük API işlemi',
        'Tüm client-side araçlar',
        '10MB maksimum dosya boyutu',
        'Topluluk desteği',
      ],
      cta: user ? 'Mevcut Plan' : 'Başla',
      popular: false,
      planId: 'free',
    },
    {
      name: 'Premium',
      price: 9,
      period: 'ay',
      description: 'Profesyoneller için',
      features: [
        '500 günlük API işlemi',
        'Tüm araçlar',
        '50MB maksimum dosya boyutu',
        'Batch işleme (10 dosya)',
        'Öncelikli destek',
      ],
      cta: 'Premium\'a Geç',
      popular: true,
      planId: 'premium',
    },
    {
      name: 'Pro',
      price: 29,
      period: 'ay',
      description: 'Ekipler ve ajanslar için',
      features: [
        '2000 günlük API işlemi',
        'Tüm araçlar',
        '100MB maksimum dosya boyutu',
        'Batch işleme (50 dosya)',
        'REST API erişimi',
        'Özel destek',
      ],
      cta: 'Pro\'ya Geç',
      popular: false,
      planId: 'pro',
    },
  ]
  
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          İhtiyacınıza Uygun Planı Seçin
        </h1>
        <p className="text-lg text-muted-foreground">
          Tüm planlar 30 gün para iade garantisi ile gelir
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.planId}
            {...plan}
            currentPlan={currentPlan}
            isLoggedIn={!!user}
          />
        ))}
      </div>
      
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sık Sorulan Sorular
        </h2>
        
        <div className="space-y-4">
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Planımı istediğim zaman iptal edebilir miyim?
            </summary>
            <p className="mt-2 text-muted-foreground">
              Evet, planınızı istediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde,
              mevcut fatura döneminin sonuna kadar premium özelliklere erişmeye devam edersiniz.
            </p>
          </details>
          
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Günlük kota nasıl sıfırlanır?
            </summary>
            <p className="mt-2 text-muted-foreground">
              Günlük API kotanız her gün gece yarısı UTC saatinde otomatik olarak sıfırlanır.
            </p>
          </details>
          
          <details className="group border rounded-lg p-4">
            <summary className="font-semibold cursor-pointer">
              Plan değiştirdiğimde ne olur?
            </summary>
            <p className="mt-2 text-muted-foreground">
              Planınızı yükselttiğinizde, yeni özellikler hemen aktif olur ve fark tutarı
              orantılı olarak hesaplanır. Düşürdüğünüzde, mevcut dönem sonuna kadar
              premium özelliklere erişmeye devam edersiniz.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
```

#### Pricing Card Bileşeni

```typescript
// components/marketing/PricingCard.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingCardProps {
  name: string
  price: number
  period: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  planId: string
  currentPlan: string
  isLoggedIn: boolean
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  popular,
  planId,
  currentPlan,
  isLoggedIn,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const isCurrent = currentPlan === planId
  
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push('/signup')
      return
    }
    
    if (planId === 'free' || isCurrent) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }
  
  return (
    <Card className={popular ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">{name}</h3>
          {popular && <Badge>En Popüler</Badge>}
          {isCurrent && <Badge variant="secondary">Mevcut</Badge>}
        </div>
        <p className="text-muted-foreground">{description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? 'default' : 'outline'}
          onClick={handleSubscribe}
          disabled={loading || isCurrent}
        >
          {loading ? 'Yükleniyor...' : isCurrent ? 'Mevcut Plan' : cta}
        </Button>
      </CardFooter>
    </Card>
  )
}
```


### 5. Rate Limiting Implementasyonu

```typescript
// lib/utils/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis client oluştur
const redis = Redis.fromEnv()

// IP bazlı rate limiter (public endpoints için)
export const ipRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
  prefix: 'ratelimit:ip',
})

// User bazlı rate limiter (authenticated endpoints için)
export const userRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
  analytics: true,
  prefix: 'ratelimit:user',
})

// API tool rate limiter (daha sıkı limit)
export const apiToolRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: 'ratelimit:api-tool',
})

/**
 * Rate limit kontrolü yap
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Rate limit header'larını oluştur
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
  }
}
```

#### Rate Limiting Middleware Kullanımı

```typescript
// app/api/tools/background-remover/route.ts (örnek)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiToolRateLimiter, checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Rate limit kontrolü
  const { success, limit, remaining, reset } = await checkRateLimit(
    user.id,
    apiToolRateLimiter
  )
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      { 
        status: 429,
        headers: {
          ...getRateLimitHeaders(limit, remaining, reset),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }
  
  // Normal işlem devam eder...
  // ...
  
  return NextResponse.json(
    { success: true },
    { headers: getRateLimitHeaders(limit, remaining, reset) }
  )
}
```

### 6. Hata İzleme Sistemi (Sentry)

```typescript
// lib/utils/error-logger.ts (güncelleme)
import * as Sentry from '@sentry/nextjs'

/**
 * Sentry'yi başlat
 */
export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Hassas verileri temizle
        if (event.request) {
          delete event.request.cookies
        }
        return event
      },
    })
  }
}

/**
 * Hatayı Sentry'ye raporla
 */
export async function reportError(
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        custom: sanitizeErrorContext(context),
      },
    })
  } else {
    console.error('Error reported:', error, context)
  }
}

/**
 * Context'i temizle (hassas verileri çıkar)
 */
function sanitizeErrorContext(context?: Record<string, any>): Record<string, any> {
  if (!context) return {}
  
  const sanitized = { ...context }
  
  // Hassas alanları çıkar
  const sensitiveKeys = ['fileData', 'imageData', 'blob', 'password', 'token']
  sensitiveKeys.forEach(key => {
    delete sanitized[key]
  })
  
  return sanitized
}

/**
 * Kullanıcı bilgilerini Sentry'ye ekle
 */
export function setSentryUser(user: { id: string; email?: string }) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    })
  }
}

/**
 * Kullanıcı bilgilerini temizle
 */
export function clearSentryUser() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser(null)
  }
}
```

#### Sentry Konfigürasyonu

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
})
```


### 7. E-posta Bildirimleri (Resend)

```typescript
// lib/email/client.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Hoş geldin e-postası gönder
 */
export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: 'Design Kit <noreply@designkit.com>',
    to,
    subject: 'Design Kit\'e Hoş Geldiniz!',
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Design Kit'e katıldığınız için teşekkür ederiz.</p>
      <p>10 güçlü tasarım aracına ücretsiz erişiminiz var:</p>
      <ul>
        <li>Color Picker</li>
        <li>Image Cropper</li>
        <li>Image Resizer</li>
        <li>Format Converter</li>
        <li>QR Generator</li>
        <li>Gradient Generator</li>
        <li>Image Compressor</li>
        <li>Background Remover (10 günlük işlem)</li>
        <li>Image Upscaler (10 günlük işlem)</li>
        <li>Mockup Generator</li>
      </ul>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">
          Dashboard'a Git
        </a>
      </p>
    `,
  })
}

/**
 * Abonelik onay e-postası
 */
export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  plan: string,
  amount: number
) {
  await resend.emails.send({
    from: 'Design Kit <noreply@designkit.com>',
    to,
    subject: `${plan} Planına Hoş Geldiniz!`,
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>${plan} planına abone olduğunuz için teşekkür ederiz.</p>
      <p><strong>Plan Detayları:</strong></p>
      <ul>
        <li>Plan: ${plan}</li>
        <li>Ücret: $${amount / 100}/ay</li>
        <li>Günlük API Kotası: ${plan === 'Premium' ? '500' : '2000'}</li>
      </ul>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">
          Dashboard'a Git
        </a>
      </p>
    `,
  })
}

/**
 * Kota uyarı e-postası
 */
export async function sendQuotaWarning(
  to: string,
  name: string,
  currentUsage: number,
  dailyLimit: number
) {
  const percentage = (currentUsage / dailyLimit) * 100
  
  await resend.emails.send({
    from: 'Design Kit <noreply@designkit.com>',
    to,
    subject: 'Günlük Kotanız Dolmak Üzere',
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Günlük API kotanızın %${percentage.toFixed(0)}'ini kullandınız.</p>
      <p>
        <strong>Kullanım:</strong> ${currentUsage} / ${dailyLimit}
      </p>
      <p>
        Daha fazla işlem yapmak için planınızı yükseltebilirsiniz.
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">
          Planları Görüntüle
        </a>
      </p>
    `,
  })
}

/**
 * Abonelik iptal e-postası
 */
export async function sendSubscriptionCancellation(
  to: string,
  name: string,
  endDate: string
) {
  await resend.emails.send({
    from: 'Design Kit <noreply@designkit.com>',
    to,
    subject: 'Aboneliğiniz İptal Edildi',
    html: `
      <h1>Merhaba ${name}!</h1>
      <p>Aboneliğiniz iptal edildi.</p>
      <p>
        ${endDate} tarihine kadar premium özelliklere erişmeye devam edeceksiniz.
      </p>
      <p>
        Geri dönmeyi düşünürseniz, her zaman yeniden abone olabilirsiniz.
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing">
          Planları Görüntüle
        </a>
      </p>
    `,
  })
}
```

#### E-posta Gönderimi için API Route

```typescript
// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendQuotaWarning } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { type, ...data } = await request.json()
  
  try {
    switch (type) {
      case 'welcome':
        await sendWelcomeEmail(user.email!, data.name)
        break
      
      case 'quota-warning':
        await sendQuotaWarning(
          user.email!,
          data.name,
          data.currentUsage,
          data.dailyLimit
        )
        break
      
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
```

### 8. Veritabanı Şeması Güncellemeleri

```sql
-- profiles tablosuna stripe_customer_id ekle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- subscriptions tablosuna index'ler ekle
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- tool_usage tablosuna index'ler ekle
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON tool_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON tool_usage(tool_name);

-- daily_limits tablosuna index'ler ekle
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, date);

-- Email preferences tablosu oluştur
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN DEFAULT true,
  quota_warnings BOOLEAN DEFAULT true,
  subscription_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```


## Güvenlik Önlemleri

### 1. Environment Variables Validasyonu

```typescript
// lib/env.ts (güncelleme)
import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PREMIUM_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Resend
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env)
```

### 2. Content Security Policy

```typescript
// next.config.js (güncelleme)
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.upstash.io",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 3. API Route Güvenlik Şablonu

```typescript
// lib/utils/apiSecurity.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, userRateLimiter } from './rateLimit'
import { reportError } from './error-logger'

export interface SecureApiOptions {
  requireAuth?: boolean
  rateLimit?: boolean
  allowedMethods?: string[]
}

/**
 * API route'u güvenli hale getir
 */
export async function secureApiRoute(
  request: NextRequest,
  options: SecureApiOptions = {}
) {
  const {
    requireAuth = true,
    rateLimit = true,
    allowedMethods = ['GET', 'POST'],
  } = options
  
  // Method kontrolü
  if (!allowedMethods.includes(request.method)) {
    return {
      error: NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      ),
    }
  }
  
  // Auth kontrolü
  let user = null
  if (requireAuth) {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }
    
    user = authUser
  }
  
  // Rate limit kontrolü
  if (rateLimit) {
    const identifier = user?.id || request.ip || 'anonymous'
    const { success, limit, remaining, reset } = await checkRateLimit(
      identifier,
      userRateLimiter
    )
    
    if (!success) {
      return {
        error: NextResponse.json(
          { error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(reset).toISOString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      }
    }
  }
  
  return { user }
}

/**
 * API hatalarını yakala ve logla
 */
export async function handleApiError(error: unknown, context?: Record<string, any>) {
  console.error('API Error:', error)
  
  await reportError(
    error instanceof Error ? error : new Error('Unknown error'),
    context
  )
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'An error occurred',
    },
    { status: 500 }
  )
}
```

#### Kullanım Örneği

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { secureApiRoute, handleApiError } from '@/lib/utils/apiSecurity'

export async function POST(request: NextRequest) {
  // Güvenlik kontrolü
  const { error, user } = await secureApiRoute(request, {
    requireAuth: true,
    rateLimit: true,
    allowedMethods: ['POST'],
  })
  
  if (error) return error
  
  try {
    // İşlem yap
    const body = await request.json()
    
    // ...
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, { userId: user?.id })
  }
}
```

## Test Stratejisi

### 1. Stripe Webhook Testleri

```typescript
// __tests__/api/stripe/webhook.test.ts
import { POST } from '@/app/api/stripe/webhook/route'
import { createMocks } from 'node-mocks-http'
import Stripe from 'stripe'

describe('Stripe Webhook', () => {
  it('should handle checkout.session.completed', async () => {
    const event: Stripe.Event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            user_id: 'user_123',
            plan: 'premium',
          },
          subscription: 'sub_123',
        },
      },
    }
    
    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'stripe-signature': 'test_signature',
      },
    })
    
    const response = await POST(req as any)
    expect(response.status).toBe(200)
  })
})
```

### 2. Rate Limiting Testleri

```typescript
// __tests__/lib/rateLimit.test.ts
import { checkRateLimit, userRateLimiter } from '@/lib/utils/rateLimit'

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const result = await checkRateLimit('test_user', userRateLimiter)
    expect(result.success).toBe(true)
  })
  
  it('should block requests exceeding limit', async () => {
    // 30 istek gönder (limit)
    for (let i = 0; i < 30; i++) {
      await checkRateLimit('test_user_2', userRateLimiter)
    }
    
    // 31. istek bloklanmalı
    const result = await checkRateLimit('test_user_2', userRateLimiter)
    expect(result.success).toBe(false)
  })
})
```

## Performans Optimizasyonları

### 1. Database Query Optimizasyonu

```typescript
// Kötü: N+1 query problemi
const users = await supabase.from('profiles').select('*')
for (const user of users.data) {
  const usage = await supabase
    .from('daily_limits')
    .select('*')
    .eq('user_id', user.id)
}

// İyi: Join kullan
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    daily_limits (*)
  `)
```

### 2. Caching Stratejisi

```typescript
// lib/utils/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 dakika
): Promise<T> {
  // Cache'den oku
  const cached = await redis.get<T>(key)
  if (cached) return cached
  
  // Fetch et
  const data = await fetcher()
  
  // Cache'e yaz
  await redis.setex(key, ttl, data)
  
  return data
}

// Kullanım
const userPlan = await getCached(
  `user:${userId}:plan`,
  async () => {
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()
    return data.plan
  },
  600 // 10 dakika
)
```

## Deployment Checklist

### Production Hazırlık

- [ ] Environment variables ayarlandı
- [ ] Stripe webhook endpoint'i production URL'e güncellendi
- [ ] Supabase RLS policies test edildi
- [ ] Rate limiting aktif
- [ ] Sentry entegrasyonu test edildi
- [ ] E-posta servisi konfigüre edildi
- [ ] CSP headers ayarlandı
- [ ] Database migration'lar çalıştırıldı
- [ ] Stripe test mode'dan live mode'a geçildi
- [ ] Analytics tracking aktif
- [ ] Error monitoring aktif
- [ ] Backup stratejisi oluşturuldu


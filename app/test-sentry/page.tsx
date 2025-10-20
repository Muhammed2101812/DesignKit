'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export default function TestSentryPage() {
  const [lastError, setLastError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testClientError = () => {
    try {
      setLastError('Client-side error triggered')
      throw new Error('Test Client-Side Error - Bu bir test hatasıdır')
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'client-side',
          location: 'test-sentry-page',
        },
        level: 'error',
      })
      console.error('Error captured by Sentry:', error)
    }
  }

  const testServerError = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sentry-example-api')
      if (!response.ok) {
        setLastError('Server-side error triggered')
      }
    } catch (error) {
      setLastError('Network error occurred')
      Sentry.captureException(error)
    } finally {
      setIsLoading(false)
    }
  }

  const testCustomEvent = () => {
    Sentry.captureMessage('Custom test message from Design Kit', {
      level: 'info',
      tags: {
        test_type: 'custom-message',
        feature: 'sentry-testing',
      },
      contexts: {
        test: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      },
    })
    setLastError('Custom message sent to Sentry')
  }

  const testBreadcrumbs = () => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'User clicked test breadcrumb button',
      level: 'info',
      data: {
        timestamp: Date.now(),
        page: 'test-sentry',
      },
    })

    Sentry.addBreadcrumb({
      category: 'navigation',
      message: 'User navigated to test page',
      level: 'info',
    })

    // Trigger an error to see breadcrumbs
    try {
      throw new Error('Test error with breadcrumbs')
    } catch (error) {
      Sentry.captureException(error)
      setLastError('Error with breadcrumbs sent')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Sentry Test Sayfası</h1>
          <p className="text-muted-foreground">
            Sentry entegrasyonunu test edin ve hata takibini kontrol edin
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sentry Yapılandırması</CardTitle>
            <CardDescription>Mevcut Sentry ayarları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">DSN:</span>
                <p className="text-muted-foreground break-all">
                  {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Yapılandırıldı' : '❌ Yapılandırılmadı'}
                </p>
              </div>
              <div>
                <span className="font-semibold">Environment:</span>
                <p className="text-muted-foreground">{process.env.NODE_ENV}</p>
              </div>
              <div>
                <span className="font-semibold">Debug Mode:</span>
                <p className="text-muted-foreground">
                  {process.env.SENTRY_DEBUG === 'true' ? '✅ Aktif' : '❌ Kapalı'}
                </p>
              </div>
              <div>
                <span className="font-semibold">Organization:</span>
                <p className="text-muted-foreground">muhammed-6y</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Senaryoları</CardTitle>
            <CardDescription>
              Farklı hata türlerini test edin ve Sentry dashboard'unda görün
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button onClick={testClientError} variant="destructive" className="w-full">
                🔴 Client-Side Error Test
              </Button>

              <Button
                onClick={testServerError}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Gönderiliyor...' : '🔴 Server-Side Error Test'}
              </Button>

              <Button onClick={testCustomEvent} variant="secondary" className="w-full">
                📝 Custom Message Test
              </Button>

              <Button onClick={testBreadcrumbs} variant="secondary" className="w-full">
                🍞 Breadcrumbs Test
              </Button>
            </div>

            {lastError && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Son İşlem: {lastError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentry Dashboard</CardTitle>
            <CardDescription>Hataları görüntülemek için Sentry dashboard'a gidin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <a
                href="https://muhammed-6y.sentry.io/issues/?project=4510217630580816"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  🔗 Sentry Issues Dashboard'u Aç
                </Button>
              </a>

              <a
                href="https://muhammed-6y.sentry.io/performance/?project=4510217630580816"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  📊 Performance Dashboard'u Aç
                </Button>
              </a>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Test İpuçları
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Hataları tetikledikten sonra 1-2 dakika bekleyin</li>
                <li>Ad-blocker'ınızı devre dışı bırakın</li>
                <li>Browser console'da network isteklerini kontrol edin</li>
                <li>Development'ta SENTRY_DEBUG=true yaparak daha fazla log görebilirsiniz</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Güvenlik Özellikleri</CardTitle>
            <CardDescription>Sentry'de aktif olan güvenlik filtreleri</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Authorization headers otomatik kaldırılır</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Cookie bilgileri gizlenir</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Token, key, secret parametreleri [REDACTED] ile değiştirilir</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Büyük dosya verileri (blob, imageData) kaldırılır</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Session Replay'de tüm text ve media maskeli</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

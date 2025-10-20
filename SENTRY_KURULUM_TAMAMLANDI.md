# Sentry Kurulum Tamamlandı ✅

## Yapılan İşlemler

### 1. Sentry Paketleri
- ✅ `@sentry/nextjs` v10.20.0 yüklü
- ✅ Next.js ile entegre edildi

### 2. Yapılandırma Dosyaları

#### `sentry.client.config.ts`
- Client-side (tarayıcı) hata takibi
- Session Replay özelliği aktif
- Hassas verileri filtreler (token, password, vb.)
- Development'ta devre dışı (SENTRY_DEBUG=false)

#### `sentry.server.config.ts`
- Server-side (Node.js) hata takibi
- API route hatalarını yakalar
- Environment variables'ları gizler
- Hassas header'ları temizler

#### `sentry.edge.config.ts`
- Edge Runtime (middleware) hata takibi
- Cloudflare Pages için optimize edilmiş

#### `next.config.js`
- Sentry webpack plugin entegrasyonu
- Source map yükleme yapılandırması
- Production'da otomatik aktif

#### `instrumentation.ts`
- Server ve Edge runtime'ları başlatır
- Next.js App Router ile uyumlu

### 3. Environment Variables (.env.local)

```bash
# Sentry DSN (Public - güvenli)
NEXT_PUBLIC_SENTRY_DSN=https://06edea258acf52feaff79214ebb301a8@o4510217628745728.ingest.de.sentry.io/4510217630580816

# Development'ta debug kapalı (production'da açılabilir)
SENTRY_DEBUG=false

# Sentry Organization & Project
SENTRY_ORG=muhammed-6y
SENTRY_PROJECT=javascript-nextjs

# Auth Token (Production için gerekli - source maps için)
# SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx
```

### 4. Güvenlik Özellikleri

✅ **Hassas Veri Filtreleme:**
- Authorization headers kaldırılır
- Cookie bilgileri gizlenir
- Token, key, secret parametreleri [REDACTED] ile değiştirilir
- Environment variables'daki hassas bilgiler gizlenir
- Büyük dosya verileri (blob, imageData) kaldırılır

✅ **Privacy-First:**
- Session Replay'de tüm text maskeli
- Tüm media (resim, video) bloklu
- Kullanıcı PII (Personally Identifiable Information) korunur

✅ **Performance:**
- Production'da %10 trace sampling (quota tasarrufu)
- Development'da %100 sampling (test için)
- Session Replay %10 sampling
- Error durumlarında %100 replay

### 5. Test Sayfası

**URL:** http://localhost:8080/sentry-example-page

**Özellikler:**
- Sentry bağlantısını test eder
- Frontend ve backend hata örnekleri
- Span tracking örneği
- Ad-blocker uyarısı

## Kullanım

### Development'ta Test

1. Sunucuyu başlat:
```bash
npm run dev
```

2. Test sayfasını aç:
```
http://localhost:8080/sentry-example-page
```

3. "Throw Sample Error" butonuna tıkla

4. Sentry dashboard'u kontrol et:
```
https://muhammed-6y.sentry.io/issues/?project=4510217630580816
```

### Production'a Deploy

1. Sentry Auth Token oluştur:
   - https://sentry.io/settings/account/api/auth-tokens/
   - "Create New Token" → Scope: `project:releases` ve `project:write`

2. `.env.production` dosyasına ekle:
```bash
SENTRY_AUTH_TOKEN=sntrys_your_token_here
SENTRY_DEBUG=false
```

3. Build ve deploy:
```bash
npm run build
```

Source maps otomatik olarak Sentry'ye yüklenecek.

## Manuel Hata Yakalama

### Client-Side

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Risky operation
  processImage(file)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      tool: 'image-compressor',
      fileSize: file.size,
    },
    level: 'error',
  })
}
```

### Server-Side (API Route)

```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
  try {
    // API operation
    const result = await processRequest(request)
    return Response.json(result)
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/tools/background-remover',
      },
    })
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

### Custom Context

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email, // Dikkat: PII
  username: user.username,
})

Sentry.setContext('tool', {
  name: 'color-picker',
  version: '1.0.0',
  imageSize: '1920x1080',
})

Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User uploaded image',
  level: 'info',
  data: {
    fileSize: 1024000,
    fileType: 'image/png',
  },
})
```

## Sentry Dashboard

**Project URL:** https://muhammed-6y.sentry.io/projects/javascript-nextjs/

**Issues:** https://muhammed-6y.sentry.io/issues/?project=4510217630580816

**Performance:** https://muhammed-6y.sentry.io/performance/?project=4510217630580816

**Releases:** https://muhammed-6y.sentry.io/releases/?project=4510217630580816

## Önemli Notlar

⚠️ **Development'ta:**
- Sentry varsayılan olarak KAPALI (SENTRY_DEBUG=false)
- Test için `SENTRY_DEBUG=true` yapabilirsiniz
- Quota tasarrufu için önerilir

⚠️ **Production'da:**
- Sentry otomatik AÇIK
- Source maps için SENTRY_AUTH_TOKEN gerekli
- Sampling oranları optimize edilmiş (%10)

⚠️ **Privacy:**
- Hassas veriler otomatik filtrelenir
- Session Replay'de tüm içerik maskeli
- GDPR/KVKK uyumlu yapılandırma

⚠️ **Quota:**
- Free plan: 5,000 errors/month
- Session Replay: 50 replays/month
- Sampling oranlarını ayarlayarak kontrol edin

## Sorun Giderme

### "Sentry unreachable" hatası
- Ad-blocker'ı devre dışı bırakın
- VPN bağlantısını kontrol edin
- Firewall ayarlarını kontrol edin

### Source maps yüklenmiyor
- SENTRY_AUTH_TOKEN'ın doğru olduğundan emin olun
- SENTRY_ORG ve SENTRY_PROJECT değerlerini kontrol edin
- Build loglarını inceleyin

### Development'ta hatalar görünmüyor
- SENTRY_DEBUG=true yapın
- Browser console'u kontrol edin
- Network tab'inde Sentry isteklerini kontrol edin

## Sonraki Adımlar

1. ✅ Sentry kurulumu tamamlandı
2. ⏭️ Test sayfasında hata testi yapın
3. ⏭️ Production'a deploy edin
4. ⏭️ Alert kuralları oluşturun (Sentry dashboard)
5. ⏭️ Slack/Email entegrasyonu ekleyin

## Kaynaklar

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://muhammed-6y.sentry.io/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Privacy & Security](https://docs.sentry.io/security-legal-pii/)

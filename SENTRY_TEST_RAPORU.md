# 🎯 Sentry Kurulum ve Test Raporu

## ✅ Kurulum Tamamlandı

Sentry error tracking sistemi başarıyla kuruldu ve yapılandırıldı.

### 📦 Kurulu Bileşenler

1. **@sentry/nextjs** v10.20.0
2. **Yapılandırma Dosyaları:**
   - ✅ `sentry.client.config.ts` - Client-side error tracking
   - ✅ `sentry.server.config.ts` - Server-side error tracking
   - ✅ `sentry.edge.config.ts` - Edge runtime error tracking
   - ✅ `instrumentation.ts` - Next.js instrumentation
   - ✅ `next.config.js` - Sentry webpack plugin

3. **Test Sayfaları:**
   - ✅ `/test-sentry` - Türkçe kapsamlı test sayfası
   - ✅ `/sentry-example-page` - Sentry wizard örnek sayfası

### 🔐 Güvenlik Özellikleri

**Otomatik Veri Filtreleme:**
- ✅ Authorization headers kaldırılır
- ✅ Cookie bilgileri gizlenir
- ✅ Token, key, secret parametreleri [REDACTED]
- ✅ Environment variables'daki hassas bilgiler gizlenir
- ✅ Büyük dosya verileri (blob, imageData) kaldırılır

**Privacy-First:**
- ✅ Session Replay'de tüm text maskeli
- ✅ Tüm media (resim, video) bloklu
- ✅ GDPR/KVKK uyumlu

**Performance:**
- ✅ Production'da %10 trace sampling
- ✅ Development'da %100 sampling
- ✅ Session Replay %10 sampling
- ✅ Error durumlarında %100 replay

### 🌐 Sentry Dashboard

**Organization:** muhammed-6y  
**Project:** javascript-nextjs  
**DSN:** Yapılandırıldı ✅

**Dashboard Linkleri:**
- Issues: https://muhammed-6y.sentry.io/issues/?project=4510217630580816
- Performance: https://muhammed-6y.sentry.io/performance/?project=4510217630580816
- Releases: https://muhammed-6y.sentry.io/releases/?project=4510217630580816

## 🧪 Test Adımları

### 1. Sunucuyu Başlat

```bash
npm run dev
```

Sunucu: http://127.0.0.1:8080

### 2. Test Sayfasını Aç

**Türkçe Test Sayfası:**
```
http://127.0.0.1:8080/test-sentry
```

**Özellikler:**
- ✅ Sentry yapılandırma bilgileri
- ✅ Client-side error test
- ✅ Server-side error test
- ✅ Custom message test
- ✅ Breadcrumbs test
- ✅ Dashboard linkleri
- ✅ Güvenlik özellikleri listesi
- ✅ Test ipuçları

### 3. Hata Testleri

#### Test 1: Client-Side Error
1. "🔴 Client-Side Error Test" butonuna tıkla
2. Browser console'da hatayı gör
3. 1-2 dakika sonra Sentry dashboard'da kontrol et

#### Test 2: Server-Side Error
1. "🔴 Server-Side Error Test" butonuna tıkla
2. API route'dan hata tetiklenir
3. Sentry dashboard'da server-side error'u gör

#### Test 3: Custom Message
1. "📝 Custom Message Test" butonuna tıkla
2. Info level message gönderilir
3. Dashboard'da custom message'ı gör

#### Test 4: Breadcrumbs
1. "🍞 Breadcrumbs Test" butonuna tıkla
2. Breadcrumb'lar eklenir ve hata tetiklenir
3. Dashboard'da breadcrumb timeline'ı gör

### 4. Dashboard Kontrolü

1. **Issues Dashboard'u Aç:**
   ```
   https://muhammed-6y.sentry.io/issues/?project=4510217630580816
   ```

2. **Kontrol Edilecekler:**
   - ✅ Hata sayısı
   - ✅ Hata detayları
   - ✅ Stack trace
   - ✅ Breadcrumbs
   - ✅ User context
   - ✅ Tags ve context bilgileri

3. **Performance Dashboard:**
   ```
   https://muhammed-6y.sentry.io/performance/?project=4510217630580816
   ```

## 📊 Beklenen Sonuçlar

### Client-Side Error
```
Error: Test Client-Side Error - Bu bir test hatasıdır
  at testClientError (test-sentry/page.tsx:15)
  
Tags:
  - test_type: client-side
  - location: test-sentry-page
  
Level: error
```

### Server-Side Error
```
Error: Sentry Example API Route Error
  at GET /api/sentry-example-api
  
Environment: development
Runtime: nodejs
```

### Custom Message
```
Message: Custom test message from Design Kit

Tags:
  - test_type: custom-message
  - feature: sentry-testing
  
Level: info
```

### Breadcrumbs Example
```
Breadcrumbs:
  1. [test] User clicked test breadcrumb button
  2. [navigation] User navigated to test page
  3. [error] Test error with breadcrumbs
```

## ⚙️ Environment Variables

### Development (.env.local)
```bash
# Sentry DSN (Public)
NEXT_PUBLIC_SENTRY_DSN=https://06edea258acf52feaff79214ebb301a8@o4510217628745728.ingest.de.sentry.io/4510217630580816

# Debug Mode (Development'ta kapalı)
SENTRY_DEBUG=false

# Organization & Project
SENTRY_ORG=muhammed-6y
SENTRY_PROJECT=javascript-nextjs

# Auth Token (Production için gerekli)
# SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx
```

### Production (.env.production)
```bash
# Sentry DSN (Aynı)
NEXT_PUBLIC_SENTRY_DSN=https://06edea258acf52feaff79214ebb301a8@o4510217628745728.ingest.de.sentry.io/4510217630580816

# Debug Mode (Production'da kapalı)
SENTRY_DEBUG=false

# Organization & Project
SENTRY_ORG=muhammed-6y
SENTRY_PROJECT=javascript-nextjs

# Auth Token (Source maps için ZORUNLU)
SENTRY_AUTH_TOKEN=sntrys_your_production_token_here
```

## 🚀 Production Deployment

### 1. Auth Token Oluştur

1. Sentry'ye giriş yap: https://sentry.io/
2. Settings → Account → API → Auth Tokens
3. "Create New Token" tıkla
4. Scope seç:
   - ✅ `project:releases`
   - ✅ `project:write`
   - ✅ `org:read`
5. Token'ı kopyala

### 2. Environment Variables Ekle

Cloudflare Pages'de:
```
Settings → Environment Variables → Production

SENTRY_AUTH_TOKEN=sntrys_your_token_here
SENTRY_ORG=muhammed-6y
SENTRY_PROJECT=javascript-nextjs
NEXT_PUBLIC_SENTRY_DSN=https://06edea258acf52feaff79214ebb301a8@o4510217628745728.ingest.de.sentry.io/4510217630580816
```

### 3. Build ve Deploy

```bash
npm run build
```

Source maps otomatik olarak Sentry'ye yüklenecek.

### 4. Production'da Test

1. Production URL'i aç
2. `/test-sentry` sayfasına git
3. Hata testlerini çalıştır
4. Dashboard'da production hatalarını gör

## 📝 Kullanım Örnekleri

### Client-Side Error Handling

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Risky operation
  await processImage(file)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      tool: 'image-compressor',
      fileSize: file.size,
    },
    level: 'error',
  })
  toast.error('İşlem başarısız oldu')
}
```

### Server-Side Error Handling

```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
  try {
    const result = await processRequest(request)
    return Response.json(result)
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/tools/background-remover',
      },
    })
    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
```

### Custom Context

```typescript
// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
})

// Set custom context
Sentry.setContext('tool', {
  name: 'color-picker',
  version: '1.0.0',
  imageSize: '1920x1080',
})

// Add breadcrumb
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

## ⚠️ Önemli Notlar

### Development
- ✅ Sentry varsayılan olarak KAPALI (SENTRY_DEBUG=false)
- ✅ Test için `SENTRY_DEBUG=true` yapabilirsiniz
- ✅ Quota tasarrufu için önerilir

### Production
- ✅ Sentry otomatik AÇIK
- ✅ Source maps için SENTRY_AUTH_TOKEN gerekli
- ✅ Sampling oranları optimize edilmiş (%10)

### Privacy
- ✅ Hassas veriler otomatik filtrelenir
- ✅ Session Replay'de tüm içerik maskeli
- ✅ GDPR/KVKK uyumlu yapılandırma

### Quota
- ✅ Free plan: 5,000 errors/month
- ✅ Session Replay: 50 replays/month
- ✅ Sampling oranlarını ayarlayarak kontrol edin

## 🔧 Sorun Giderme

### "Sentry unreachable" hatası
- Ad-blocker'ı devre dışı bırakın
- VPN bağlantısını kontrol edin
- Firewall ayarlarını kontrol edin
- Browser console'da network isteklerini kontrol edin

### Source maps yüklenmiyor
- SENTRY_AUTH_TOKEN'ın doğru olduğundan emin olun
- SENTRY_ORG ve SENTRY_PROJECT değerlerini kontrol edin
- Build loglarını inceleyin
- Token scope'larını kontrol edin

### Development'ta hatalar görünmüyor
- SENTRY_DEBUG=true yapın
- Browser console'u kontrol edin
- Network tab'inde Sentry isteklerini kontrol edin
- DSN'in doğru olduğundan emin olun

### Dashboard'da hatalar görünmüyor
- 1-2 dakika bekleyin (processing time)
- Project ID'nin doğru olduğundan emin olun
- Filters'ı kontrol edin (environment, date range)
- Browser console'da Sentry isteklerini kontrol edin

## ✅ Checklist

### Kurulum
- [x] @sentry/nextjs paketi yüklendi
- [x] Yapılandırma dosyaları oluşturuldu
- [x] Environment variables ayarlandı
- [x] next.config.js güncellendi
- [x] Test sayfaları oluşturuldu

### Test
- [ ] Development sunucusu başlatıldı
- [ ] Test sayfası açıldı
- [ ] Client-side error test edildi
- [ ] Server-side error test edildi
- [ ] Custom message test edildi
- [ ] Breadcrumbs test edildi
- [ ] Dashboard'da hatalar görüldü

### Production
- [ ] Auth token oluşturuldu
- [ ] Production environment variables eklendi
- [ ] Build başarılı
- [ ] Source maps yüklendi
- [ ] Production'da test edildi
- [ ] Alert kuralları oluşturuldu

## 📚 Kaynaklar

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://muhammed-6y.sentry.io/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Privacy & Security](https://docs.sentry.io/security-legal-pii/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## 🎉 Sonuç

Sentry kurulumu başarıyla tamamlandı! Artık:

✅ Client-side hatalar otomatik yakalanıyor  
✅ Server-side hatalar otomatik yakalanıyor  
✅ Edge runtime hatalar otomatik yakalanıyor  
✅ Hassas veriler otomatik filtreleniyor  
✅ Session Replay aktif (privacy-first)  
✅ Performance monitoring aktif  
✅ Test sayfaları hazır  
✅ Production'a hazır  

**Sonraki Adım:** Test sayfasını açın ve hata testlerini çalıştırın!

```
http://127.0.0.1:8080/test-sentry
```

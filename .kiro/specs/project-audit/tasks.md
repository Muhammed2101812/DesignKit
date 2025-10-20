# Implementation Plan - Proje Eksiklikleri ve İyileştirmeler

Bu implementation plan, Design Kit projesindeki eksik özelliklerin kodlanması için adım adım görevleri içerir. Her görev, önceki görevler üzerine inşa edilir ve hiçbir kod parçası yalnız bırakılmaz.

## Faz 1: Temel Altyapı ve Güvenlik

- [x] 1. Environment variables ve güvenlik konfigürasyonu





  - `lib/env.ts` dosyasını Stripe, Upstash, Sentry ve Resend değişkenleri ile güncelle
  - Zod schema ile tüm environment variables'ı validate et
  - `next.config.js` dosyasına Content Security Policy headers ekle
  - `.env.example` dosyasını yeni değişkenlerle güncelle
  - _Gereksinimler: 8.5, 8.6_
-

- [x] 2. Veritabanı şeması güncellemeleri




  - `supabase/migrations/` klasörüne yeni migration dosyası oluştur
  - `profiles` tablosuna `stripe_customer_id` kolonu ekle
  - `subscriptions`, `tool_usage`, `daily_limits` tablolarına index'ler ekle
  - `email_preferences` tablosunu oluştur ve RLS policies ekle
  - Migration'ı test et ve doğrula
  - _Gereksinimler: 1.3, 1.4, 10.7_
-

- [x] 3. Rate limiting altyapısı




  - `lib/utils/rateLimit.ts` dosyasını oluştur
  - Upstash Redis client'ı konfigüre et
  - IP bazlı, user bazlı ve API tool rate limiter'ları oluştur
  - Rate limit header'ları oluşturan helper fonksiyonlar ekle
  - _Gereksinimler: 8.1, 8.2, 8.3, 8.4_
- [x] 4. API güvenlik utilities









- [ ] 4. API güvenlik utilities

  - `lib/utils/apiSecurity.ts` dosyasını oluştur
  - `secureApiRoute` fonksiyonunu implement et (auth, rate limit, method kontrolü)
  - `handleApiError` fonksiyonunu implement et
  - Örnek kullanım dokümantasyonu ekle
  - _Gereksinimler: 8.1, 8.2, 8.5_
-

-

- [x] 5. Hata izleme sistemi (Sentry)






  - `@sentry/nextjs` paketini yükle
  - `sentry.client.config.ts` ve `sentry.server.config.ts` dosyalarını oluştur
  - `lib/utils/error-logger.ts` dosyasını Sentry entegrasyonu ile güncelle
  - `reportError`, `setSentryUser`, `clearSentryUser` fonksiyonlarını implement et
  - _Gereksinimler: 6.1, 6.2, 6.3, 6.4, 6.5_


## Faz 2: Stripe Entegrasyonu

- [ ] 6. Stripe client ve server konfigürasyonu
  - `stripe` ve `@stripe/stripe-js` paketlerini yükle
  - `lib/stripe/client.ts` dosyasını oluştur ve `getStripe` fonksiyonunu implement et
  - `lib/stripe/server.ts` dosyasını oluştur ve Stripe client'ı initialize et
  - `STRIPE_PLANS` constant'ını plan fiyat ID'leri ile tanımla
  - _Gereksinimler: 1.1, 1.2_

- [ ] 7. Checkout session API route
  - `app/api/stripe/create-checkout/route.ts` dosyasını oluştur
  - POST handler'ı implement et
  - Kullanıcı authentication kontrolü ekle
  - Stripe Customer oluştur veya mevcut customer'ı bul
  - Checkout session oluştur ve URL'i döndür
  - Error handling ve validation ekle
  - _Gereksinimler: 1.2, 1.3_

- [ ] 8. Stripe webhook handler
  - `app/api/stripe/webhook/route.ts` dosyasını oluştur
  - Webhook signature verification implement et
  - `checkout.session.completed` event handler'ı ekle
  - `customer.subscription.updated` event handler'ı ekle
  - `customer.subscription.deleted` event handler'ı ekle
  - Subscriptions ve profiles tablolarını güncelle
  - _Gereksinimler: 1.3, 1.4, 1.6, 1.7_

- [ ] 9. Customer Portal API route
  - `app/api/stripe/create-portal/route.ts` dosyasını oluştur
  - POST handler'ı implement et
  - Kullanıcının stripe_customer_id'sini al
  - Billing portal session oluştur ve URL'i döndür
  - Error handling ekle
  - _Gereksinimler: 1.5_

- [ ] 10. Stripe entegrasyonu testleri
  - Webhook handler için unit testler yaz
  - Checkout session oluşturma testleri yaz
  - Customer Portal testleri yaz
  - Mock Stripe responses kullan
  - _Gereksinimler: 1.1, 1.2, 1.3_

## Faz 3: Kimlik Doğrulama ve Middleware

- [ ] 11. Authentication middleware
  - `middleware.ts` dosyasını güncelle
  - Korumalı rotaları tanımla (dashboard, profile, API-powered tools)
  - Auth rotalarını tanımla (login, signup)
  - Supabase SSR client ile kullanıcı kontrolü yap
  - Yetkisiz erişimlerde login'e yönlendir (return_to parametresi ile)
  - Giriş yapmış kullanıcıları auth rotalarından dashboard'a yönlendir
  - _Gereksinimler: 2.1, 2.2, 2.3_

- [ ] 12. Auth callback ve yönlendirme
  - `app/auth/callback/route.ts` dosyasını oluştur
  - OAuth callback'i handle et
  - Session oluştur ve return_to parametresine yönlendir
  - Error handling ekle
  - _Gereksinimler: 2.3, 2.4_

- [ ] 13. Kullanıcı kaydı sonrası profile oluşturma
  - Supabase trigger veya Edge Function ile otomatik profile oluştur
  - Yeni kullanıcılar için plan'ı 'free' olarak ayarla
  - Hoş geldin e-postası gönder
  - _Gereksinimler: 2.5, 10.2_

- [ ] 14. Auth sayfalarını güncelle
  - Login, signup, reset-password sayfalarını kontrol et
  - OAuth butonlarını ekle (Google, GitHub)
  - Return_to parametresini handle et
  - Error mesajlarını iyileştir
  - _Gereksinimler: 2.4, 2.6_


## Faz 4: Dashboard ve Kullanıcı Profili

- [ ] 15. Dashboard ana sayfa
  - `app/(dashboard)/dashboard/page.tsx` dosyasını güncelle
  - Kullanıcı profili ve plan bilgisini fetch et
  - Günlük kullanım ve kalan kotayı hesapla
  - Son 7 günün kullanım verilerini al
  - En çok kullanılan araçları listele
  - Son aktiviteleri göster
  - Kota uyarısı (>80%) göster
  - _Gereksinimler: 3.1, 3.2, 3.3_

- [ ] 16. QuotaCard bileşeni
  - `components/dashboard/QuotaCard.tsx` dosyasını oluştur
  - Günlük kota progress bar'ı implement et
  - Renk kodlaması ekle (yeşil, sarı, kırmızı)
  - Kalan işlem sayısını göster
  - Free plan için upgrade butonu ekle
  - _Gereksinimler: 3.1, 3.3, 3.6_

- [ ] 17. PlanCard bileşeni
  - `components/dashboard/PlanCard.tsx` dosyasını oluştur
  - Mevcut plan bilgilerini göster
  - Plan özelliklerini listele
  - "Manage Subscription" butonu ekle (Premium/Pro için)
  - "Upgrade" butonu ekle (Free/Premium için)
  - Stripe Customer Portal'a yönlendirme implement et
  - _Gereksinimler: 3.1, 3.6, 3.7_

- [ ] 18. UsageChart bileşeni
  - `components/dashboard/UsageChart.tsx` dosyasını oluştur
  - Son 7 günün kullanım grafiğini göster
  - Recharts veya Chart.js kullan
  - Responsive tasarım ekle
  - _Gereksinimler: 3.2_

- [ ] 19. RecentActivity bileşeni
  - `components/dashboard/RecentActivity.tsx` dosyasını oluştur
  - Son 10 tool kullanımını listele
  - Başarı/hata durumunu göster
  - Zaman damgasını formatla
  - _Gereksinimler: 3.2_

- [ ] 20. Profile sayfası güncellemeleri
  - `app/(dashboard)/profile/page.tsx` dosyasını güncelle
  - Kullanıcı bilgilerini göster (ad, e-posta, avatar)
  - Plan bilgilerini ve abonelik durumunu göster
  - Hesap oluşturma tarihini göster
  - Ad ve avatar güncelleme formu ekle
  - E-posta tercihleri bölümü ekle
  - _Gereksinimler: 3.4, 3.5, 10.7_

## Faz 5: Pricing Sayfası

- [ ] 21. Pricing sayfası implementasyonu
  - `app/pricing/page.tsx` dosyasını güncelle
  - Kullanıcının mevcut planını fetch et
  - Üç plan kartını (Free, Premium, Pro) göster
  - Plan özelliklerini karşılaştırmalı olarak listele
  - FAQ bölümü ekle
  - _Gereksinimler: 5.1, 5.2, 5.3, 5.7_

- [ ] 22. PricingCard bileşeni
  - `components/marketing/PricingCard.tsx` dosyasını oluştur
  - Plan bilgilerini göster (isim, fiyat, özellikler)
  - "Most Popular" badge'i ekle (Premium için)
  - "Current Plan" badge'i ekle (mevcut plan için)
  - Subscribe butonu implement et
  - Giriş yapmamış kullanıcıları signup'a yönlendir
  - Giriş yapmış kullanıcıları Stripe Checkout'a yönlendir
  - Loading state ekle
  - _Gereksinimler: 5.4, 5.5, 5.6_

- [ ] 23. Pricing sayfası FAQ bölümü
  - Sık sorulan soruları ekle
  - Accordion/details component kullan
  - Plan değişikliği, iptal, kota sıfırlama konularını açıkla
  - _Gereksinimler: 5.7_


## Faz 6: API-Powered Tools Kota Yönetimi

- [ ] 24. UsageIndicator bileşeni güncellemesi
  - Mevcut `components/shared/UsageIndicator.tsx` dosyasını kontrol et
  - Eğer yoksa oluştur, varsa güncelle
  - Real-time kota gösterimi ekle
  - Progress bar ile görsel gösterim
  - Renk kodlaması (yeşil >50%, sarı 20-50%, kırmızı <20%)
  - Upgrade CTA butonu ekle (kota düşükse)
  - _Gereksinimler: 4.1, 4.2, 4.3, 4.4_

- [ ] 25. Background Remover tool'a kota UI ekle
  - `app/(tools)/background-remover/page.tsx` dosyasını güncelle
  - UsageIndicator component'ini sayfanın üstüne ekle
  - Kota sıfırsa process butonunu disable et
  - "Quota exceeded" mesajı göster
  - Upgrade dialog'u ekle
  - _Gereksinimler: 4.5, 4.6_

- [ ] 26. Image Upscaler tool'a kota UI ekle
  - `app/(tools)/image-upscaler/page.tsx` dosyasını güncelle
  - UsageIndicator component'ini sayfanın üstüne ekle
  - Kota sıfırsa process butonunu disable et
  - "Quota exceeded" mesajı göster
  - Upgrade dialog'u ekle
  - _Gereksinimler: 4.5, 4.6_

- [ ] 27. Kota kontrolü ve güncelleme entegrasyonu
  - API tool'ların işlem sonrası UsageIndicator'ı güncelle
  - Real-time kota fetch fonksiyonu ekle
  - Optimistic UI update implement et
  - Error handling ekle
  - _Gereksinimler: 4.7_

- [ ] 28. Upgrade dialog bileşeni
  - `components/shared/UpgradeDialog.tsx` dosyasını oluştur
  - Kota aşımı durumunda göster
  - Plan seçeneklerini listele
  - Pricing sayfasına yönlendirme butonu ekle
  - Kapatılabilir dialog
  - _Gereksinimler: 4.6_

## Faz 7: E-posta Bildirimleri

- [ ] 29. E-posta client konfigürasyonu
  - `resend` paketini yükle
  - `lib/email/client.ts` dosyasını oluştur
  - Resend client'ı initialize et
  - E-posta template'leri için helper fonksiyonlar oluştur
  - _Gereksinimler: 10.6_

- [ ] 30. E-posta template fonksiyonları
  - `sendWelcomeEmail` fonksiyonunu implement et
  - `sendSubscriptionConfirmation` fonksiyonunu implement et
  - `sendQuotaWarning` fonksiyonunu implement et
  - `sendSubscriptionCancellation` fonksiyonunu implement et
  - HTML template'leri oluştur
  - _Gereksinimler: 10.2, 10.3, 10.4, 10.5_

- [ ] 31. E-posta gönderimi API route
  - `app/api/email/send/route.ts` dosyasını oluştur
  - POST handler implement et
  - E-posta tiplerine göre routing yap
  - Authentication kontrolü ekle
  - Error handling ekle
  - _Gereksinimler: 10.1, 10.6_

- [ ] 32. E-posta tercihleri yönetimi
  - `app/api/user/email-preferences/route.ts` dosyasını oluştur
  - GET ve PUT handler'ları implement et
  - Email preferences tablosundan oku/yaz
  - Profile sayfasına e-posta tercihleri formu ekle
  - _Gereksinimler: 10.7_

- [ ] 33. Otomatik e-posta tetikleyicileri
  - Kullanıcı kaydında hoş geldin e-postası gönder
  - Stripe webhook'ta abonelik onayı e-postası gönder
  - Kota %90'a ulaştığında uyarı e-postası gönder
  - Abonelik iptalinde bilgilendirme e-postası gönder
  - _Gereksinimler: 10.2, 10.3, 10.4, 10.5_


## Faz 8: Analytics ve İstatistikler

- [ ] 34. Analytics query fonksiyonları
  - `lib/analytics/queries.ts` dosyasını oluştur
  - En çok kullanılan araçları getiren query yaz
  - Günlük aktif kullanıcı sayısını hesaplayan query yaz
  - Ortalama işlem süresini hesaplayan query yaz
  - Başarı oranını hesaplayan query yaz
  - Retention metriklerini hesaplayan query yaz
  - _Gereksinimler: 9.3, 9.4, 9.5, 9.6_

- [ ] 35. Admin analytics sayfası
  - `app/(dashboard)/admin/analytics/page.tsx` dosyasını oluştur
  - Admin kontrolü ekle (role-based)
  - Genel istatistikleri göster (DAU, toplam kullanım, başarı oranı)
  - Tool bazlı kullanım grafiklerini göster
  - Kullanıcı retention metriklerini göster
  - Conversion funnel'ı göster
  - _Gereksinimler: 9.2, 9.3, 9.7_

- [ ] 36. Analytics dashboard bileşenleri
  - `components/admin/StatsCard.tsx` - Genel istatistik kartları
  - `components/admin/ToolUsageChart.tsx` - Tool kullanım grafikleri
  - `components/admin/RetentionChart.tsx` - Retention grafikleri
  - `components/admin/ConversionFunnel.tsx` - Conversion funnel
  - _Gereksinimler: 9.2, 9.3, 9.4_

- [ ] 37. User dashboard'a kişisel istatistikler
  - Dashboard'a "Your Stats" bölümü ekle
  - Toplam tool kullanımını göster
  - En çok kullanılan araçları göster
  - Haftalık aktivite grafiği göster
  - _Gereksinimler: 9.1_

## Faz 9: Mockup Generator İyileştirmeleri

- [ ] 38. Mockup template'leri oluşturma
  - `public/mockup-templates/` klasöründeki placeholder SVG'leri PNG'ye dönüştür
  - En az 15 yüksek kaliteli mockup template'i ekle (5 device, 5 print, 5 apparel)
  - Her template için JSON metadata dosyası oluştur
  - Design area koordinatlarını tanımla
  - Perspective transform parametrelerini ekle
  - _Gereksinimler: 7.1, 7.2, 7.4_

- [ ] 39. Template metadata sistemi
  - `lib/mockup/templates.ts` dosyasını oluştur
  - Template metadata type'ları tanımla
  - Template'leri kategorilere göre grupla
  - Template yükleme fonksiyonları ekle
  - _Gereksinimler: 7.2, 7.3_

- [ ] 40. Mockup Generator UI güncellemeleri
  - `app/(tools)/mockup-generator/page.tsx` dosyasını güncelle
  - Template seçici component'ini iyileştir
  - Kategori filtreleme ekle
  - Template preview'ları göster
  - Design area vurgulama ekle
  - _Gereksinimler: 7.3, 7.5_

- [ ] 41. Perspective transform implementasyonu
  - Canvas perspective transform fonksiyonları ekle
  - Gerçekçi gölge ve highlight efektleri ekle
  - Yüksek çözünürlük export (min 2000px) ekle
  - _Gereksinimler: 7.6, 7.7_


## Faz 10: Rate Limiting Entegrasyonu

- [ ] 42. API route'lara rate limiting ekle
  - `app/api/stripe/create-checkout/route.ts` - User rate limiter ekle
  - `app/api/stripe/create-portal/route.ts` - User rate limiter ekle
  - `app/api/tools/background-remover/route.ts` - API tool rate limiter ekle
  - `app/api/tools/image-upscaler/route.ts` - API tool rate limiter ekle
  - `app/api/email/send/route.ts` - User rate limiter ekle
  - _Gereksinimler: 8.1, 8.2, 8.3_

- [ ] 43. Rate limit error handling
  - 429 response'ları için özel error component oluştur
  - Retry-After header'ını kullanıcıya göster
  - Rate limit aşımında kullanıcıyı bilgilendir
  - _Gereksinimler: 8.4_

- [ ] 44. Rate limiting testleri
  - Rate limit fonksiyonları için unit testler yaz
  - API route'ların rate limit davranışını test et
  - Concurrent request testleri yaz
  - _Gereksinimler: 8.1, 8.2_

## Faz 11: Test ve Kalite Güvencesi

- [ ] 45. Stripe entegrasyonu end-to-end testleri
  - Checkout flow'u test et
  - Webhook handling'i test et
  - Customer Portal'ı test et
  - Plan upgrade/downgrade senaryolarını test et
  - _Gereksinimler: 1.1, 1.2, 1.3, 1.5_

- [ ] 46. Authentication flow testleri
  - Login/logout flow'u test et
  - Protected route'ların korunduğunu test et
  - Return_to parametresinin çalıştığını test et
  - OAuth flow'u test et
  - _Gereksinimler: 2.1, 2.2, 2.3, 2.4_

- [ ] 47. Dashboard ve kota yönetimi testleri
  - Dashboard component'lerini test et
  - Kota hesaplamalarını test et
  - UsageIndicator'ın doğru çalıştığını test et
  - Upgrade flow'unu test et
  - _Gereksinimler: 3.1, 3.2, 4.1, 4.2_

- [ ] 48. E-posta gönderimi testleri
  - E-posta template'lerini test et
  - E-posta gönderim fonksiyonlarını test et
  - E-posta tercihleri yönetimini test et
  - _Gereksinimler: 10.1, 10.2, 10.6_

- [ ] 49. Performance ve güvenlik testleri
  - Lighthouse audit'leri çalıştır (target >90)
  - Security headers'ları doğrula
  - Rate limiting'i test et
  - SQL injection ve XSS testleri yap
  - _Gereksinimler: 8.5, 8.6, 8.7_

## Faz 12: Dokümantasyon ve Deployment

- [ ] 50. API dokümantasyonu
  - Tüm yeni API endpoint'leri için dokümantasyon yaz
  - Request/response örnekleri ekle
  - Error code'ları ve mesajları dokümante et
  - Rate limit bilgilerini ekle
  - _Gereksinimler: Tüm API endpoint'leri_

- [ ] 51. Kullanıcı dokümantasyonu
  - Pricing ve plan değişikliği rehberi yaz
  - Kota yönetimi rehberi yaz
  - FAQ'ı güncelle
  - Troubleshooting guide oluştur
  - _Gereksinimler: 5.7, 10.5_

- [ ] 52. Environment setup dokümantasyonu
  - Stripe setup adımlarını dokümante et
  - Upstash Redis setup'ı açıkla
  - Sentry setup'ı açıkla
  - Resend setup'ı açıkla
  - Production deployment checklist oluştur
  - _Gereksinimler: Tüm servisler_

- [ ] 53. Production deployment hazırlığı
  - Environment variables'ı production'a ekle
  - Stripe webhook endpoint'ini production URL'e güncelle
  - Stripe'ı test mode'dan live mode'a geç
  - Database migration'ları production'da çalıştır
  - Sentry ve Resend'i production'da test et
  - _Gereksinimler: Tüm servisler_

- [ ] 54. Monitoring ve alerting kurulumu
  - Sentry alert'leri konfigüre et
  - Uptime monitoring ekle
  - Database backup stratejisi oluştur
  - Error rate threshold'ları belirle
  - _Gereksinimler: 6.1, 6.2_

## Notlar

- Her görev tamamlandığında, ilgili testlerin yazılması ve çalıştırılması önemlidir
- Stripe entegrasyonu için test mode kullanılmalı, production'a geçmeden önce kapsamlı test yapılmalıdır
- Rate limiting için Upstash Redis free tier yeterli olacaktır, ancak production'da ölçeklendirme planı yapılmalıdır
- E-posta gönderimi için Resend free tier günde 100 e-posta sınırı vardır, gerekirse plan yükseltilmelidir
- Tüm hassas veriler (API keys, secrets) environment variables'da saklanmalı ve asla commit edilmemelidir


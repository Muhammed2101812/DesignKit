# Proje Eksiklikleri ve İyileştirmeler - Gereksinimler Belgesi

## Giriş

Bu belge, Design Kit projesinin mevcut durumunu analiz ederek eksik olan özellikleri, tamamlanmamış implementasyonları ve iyileştirme alanlarını tanımlar. Proje, 10 tasarım aracından oluşan bir SaaS platformudur ve şu anda temel araçlar implementasyonu tamamlanmış durumda, ancak kritik iş mantığı ve entegrasyon özellikleri eksiktir.

## Sözlük

- **Design Kit**: Tarayıcı tabanlı görüntü işleme ve tasarım araçları sağlayan web uygulaması
- **Stripe**: Ödeme işleme ve abonelik yönetimi platformu
- **Supabase**: PostgreSQL veritabanı ve kimlik doğrulama servisi
- **API-Powered Tool**: Sunucu tarafı işleme gerektiren ve kullanıcı kotasından düşen araç
- **Client-Side Tool**: Tamamen tarayıcıda çalışan ve kota kullanmayan araç
- **Quota System**: Kullanıcı abonelik planına göre günlük API kullanımını sınırlayan sistem
- **RLS (Row Level Security)**: Veritabanı seviyesinde kullanıcı verilerini izole eden güvenlik mekanizması
- **Middleware**: Next.js'te her istekten önce çalışan kimlik doğrulama ve yönlendirme mantığı

## Gereksinimler

### Gereksinim 1: Stripe Entegrasyonu ve Ödeme Sistemi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, Premium veya Pro plana abone olabilmek ve ödeme yapabilmek istiyorum, böylece daha fazla API kotası ve özelliklerine erişebilirim.

#### Kabul Kriterleri

1. WHEN bir kullanıcı pricing sayfasını ziyaret ettiğinde, THE Design Kit SHALL üç plan seçeneğini (Free, Premium $9/ay, Pro $29/ay) özellik karşılaştırması ile birlikte göstermelidir.

2. WHEN bir kullanıcı Premium veya Pro plan için "Subscribe" butonuna tıkladığında, THE Design Kit SHALL kullanıcıyı Stripe Checkout sayfasına yönlendirmelidir.

3. WHEN bir kullanıcı Stripe Checkout'ta ödemeyi tamamladığında, THE Design Kit SHALL Stripe webhook'u aracılığıyla abonelik bilgilerini almalı ve veritabanındaki subscriptions tablosuna kaydetmelidir.

4. WHEN bir abonelik başarıyla oluşturulduğunda, THE Design Kit SHALL kullanıcının profiles tablosundaki plan alanını güncellemeli ve günlük kotasını yeni plana göre ayarlamalıdır.

5. WHEN bir kullanıcı dashboard'da "Manage Subscription" butonuna tıkladığında, THE Design Kit SHALL kullanıcıyı Stripe Customer Portal'a yönlendirmelidir.

6. WHEN bir abonelik iptal edildiğinde veya ödeme başarısız olduğunda, THE Design Kit SHALL webhook aracılığıyla abonelik durumunu güncellemelidir.

7. THE Design Kit SHALL Stripe webhook'larını güvenli bir şekilde doğrulamalı (webhook signature verification) ve yalnızca geçerli webhook'ları işlemelidir.

### Gereksinim 2: Kimlik Doğrulama ve Yetkilendirme Sistemi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, hesap oluşturabilmek, giriş yapabilmek ve korumalı sayfalara erişebilmek istiyorum, böylece kişisel verilerime ve abonelik bilgilerime güvenli bir şekilde ulaşabilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL middleware.ts dosyasında kimlik doğrulama kontrolü yapmalı ve korumalı rotaları (dashboard, profile, API-powered tools) yetkisiz erişimden korumalıdır.

2. WHEN yetkisiz bir kullanıcı korumalı bir sayfaya erişmeye çalıştığında, THE Design Kit SHALL kullanıcıyı login sayfasına yönlendirmeli ve orijinal URL'yi return_to parametresi olarak saklamalıdır.

3. WHEN bir kullanıcı başarıyla giriş yaptığında, THE Design Kit SHALL kullanıcıyı return_to parametresindeki URL'ye veya dashboard'a yönlendirmelidir.

4. THE Design Kit SHALL OAuth sağlayıcıları (Google, GitHub) için giriş seçenekleri sunmalıdır.

5. WHEN bir kullanıcı ilk kez kayıt olduğunda, THE Design Kit SHALL otomatik olarak profiles tablosunda bir kayıt oluşturmalı ve plan alanını 'free' olarak ayarlamalıdır.

6. THE Design Kit SHALL şifre sıfırlama, e-posta doğrulama ve şifre güncelleme akışlarını tam olarak implementasyonu yapmalıdır.

7. THE Design Kit SHALL kullanıcı oturumunu güvenli bir şekilde yönetmeli ve session token'ları düzenli olarak yenilemelidir.

### Gereksinim 3: Dashboard ve Kullanıcı Profili

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, kullanım istatistiklerimi, abonelik bilgilerimi ve hesap ayarlarımı görebilmek istiyorum, böylece kotamı takip edebilir ve hesabımı yönetebilirim.

#### Kabul Kriterleri

1. WHEN bir kullanıcı dashboard sayfasını ziyaret ettiğinde, THE Design Kit SHALL günlük API kullanımını, kalan kotayı, mevcut planı ve son kullanılan araçları göstermelidir.

2. THE Design Kit SHALL dashboard'da kullanım grafiği (son 7 gün) ve en çok kullanılan araçların listesini göstermelidir.

3. WHEN bir kullanıcının kotası %80'in üzerine çıktığında, THE Design Kit SHALL dashboard'da bir uyarı mesajı ve upgrade önerisi göstermelidir.

4. WHEN bir kullanıcı profile sayfasını ziyaret ettiğinde, THE Design Kit SHALL kullanıcı bilgilerini (ad, e-posta, avatar), plan bilgilerini ve hesap oluşturma tarihini göstermelidir.

5. THE Design Kit SHALL profile sayfasında kullanıcının ad ve avatar bilgilerini güncelleyebilmesini sağlamalıdır.

6. WHEN bir kullanıcı Free plandaysa, THE Design Kit SHALL dashboard ve profile sayfalarında upgrade CTA'ları göstermelidir.

7. THE Design Kit SHALL kullanıcının abonelik durumunu (active, canceled, past_due) görsel olarak belirtmelidir.

### Gereksinim 4: API-Powered Tools için Kota Yönetimi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, API-powered araçları kullanırken kalan kotamı görebilmek ve kota aşımı durumunda bilgilendirilmek istiyorum, böylece kullanımımı planlayabilir ve gerekirse upgrade yapabilirim.

#### Kabul Kriterleri

1. WHEN bir kullanıcı Background Remover veya Image Upscaler aracını açtığında, THE Design Kit SHALL sayfanın üst kısmında UsageIndicator component'ini göstermelidir.

2. THE Design Kit SHALL UsageIndicator'da kalan kotayı sayısal (örn: "8/10 remaining") ve görsel (progress bar) olarak göstermelidir.

3. WHEN bir kullanıcının kotası %50'nin altına düştüğünde, THE Design Kit SHALL progress bar'ı sarı renge çevirmelidir.

4. WHEN bir kullanıcının kotası %20'nin altına düştüğünde, THE Design Kit SHALL progress bar'ı kırmızı renge çevirmelidir.

5. WHEN bir kullanıcının kotası sıfıra ulaştığında, THE Design Kit SHALL process butonunu devre dışı bırakmalı ve "Daily quota exceeded" mesajı göstermelidir.

6. THE Design Kit SHALL kota sıfıra ulaştığında upgrade dialog'u göstermeli ve plan seçeneklerini sunmalıdır.

7. WHEN bir API işlemi başarıyla tamamlandığında, THE Design Kit SHALL UsageIndicator'ı gerçek zamanlı olarak güncellemelidir.

### Gereksinim 5: Pricing Sayfası ve Plan Karşılaştırması

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, farklı planları karşılaştırabilmek ve hangisinin bana uygun olduğuna karar verebilmek istiyorum, böylece bilinçli bir satın alma kararı verebilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL pricing sayfasında üç plan kartı (Free, Premium, Pro) yan yana göstermelidir.

2. WHEN bir kullanıcı pricing sayfasını ziyaret ettiğinde, THE Design Kit SHALL her plan için günlük API kotasını, maksimum dosya boyutunu, batch işleme limitini ve diğer özellikleri göstermelidir.

3. THE Design Kit SHALL Premium planı "Most Popular" badge'i ile vurgulamalıdır.

4. WHEN bir kullanıcı giriş yapmamışsa, THE Design Kit SHALL "Get Started" butonlarını signup sayfasına yönlendirmelidir.

5. WHEN bir kullanıcı giriş yapmışsa ve Free plandaysa, THE Design Kit SHALL "Upgrade" butonlarını Stripe Checkout'a yönlendirmelidir.

6. WHEN bir kullanıcı zaten Premium veya Pro plandaysa, THE Design Kit SHALL mevcut planı "Current Plan" badge'i ile işaretlemeli ve diğer planlar için "Upgrade" veya "Downgrade" seçenekleri sunmalıdır.

7. THE Design Kit SHALL pricing sayfasında sık sorulan soruları (FAQ) ve plan değişikliği politikasını açıklamalıdır.

### Gereksinim 6: Hata İzleme ve Loglama Sistemi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, production ortamında oluşan hataları izleyebilmek ve debug edebilmek istiyorum, böylece kullanıcı deneyimini iyileştirebilir ve sorunları hızlıca çözebilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL lib/utils/error-logger.ts dosyasındaki reportError fonksiyonunu bir hata izleme servisine (Sentry, LogRocket, vb.) entegre etmelidir.

2. WHEN production ortamında bir hata oluştuğunda, THE Design Kit SHALL hatayı otomatik olarak hata izleme servisine göndermelidir.

3. THE Design Kit SHALL hata loglarında kullanıcı kimliği, tool adı, hata mesajı, stack trace ve context bilgilerini içermelidir.

4. THE Design Kit SHALL hassas verileri (file data, image data, blob) hata loglarından çıkarmalıdır.

5. THE Design Kit SHALL API hatalarını ayrı bir kategori olarak loglamalı ve HTTP status code, endpoint ve response body bilgilerini içermelidir.

6. WHEN bir API işlemi başarısız olduğunda, THE Design Kit SHALL kullanıcının kotasını düşürmemeli ve hatayı loglayarak retry seçeneği sunmalıdır.

7. THE Design Kit SHALL development ortamında hataları console'a loglamalı ancak external servise göndermemelidir.

### Gereksinim 7: Mockup Generator Template Sistemi

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, tasarımlarımı gerçekçi mockup'lara yerleştirebilmek istiyorum, böylece profesyonel sunumlar hazırlayabilir ve müşterilere gösterebilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL public/mockup-templates/ klasöründeki placeholder SVG dosyalarını yüksek kaliteli PNG mockup görsellerine dönüştürmelidir.

2. THE Design Kit SHALL her mockup template için JSON metadata dosyası oluşturmalı ve design area koordinatlarını, perspective transform parametrelerini ve template kategorisini içermelidir.

3. WHEN bir kullanıcı Mockup Generator aracını açtığında, THE Design Kit SHALL template'leri kategorilere göre (device, print, apparel) gruplandırarak göstermelidir.

4. THE Design Kit SHALL en az 15 farklı mockup template'i sağlamalıdır (5 device, 5 print, 5 apparel).

5. WHEN bir kullanıcı template seçtiğinde, THE Design Kit SHALL template'in preview görselini ve design area'yı vurgulayarak göstermelidir.

6. THE Design Kit SHALL kullanıcının tasarımını template üzerine yerleştirirken perspective transform uygulayarak gerçekçi bir görünüm sağlamalıdır.

7. THE Design Kit SHALL mockup generator'ın yüksek çözünürlükte (minimum 2000px genişlik) export yapabilmesini sağlamalıdır.

### Gereksinim 8: Rate Limiting ve Güvenlik İyileştirmeleri

**Kullanıcı Hikayesi:** Bir sistem yöneticisi olarak, API endpoint'lerini kötüye kullanımdan koruyabilmek istiyorum, böylece sistem kaynaklarını verimli kullanabilir ve DDoS saldırılarını önleyebilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL tüm API route'larında (@upstash/ratelimit kullanarak) rate limiting implementasyonu yapmalıdır.

2. THE Design Kit SHALL kimlik doğrulaması gerektirmeyen endpoint'ler için IP bazlı rate limiting (dakikada 10 istek) uygulamalıdır.

3. THE Design Kit SHALL kimlik doğrulaması gerektiren endpoint'ler için kullanıcı bazlı rate limiting (dakikada 30 istek) uygulamalıdır.

4. WHEN bir kullanıcı veya IP rate limit'i aştığında, THE Design Kit SHALL 429 (Too Many Requests) status code'u ile yanıt vermeli ve Retry-After header'ı eklemelidir.

5. THE Design Kit SHALL file upload endpoint'lerinde dosya boyutu, dosya tipi ve magic number validasyonu yapmalıdır.

6. THE Design Kit SHALL Content Security Policy (CSP) header'larını next.config.js dosyasında tanımlamalı ve XSS saldırılarını önlemelidir.

7. THE Design Kit SHALL production ortamında HTTPS zorunluluğu getirmeli ve HTTP isteklerini HTTPS'e yönlendirmelidir.

### Gereksinim 9: Analytics ve Kullanım İstatistikleri

**Kullanıcı Hikayesi:** Bir ürün yöneticisi olarak, hangi araçların en çok kullanıldığını ve kullanıcı davranışlarını görebilmek istiyorum, böylece ürün geliştirme kararlarını veriye dayalı olarak alabilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL tool_usage tablosuna kaydedilen verileri analiz ederek dashboard'da kullanım istatistikleri göstermelidir.

2. THE Design Kit SHALL admin kullanıcılar için ayrı bir analytics sayfası oluşturmalı ve tüm kullanıcıların istatistiklerini göstermelidir.

3. WHEN bir admin analytics sayfasını ziyaret ettiğinde, THE Design Kit SHALL en çok kullanılan araçları, günlük aktif kullanıcı sayısını, ortalama işlem süresini ve başarı oranını göstermelidir.

4. THE Design Kit SHALL her tool için ayrı ayrı kullanım grafiği (son 30 gün) göstermelidir.

5. THE Design Kit SHALL API-powered tools için ortalama işlem süresini ve başarı oranını izlemelidir.

6. THE Design Kit SHALL kullanıcı retention metriklerini (7-day, 30-day) hesaplamalı ve göstermelidir.

7. THE Design Kit SHALL conversion funnel'ı (signup → first tool use → subscription) analiz etmelidir.

### Gereksinim 10: E-posta Bildirimleri ve İletişim

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, önemli hesap olayları hakkında e-posta bildirimleri almak istiyorum, böylece abonelik durumum, kota kullanımım ve hesap güvenliğim hakkında bilgilendirilmiş olabilirim.

#### Kabul Kriterleri

1. THE Design Kit SHALL Supabase Auth'un e-posta template'lerini özelleştirmeli ve marka kimliğine uygun hale getirmelidir.

2. WHEN bir kullanıcı kayıt olduğunda, THE Design Kit SHALL hoş geldin e-postası göndermelidir.

3. WHEN bir kullanıcı abonelik satın aldığında, THE Design Kit SHALL satın alma onayı e-postası göndermelidir.

4. WHEN bir kullanıcının aboneliği iptal edildiğinde veya ödeme başarısız olduğunda, THE Design Kit SHALL bilgilendirme e-postası göndermelidir.

5. WHEN bir kullanıcının günlük kotası %90'a ulaştığında, THE Design Kit SHALL uyarı e-postası göndermelidir.

6. THE Design Kit SHALL e-posta gönderimi için bir servis (Resend, SendGrid, vb.) entegre etmelidir.

7. THE Design Kit SHALL kullanıcıların e-posta tercihlerini yönetebilmesini (marketing e-postaları, bildirimler) sağlamalıdır.


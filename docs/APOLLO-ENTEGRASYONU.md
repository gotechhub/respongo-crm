# Apollo — Faz 5 / ilk iş paketi

7 Eylül 2026. Yerel uygulama ve sahte yanıtlarla testler tamamlandı; gerçek hesap ve canlı veritabanı testi henüz yapılmadı. V2 tamamlanmış durumu korunur.

## Kullanım

Müşteri Adayları ekranında **Apollo.io ile Müşteri Adayı Bul** paneli aktif founder ve region_admin kullanıcıları içindir. Firma anahtar kelimesi, ünvan veya kişinin konumuyla arama yapılır. Sayfa başına 10 sonuç gösterilir. Founder kayıt bölgesini seçer; bölge yöneticisinin kendi bölgesi sunucuda zorlanır. Coğrafi arama filtresi ile CRM erişim bölgesi farklı kavramlardır.

Kişi seçildikten sonra kullanıcı kredi kullanabilen zenginleştirmeyi açıkça onaylar. Yalnız doğrulanmış iş e-postası ve firma adı bulunan kişi `source_type=apollo`, `external_ref=Apollo kişi kimliği`, `status=yeni` olarak kaydedilir. Kişisel e-posta, telefon ve waterfall parametreleri false gönderilir. Mevcut lead içeriği güncellenmez. Bu ilk paket yeni aday alımıdır; mevcut CRM kaydının yerinde zenginleştirilmesi ayrı iştir.

## Hesap bağlantısı

1. Apollo API anahtarında `api/v1/mixed_people/api_search` ve `api/v1/people/match` erişimlerini doğrula.
2. Anahtarı yalnız sunucu ortamına `APOLLO_API_KEY` olarak ekle (yerelde `.env.local`, dağıtımda Vercel ortam değişkenleri). Anahtarı sohbete, Git'e veya `NEXT_PUBLIC_` değişkenine koyma.
3. Ortam güncellendikten sonra uygulama yeniden başlatılmalı/dağıtılmalı. Anahtar yoksa panel bağlantının etkin olmadığını gösterir; anahtarın varlığı API erişiminin doğrulandığı anlamına gelmez.
4. İlk canlı test öncesi mevcut `leads_region_email_norm_key` / `(region, contact_email_norm)` unique yapısını, lead INSERT/SELECT RLS'ini ve `auto_assign_lead` RPC'sini mevcut canlı kaynaklarla doğrula. Bu paket yeni migration veya service-role erişimi eklemez.
5. Önce dar filtreyle arama yap. Ardından kullanıcının seçtiği tek test kişisini kredi onayıyla içe al; bölge, source_type, external_ref, atama ve tekrar içe alma sonucunu kontrol et.

## Tekrar kayıt ve hata davranışı

- Aynı bölge/kaynak/Apollo kimliği zaten varsa zenginleştirmeden önce atlanır.
- Aynı bölge/e-posta için mevcut unique constraint üzerinden `ignoreDuplicates` kullanılır. Mevcut kayıt silinmez veya güncellenmez.
- Apollo kimliği için yeni unique constraint eklenmedi. Aynı kişinin e-postasının değişmesiyle eşzamanlı gelen istekler için kimlik bazlı atomik dedup bu sürümde garanti edilmez; gerçek şema eşleştirmesinden sonra değerlendirilecek.
- Otomatik kredi harcayan retry yoktur. Süre aşımı/bağlantı kaybında Apollo isteği işlenmiş olabilir; tekrar denemeden önce kullanım kontrol edilmelidir.
- E-posta bulunamaması, kayıt/atama hatası ve kota hatası farklı sonuçlardır. Kayıt başarılı ama atama başarısızsa başarı kaydı korunur ve atama uyarısı gösterilir.
- Kullanıcı kontrollü tek kişi alımı vardır. Toplu arka plan taraması, zamanlanmış çalışma veya otomatik e-posta gönderimi eklenmedi.

## Kontroller

- `npm test`: 18 test — alan dönüşümü, aktif yönetici erişimi, bölge zorlaması, kredi onayı, dedup, API hata/limit davranışı, yazma ve atama hataları. Sahte Apollo/Supabase yanıtları; dış API veya canlı DB işlemi yok.
- İlk TypeScript ve ESLint kontrolleri geçti. Son üretim derlemesi sonucu CRM devam planına kaydedilir.
- Canlı Apollo hesabı, kredi/kota ve gerçek API yanıtı doğrulaması bekliyor. Canlıya dağıtılmadı.

## Resmî API kaynakları

7 Eylül 2026 tarihinde kontrol edildi:
- [People API Search](https://docs.apollo.io/reference/people-api-search): yeni arama endpoint'i, filtreler, sayfalama; arama e-posta/telefon döndürmez.
- [People Enrichment](https://docs.apollo.io/reference/people-enrichment): kişi ID'siyle eşleştirme, kredi kullanımı ve reveal/waterfall parametreleri.

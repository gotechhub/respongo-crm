# CRM devam planı

İnceleme: 7 Eylül 2026. Başlangıç commit'i: `7bf03a3`.

## Kaynak ve devam noktası

- `lib/nav-config.ts`: CRM ekranlarının mevcut navigasyon haritası.
- `app/(dashboard)`, `app/(portal)`, `app/api`: ekranlar, müşteri portalı ve entegrasyon uçları.
- `supabase/migrations`: depoda bulunan 14 migration; canlı veritabanına uygulanma durumu henüz doğrulanmadı.
- `docs/respongo-site-haritasi-tr-en.xlsx`: respongo.com public web sitesinin 80 sayfalık TR/EN envanteri; CRM iş listesi değildir.
- Son commit: proje/görev ayrımı, Görevlerim ekranı, görev panosu ve navigasyon düzenlemesi. Kod yorumları V3 / 3 Eylül 2026 akışına işaret ediyor.
- Önceki gereksinimler bulundu: `C:/Users/SG/Desktop/respongo-crm/RESPONGO-CRM-V2-REVISED-Yapıldı.txt` ve aynı klasördeki `Respongo-Crm.xlsx` dosyasının `Sayfa1` sayfası. V2 metni teklif şablonlarını projenin kalbi olarak tanımlar; işleri kuyruğa alarak sırayla ilerlemeyi ve HTML durum raporunu güncellemeyi ister.
- `RESPONGO-CRM-V3-REVISED.txt` boş (0 bayt). Eski HTML dosyası taranan konumlarda bulunamadı; kullanıcı daha sonra GO CRM Radar içeriğini konuşmada sağladı. Tamamlanma durumunda bu Radar kaydı esas alınır.
- `C:/Users/SG/Desktop/CRM DOSYA.xlsx` şirket dosya kategorilerini tanımlar; uygulama geliştirme sırası olarak kullanılmaz. Hesap bilgileri plan ve rapora aktarılmaz.

## Radar ile doğrulanan proje başlangıcı

Kaynak: kullanıcının bu konuşmada paylaştığı **GO CRM Radar**, son güncelleme 3 Eylül 2026. Önceki geçici kuyruk bu kayıtla düzeltilmiştir.

- Çekirdek Faz 0–4: **26/26, %100 tamamlandı**.
- V2 revizeler: **A–J tamamlandı**; K (menü/IA/UX) sürekli standart olarak tamamlandı.
- Radar kaydında **22 canlı modül, 0 açık iş** var.
- A teklif şablonları, B müşteri portalı, C satış ekibi, D.1–D.3 iş ortakları/komisyon/toplantı/hedef, E lead havuzu, F fatura, G pazarlama/web, H bildirim/takvim, I profil ve J sistem ayarları/View-As yeniden geliştirme kuyruğuna alınmayacak.
- Brevo, Paraşüt TR ve JivoChat entegrasyonları Radar'a göre canlı. Paraşüt canlı hesap testi ayrı takip fırsatı.
- J için Radar rollback-testli 5 senaryo ve READY deployment kaydı bildiriyor. Bunlar önceki doğrulama kayıtlarıdır; bu oturumda yeniden yapılmış testler olarak sunulmaz.
- Apollo.io, n8n ve Firecrawl henüz kurulmamış **Faz 5** entegrasyonlarıdır. E başlığında Apollo geçmesi, Apollo entegrasyonunun tamamlandığı anlamına gelmez.
- GA4/Ads OAuth takip fırsatıdır; G'nin tamamlanmış durumunu değiştirmez.

## Bundan sonraki sıra

| Sıra | İş | Durum ve bitiş ölçütü |
| --- | --- | --- |
| 0 | Radar ile planı uzlaştırma | Tamamlandı; biten A–K işleri yeniden açılmadı |
| 1 | Kaynak/şema senkronizasyonu | Teknik bakım: canlı SQL/migration kaynaklarını depoyla eşleştir, gerçek şemadan tip üret; canlı özellik eksikliği olarak sınıflandırma |
| 2 | Faz 5 entegrasyon tasarımı | Önerilen sıra Apollo → n8n → Firecrawl. Önce mevcut lead/atama/webhook yapısına uyum, mükerrer kayıt, bölge/izin, hata/yeniden deneme ve hesap gereksinimlerini belirle |
| 3 | İlk Faz 5 iş paketi | Apollo lead alımı/zenginleştirme: yerelde uygulandı ve test edildi; gerçek hesap bağlantısı, canlı şema/RLS doğrulaması ve kota bilgisi bağımlılıkları bekliyor |
| 4 | Sonraki entegrasyonlar | n8n otomasyonları, ardından Firecrawl; önceki paket tamamlanmadan yenisine geçme |
| 5 | İsteğe bağlı takip kuyruğu | Paraşüt canlı hesap testi, GA4/Ads OAuth; Office 365/AI/ileri reklam yönetimi eski vizyon talepleri olarak ayrı tutulur, V2 eksik işi sayılmaz |

Tek aktif iş paketiyle ilerle. Yeni istekleri kuyruğa ekle. Mevcut modüllerde yalnız somut hata veya yeni gereksinim varsa iş aç. Build/tarayıcı/regresyon kontrolleri değişikliğin kapsamına göre yapılır; tüm tamamlanmış projeyi baştan kabul testine sokmak zorunlu yeni faz değildir.

Radar mimari kuralları korunacak: RLS ve TR/global izolasyonu, hassas kolonlarda trigger koruması, silinmeyen denetim kayıtları, trigger için rollback testi, DROP+CREATE sonrası GRANT kontrolü, bildirimlerde idempotent dedup, View-As için gerçek oturum ve audit izi. Skill etkinlik sayısı Radar'ın tarihsel kaydıdır; bu oturumdaki mevcut skill araçlarıyla aynı olduğu varsayılmaz.

Güncel kısa HTML durum raporu: `docs/CRM-ROADMAP.html`.

## Bu oturumdaki düzeltme

- `/test-accounts` sayfası mevcut değilken menüde canlı (`beta`) işaretliydi. Mevcut `v1` davranışına geçirildi; artık kullanıcıyı 404'e götürmek yerine pasif gelecek özellik olarak görünür. Test hesabı oluşturma işlevi eklenmedi.

## Çalışma notları

- `npm ci --ignore-scripts --no-audit --no-fund` tamamlandı: lockfile üzerinden 704 paket kuruldu. İlk sandbox denemesi ağ erişiminden başarısız oldu; izinli tekrar başarılı.
- Kurulum sonrası `node node_modules/typescript/bin/tsc --noEmit --incremental false` başarılı (çıkış kodu 0). İlk altı eksik modül hatası giderildi; paket sürümleri değiştirilmedi.
- Kurulum sonrası `node node_modules/eslint/bin/eslint.js app components lib types middleware.ts --ext .ts,.tsx` başarılı (çıkış kodu 0, uyarı yok). Build, tarayıcı ve canlı Supabase doğrulaması henüz yapılmadı.
- Yerel Git geçmişinin tüm referanslarında SQL dosyaları tarandı; mevcut 14 migration dışında ek SQL dosyası yolu bulunamadı.

- Statik rota kontrolü: 28 canlı menü girdisinin tamamında `page.tsx` bulundu; eksik canlı rota kalmadı. `git diff --check` geçti.
- Migration metninde adı bulunmayan `.from()` bağımlılıkları: `chat_sessions`, `commission_entries`, `customer_requests`, `invoice_items`, `notifications`, `partner_meetings`, `partner_monthly_targets`, `partner_profiles`, `partner_tasks`, `proposal_template_sections`, `resources`, `social_posts`, `system_settings`, `view_as_audit_log`; ayrıca storage bucket referansı `signed-documents`.
- Migration metninde adı bulunmayan RPC'ler: `auto_assign_lead`, `generate_due_notifications`, `marketing_get_decrypted_credentials`, `marketing_get_settings_display`, `marketing_record_test_result`, `marketing_save_brevo_credentials`, `marketing_update_integration_settings`, `marketing_update_preferences`, `parasut_get_decrypted_credentials`, `parasut_get_settings_display`, `parasut_record_test_result`, `parasut_save_credentials`, `parasut_update_preferences`, `parasut_update_tokens`. Bu tarama canlı veritabanında eksiklik kanıtı değildir; depodan yeniden kurulumun doğrulanması gerektiğini gösterir.

- Otomatik commit/push betikleri mevcut; lock dosyasındaki PID inceleme sırasında çalışmıyordu. Commit/push bu çalışmanın teslim adımı olarak yapılmadı.
- İlk lint denemesi bağımlılık kurulumu ile çakıştığı için geçerli sonuç sayılmamalı; kurulum sonrasında yeniden çalıştırılmalı.
- Canlı veritabanında değişiklik, dış servise ileti gönderimi ve dağıtım yapılmadı.
- Faz 5 / Apollo: Müşteri Adayları ekranına yöneticiye özel arama ve seçerek içe alma akışı eklendi. Server Action oturum, aktif kullanıcı, rol ve bölgeyi doğrular; arama kredi kullanmaz, zenginleştirme açık onay gerektirir. Yalnız doğrulanmış iş e-postası/firma adı olan kişi eklenir; mevcut kayıtlar güncellenmez. Ayrıntı: `docs/APOLLO-ENTEGRASYONU.md`.
- Apollo doğrulaması: `npm test` ile 18 test geçti; TypeScript ve ESLint geçti. `npm run build` ağ erişimiyle derleme aşamasını başarıyla tamamladı ancak Next.js'in tür doğrulama aşaması uzun süre sonuç vermediği için kullanıcı tarafından kesilmedi, bu oturumda Ctrl+C ile sonlandırıldı. Bu nedenle üretim derlemesi başarılı kabul edilmez; deploy öncesi tekrar çalıştırılmalı.

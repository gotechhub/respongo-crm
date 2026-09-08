# Teklif Stüdyosu — yeniden tasarım kapsamı

Başlangıç: 8 Eylül 2026. Bu iş, tamamlanmış V2 teklif akışını geriye dönük bozmayacak Faz 5 iyileştirmesidir.

## Ürün ve dil kütüphanesi

Her dilde altı ana tasarım bulunacak; toplam 12 ana şablon:

| Ürün | Türkçe şablon | English template | Tasarım odağı |
| --- | --- | --- | --- |
| GOLMS | GOLMS Kurumsal Öğrenme Platformu | GOLMS Learning Management Platform | platform, güvenlik, entegrasyon ve yönetim görünürlüğü |
| GOLXP | GOLXP Öğrenme Deneyimi | GOLXP Learning Experience Platform | beceri, kişiselleştirme ve çalışan deneyimi |
| GOCATALOG | GOCATALOG Hazır Eğitim Kataloğu | GOCATALOG Ready-to-Use Learning Catalog | katalog kapsamı, içerik ortakları ve kullanım modeli |
| GOFACTORY | GOFACTORY Özel İçerik Üretimi | GOFACTORY Custom Learning Content | yaratıcı yaklaşım, üretim yöntemi ve örnek işler |
| GOTOOLS | GOTOOLS İçerik Üretim Araçları | GOTOOLS Authoring Tools | üretim hızı, yönetişim ve araç seti |
| Genel | Respongo Öğrenme Ekosistemi | Respongo Learning Ecosystem | çoklu ürün çözümü, yol haritası ve ticari paket |

Her şablonun kendine ait kapağı, ürün logosu, kapak görseli, renk uygulaması ve anlatım sırası olacak. Mevcut `public/logos` ve `assets` arşivindeki ürün varlıkları, telif/marka kullanımına uygun olanlar seçilerek `/public/proposal-assets` altına alınacak. Ham `assets` klasörü Next.js tarafından webden doğrudan servis edilmediği için doğrudan URL olarak kullanılmayacak.

## Belge yapısı

Her şablon sekiz düzenlenebilir bölümle açılır: kapak, müşteri bağlamı, kapsam, ürün hikâyesi, Türkiye ticari şartları, Global ticari şartları, ödeme bilgileri, onay ve imza. Hukuki metinler hazır şablonun içine uydurulmayacak; Respongo'nun onaylanmış TR ve Global metinleri girilene kadar boş/uyarı durumunda tutulacak.

Şablon stüdyosu tek ekranda çalışacak: ürün/dil kartları, belge bölümü navigasyonu, bölüm düzenleyici, marka önizlemesi, kopyalama ve durum yönetimi. İlk ekran ve 12 başlangıç şablonunu oluşturan yönetici işlemi yerelde eklendi. Eski kalem bazlı şablonlar geriye dönük erişilebilir kalacak, ancak yeni teklifler için ana deneyim olmayacak.

## Teklif ve müşteri akışı

1. Satış ekibi hedefi seçer, ürün/dil şablonunu seçer ve kalemleri ekler.
2. Teklif, seçilen şablonun bölümleri ve kalemleriyle bir belge sürümü oluşturur.
3. Eşik/kurala göre yönetici onayına düşer. Yönetici onaylar veya açık revizyon notu yazar.
4. Gönderilen sürüm müşteri portalında HTML teklif olarak açılır; müşteri PDF indirebilir, kabul eder, reddeder veya revizyon ister.
5. Revizyon istendiğinde yeni sürüm oluşturulur. Önceki sürüm, notu, fiyatı ve karar geçmişi değişmeden kayıt altında kalır.

`proposal_versions` migration'ı bu değiştirilemez sürüm geçmişinin temelidir. Eski tekliflerin sürümleri geriye dönük otomatik üretilmeyecek; ilk düzenleme/gönderimlerinde sürümlenecek veya kontrollü veri taşıma işiyle aktarılacak.

## Kabul ölçütleri

- 12 şablon kartı ürün ve dil bazında ayrı tasarımla görünür.
- Şablon seçimi teklifin HTML, PDF ve portal görünümünde aynı belge yapısını kullanır.
- Her gönderim/revizyon için sürüm numarası, değişiklik özeti, oluşturan kişi ve zaman saklanır.
- Müşteri yalnız kendi teklifinin geçerli ve önceki sürümlerini görür; iç onay notlarını görmez.
- Müşteri kararı geçerli sürüme bağlıdır; eski sürüm kabul/red işlemi yapamaz.
- Yönetici onayı olmadan eşik üzerindeki teklif müşteriye gönderilemez.
- PDF, HTML içeriğinin ayrı ve daha zayıf bir yorumu olmaz; aynı sürüm anlık görüntüsünden üretilir.

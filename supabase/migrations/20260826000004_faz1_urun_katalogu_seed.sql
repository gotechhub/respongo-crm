-- Faz 1 / Adım 4 — Ürün kataloğu ilk veri girişi (seed).
--
-- Kaynak: respongo.com'un canlı ürün ve fiyatlandırma sayfaları (GOLMS, GOLXP,
-- GOCATALOG, GOFACTORY, GOTOOLS/Craft/isEazy Author) + docs/respongo-site-haritasi-tr-en.xlsx
-- (26.08.2026 tarihli site haritası envanteri, 80 sayfa). Web sitesindeki hiçbir
-- ürün sayfasında GERÇEK bir liste fiyatı yayınlanmıyor — hepsi "kuruma özel
-- teklif" modeliyle satılıyor (GOLMS fiyatlandırma sayfası: kullanıcı sayısı
-- bandı + modül + entegrasyon + içerik + destek seviyesine göre özel teklif).
--
-- Bu yüzden burada eklenen unit_price değerleri BİLİNÇLİ OLARAK 0.00 —
-- gerçek rakamlar değil, iskelet/placeholder. Ürün adları, birimler (kullanıcı/yıl,
-- proje, yazar/yıl) ve kademeler (1-100, 101-500 vb.) web sitesindeki gerçek
-- yapıyı birebir yansıtıyor. Süper Admin, Fiyat Listeleri ekranından gerçek
-- rakamları girdiğinde teklif modülü doğru fiyatlarla çalışmaya başlayacak.

do $$
declare
  v_golms uuid;
  v_golxp uuid;
  v_gocatalog uuid;
  v_gofactory uuid;
  v_gotools uuid;
begin
  insert into public.price_lists (name, product, currency, is_active)
  values ('GOLMS — Lisans Fiyat Listesi', 'golms', 'USD', true)
  returning id into v_golms;

  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_golms, '1–100 kullanıcı', 'Enterprise lisans, kurulum, temel entegrasyonlar, standart destek', 'kullanıcı/yıl', 0),
    (v_golms, '101–500 kullanıcı', 'Enterprise lisans, kurulum, veri/içerik taşıma, standart destek', 'kullanıcı/yıl', 0),
    (v_golms, '501–1.000 kullanıcı', 'Enterprise lisans, gelişmiş entegrasyonlar (SSO/HRIS), öncelikli destek', 'kullanıcı/yıl', 0),
    (v_golms, '1.001–5.000 kullanıcı', 'Enterprise lisans, tam entegrasyon paketi, özel SLA', 'kullanıcı/yıl', 0),
    (v_golms, '5.000+ kullanıcı', 'Kurumsal lisans, özel SLA, ayrılmış destek ekibi', 'kullanıcı/yıl', 0);

  insert into public.price_lists (name, product, currency, is_active)
  values ('GOLXP — Lisans Fiyat Listesi', 'golxp', 'USD', true)
  returning id into v_golxp;

  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_golxp, '1–100 kullanıcı', 'AI destekli öğrenme deneyimi platformu, Skills Intelligence, Neura AI asistanı', 'kullanıcı/yıl', 0),
    (v_golxp, '101–500 kullanıcı', 'AI destekli öğrenme deneyimi platformu, Capability Intelligence Hub', 'kullanıcı/yıl', 0),
    (v_golxp, '501–1.000 kullanıcı', 'AI destekli öğrenme deneyimi platformu, gelişmiş yetkinlik analitiği', 'kullanıcı/yıl', 0),
    (v_golxp, '1.001–5.000 kullanıcı', 'AI destekli öğrenme deneyimi platformu, kurumsal entegrasyon', 'kullanıcı/yıl', 0),
    (v_golxp, '5.000+ kullanıcı', 'AI destekli öğrenme deneyimi platformu, özel SLA', 'kullanıcı/yıl', 0);

  insert into public.price_lists (name, product, currency, is_active)
  values ('GOCATALOG — Hazır Eğitim Kataloğu Fiyat Listesi', 'gocatalog', 'USD', true)
  returning id into v_gocatalog;

  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_gocatalog, 'Respongo Kataloğu', '85 Türkçe eğitim, 2 dil, yerel kurumsal içerik', 'kullanıcı/yıl', 0),
    (v_gocatalog, 'Udemy Business', '27.000+ eğitim, 10 dil, geniş global teknoloji/iş becerisi kütüphanesi', 'kullanıcı/yıl', 0),
    (v_gocatalog, 'LinkedIn Learning', '3.000+ eğitim, 13 dil, profesyonel gelişim ve kariyer becerileri', 'kullanıcı/yıl', 0),
    (v_gocatalog, 'Cegos', '1.850 eğitim, 22 dil, yumuşak beceriler ve liderlik gelişimi', 'kullanıcı/yıl', 0),
    (v_gocatalog, 'isEazy Skills', '600+ eğitim, 8 dil, interaktif mikro-öğrenme', 'kullanıcı/yıl', 0);

  insert into public.price_lists (name, product, currency, is_active)
  values ('GOFACTORY — İçerik Üretim Hizmetleri Fiyat Listesi', 'gofactory', 'USD', true)
  returning id into v_gofactory;

  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_gofactory, 'İnteraktif E-Öğrenme Modülü', 'SCORM uyumlu, quiz ve senaryo içeren özel modül üretimi', 'proje', 0),
    (v_gofactory, 'Oyun & Simülasyon', 'Gamifiye deneyimler, görev ve puanlama sistemleri', 'proje', 0),
    (v_gofactory, 'Video & Animasyon', 'Motion graphics ve karakter tabanlı anlatım', 'proje', 0),
    (v_gofactory, 'Mobil Öğrenme', 'Saha ekipleri için mikro-öğrenme içerikleri', 'proje', 0),
    (v_gofactory, 'ILT / VILT', 'Yüz yüze ve sanal eğitmen eşliğinde eğitim tasarımı', 'proje', 0),
    (v_gofactory, 'VR / 3D Deneyim', 'Sürükleyici simülasyon ve 3D öğrenme deneyimleri', 'proje', 0);

  insert into public.price_lists (name, product, currency, is_active)
  values ('GOTOOLS — Yazarlık Araçları Fiyat Listesi', 'gotools', 'USD', true)
  returning id into v_gotools;

  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_gotools, 'Craft', 'Yapay zekâ destekli mikro-öğrenme aracı — "prompttan kursa dakikalar içinde", çoklu dil ve otomatik çeviri', 'yazar/yıl', 0),
    (v_gotools, 'isEazy Author', 'Kod yazmadan sürükle-bırak kurs yazarlığı, SCORM/xAPI uyumlu çıktı', 'yazar/yıl', 0);
end $$;

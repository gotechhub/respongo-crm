-- Respongo Fiyat Listesi 2026 kaynaklı teklif kalemleri.
-- Kaynak: assets/Respongo-Fiyat-Listesi-2026.pdf (GOLMS, GOCATALOG,
-- GOFACTORY içerik hizmetleri ve GOTOOLS). GOLXP rakamları PDF'de yer almaz;
-- bu nedenle GOLXP satırları açıkça "Demo / iç planlama" olarak işaretlenir.

do $$
declare
  v_golms_addons uuid;
  v_catalog_udemy uuid;
begin
  update public.price_lists set valid_from = date '2026-01-01', valid_until = date '2026-12-31'
  where product in ('golms', 'gocatalog', 'gofactory', 'gotools');

  -- GOLMS yıllık lisans fiyatları (kullanıcı bandı başına sabit yıllık bedel).
  update public.price_list_items i set unit_price = v.price
  from (values
    ('1–100 kullanıcı', 2000::numeric), ('101–500 kullanıcı', 3000::numeric),
    ('501–1.000 kullanıcı', 5000::numeric), ('1.001–5.000 kullanıcı', 8500::numeric),
    ('5.000+ kullanıcı', 13000::numeric)
  ) as v(name, price)
  where i.name = v.name and i.price_list_id in (select id from public.price_lists where product = 'golms');

  insert into public.price_lists (name, product, currency, is_active, valid_from, valid_until)
  values ('GOLMS — Ek Hizmetler 2026', 'golms', 'USD', true, date '2026-01-01', date '2026-12-31')
  returning id into v_golms_addons;
  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_golms_addons, 'Ek Portal · 5.000 kullanıcıya kadar', 'İlave portal lisansı', 'yıl', 950),
    (v_golms_addons, 'Ek Portal · 5.000+ kullanıcı', 'İlave portal lisansı', 'yıl', 1600),
    (v_golms_addons, 'Yönetim servisi · 50 saat', 'Yıllık uzman yönetim hizmeti', 'yıl', 2500),
    (v_golms_addons, 'Ürün eğitimi · 4 saat / 2 oturum', 'Yönetici ve ekip başlangıç eğitimi', 'proje', 600),
    (v_golms_addons, 'Mobil uygulama kurulumu', 'UpsideLMS iOS ve Android', 'proje', 2800),
    (v_golms_addons, 'Mobil uygulama özel markalama', 'iOS ve Android white-label', 'proje', 6500),
    (v_golms_addons, 'Mobil uygulama yıllık güncelleme', 'iOS ve Android', 'yıl', 3000),
    (v_golms_addons, 'SSO entegrasyonu', 'Tek oturum açma entegrasyonu', 'proje', 2800),
    (v_golms_addons, 'ADFS özel SSO entegrasyonu', 'Kuruma özel ADFS yapılandırması', 'proje', 7500),
    (v_golms_addons, 'Veri aktarma hizmeti', 'LMS transferi', 'proje', 10000),
    (v_golms_addons, 'Öğrenme haritası', 'Learning Path tasarımı', 'proje', 2000),
    (v_golms_addons, 'Oyunlaştırma modülü', 'Gamification / Rosette', 'proje', 3500),
    (v_golms_addons, 'GoCloud-SaaS kurulum ve konfigürasyon', 'Tek seferlik platform kurulumu', 'proje', 5000),
    (v_golms_addons, 'Müşteri sunucusu kurulum ve konfigürasyon', 'Tek seferlik on-premise kurulum', 'proje', 8000);

  insert into public.price_lists (name, product, currency, is_active, valid_from, valid_until)
  values ('GOCATALOG — Udemy Business 2026', 'gocatalog', 'USD', true, date '2026-01-01', date '2026-12-31')
  returning id into v_catalog_udemy;
  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_catalog_udemy, '21–50 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 450),
    (v_catalog_udemy, '51–100 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 427.50),
    (v_catalog_udemy, '101–200 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 405),
    (v_catalog_udemy, '501–1.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 315),
    (v_catalog_udemy, '10.001–15.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 225),
    (v_catalog_udemy, '15.001–20.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 202.50),
    (v_catalog_udemy, '20.001–30.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 180),
    (v_catalog_udemy, '30.001–40.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 157.50),
    (v_catalog_udemy, '40.001–50.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 135),
    (v_catalog_udemy, '50.001–60.001 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 112.50),
    (v_catalog_udemy, '60.001–75.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 99),
    (v_catalog_udemy, '75.001–100.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 85.50),
    (v_catalog_udemy, '100.001–150.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 72),
    (v_catalog_udemy, '150.001–200.000 kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 63),
    (v_catalog_udemy, '200.001+ kullanıcı', 'Udemy Business yıllık birim fiyatı', 'kullanıcı/yıl', 54);

  update public.price_lists set currency = 'TRY' where product = 'gofactory';
  update public.price_list_items i set unit_price = v.price
  from (values ('Video & Animasyon', 300000::numeric), ('Oyun & Simülasyon', 1250000::numeric), ('Mobil Öğrenme', 490000::numeric), ('ILT / VILT', 45000::numeric)) as v(name, price)
  where i.name = v.name and i.price_list_id in (select id from public.price_lists where product = 'gofactory');
end $$;

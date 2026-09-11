-- Faz 6 — Genel demo veri seti
--
-- Kullanıcı isteği (birebir): "crm sisteminde hiç bir alan alt alanlar boş kalmasın hepsini demo
-- içerikler ile doldur mantığını anlayalım hepsini doldur eksik olan bütün yerleri". Kod tabanı
-- taraması (4 paralel ajan) şunu doğruladı: sadece price_lists ve proposal_templates modüllerinde
-- gerçek seed veri var — companies, contacts, customer_pool, leads, customers, licenses,
-- marketing_campaigns, invoices, projects/tasks dahil neredeyse HER modül şema+RLS olarak hazır
-- ama satır bazında tamamen boş.
--
-- TASARIM İLKESİ: her tablo SADECE O TABLO O AN TAMAMEN BOŞSA doldurulur (kullanıcı gerçek veri
-- girmeye başladıysa bu migration bir daha hiçbir şey eklemez — re-run edilebilir/idempotent).
-- Zorunlu (NOT NULL) yabancı anahtar zincirleri (customers -> licenses/proposals/invoices/projects,
-- projects -> tasks) SABİT/deterministik UUID'ler + "sadece referans verilen satır GERÇEKTEN
-- var olduğunda ekle" güvenliğiyle kuruldu — böylece companies/customers gibi bir üst tablo daha
-- önce (başka bir yoldan) doldurulmuşsa alt tablolar asla var olmayan bir satırı referans alıp
-- foreign key hatasıyla CI'ı kırmaz, sessizce atlar. Opsiyonel (nullable) bağlantılar
-- (contacts.company_id, leads.company_id vb.) "varsa bağla yoksa NULL bırak" mantığıyla bir alt
-- sorguyla çözülüyor.
--
-- Sahiplik: tüm demo kayıtların owner_id'si mevcut founder hesabına atanır — böylece Dashboard,
-- Performansım ve diğer "sadece bana ait kayıtlar" ekranları ilk günden itibaren dolu görünür.
-- Founder hesabı yoksa (teorik olarak imkansız ama savunmacı) bu migration hiçbir şey eklemez.

do $$
declare
  v_founder uuid;
begin
  select id into v_founder from public.profiles where role = 'founder' order by created_at asc limit 1;
  if v_founder is null then
    raise notice 'Founder hesabı bulunamadı, genel demo veri ataması atlanıyor.';
    return;
  end if;

  -- --------------------------------------------------------------------------
  -- 1. companies
  -- --------------------------------------------------------------------------
  insert into public.companies (id, name, industry, country, city, employee_count, region, owner_id)
  select * from (values
    ('a0000000-0000-4000-a000-000000000001'::uuid, 'Anadolu Sigorta A.Ş.', 'Sigorta', 'Türkiye', 'İstanbul', '200+', 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000002'::uuid, 'Marmara Enerji Holding', 'Enerji', 'Türkiye', 'İzmir', '200+', 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000003'::uuid, 'Kuzey Lojistik ve Taşımacılık', 'Lojistik', 'Türkiye', 'Ankara', '51-200', 'tr'::public.region, null),
    ('a0000000-0000-4000-a000-000000000004'::uuid, 'Atlas Retail Group', 'Perakende', 'Türkiye', 'Bursa', '200+', 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000005'::uuid, 'Nordic Health Systems AB', 'Sağlık', 'İsveç', 'Stockholm', '51-200', 'global'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000006'::uuid, 'Meridian Financial Services LLC', 'Finans', 'BAE', 'Dubai', '11-50', 'global'::public.region, null)
  ) as v(id, name, industry, country, city, employee_count, region, owner_id)
  where not exists (select 1 from public.companies);

  -- --------------------------------------------------------------------------
  -- 2. contacts
  -- --------------------------------------------------------------------------
  insert into public.contacts (company_id, first_name, last_name, title, email, phone, is_primary, region, owner_id)
  select * from (values
    ('a0000000-0000-4000-a000-000000000001'::uuid, 'Elif', 'Kaya', 'İK Direktörü', 'elif.kaya@anadolusigorta-demo.com', '+90 532 100 10 01', true, 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000001'::uuid, 'Barış', 'Yıldız', 'Eğitim ve Gelişim Uzmanı', 'baris.yildiz@anadolusigorta-demo.com', '+90 532 100 10 02', false, 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000002'::uuid, 'Deniz', 'Aydın', 'L&D Müdürü', 'deniz.aydin@marmaraenerji-demo.com', '+90 532 100 10 03', true, 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000003'::uuid, 'Cem', 'Öztürk', 'Operasyon Direktörü', 'cem.ozturk@kuzeylojistik-demo.com', '+90 532 100 10 04', true, 'tr'::public.region, null),
    ('a0000000-0000-4000-a000-000000000004'::uuid, 'Selin', 'Demir', 'İK Direktörü', 'selin.demir@atlasretail-demo.com', '+90 532 100 10 05', true, 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000004'::uuid, 'Kaan', 'Şahin', 'Mağaza Operasyonları Eğitim Sorumlusu', 'kaan.sahin@atlasretail-demo.com', '+90 532 100 10 06', false, 'tr'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000005'::uuid, 'Erik', 'Lindqvist', 'Head of People', 'erik.lindqvist@nordichealth-demo.com', '+46 70 100 10 07', true, 'global'::public.region, v_founder),
    ('a0000000-0000-4000-a000-000000000006'::uuid, 'Fatima', 'Al-Habsi', 'L&D Manager', 'fatima.alhabsi@meridianfs-demo.com', '+971 50 100 10 08', true, 'global'::public.region, null)
  ) as v(company_id, first_name, last_name, title, email, phone, is_primary, region, owner_id)
  where not exists (select 1 from public.contacts);

  -- --------------------------------------------------------------------------
  -- 3. customer_pool (henüz lead'e dönüşmemiş ham havuz kayıtları)
  -- --------------------------------------------------------------------------
  insert into public.customer_pool (company_name, contact_name, contact_email, contact_phone, source, country, owner_id, region, source_type)
  select * from (values
    ('Baltık Eğitim Teknolojileri', 'Anna Kowalski', 'anna.kowalski@baltikedu-demo.com', '+48 500 100 201', 'LinkedIn Ads', 'Polonya', v_founder, 'global'::public.region, 'ad_linkedin'::public.lead_source),
    ('Ege Tekstil Sanayi', 'Murat Aksoy', 'murat.aksoy@egetekstil-demo.com', '+90 532 100 202', 'Referans', 'Türkiye', v_founder, 'tr'::public.region, 'referral'::public.lead_source),
    ('Gulf Retail Partners', 'Yusuf Al-Rashid', 'yusuf.alrashid@gulfretail-demo.com', '+971 50 100 203', 'Web Formu', 'BAE', null, 'global'::public.region, 'website_form'::public.lead_source),
    ('Karadeniz Gıda A.Ş.', 'Ayşe Yılmaz', 'ayse.yilmaz@karadenizgida-demo.com', '+90 532 100 204', 'Fuar — HR Summit 2026', 'Türkiye', v_founder, 'tr'::public.region, 'manual'::public.lead_source),
    ('Alpine Manufacturing GmbH', 'Klaus Weber', 'klaus.weber@alpinemfg-demo.com', '+49 170 100 205', 'Google Ads', 'Almanya', null, 'global'::public.region, 'ad_google'::public.lead_source)
  ) as v(company_name, contact_name, contact_email, contact_phone, source, country, owner_id, region, source_type)
  where not exists (select 1 from public.customer_pool);

  -- --------------------------------------------------------------------------
  -- 4. leads — huninin 5 durumunun (yeni/görüşme/teklif/müşteri/kaybedildi) hepsinden örnek
  -- --------------------------------------------------------------------------
  insert into public.leads (company_name, contact_name, contact_email, product_interest, status, value_estimate, currency, owner_id, region, source_type)
  select * from (values
    ('Doğu Anadolu Üniversitesi', 'Prof. Dr. Hakan Er', 'hakan.er@dogu-uni-demo.edu.tr', '{golms}'::public.product_key[], 'yeni'::public.lead_status, 18000, 'USD', v_founder, 'tr'::public.region, 'website_form'::public.lead_source),
    ('Pera Otelcilik Grubu', 'Zeynep Arslan', 'zeynep.arslan@peraotel-demo.com', '{golxp,gocatalog}'::public.product_key[], 'gorusme'::public.lead_status, 32000, 'USD', v_founder, 'tr'::public.region, 'referral'::public.lead_source),
    ('Trakya Otomotiv Yan Sanayi', 'Ozan Kurt', 'ozan.kurt@trakyaotomotiv-demo.com', '{golms,gofactory}'::public.product_key[], 'teklif'::public.lead_status, 54000, 'USD', v_founder, 'tr'::public.region, 'sales_rep'::public.lead_source),
    ('Bosphorus Danışmanlık', 'Aylin Çelik', 'aylin.celik@bosphorusdanismanlik-demo.com', '{gotools}'::public.product_key[], 'kaybedildi'::public.lead_status, 9000, 'USD', v_founder, 'tr'::public.region, 'manual'::public.lead_source),
    ('Riviera Hospitality Group', 'Marco Rossi', 'marco.rossi@rivierahg-demo.com', '{golxp}'::public.product_key[], 'yeni'::public.lead_status, 21000, 'USD', null, 'global'::public.region, 'ad_google'::public.lead_source),
    ('Cascade Manufacturing Inc.', 'Emily Turner', 'emily.turner@cascademfg-demo.com', '{golms,golxp,gocatalog}'::public.product_key[], 'gorusme'::public.lead_status, 68000, 'USD', v_founder, 'global'::public.region, 'apollo'::public.lead_source),
    ('Silk Road Trading Co.', 'Aizhan Nurlanovna', 'aizhan.n@silkroadtrading-demo.com', '{gocatalog}'::public.product_key[], 'teklif'::public.lead_status, 14000, 'USD', v_founder, 'global'::public.region, 'social_other'::public.lead_source),
    ('Helvetia Precision AG', 'Thomas Meier', 'thomas.meier@helvetiaprecision-demo.com', '{gofactory}'::public.product_key[], 'kaybedildi'::public.lead_status, 41000, 'USD', null, 'global'::public.region, 'ad_linkedin'::public.lead_source),
    ('Nile Educational Services', 'Mona Farouk', 'mona.farouk@nileedu-demo.com', '{golms}'::public.product_key[], 'yeni'::public.lead_status, 12500, 'USD', v_founder, 'global'::public.region, 'website_form'::public.lead_source),
    ('Cedar Business Solutions', 'Karim Haddad', 'karim.haddad@cedarbiz-demo.com', '{golxp,gotools}'::public.product_key[], 'musteri'::public.lead_status, 27500, 'USD', v_founder, 'global'::public.region, 'referral'::public.lead_source)
  ) as v(company_name, contact_name, contact_email, product_interest, status, value_estimate, currency, owner_id, region, source_type)
  where not exists (select 1 from public.leads);

  -- --------------------------------------------------------------------------
  -- 5. customers (sabit UUID'ler — licenses/proposals/invoices/projects bunlara bağlanacak)
  -- --------------------------------------------------------------------------
  insert into public.customers (id, lead_id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone, country, owner_id, region, company_id, is_active)
  select * from (values
    ('c0000000-0000-4000-a000-000000000001'::uuid, null::uuid, 'Anadolu Sigorta A.Ş.', 'Elif Kaya', 'elif.kaya@anadolusigorta-demo.com', '+90 532 100 10 01', 'Türkiye', v_founder, 'tr'::public.region, 'a0000000-0000-4000-a000-000000000001'::uuid, true),
    ('c0000000-0000-4000-a000-000000000002'::uuid, null::uuid, 'Atlas Retail Group', 'Selin Demir', 'selin.demir@atlasretail-demo.com', '+90 532 100 10 05', 'Türkiye', v_founder, 'tr'::public.region, 'a0000000-0000-4000-a000-000000000004'::uuid, true),
    ('c0000000-0000-4000-a000-000000000003'::uuid, null::uuid, 'Nordic Health Systems AB', 'Erik Lindqvist', 'erik.lindqvist@nordichealth-demo.com', '+46 70 100 10 07', 'İsveç', v_founder, 'global'::public.region, 'a0000000-0000-4000-a000-000000000005'::uuid, true),
    ('c0000000-0000-4000-a000-000000000004'::uuid, null::uuid, 'Marmara Enerji Holding', 'Deniz Aydın', 'deniz.aydin@marmaraenerji-demo.com', '+90 532 100 10 03', 'Türkiye', v_founder, 'tr'::public.region, 'a0000000-0000-4000-a000-000000000002'::uuid, false)
  ) as v(id, lead_id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone, country, owner_id, region, company_id, is_active)
  where not exists (select 1 from public.customers);

  -- --------------------------------------------------------------------------
  -- 6. licenses — sadece yukarıdaki customer satırları gerçekten var olduğunda
  -- --------------------------------------------------------------------------
  insert into public.licenses (customer_id, product, license_name, seat_count, amount, currency, start_date, end_date, status, region, owner_id)
  select * from (values
    ('c0000000-0000-4000-a000-000000000001'::uuid, 'golms'::public.product_key, 'Anadolu Sigorta — GOLMS Kurumsal Lisans', 450, 42000, 'USD', current_date - interval '8 months', current_date + interval '4 months', 'active'::public.license_status, 'tr'::public.region, v_founder),
    ('c0000000-0000-4000-a000-000000000002'::uuid, 'golxp'::public.product_key, 'Atlas Retail — GOLXP Lisansı', 1200, 68000, 'USD', current_date - interval '10 months', current_date + interval '2 months', 'active'::public.license_status, 'tr'::public.region, v_founder),
    ('c0000000-0000-4000-a000-000000000002'::uuid, 'gocatalog'::public.product_key, 'Atlas Retail — GOCATALOG Ek Paket', 1200, 24000, 'USD', current_date - interval '10 months', current_date + interval '2 months', 'active'::public.license_status, 'tr'::public.region, v_founder),
    ('c0000000-0000-4000-a000-000000000003'::uuid, 'golms'::public.product_key, 'Nordic Health — GOLMS Global Lisans', 300, 51000, 'USD', current_date - interval '14 months', current_date - interval '2 months', 'cancelled'::public.license_status, 'global'::public.region, v_founder),
    ('c0000000-0000-4000-a000-000000000004'::uuid, 'gofactory'::public.product_key, 'Marmara Enerji — GOFACTORY Proje Bazlı', 1, 36000, 'USD', current_date - interval '6 months', current_date + interval '1 month', 'active'::public.license_status, 'tr'::public.region, v_founder)
  ) as v(customer_id, product, license_name, seat_count, amount, currency, start_date, end_date, status, region, owner_id)
  where exists (select 1 from public.customers where id = 'c0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.licenses);

  -- --------------------------------------------------------------------------
  -- 7. proposals + proposal_items
  -- --------------------------------------------------------------------------
  insert into public.proposals (id, customer_id, title, status, total_amount, currency, valid_until, owner_id)
  select * from (values
    ('e0000000-0000-4000-a000-000000000001'::uuid, 'c0000000-0000-4000-a000-000000000001'::uuid, 'Anadolu Sigorta — GOLMS Yenileme Teklifi', 'accepted'::public.proposal_status, 44000, 'USD', current_date + interval '20 days', v_founder),
    ('e0000000-0000-4000-a000-000000000002'::uuid, 'c0000000-0000-4000-a000-000000000004'::uuid, 'Marmara Enerji — GOFACTORY İçerik Üretim Teklifi', 'sent'::public.proposal_status, 36000, 'USD', current_date + interval '15 days', v_founder),
    ('e0000000-0000-4000-a000-000000000003'::uuid, 'c0000000-0000-4000-a000-000000000003'::uuid, 'Nordic Health — GOLXP Genişletme Teklifi', 'draft'::public.proposal_status, 29000, 'USD', current_date + interval '30 days', v_founder)
  ) as v(id, customer_id, title, status, total_amount, currency, valid_until, owner_id)
  where exists (select 1 from public.customers where id = 'c0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.proposals);

  insert into public.proposal_items (proposal_id, product, description, quantity, unit_price, discount_percent)
  select * from (values
    ('e0000000-0000-4000-a000-000000000001'::uuid, 'golms'::public.product_key, 'GOLMS yıllık yenileme — 450 koltuk', 450, 100, 2.2),
    ('e0000000-0000-4000-a000-000000000002'::uuid, 'gofactory'::public.product_key, 'Kuruma özel içerik üretimi — 6 modül', 6, 6000, 0),
    ('e0000000-0000-4000-a000-000000000003'::uuid, 'golxp'::public.product_key, 'GOLXP genişletme — ek 300 koltuk', 300, 96.7, 0)
  ) as v(proposal_id, product, description, quantity, unit_price, discount_percent)
  where exists (select 1 from public.proposals where id = 'e0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.proposal_items);

  -- --------------------------------------------------------------------------
  -- 8. invoices + payments
  -- --------------------------------------------------------------------------
  insert into public.invoices (id, customer_id, proposal_id, amount, currency, status, issue_date, due_date, paid_at, region, owner_id)
  select * from (values
    ('f0000000-0000-4000-a000-000000000001'::uuid, 'c0000000-0000-4000-a000-000000000001'::uuid, 'e0000000-0000-4000-a000-000000000001'::uuid, 44000, 'USD', 'paid'::public.invoice_status, current_date - interval '25 days', current_date - interval '10 days', (current_date - interval '12 days')::timestamptz, 'tr'::public.region, v_founder),
    ('f0000000-0000-4000-a000-000000000002'::uuid, 'c0000000-0000-4000-a000-000000000002'::uuid, null, 68000, 'USD', 'sent'::public.invoice_status, current_date - interval '10 days', current_date + interval '20 days', null, 'tr'::public.region, v_founder),
    ('f0000000-0000-4000-a000-000000000003'::uuid, 'c0000000-0000-4000-a000-000000000004'::uuid, null, 12000, 'USD', 'draft'::public.invoice_status, current_date, current_date + interval '30 days', null, 'tr'::public.region, v_founder)
  ) as v(id, customer_id, proposal_id, amount, currency, status, issue_date, due_date, paid_at, region, owner_id)
  where exists (select 1 from public.customers where id = 'c0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.invoices);

  insert into public.payments (invoice_id, amount, currency, method, paid_at, reference_no)
  select * from (values
    ('f0000000-0000-4000-a000-000000000001'::uuid, 44000, 'USD', 'bank_transfer'::public.payment_method, current_date - interval '12 days', 'DEMO-REF-1001')
  ) as v(invoice_id, amount, currency, method, paid_at, reference_no)
  where exists (select 1 from public.invoices where id = 'f0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.payments);

  -- --------------------------------------------------------------------------
  -- 9. marketing_campaigns
  -- --------------------------------------------------------------------------
  insert into public.marketing_campaigns (name, channel, status, product, region, budget, currency, start_date, end_date, goal_leads, description, owner_id)
  select * from (values
    ('2026 Q3 — LinkedIn Lead Gen (TR)', 'linkedin_ads'::public.campaign_channel, 'active'::public.campaign_status, 'golms'::public.product_key, 'tr'::public.region, 45000, 'USD', current_date - interval '20 days', current_date + interval '40 days', 60, 'İK/L&D karar vericilerini hedefleyen LinkedIn reklam kampanyası.', v_founder),
    ('HR Summit 2026 — Etkinlik Sponsorluğu', 'event'::public.campaign_channel, 'completed'::public.campaign_status, null, 'tr'::public.region, 30000, 'USD', current_date - interval '90 days', current_date - interval '85 days', 40, 'İstanbul HR Summit fuarında stant + konuşmacı sponsorluğu.', v_founder),
    ('Global Google Ads — GOCATALOG', 'google_ads'::public.campaign_channel, 'active'::public.campaign_status, 'gocatalog'::public.product_key, 'global'::public.region, 25000, 'USD', current_date - interval '10 days', current_date + interval '50 days', 80, 'Hazır içerik kütüphanesi için arama ağı reklamı.', v_founder),
    ('İş Ortağı Referans Programı 2026', 'referral_program'::public.campaign_channel, 'planned'::public.campaign_status, null, null, 15000, 'USD', current_date + interval '10 days', current_date + interval '190 days', 25, 'Mevcut iş ortaklarının getirdiği yeni müşteriler için komisyon artışlı referans kampanyası.', v_founder)
  ) as v(name, channel, status, product, region, budget, currency, start_date, end_date, goal_leads, description, owner_id)
  where not exists (select 1 from public.marketing_campaigns);

  -- --------------------------------------------------------------------------
  -- 10. projects -> tasks -> subtasks / task_assignees
  -- --------------------------------------------------------------------------
  insert into public.projects (id, customer_id, name, description, status, owner_id, start_date, end_date)
  select * from (values
    ('d0000000-0000-4000-a000-000000000001'::uuid, 'c0000000-0000-4000-a000-000000000001'::uuid, 'Anadolu Sigorta — GOLMS Devreye Alma', 'GOLMS kurulumu, SSO entegrasyonu ve yönetici eğitimi.', 'active'::public.project_status, v_founder, current_date - interval '30 days', current_date + interval '30 days'),
    ('d0000000-0000-4000-a000-000000000002'::uuid, 'c0000000-0000-4000-a000-000000000002'::uuid, 'Atlas Retail — GOLXP + GOCATALOG Yaygınlaştırma', 'Mağaza ekiplerine kademeli yaygınlaştırma planı.', 'active'::public.project_status, v_founder, current_date - interval '15 days', current_date + interval '60 days')
  ) as v(id, customer_id, name, description, status, owner_id, start_date, end_date)
  where exists (select 1 from public.customers where id = 'c0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.projects);

  insert into public.tasks (id, project_id, title, description, status, due_date, created_by)
  select * from (values
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'd0000000-0000-4000-a000-000000000001'::uuid, 'SSO entegrasyon kurulumu', 'Azure AD ile SSO bağlantısının kurulması ve test edilmesi.', 'in_progress'::public.task_status, current_date + interval '5 days', v_founder),
    ('b0000000-0000-4000-a000-000000000002'::uuid, 'd0000000-0000-4000-a000-000000000001'::uuid, 'Yönetici eğitimi planla', 'İK ve içerik sorumlularına yönelik GOLMS yönetici eğitimini planla.', 'todo'::public.task_status, current_date + interval '12 days', v_founder),
    ('b0000000-0000-4000-a000-000000000003'::uuid, 'd0000000-0000-4000-a000-000000000002'::uuid, 'Mağaza pilot bölgesi seçimi', '3 pilot mağaza belirlenip GOLXP/GOCATALOG erişimi açılacak.', 'done'::public.task_status, current_date - interval '5 days', v_founder),
    ('b0000000-0000-4000-a000-000000000004'::uuid, 'd0000000-0000-4000-a000-000000000002'::uuid, 'Yaygınlaştırma takvimini müşteriyle paylaş', null, 'todo'::public.task_status, current_date + interval '20 days', v_founder)
  ) as v(id, project_id, title, description, status, due_date, created_by)
  where exists (select 1 from public.projects where id = 'd0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.tasks);

  insert into public.task_assignees (task_id, profile_id)
  select t.id, v_founder from (values
    ('b0000000-0000-4000-a000-000000000001'::uuid),
    ('b0000000-0000-4000-a000-000000000002'::uuid),
    ('b0000000-0000-4000-a000-000000000003'::uuid),
    ('b0000000-0000-4000-a000-000000000004'::uuid)
  ) as t(id)
  where exists (select 1 from public.tasks where id = 'b0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.task_assignees);

  insert into public.subtasks (task_id, title, is_done, assignee_id, due_date)
  select * from (values
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'Azure AD test kullanıcısı oluştur', true, v_founder, current_date - interval '2 days'),
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'SSO giriş akışını uçtan uca test et', false, v_founder, current_date + interval '3 days'),
    ('b0000000-0000-4000-a000-000000000003'::uuid, 'Pilot mağaza listesini müşteriden al', true, v_founder, current_date - interval '8 days')
  ) as v(task_id, title, is_done, assignee_id, due_date)
  where exists (select 1 from public.tasks where id = 'b0000000-0000-4000-a000-000000000001'::uuid)
    and not exists (select 1 from public.subtasks);
end $$;

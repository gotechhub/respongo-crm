-- Faz 1 / Adım 5 — Teklif şablonları (proposal_templates) yeniden kuruluyor.
--
-- Eski (silinen) sistemde 5 ürüne özel + 1 genel teklif şablonu vardı, hepsi
-- hem TR hem EN. Bu migration önce şemayı bu ihtiyaca göre genişletiyor
-- (proposal_templates başlangıçta dil/metin alanları içermiyordu), sonra
-- respongo.com'dan araştırılan gerçek ürün bilgisiyle 12 şablon kaydı ekliyor
-- (5 ürün x 2 dil + 1 genel x 2 dil). Her ürün şablonu, bir önceki migration'da
-- (20260826000004) eklenen gerçek fiyat listesi kalemlerine bağlanıyor.
--
-- Not: unit_price alanları önceki migration'daki gibi 0 (placeholder) —
-- respongo.com'da hiçbir üründe genel liste fiyatı yok, hepsi kuruma özel
-- teklif. Süper Admin gerçek rakamları Fiyat Listeleri ekranından girdiğinde
-- şablonlar da o fiyatları otomatik yansıtacak (price_list_item_id bağlantısı
-- sayesinde).

-- ----------------------------------------------------------------------------
-- 1. Şema genişletmesi: dil + doküman metinleri
-- ----------------------------------------------------------------------------

alter table public.proposal_templates
  add column if not exists language text not null default 'tr' check (language in ('tr', 'en')),
  add column if not exists intro_text text,
  add column if not exists terms_text text,
  add column if not exists valid_days integer not null default 30;

-- Genel (çok ürünlü) şablon tek bir product_key'e sığmıyor — NULL'a izin ver.
alter table public.proposal_templates alter column product drop not null;

comment on column public.proposal_templates.language is
  'Şablonun hazırlandığı dil — tr veya en. Aynı ürün için iki ayrı satır (biri tr, biri en) olur.';
comment on column public.proposal_templates.intro_text is
  'Teklif dokümanının açılış paragrafı — müşteri karşısına ilk çıkan metin.';
comment on column public.proposal_templates.terms_text is
  'Standart geçerlilik/koşullar metni — {valid_days} yerine valid_days değeri konur.';

-- ----------------------------------------------------------------------------
-- 2. Şablonlar + kalemler
-- ----------------------------------------------------------------------------

do $$
declare
  v_id uuid;
begin
  -- ========== GOLMS ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOLMS Kurumsal Teklif Şablonu', 'golms', 'tr',
    'Yapay zekâ destekli öğrenme yönetim sistemi (LMS) için standart teklif şablonu.',
    30,
    'Merhaba, GOLMS ile [Kurum Adı] için işe alım, uyum eğitimi, satış etkinleştirme ve daha fazlasını tek platformda yönetebilirsiniz. GOLMS bugün 400''den fazla kurumda, 3 milyondan fazla aktif kullanıcıyla çalışıyor ve 4,9/5 müşteri memnuniyeti puanına sahip. Platform ISO 27001:2022, SOC 2 Type II ve GDPR uyumludur; yıllık sızma testleriyle güvenliği düzenli olarak doğrulanır. Aşağıda kurumunuza özel hazırladığımız teklifi bulabilirsiniz.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Fiyatlara kurulum, temel entegrasyon ve standart destek dahildir; ek entegrasyon ve özel geliştirme talepleri ayrıca değerlendirilir. Ödeme koşulları ve sözleşme detayları sözleşme aşamasında netleştirilir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, 'Ana lisans kalemi — kullanıcı sayısına göre teklif oluşturulurken güncellenir.', 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'golms' and pli.name = '101–500 kullanıcı';

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOLMS Enterprise Proposal Template', 'golms', 'en',
    'Standard proposal template for the AI-powered Learning Management System.',
    30,
    'Hello, with GOLMS you can manage onboarding, compliance training, sales enablement and more for [Company Name] on a single platform. GOLMS is trusted today by more than 400 organizations with over 3 million active users and a 4.9/5 customer satisfaction score. The platform is ISO 27001:2022, SOC 2 Type II and GDPR compliant, with annual penetration testing to continuously validate security. Below you will find the proposal we have prepared specifically for your organization.',
    'This proposal is valid for {valid_days} days from the issue date. Pricing includes setup, core integrations and standard support; additional integration or custom development requests will be scoped separately. Payment terms and contract details will be finalized at signing.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, 'Core license line item — updated by user tier when the quote is created.', 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'golms' and pli.name = '101–500 kullanıcı';

  -- ========== GOLXP ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOLXP Teklif Şablonu', 'golxp', 'tr',
    'Yapay zekâ destekli öğrenme deneyimi platformu için standart teklif şablonu.',
    30,
    '[Kurum Adı] için GOLXP ile öğrenmeyi doğrudan iş sonuçlarına bağlayan, yetkinlik odaklı bir deneyim sunuyoruz. Neura AI asistanı ve Skills Intelligence altyapısı sayesinde her çalışan, rolüne ve hedeflerine özel bir öğrenme yolculuğu izler. Standart sürecimiz: keşif görüşmesi → canlı demo → kuruma özel teklif → opsiyonel pilot (POC) → 4-5 hafta içinde canlıya alma.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Kesin fiyat, keşif görüşmesi ve kapsam netleşmesi sonrası güncellenir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, 'Ana lisans kalemi — kullanıcı sayısına göre teklif oluşturulurken güncellenir.', 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'golxp' and pli.name = '101–500 kullanıcı';

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOLXP Proposal Template', 'golxp', 'en',
    'Standard proposal template for the AI-powered learning experience platform.',
    30,
    'For [Company Name], GOLXP delivers a competency-driven learning experience directly tied to business outcomes. Powered by the Neura AI assistant and our Skills Intelligence framework, every employee follows a learning journey tailored to their role and goals. Our standard process: discovery call → live demo → custom proposal → optional proof-of-concept → go-live within 4–5 weeks.',
    'This proposal is valid for {valid_days} days from the issue date. Final pricing is confirmed after the discovery call and scope definition.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, 'Core license line item — updated by user tier when the quote is created.', 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'golxp' and pli.name = '101–500 kullanıcı';

  -- ========== GOCATALOG ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOCATALOG Teklif Şablonu', 'gocatalog', 'tr',
    'Hazır eğitim katalogları için standart teklif şablonu — 5 sağlayıcı tek listede.',
    30,
    'GOCATALOG ile Respongo, Udemy Business, LinkedIn Learning, Cegos ve isEazy Skills kataloglarını tek çatı altında, GOLMS veya mevcut LMS''inizle uyumlu şekilde sunuyoruz. Toplamda 30.000''den fazla hazır eğitime tek entegrasyonla erişebilirsiniz. Aşağıda ihtiyacınıza uygun katalog seçeneklerini bulabilirsiniz — teklif oluşturulurken gerekmeyen kalemleri kaldırabilirsiniz.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Fiyat; sağlayıcı, kullanıcı sayısı, lisans süresi ve kapsama göre değişir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gocatalog';

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOCATALOG Proposal Template', 'gocatalog', 'en',
    'Standard proposal template for ready-to-use course catalogs — all 5 providers in one list.',
    30,
    'With GOCATALOG, we bring the Respongo, Udemy Business, LinkedIn Learning, Cegos and isEazy Skills catalogs together under one roof, compatible with GOLMS or your existing LMS. That means access to over 30,000 ready-to-use courses through a single integration. Below you''ll find the catalog options suited to your needs — feel free to remove any line items you don''t need when creating the quote.',
    'This proposal is valid for {valid_days} days from the issue date. Pricing depends on the provider, number of users, license duration and scope.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gocatalog';

  -- ========== GOFACTORY ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOFACTORY Teklif Şablonu', 'gofactory', 'tr',
    'Kuruma özel içerik üretimi için standart teklif şablonu — 6 hizmet kategorisi.',
    30,
    'GOFACTORY, kurumunuzun eğitim ihtiyacını markanıza özel, interaktif, ölçülebilir ve LMS uyumlu dijital öğrenme deneyimlerine dönüştürür. Sadece izlenen değil, davranış değiştiren içerik üretiyoruz. İhtiyaç analizinden yayın ve desteğe kadar 10 adımlı bir süreçle ilerliyoruz. Aşağıda projenize uygun içerik üretim kalemlerini bulabilirsiniz.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Kesin fiyat, ihtiyaç analizi sonrası proje kapsamına göre netleşir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gofactory';

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOFACTORY Proposal Template', 'gofactory', 'en',
    'Standard proposal template for custom content production — 6 service categories.',
    30,
    'GOFACTORY transforms your organization''s training needs into digital learning experiences that are tailored to your brand, interactive, measurable and LMS-compatible. We don''t produce content that just gets watched — we produce learning that changes behavior. Our process runs through 10 steps, from needs analysis to launch and ongoing support. Below you''ll find the content production items suited to your project.',
    'This proposal is valid for {valid_days} days from the issue date. Final pricing is confirmed after the needs analysis, based on project scope.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gofactory';

  -- ========== GOTOOLS ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOTOOLS Teklif Şablonu', 'gotools', 'tr',
    'Kurum içi içerik üretim araçları için standart teklif şablonu — Craft + isEazy Author.',
    30,
    'GOTOOLS ile kurum içi eğitim içeriğinizi hızlı ve standartlara uygun şekilde kendi ekibinizle üretebilirsiniz. Lisanslama, kurulum, eğitim ve destek tek tedarikçiden yürütülür. Craft ile dakikalar içinde yapay zekâ destekli mikro-öğrenme içerikleri, isEazy Author ile kod yazmadan sürükle-bırak SCORM/xAPI uyumlu kurslar oluşturabilirsiniz.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Fiyat; seçilen araç, yazar sayısı, lisans süresi ve destek kapsamına göre değişir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gotools';

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'GOTOOLS Proposal Template', 'gotools', 'en',
    'Standard proposal template for in-house content authoring tools — Craft + isEazy Author.',
    30,
    'GOTOOLS lets your team produce in-house training content quickly and to standard. Licensing, setup, training and support are all handled by a single provider. With Craft, create AI-powered microlearning content in minutes; with isEazy Author, build SCORM/xAPI-compliant courses with a code-free drag-and-drop editor.',
    'This proposal is valid for {valid_days} days from the issue date. Pricing depends on the chosen tool, number of authors, license term and support scope.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  select v_id, pli.id, pli.description, 1, 0, 0
  from public.price_list_items pli join public.price_lists pl on pl.id = pli.price_list_id
  where pl.product = 'gotools';

  -- ========== GENEL / GENERAL (çok ürünlü, ekosistem teklifi) ==========
  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'Genel Ekosistem Teklif Şablonu', null, 'tr',
    'Birden fazla ürünü kapsayan, ürün seçimi teklif oluşturulurken yapılan genel şablon.',
    30,
    'Respongo, çalışanlarınızdan müşterilerinize ve iş ortaklarınıza kadar her kitle için uçtan uca bir öğrenme ekosistemi sunar: GOLMS ile öğrenme yönetimi, GOLXP ile yetkinlik odaklı deneyim, GOCATALOG ile hazır içerik, GOFACTORY ile özel içerik üretimi, GOTOOLS ile kurum içi yazarlık. Aşağıda kurumunuzun ihtiyaçlarına göre bir araya getirdiğimiz teklifi bulabilirsiniz.',
    'Bu teklif yayın tarihinden itibaren {valid_days} gün geçerlidir. Kapsam ve fiyat, seçilen ürün kombinasyonuna göre netleşir.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  values (v_id, null, 'Kapsam — hangi ürünlerin dahil olacağı görüşme sonrası netleşecek.', 1, 0, 0);

  insert into public.proposal_templates (name, product, language, description, valid_days, intro_text, terms_text)
  values (
    'General Ecosystem Proposal Template', null, 'en',
    'A multi-product template — the exact product mix is chosen when the quote is created.',
    30,
    'Respongo offers an end-to-end learning ecosystem for every audience — from employees to customers and partners: GOLMS for learning management, GOLXP for competency-driven experience, GOCATALOG for ready-made content, GOFACTORY for custom content production, and GOTOOLS for in-house authoring. Below is the proposal we''ve put together based on your organization''s needs.',
    'This proposal is valid for {valid_days} days from the issue date. Scope and pricing are finalized based on the selected product combination.'
  ) returning id into v_id;
  insert into public.proposal_template_items (template_id, price_list_item_id, description, quantity, unit_price, discount_percent)
  values (v_id, null, 'Scope — the exact products included will be confirmed after the discovery call.', 1, 0, 0);
end $$;

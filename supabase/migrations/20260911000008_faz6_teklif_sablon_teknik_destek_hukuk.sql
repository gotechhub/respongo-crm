-- Faz 6 (V5) — Kullanıcının sert ve açık geri bildirimi: "teklif şablonu çok önemli ve sen çok
-- kötü yapıyorsun bunu acil düzelt ... teknik detaylar ve teklif koşulları gerçekçi ve en iyi
-- şekilde yap". lib/proposals/template-studio.ts içinde YENİ şablonlar için zaten 3 yeni bölüm tipi
-- (technical_specs, implementation_timeline, support_sla) ve dolu bir ticari/hukuki şartlar taslağı
-- eklendi — bu migration aynı içeriği ZATEN VAR OLAN 12 kanonik şablona (5 ürün + Genel × TR/EN)
-- retroaktif olarak işliyor, böylece sadece bundan sonra oluşturulacak şablonlar değil, canlıdaki
-- mevcut şablonlar da aynı kalitede olsun.
--
-- Güvenlik notu: technical_specs içeriği respongo.com/tr/yasal/guvenlik sayfasından doğrulanan
-- gerçek iddialara dayanıyor (SOC 2 Type II ilkelerine uygunluk, ISO 27001 çerçevesi, KVKK/GDPR,
-- VAPT, MFA) — sitenin kullandığı temkinli dil ("uygunluk", "çerçeve") aynen korunuyor, Respongo'nun
-- sahip olmadığı bir sertifika iddia edilmiyor.
--
-- Sort_order stratejisi: canlıdaki mevcut şablonlarda legal_terms=50/60, bank_info=70, signature=80
-- olarak zaten var (eski şema). Bu üç yeni bölümü 41/42/43 sort_order'larıyla ekliyoruz — böylece
-- product_info(40) ile legal_terms(50) arasına doğru sırayla girerler, var olan hiçbir sort_order'ı
-- değiştirmeden/çakıştırmadan. (Bundan sonra createStudioSections() ile oluşturulacak YENİ şablonlar
-- zaten 50/60/70/80/90/100/110 şemasını kullanıyor — iki şema aynı ekranda sorunsuz çalışır, sıralama
-- her zaman `order by sort_order` ile yapılıyor.)
--
-- Idempotent: her INSERT `where not exists` ile korunuyor (tekrar çalıştırılırsa hiçbir şey eklemez),
-- legal_terms UPDATE'i SADECE hem body_tr hem body_en hâlâ boşsa çalışır (founder'ın elle girdiği
-- herhangi bir metin asla ezilmez).

with product_copy(product, phases_tr, phases_en) as (
  values
  ('golms',
    '["1. Hafta — Keşif ve kurumsal yapı/rol planlaması","2–3. Hafta — Kurulum, SSO/HRIS entegrasyonu ve içerik aktarımı","4. Hafta — Yönetici eğitimi ve pilot grup","5. Hafta — Canlıya geçiş ve ilk 30 gün yerinde destek"]'::jsonb,
    '["Week 1 — Discovery and organisational/role planning","Weeks 2–3 — Setup, SSO/HRIS integration and content migration","Week 4 — Administrator training and pilot group","Week 5 — Go-live and 30 days of hands-on support"]'::jsonb),
  ('golxp',
    '["1. Hafta — Rol/hedef bazlı akış planlaması","2–3. Hafta — Kurulum ve yapay zekâ önerisi motorunun devreye alınması","4. Hafta — Yönetici paneli eğitimi","5. Hafta — Canlıya geçiş ve kullanım takibi"]'::jsonb,
    '["Week 1 — Role/goal-based flow planning","Weeks 2–3 — Setup and activation of the AI recommendation engine","Week 4 — Manager dashboard training","Week 5 — Go-live and usage follow-up"]'::jsonb),
  ('gocatalog',
    '["1. Hafta — Erişim tanımlama ve atama kurgusu","2. Hafta — Departman/rol bazlı yayına alma","3. Hafta — Kullanım raporlama ve ince ayar"]'::jsonb,
    '["Week 1 — Access provisioning and assignment setup","Week 2 — Department/role-based rollout","Week 3 — Usage reporting and fine-tuning"]'::jsonb),
  ('gofactory',
    '["1–2. Hafta — Keşif ve öğrenme tasarımı çalıştayı","3–6. Hafta — Prodüksiyon (senaryo, görsel/animasyon, seslendirme)","7. Hafta — Revizyon turu","8. Hafta — Teslim, SCORM/xAPI paketleme ve entegrasyon (süre proje kapsamına göre değişir)"]'::jsonb,
    '["Weeks 1–2 — Discovery and learning-design workshop","Weeks 3–6 — Production (script, visuals/animation, voice-over)","Week 7 — Revision round","Week 8 — Delivery, SCORM/xAPI packaging and integration (duration varies by project scope)"]'::jsonb),
  ('gotools',
    '["1. Hafta — Lisans ve marka kiti kurulumu","2. Hafta — İçerik ekibi için yazarlık eğitimi","3. Hafta — İlk içeriklerin yayına alınması"]'::jsonb,
    '["Week 1 — Licence and brand-kit setup","Week 2 — Authoring training for your content team","Week 3 — First content pieces go live"]'::jsonb),
  ('general',
    '["1. Hafta — Mevcut sistemlerin ve ihtiyaçların keşfi","2. Hafta — Doğru Respongo ürün/ürünlerinin ve mimarinin belirlenmesi","3–4. Hafta — Kurulum ve entegrasyon","5. Hafta — Canlıya geçiş ve takip"]'::jsonb,
    '["Week 1 — Discovery of current systems and needs","Week 2 — Identifying the right Respongo product(s) and architecture","Weeks 3–4 — Setup and integration","Week 5 — Go-live and follow-up"]'::jsonb)
),
-- V6 (2026-09-12) düzeltmesi: tek düz liste yerine 4 kategoriye ayrılmış teknik özellikler —
-- lib/proposals/template-studio.ts'teki TECHNICAL_GROUPS ile birebir aynı içerik (UI'dan
-- oluşturulan YENİ şablonlarla, migration'la seed edilen şablonlar arasında tutarlılık için).
-- items_tr/items_en de AYRICA tutuluyor (gruplardan düzleştirilmiş) — eski render kodu bu
-- alanları ararsa boş kalmasın diye geriye dönük uyumluluk.
technical_shared(groups, items_tr, items_en) as (
  values (
    '[
      {"label_tr":"Güvenlik ve Uyumluluk","label_en":"Security & Compliance","items_tr":["Bilgi güvenliği yönetiminde ISO 27001 çerçevesiyle uyumlu kontroller","SOC 2 Type II ilkelerine uygun bağımsız denetim yaklaşımı","Aktarımda (TLS 1.2+) ve beklemede (AES-256) endüstri standardı şifreleme","KVKK (6698) ve GDPR gereksinimlerine uygun veri işleme yaklaşımı; talep halinde ayrı bir Veri İşleme Sözleşmesi (DPA) imzalanabilir","Rol tabanlı yetkilendirme (RBAC), en az ayrıcalık ilkesi ve çok faktörlü kimlik doğrulama (MFA)","Periyodik zafiyet taramaları ve bağımsız sızma testleri (VAPT), yılda en az bir kez"],"items_en":["Information security controls aligned with the ISO 27001 framework","Independent-audit approach following SOC 2 Type II principles","Industry-standard encryption in transit (TLS 1.2+) and at rest (AES-256)","Data processing aligned with KVKK (Turkish DPL) and GDPR requirements; a separate Data Processing Agreement (DPA) can be executed on request","Role-based access control (RBAC), least-privilege principle and multi-factor authentication (MFA)","Periodic vulnerability scans and independent penetration testing (VAPT), at least annually"]},
      {"label_tr":"Altyapı ve Güvenilirlik","label_en":"Infrastructure & Reliability","items_tr":["Bulut tabanlı, kurulum gerektirmeyen erişim — güncel bir web tarayıcısı yeterlidir","%99,5 hedeflenen aylık çalışma süresi (uptime); gerçek taahhüt hizmet sözleşmesinde (SLA) belirtilir","Düzenli otomatik yedekleme ve periyodik geri dönüş (restore) testleri","Kurtarma süresi/nokta hedefleri (RTO/RPO) hizmet sözleşmesinde belirtilir","Frankfurt (AB) bölgesinde barındırılan veritabanı altyapısı"],"items_en":["Cloud-based, no-install access — a current web browser is sufficient","Target of 99.5% monthly uptime; the contractual commitment is defined in the service agreement (SLA)","Regular automated backups and periodic restore testing","Recovery time/point objectives (RTO/RPO) are defined in the service agreement","Database infrastructure hosted in the Frankfurt (EU) region"]},
      {"label_tr":"Entegrasyonlar ve Standartlar","label_en":"Integrations & Standards","items_tr":["SSO (SAML 2.0 / OpenID Connect), HRIS, Microsoft Teams ve Zoom ile hazır entegrasyonlar","Açık REST API ve webhook desteği; üçüncü taraf sistemlerle özel entegrasyon geliştirilebilir","SCORM 1.2/2004 ve xAPI (Tin Can) içerik standartlarıyla tam uyumluluk","CSV/Excel toplu içe/dışa aktarım ve otomatik kullanıcı senkronizasyonu"],"items_en":["Ready-made SSO (SAML 2.0 / OpenID Connect), HRIS, Microsoft Teams and Zoom integrations","Open REST API and webhook support; custom integrations with third-party systems can be developed","Full compliance with SCORM 1.2/2004 and xAPI (Tin Can) content standards","Bulk CSV/Excel import/export and automated user provisioning sync"]},
      {"label_tr":"Erişilebilirlik ve Dil Desteği","label_en":"Accessibility & Language Support","items_tr":["22''den fazla dilde içerik ve arayüz desteği","Çevrimdışı çalışabilen mobil öğrenme deneyimi (iOS/Android)","WCAG 2.1 AA ilkelerini gözeten arayüz tasarımı"],"items_en":["Content and interface support in 22+ languages","Offline-capable mobile learning experience (iOS/Android)","Interface design that follows WCAG 2.1 AA principles"]}
    ]'::jsonb,
    '["Bilgi güvenliği yönetiminde ISO 27001 çerçevesiyle uyumlu kontroller","SOC 2 Type II ilkelerine uygun bağımsız denetim yaklaşımı","Aktarımda (TLS 1.2+) ve beklemede (AES-256) endüstri standardı şifreleme","KVKK (6698) ve GDPR gereksinimlerine uygun veri işleme yaklaşımı","Rol tabanlı yetkilendirme (RBAC), en az ayrıcalık ilkesi ve çok faktörlü kimlik doğrulama (MFA)","Periyodik zafiyet taramaları ve bağımsız sızma testleri (VAPT)","Bulut tabanlı, kurulum gerektirmeyen erişim","%99,5 hedeflenen aylık çalışma süresi","Düzenli otomatik yedekleme ve periyodik geri dönüş testleri","SSO, HRIS, Microsoft Teams ve Zoom ile hazır entegrasyonlar","SCORM ve xAPI içerik standartlarıyla tam uyumluluk","22''den fazla dilde içerik ve arayüz desteği","Çevrimdışı çalışabilen mobil öğrenme deneyimi"]'::jsonb,
    '["Information security controls aligned with the ISO 27001 framework","Independent-audit approach following SOC 2 Type II principles","Industry-standard encryption in transit (TLS 1.2+) and at rest (AES-256)","Data processing aligned with KVKK and GDPR requirements","Role-based access control (RBAC), least-privilege principle and multi-factor authentication (MFA)","Periodic vulnerability scans and independent penetration testing (VAPT)","Cloud-based, no-install access","Target of 99.5% monthly uptime","Regular automated backups and periodic restore testing","Ready-made SSO, HRIS, Microsoft Teams and Zoom integrations","Full compliance with SCORM and xAPI content standards","Content and interface support in 22+ languages","Offline-capable mobile learning experience"]'::jsonb
  )
),
support_shared(tiers_tr, tiers_en) as (
  values (
    '["Kritik (P1 — sistem tamamen erişilemez): 7/24 kanal, ilk yanıt 2 saat içinde","Yüksek (P2 — önemli bir işlev çalışmıyor): iş günü içinde ilk yanıt 4 saat içinde","Normal (P3 — genel soru/talep): ilk yanıt 1 iş günü içinde","Destek kanalları: destek@respongo.com (TR) / support@respongo.com (Global) ve uygulama içi destek merkezi","Standart destek saatleri: Pazartesi–Cuma 09:00–18:00 (TRT); kritik öncelik 7/24 karşılanır","Kurumsal (Enterprise) paketlerde atanmış bir Müşteri Başarı Yöneticisi (CSM) eşlik eder"]'::jsonb,
    '["Critical (P1 — system fully inaccessible): 24/7 channel, first response within 2 hours","High (P2 — a major function is broken): first response within 4 business hours","Normal (P3 — general question/request): first response within 1 business day","Support channels: destek@respongo.com (TR) / support@respongo.com (Global) and the in-app support centre","Standard support hours: Monday–Friday 09:00–18:00 (TRT); critical priority is covered 24/7","Enterprise packages include a dedicated Customer Success Manager (CSM)"]'::jsonb
  )
)
insert into public.proposal_template_sections (template_id, section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)
select t.id, x.section_type, null, x.sort_order, x.title_tr, x.title_en, '', '', x.content
from public.proposal_templates t
join product_copy pc on pc.product = coalesce(t.product::text, 'general')
cross join technical_shared ts
cross join support_shared ss
cross join lateral (
  values
    ('technical_specs', 41, 'Teknik Özellikler ve Güvenlik', 'Technical Specifications & Security',
      jsonb_build_object('groups', ts.groups, 'items_tr', ts.items_tr, 'items_en', ts.items_en)),
    ('implementation_timeline', 42, 'Uygulama Planı', 'Implementation Plan',
      jsonb_build_object('phases_tr', pc.phases_tr, 'phases_en', pc.phases_en)),
    ('support_sla', 43, 'Destek ve Hizmet Seviyesi (SLA)', 'Support & Service Level Agreement',
      jsonb_build_object('tiers_tr', ss.tiers_tr, 'tiers_en', ss.tiers_en))
) as x(section_type, sort_order, title_tr, title_en, content)
where not exists (
  select 1 from public.proposal_template_sections s
  where s.template_id = t.id and s.section_type = x.section_type
);

-- Ticari ve hukuki şartlar taslağı — SADECE hem body_tr hem body_en hâlâ boş/null olan legal_terms
-- satırlarını doldurur (founder herhangi bir dilde elle bir şey yazmışsa o satıra hiç dokunulmaz).
-- V6 (2026-09-12) düzeltmesi: legal_region='tr' ve legal_region='us' (Global) artık GERÇEKTEN
-- FARKLI metin alıyor (önceki sürümde ikisi de birebir aynı Türkiye-özel metni taşıyordu) — bkz.
-- lib/proposals/template-studio.ts LEGAL_GLOBAL_BODY_TR/EN ile birebir aynı içerik.
update public.proposal_template_sections
set body_tr = '[TASLAK — bu bölüm hukuk danışmanınızca onaylanmadan yürürlüğe girmemelidir]

• Ödeme Şartları: Faturalar teklifin onaylanmasını takiben düzenlenir; ödeme vadesi, aksi kararlaştırılmadıkça fatura tarihinden itibaren 30 gündür. Gecikme halinde yasal gecikme faizi uygulanabilir.
• Yenileme: Lisans/hizmet süresi sona ermeden en az 30 gün önce taraflardan biri yazılı olarak fesih bildirmediği sürece sözleşme aynı şartlarla 1 yıl daha uzar.
• Fesih: Taraflardan biri esaslı bir yükümlülüğünü ihlal eder ve 30 günlük yazılı ihtara rağmen düzeltmezse, diğer taraf sözleşmeyi feshedebilir.
• Gizlilik: Taraflar, işbu teklif kapsamında öğrendikleri ticari ve teknik bilgileri üçüncü kişilerle paylaşmayacak, karşılıklı gizlilik yükümlülüğüne uyacaktır.
• Fikri Mülkiyet: Respongo platformları ve alt yapısına ait tüm fikri mülkiyet hakları Respongo''ya aittir; müşteri kendi verileri ve platformda ürettiği içerik üzerindeki haklarını korur.
• Kişisel Verilerin Korunması: Taraflar 6698 sayılı KVKK kapsamındaki yükümlülüklerini yerine getirir; veri işleme ilişkisinin detayları ayrı bir Veri İşleme Sözleşmesi (DPA) ile belirlenebilir.
• Sorumluluk Sınırı: Respongo''nun bu teklife dayalı sözleşmeden doğan toplam sorumluluğu, ilgili 12 aylık dönemde ödenen toplam bedeli aşamaz; dolaylı zararlar kapsam dışıdır.
• Mücbir Sebep: Taraflar, makul kontrolleri dışındaki mücbir sebep hallerinde yükümlülüklerini yerine getirememekten sorumlu tutulamaz.
• Uygulanacak Hukuk ve Yetki: İşbu teklife ve doğacak sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır; uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir.
• Geçerlilik: Bu teklif, hazırlanma tarihinden itibaren 30 gün geçerlidir.',
    body_en = '[DRAFT — this section must be reviewed and approved by your legal counsel before it takes effect]

• Payment Terms: Invoices are issued following acceptance of this proposal; payment is due within 30 days of the invoice date unless otherwise agreed. Late payment may be subject to statutory interest.
• Renewal: Unless either party gives written notice of termination at least 30 days before the term ends, the agreement automatically renews for a further 1-year term under the same terms.
• Termination: Either party may terminate for uncured material breach following 30 days'' written notice.
• Confidentiality: Each party will keep the other''s confidential business and technical information disclosed under this proposal confidential, on a mutual basis.
• Intellectual Property: Respongo retains all intellectual property rights in its platforms and infrastructure; the customer retains rights to its own data and to content it produces on the platform.
• Data Protection: The parties will meet their obligations under the Turkish Personal Data Protection Law (KVKK No. 6698); a separate Data Processing Agreement (DPA) can be executed to govern the details.
• Limitation of Liability: Respongo''s total liability under any agreement resulting from this proposal is capped at the fees paid in the preceding 12 months, excluding indirect or consequential damages.
• Force Majeure: Neither party is liable for failure to perform due to causes beyond its reasonable control.
• Governing Law & Jurisdiction: This proposal and any resulting agreement are governed by the laws of the Republic of Türkiye; disputes are subject to the courts and execution offices of Istanbul (Merkez), unless the definitive agreement specifies otherwise.
• Validity: This proposal is valid for 30 days from the date of preparation.'
where section_type = 'legal_terms'
  and legal_region = 'tr'
  and (body_tr is null or btrim(body_tr) = '')
  and (body_en is null or btrim(body_en) = '');

update public.proposal_template_sections
set body_tr = '[TASLAK — bu bölüm hukuk danışmanınızca onaylanmadan yürürlüğe girmemelidir]

• Ödeme Şartları: Faturalar USD veya EUR olarak düzenlenir; ödeme vadesi, aksi kararlaştırılmadıkça fatura tarihinden itibaren 30 gündür. Banka transfer masrafları alıcıya aittir.
• Yenileme: Lisans/hizmet süresi sona ermeden en az 30 gün önce taraflardan biri yazılı olarak fesih bildirmediği sürece sözleşme aynı şartlarla 1 yıl daha uzar.
• Fesih: Taraflardan biri esaslı bir yükümlülüğünü ihlal eder ve 30 günlük yazılı ihtara rağmen düzeltmezse, diğer taraf sözleşmeyi feshedebilir.
• Gizlilik: Taraflar, işbu teklif kapsamında öğrendikleri ticari ve teknik bilgileri üçüncü kişilerle paylaşmayacak, karşılıklı gizlilik yükümlülüğüne uyacaktır.
• Fikri Mülkiyet: Respongo platformları ve alt yapısına ait tüm fikri mülkiyet hakları Respongo''ya aittir; müşteri kendi verileri ve platformda ürettiği içerik üzerindeki haklarını korur.
• Kişisel Verilerin Korunması: Respongo, müşterinin bulunduğu ülkede uygulanabilir olduğu ölçüde Genel Veri Koruma Tüzüğü''ne (GDPR) uygun bir veri işleme yaklaşımı benimser; detaylar ayrı bir Veri İşleme Sözleşmesi (DPA) ile belirlenebilir.
• Sorumluluk Sınırı: Respongo''nun bu teklife dayalı sözleşmeden doğan toplam sorumluluğu, ilgili 12 aylık dönemde ödenen toplam bedeli aşamaz; dolaylı zararlar kapsam dışıdır.
• Mücbir Sebep: Taraflar, makul kontrolleri dışındaki mücbir sebep hallerinde yükümlülüklerini yerine getirememekten sorumlu tutulamaz.
• Uygulanacak Hukuk ve Uyuşmazlık Çözümü: İşbu teklife ve doğacak sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır; taraflar arasındaki uyuşmazlıklar, aksi kararlaştırılmadıkça İstanbul''da, İngilizce dilinde, tek hakemli tahkim yoluyla çözülür.
• Geçerlilik: Bu teklif, hazırlanma tarihinden itibaren 30 gün geçerlidir.',
    body_en = '[DRAFT — this section must be reviewed and approved by your legal counsel before it takes effect]

• Payment Terms: Invoices are issued in USD or EUR; payment is due within 30 days of the invoice date unless otherwise agreed. Bank transfer fees are borne by the payer.
• Renewal: Unless either party gives written notice of termination at least 30 days before the term ends, the agreement automatically renews for a further 1-year term under the same terms.
• Termination: Either party may terminate for uncured material breach following 30 days'' written notice.
• Confidentiality: Each party will keep the other''s confidential business and technical information disclosed under this proposal confidential, on a mutual basis.
• Intellectual Property: Respongo retains all intellectual property rights in its platforms and infrastructure; the customer retains rights to its own data and to content it produces on the platform.
• Data Protection: Respongo adopts a data processing approach aligned with the General Data Protection Regulation (GDPR) to the extent applicable in the customer''s jurisdiction; details can be governed by a separate Data Processing Agreement (DPA).
• Limitation of Liability: Respongo''s total liability under any agreement resulting from this proposal is capped at the fees paid in the preceding 12 months, excluding indirect or consequential damages.
• Force Majeure: Neither party is liable for failure to perform due to causes beyond its reasonable control.
• Governing Law & Dispute Resolution: This proposal and any resulting agreement are governed by the laws of the Republic of Türkiye; unless otherwise agreed, disputes are finally resolved by sole-arbitrator arbitration seated in Istanbul, conducted in English.
• Validity: This proposal is valid for 30 days from the date of preparation.'
where section_type = 'legal_terms'
  and legal_region = 'us'
  and (body_tr is null or btrim(body_tr) = '')
  and (body_en is null or btrim(body_en) = '');

-- Faz 6 (V5) — DÖRDÜNCÜ örneği: teklif şablonlarının TEMEL 8 bölümü (kapak, müşteri bilgisi,
-- kapsam, ürün anlatımı, hukuki şartlar×2, ödeme bilgisi, onay) hiçbir migration dosyasında hiç
-- oluşturulmamış.
--
-- Bu, önceki oturumlarda bulunan customer_requests / partner_profiles+kaynaklar / lead
-- contact_email_norm+auto_assign_lead / proposal_template_sections TABLOSU (bkz. 20260908000000)
-- ile AYNI SINIF hata: canlı veritabanında bu içerik muhtemelen elle (execute_sql ile doğrudan)
-- oluşturulmuş — kullanıcının paylaştığı ekran görüntüleri dolu/çalışan bir düzenleyici gösteriyordu
-- — ama migration geçmişi eksik. Bu, yerel bir Postgres kopyasında TÜM migration geçmişi sıfırdan
-- tekrar oynatılarak doğrulanırken ortaya çıktı: 20260911000008 (teknik özellikler/uygulama planı/
-- destek-SLA) çalıştırıldıktan sonra proposal_template_sections tablosunda SADECE o 3 yeni bölüm
-- vardı, temel 8 bölüm YOKTU — yani sıfırdan bir ortamda (yedekten geri yükleme, yeni staging, ya da
-- "supabase db push --include-all") teklif şablonu düzenleyicisi TAMAMEN BOŞ açılırdı.
--
-- Bu migration, lib/proposals/template-studio.ts'teki createStudioSections()/PROPOSAL_COPY ile
-- BİREBİR aynı içeriği (respongo.com'dan araştırılan gerçek ürün metinleri + V5'te eklenen dolu
-- ticari/hukuki şartlar taslağı) SQL'e taşıyor. Her INSERT `where not exists` ile korunuyor —
-- canlıda bu bölümler zaten elle oluşturulmuşsa hiçbir şey yapmaz ve mevcut içeriği/founder
-- düzenlemelerini asla ezmez; sadece sıfırdan bir ortamda doğru temel içeriği kurar.
--
-- Sort_order: 10/20/30/40 (temel dört bölüm) mevcut şemayla zaten tutarlı; legal_terms/bank_info/
-- signature için canlıda muhtemelen kullanılan 50/60/70/80 korunuyor (20260911000008'in yeni
-- bölümleri için seçtiği 41/42/43 ile çakışmıyor — sıralama her zaman `order by sort_order`).

with product_copy(product, cover_tr, cover_en, product_tr, product_en, included_tr, included_en, excluded_tr, excluded_en, cover_image, accent) as (
  values
  ('golms',
    'Respongo''nun 17+ yıllık kurumsal öğrenme deneyimiyle kurulan GOLMS Kurumsal Öğrenme Platformu, eğitim operasyonunuzu atama, takip, sertifikasyon ve raporlamayla tek merkezden yönetmenizi sağlar. Bugün 400''den fazla kurumun ve 5 milyondan fazla kullanıcının güvendiği aynı sistemi kurumunuza özel olarak tasarlıyoruz.',
    'Built on Respongo''s 17+ years of enterprise learning experience, the GOLMS Learning Management Platform lets you manage assignments, tracking, certification and reporting from a single hub — the same system trusted by 400+ organisations and 5M+ users worldwide, tailored to yours.',
    'GOLMS; yetkinlik, uyum (compliance) ve tamamlama takibini tek panelde birleştirir. SSO, İK/HRIS sistemleri, Microsoft Teams ve Zoom ile hazır entegrasyonlar sunar; çevrimdışı kullanılabilen mobil öğrenme desteğiyle sahadaki ekipler de eğitim operasyonunun dışında kalmaz.',
    'GOLMS brings competency, compliance and completion tracking together on a single dashboard. It ships with ready SSO, HRIS, Microsoft Teams and Zoom integrations, plus offline-capable mobile learning so field teams stay covered.',
    '["Kurumsal yapı ve rol/departman tanımlarının GOLMS''e aktarılması","SSO, HRIS, Microsoft Teams ve Zoom entegrasyon kurulumu","Yönetici ve içerik sorumlusu eğitimi","Canlıya geçiş ve ilk 30 gün yerinde destek"]'::jsonb,
    '["Migrating your organisational structure and role/department definitions into GOLMS","SSO, HRIS, Microsoft Teams and Zoom integration setup","Administrator and content-owner training","Go-live and 30 days of hands-on support"]'::jsonb,
    '["Kapsam dışı özel entegrasyon geliştirmeleri","Üçüncü taraf lisans bedelleri (SSO sağlayıcı, HRIS vb.)"]'::jsonb,
    '["Custom integration development outside this scope","Third-party licence fees (SSO provider, HRIS, etc.)"]'::jsonb,
    '/proposal-assets/golms-dashboard.avif', '#2563eb'),
  ('golxp',
    'GOLXP Öğrenme Deneyimi Platformu, eğitimi bir zorunluluktan bir alışkanlığa dönüştürür: her çalışan, rolüne, hedeflerine ve ilgi alanlarına göre kişiselleştirilmiş kendi öğrenme akışını ve beceri haritasını görür.',
    'The GOLXP Learning Experience Platform turns training from an obligation into a habit: every employee gets a personalised learning flow and skill map based on their role, goals and interests.',
    'GOLXP; yapay zekâ destekli, beceri odaklı içerik keşfi ile çalışana rolüne ve hedeflerine uygun önerileri otomatik sunar. Yetkinlik açığı görünürlüğü, yöneticilerin ekip bazında gelişim ihtiyacını netleştirmesini sağlar.',
    'GOLXP uses AI-powered, skills-based content discovery to automatically surface recommendations matched to each employee''s role and goals. Skill-gap visibility gives managers a clear view of team-level development needs.',
    '["Rol ve hedef bazlı öğrenme akışı kurgusu","Yapay zekâ destekli içerik önerisi motorunun devreye alınması","Yetkinlik haritası ve beceri açığı analizi kurulumu","Yönetici paneli eğitimi ve canlı destek"]'::jsonb,
    '["Role- and goal-based learning flow configuration","Activating the AI-powered content recommendation engine","Skill map and skill-gap analysis setup","Manager dashboard training and live support"]'::jsonb,
    '["Özel içerik üretimi (GOFACTORY kapsamındadır)","Üçüncü taraf içerik lisans bedelleri"]'::jsonb,
    '["Custom content production (covered separately under GOFACTORY)","Third-party content licence fees"]'::jsonb,
    '/proposal-assets/golxp-dashboard.avif', '#7c3aed'),
  ('gocatalog',
    'GOCATALOG ile beklemeden başlıyorsunuz: Respongo, isEazy Skills, Cegos, Udemy Business ve LinkedIn Learning gibi ortaklardan derlenen, 22''den fazla dilde güncel bir hazır eğitim kütüphanesine anında erişim.',
    'With GOCATALOG you start without waiting: instant access to an up-to-date, ready-to-use training library spanning 22+ languages, curated from partners including Respongo, isEazy Skills, Cegos, Udemy Business and LinkedIn Learning.',
    'GOCATALOG, kurumunuzun kendi özel içerik üretimini beklemeden eğitime başlamasını sağlar. 22''den fazla dilde, düzenli güncellenen bir kütüphaneyle departman ve rol bazlı atama yapabilirsiniz.',
    'GOCATALOG lets your organisation start training immediately, without waiting on custom content production. With a regularly refreshed library spanning 22+ languages, you can assign by department and role.',
    '["22+ dilde hazır kütüphaneye erişim tanımlama","Departman/rol bazlı atama kurgusu","Kullanım ve tamamlama raporlama panelinin devreye alınması","İlk 90 gün kullanım desteği"]'::jsonb,
    '["Provisioning access to the 22+ language ready-made library","Department/role-based assignment setup","Activating the usage and completion reporting dashboard","90 days of onboarding support"]'::jsonb,
    '["Kurum içi özel içerik üretimi","GOLMS/GOLXP dışında üçüncü taraf platform entegrasyonu"]'::jsonb,
    '["In-house custom content production","Third-party platform integrations outside GOLMS/GOLXP"]'::jsonb,
    '/proposal-assets/gocatalog-learning.avif', '#0f766e'),
  ('gofactory',
    'GOFACTORY ile kuruma özel içerik üretiyoruz: sistemli, ölçülebilir ve markanıza birebir. Öğrenme tasarımından 2D/3D animasyona, canlı çekimden VR/360° deneyimlere kadar uçtan uca prodüksiyonu, SCORM/xAPI standartlarında paketleyerek teslim ediyoruz.',
    'GOFACTORY produces content tailored to your organisation — systematic, measurable and true to your brand. From learning design to 2D/3D animation, live-action and VR/360° experiences, we deliver end-to-end production packaged to SCORM/xAPI standards.',
    'GOFACTORY ekibi, öğrenme tasarımı uzmanlığını kurumunuzun marka diliyle birleştirir: senaryo ve storyboard aşamasından, 2D/3D animasyon, canlı çekim ve VR/360° deneyimlere kadar geniş bir prodüksiyon yelpazesi sunar.',
    'The GOFACTORY team pairs learning-design expertise with your brand''s voice, offering a full production range — from script and storyboard through 2D/3D animation, live-action and VR/360° experiences.',
    '["İçerik keşif ve öğrenme tasarımı çalıştayı","Senaryo, storyboard ve görsel tasarım","SCORM/xAPI paketleme ve kalite kontrolü","1 revizyon turu"]'::jsonb,
    '["Discovery and learning-design workshop","Script, storyboard and visual design","SCORM/xAPI packaging and QA","One round of revisions"]'::jsonb,
    '["3D/VR prodüksiyon (talep halinde ayrı teklif kapsamına eklenir)","Seslendirme/dublaj için üçüncü taraf stüdyo bedelleri"]'::jsonb,
    '["3D/VR production (added under a separate scope on request)","Third-party voice-over/dubbing studio fees"]'::jsonb,
    '/proposal-assets/gofactory-content.avif', '#ea580c'),
  ('gotools',
    'GOTOOLS ile kurum içi içerik üretimini dış bağımlılık olmadan hızlandırıyorsunuz. Craft ve isEazy Author gibi bulut tabanlı yazarlık araçlarıyla ekibiniz, kurumsal şablonlar ve marka kiti üzerinden hızlı, tutarlı içerik üretip anında güncelleyebilir.',
    'GOTOOLS lets you accelerate in-house content production without external dependencies. With cloud-based authoring tools like Craft and isEazy Author, your team can produce fast, consistent content on corporate templates and a brand kit.',
    'GOTOOLS; Craft ve isEazy Author bulut tabanlı yazarlık araçlarını, kurumunuza özel şablonlar ve marka kitiyle birlikte devreye alır. İçerik ekibiniz dış ajansa bağımlı kalmadan üretim yapar.',
    'GOTOOLS deploys the Craft and isEazy Author cloud authoring tools together with templates and a brand kit built for your organisation. Your content team produces without relying on external agencies.',
    '["Craft / isEazy Author lisanslarının kurulumu","Kurumsal şablon ve marka kiti tanımlama","İçerik ekibi için yazarlık eğitimi","İlk 60 gün teknik destek"]'::jsonb,
    '["Craft / isEazy Author licence setup","Corporate template and brand kit configuration","Authoring training for your content team","60 days of technical support"]'::jsonb,
    '["Kurum içi ekip tarafından üretilecek içeriklerin kendisi","Üçüncü taraf stok görsel/video lisansları"]'::jsonb,
    '["The content itself, produced by your in-house team","Third-party stock image/video licences"]'::jsonb,
    '/proposal-assets/gotools-craft.avif', '#0891b2'),
  ('general',
    'Respongo, 17+ yıllık uzmanlığı, 400''den fazla kurumsal müşterisi ve 5 milyondan fazla kullanıcıya ulaşan öğrenme ekosistemiyle içerik üretimini, teknoloji platformlarını ve danışmanlığı tek çatı altında birleştirir. Bu teklif, kurumunuzun ihtiyacına en uygun Respongo çözümünü/çözümlerini bir araya getirir.',
    'With 17+ years of expertise, 400+ corporate clients and a learning ecosystem reaching 5M+ users, Respongo brings content production, technology platforms and consulting together under one roof.',
    'Respongo ekosistemi; öğrenme yönetimi (GOLMS), öğrenme deneyimi (GOLXP), hazır içerik kütüphanesi (GOCATALOG), kuruma özel içerik üretimi (GOFACTORY) ve içerik üretim araçlarını (GOTOOLS) tek bir stratejinin parçaları olarak sunar.',
    'The Respongo ecosystem brings learning management (GOLMS), learning experience (GOLXP), a ready-made content library (GOCATALOG), custom content production (GOFACTORY) and authoring tools (GOTOOLS) together as parts of one strategy.',
    '["Mevcut sistemlerin ve ihtiyaçların keşfi","Doğru Respongo ürün/ürünlerinin belirlenmesi","Uygulama planı ve zaman çizelgesi","Canlıya geçiş ve takip"]'::jsonb,
    '["Discovery of current systems and needs","Identifying the right Respongo product(s)","Implementation plan and timeline","Go-live and follow-up"]'::jsonb,
    '["Kapsam dışı özel geliştirmeler","Üçüncü taraf lisans ve altyapı bedelleri"]'::jsonb,
    '["Out-of-scope custom development","Third-party licence and infrastructure fees"]'::jsonb,
    '/proposal-assets/respongo-ecosystem.avif', '#172554')
),
legal_draft(body_tr, body_en) as (
  values (
    '[TASLAK — bu bölüm hukuk danışmanınızca onaylanmadan yürürlüğe girmemelidir]

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
    '[DRAFT — this section must be reviewed and approved by your legal counsel before it takes effect]

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
  )
),
-- V6 (2026-09-12) düzeltmesi: legal_region='us' (Global) satırı artık gerçekten farklı bir
-- taslak alıyor — önceki sürümde legal_draft ile BİREBİR AYNI (sadece başlığı farklı) Türkiye
-- şartları kullanılıyordu. Bkz. lib/proposals/template-studio.ts LEGAL_GLOBAL_BODY_TR/EN.
legal_global_draft(body_tr, body_en) as (
  values (
    '[TASLAK — bu bölüm hukuk danışmanınızca onaylanmadan yürürlüğe girmemelidir]

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
    '[DRAFT — this section must be reviewed and approved by your legal counsel before it takes effect]

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
  )
)
insert into public.proposal_template_sections (template_id, section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)
select t.id, x.section_type, x.legal_region, x.sort_order, x.title_tr, x.title_en, x.body_tr, x.body_en, x.content
from public.proposal_templates t
join product_copy pc on pc.product = coalesce(t.product::text, 'general')
cross join legal_draft ld
cross join legal_global_draft lgd
cross join lateral (
  values
    ('cover', null::text, 10, 'Teklif', 'Proposal', pc.cover_tr, pc.cover_en,
      jsonb_build_object('cover_image', pc.cover_image, 'accent', pc.accent)),
    ('customer_info', null::text, 20, 'Müşteri Bilgileri', 'Customer details', '', '', '{}'::jsonb),
    ('scope', null::text, 30, 'Kapsam', 'Scope', '', '',
      jsonb_build_object('included_tr', pc.included_tr, 'included_en', pc.included_en, 'excluded_tr', pc.excluded_tr, 'excluded_en', pc.excluded_en)),
    ('product_info', null::text, 40, 'Çözüm Hakkında', 'About the solution', pc.product_tr, pc.product_en,
      jsonb_build_object('cover_image', pc.cover_image, 'accent', pc.accent)),
    ('legal_terms', 'tr', 50, 'Ticari ve Hukuki Şartlar', 'Commercial & legal terms', ld.body_tr, ld.body_en, jsonb_build_object('review_required', true)),
    ('legal_terms', 'us', 60, 'Uluslararası Ticari ve Hukuki Şartlar', 'International commercial & legal terms', lgd.body_tr, lgd.body_en, jsonb_build_object('review_required', true)),
    ('bank_info', null::text, 70, 'Ödeme Bilgileri', 'Payment details', '', '',
      jsonb_build_object('bank_name', '', 'account_name', '', 'iban', '', 'swift', '', 'currency', '')),
    ('signature', null::text, 80, 'Onay', 'Acceptance', '', '', '{}'::jsonb)
) as x(section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)
where not exists (
  select 1 from public.proposal_template_sections s
  where s.template_id = t.id
    and s.section_type = x.section_type
    and s.legal_region is not distinct from x.legal_region
);

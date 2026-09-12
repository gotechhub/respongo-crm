-- ============================================================================
-- Respongo CRM — Faz 6 / Adım 2: Demo veri — Kaynaklar + mevcut iş ortağı
-- hesapları için toplantı/hedef/görev örnekleri.
--
-- Kaynaklar: kullanıcı sayısından bağımsız, koşulsuz seed (tablo boşsa).
-- Toplantı/hedef/görev: SADECE o an partner_profiles'ta GERÇEKTEN var olan
-- bir iş ortağı hesabı için eklenir (var olmayan bir auth.users satırına
-- sahte veri bağlamak güvenli değil) — bu yüzden "insert into ... select
-- ... from public.partner_profiles" desenini kullanıyoruz. Founder henüz
-- hiç iş ortağı davet etmediyse bu adımlar sessizce hiçbir şey eklemez;
-- ilk iş ortağı hesabı oluşturulduğunda (İş Ortakları > Yeni İş Ortağı
-- Ekle) panel zaten gerçek verilerle dolacaktır — bu migration sadece
-- MEVCUT hesaplar için "ilk günden itibaren boş görünmesin" amaçlı örnek
-- veri ekler.
-- Komisyon kayıtları (commission_entries) burada elle eklenmiyor — onlar
-- zaten trg_calculate_partner_commission trigger'ı ile bir teklif kabul
-- edildiğinde otomatik oluşuyor; sahte komisyon kaydı eklemek gerçek mali
-- veriyle karışabileceğinden kasıtlı olarak yapılmadı.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Kaynaklar — satış konuşması, ürün tanıtımı, sözlük, hedef kitle, onboarding
-- ----------------------------------------------------------------------------

insert into public.resources (category, title_tr, title_en, body_tr, body_en, url, sort_order)
select * from (values
  ('sales_pitch', 'Respongo 60 Saniyelik Tanıtım Konuşması', 'Respongo 60-Second Pitch',
    'Respongo, kurumların eğitim, gelişim ve performans süreçlerini tek bir çatı altında toplayan bir kurumsal öğrenme teknolojisi şirketidir. GOLMS ile öğrenmeyi yönetir, GOLXP ile öğrenme deneyimini kişiselleştirir, GOCATALOG ile hazır içerik sağlar, GOFACTORY ile kuruma özel içerik üretir, GOTOOLS ile mikro-öğrenme araçları sunarız. Hedefimiz: kurumların İK ve eğitim ekiplerinin, dağınık araçlar yerine tek bir ekosistemle çalışmasını sağlamak.',
    'Respongo is a corporate learning technology company that brings training, development and performance processes under one roof. GOLMS manages learning, GOLXP personalizes the learning experience, GOCATALOG provides ready content, GOFACTORY produces company-specific content, and GOTOOLS offers micro-learning tools. Our goal: let HR and L&D teams work with one ecosystem instead of scattered tools.',
    null, 0),
  ('sales_pitch', 'Fiyatlandırma ve Paket Mantığı', 'Pricing & Packaging Logic',
    'Fiyatlandırma kullanıcı/koltuk sayısı ve seçilen ürün kombinasyonuna göre değişir. Güncel fiyat listesi için Fiyat Listeleri modülüne bak — oradaki tutarlar teklif oluştururken otomatik önerilir, teklif aşamasında müşteriye özel indirim uygulanabilir.',
    'Pricing varies by seat count and the selected product combination. See the Price Lists module for current figures — those amounts are auto-suggested when creating a proposal, and a customer-specific discount can be applied at proposal stage.',
    '/sales/price-lists', 1),
  ('product', 'GOLMS — Kurumsal Öğrenme Yönetim Sistemi', 'GOLMS — Corporate Learning Management System',
    'Bulut tabanlı LMS; rol bazlı katalog, SCORM/xAPI desteği, sınav ve sertifika yönetimi, detaylı raporlama, çoklu dil desteği, SSO ve HRIS entegrasyonlarıyla kurumun tüm öğrenme operasyonunu merkezi olarak yönetir.',
    'Cloud-based LMS; centrally manages an organization''s entire learning operation with role-based catalogs, SCORM/xAPI support, exam and certificate management, detailed reporting, multi-language support, SSO and HRIS integrations.',
    null, 10),
  ('product', 'GOLXP — Öğrenme Deneyimi Platformu', 'GOLXP — Learning Experience Platform',
    'Netflix benzeri bir keşif arayüzüyle çalışanların ilgi alanlarına göre öğrenme içeriği önerir, sosyal öğrenmeyi (yorum, puanlama, paylaşım) ve kişiselleştirilmiş öğrenme yollarını destekler.',
    'Recommends learning content based on employees'' interests through a Netflix-like discovery interface, supporting social learning (comments, ratings, sharing) and personalized learning paths.',
    null, 11),
  ('product', 'GOCATALOG — Hazır Eğitim Kataloğu', 'GOCATALOG — Ready-Made Course Catalog',
    'Yüzlerce hazır kurs modülünden oluşan, sektöre göre filtrelenebilen, sürekli güncellenen bir içerik kütüphanesi — kurumların sıfırdan içerik üretmeden hızlıca eğitim programı başlatmasını sağlar.',
    'A continuously updated content library of hundreds of ready-made course modules, filterable by industry — lets organizations launch a training program quickly without producing content from scratch.',
    null, 12),
  ('product', 'GOFACTORY — Kuruma Özel İçerik Üretimi', 'GOFACTORY — Custom Content Production',
    'Kurumun kendi süreç, marka ve terminolojisine özel eğitim içeriği üretimi — senaryo yazımından seslendirme ve interaktif tasarıma kadar uçtan uca içerik prodüksiyon hizmeti.',
    'Production of training content tailored to the organization''s own processes, brand and terminology — end-to-end content production from script writing to voiceover and interactive design.',
    null, 13),
  ('product', 'GOTOOLS — AI Destekli Mikro-Öğrenme Araçları', 'GOTOOLS — AI-Powered Micro-Learning Tools',
    'Kısa, odaklı, AI destekli mikro-öğrenme modülleri oluşturmak için araç seti — hızlı bilgi tazeleme, tek oturumluk beceri eğitimleri ve mobil öncelikli öğrenme senaryoları için idealdir.',
    'A toolset for creating short, focused, AI-powered micro-learning modules — ideal for quick knowledge refreshers, single-session skill training and mobile-first learning scenarios.',
    null, 14),
  ('glossary', 'SCORM / xAPI Nedir?', 'What is SCORM / xAPI?',
    'SCORM ve xAPI, e-öğrenme içeriğinin bir LMS ile "konuşabilmesi" için kullanılan endüstri standartlarıdır — bir kursun tamamlanma durumunu, puanını ve süresini LMS''e raporlar. Bir müşteri "SCORM uyumlu mu?" diye sorarsa: evet, GOLMS her ikisini de destekler.',
    'SCORM and xAPI are industry standards that let e-learning content "talk" to an LMS — reporting a course''s completion status, score and duration back to the LMS. If a customer asks "is it SCORM-compliant?" — yes, GOLMS supports both.',
    null, 20),
  ('glossary', 'Koltuk (Seat) / Kullanıcı Bazlı Fiyatlandırma', 'Seat-Based Pricing',
    'Fiyatlandırmanın çoğu ürün için aktif kullanıcı sayısına (koltuk) göre kademelendirildiği model — bir müşteri büyüdükçe koltuk sayısı artar, fiyat da buna göre ölçeklenir.',
    'A model where pricing for most products is tiered by active user count (seats) — as a customer grows, seat count increases and price scales accordingly.',
    null, 21),
  ('audience', 'Hedef Kitle: Kimlerle Görüşüyoruz?', 'Target Audience: Who Are We Talking To?',
    'Ana karar verici genelde İK Direktörü / Öğrenme & Gelişim (L&D) Müdürü, bazen de bir dijital dönüşüm/operasyon lideri. 50+ çalışanlı, kurumsal eğitim süreçlerini dijitalleştirmek isteyen şirketler en iyi uyan profil.',
    'The main decision-maker is usually an HR Director / Learning & Development Manager, sometimes a digital transformation/operations lead. Companies with 50+ employees looking to digitize corporate training processes are the best-fit profile.',
    null, 30),
  ('onboarding', 'İş Ortağı Sözleşmesi ve Komisyon Esasları', 'Partner Agreement & Commission Basics',
    'Komisyon oranı, İş Ortakları ekranından founder tarafından her ortak için ayrı belirlenir ve bir teklif "kabul edildi" durumuna geçtiğinde otomatik olarak hesaplanıp Komisyonlarım ekranına düşer. Ödeme, founder komisyon kaydını "Ödendi" olarak işaretlediğinde gerçekleşmiş sayılır.',
    'The commission rate is set individually per partner by the founder from the Partners screen, and is automatically calculated and posted to My Commissions the moment a proposal moves to "accepted." Payment is considered complete once the founder marks the commission entry as "Paid."',
    null, 40)
) as v(category, title_tr, title_en, body_tr, body_en, url, sort_order)
where not exists (select 1 from public.resources);

-- ----------------------------------------------------------------------------
-- 2. Mevcut iş ortağı hesapları için örnek toplantı/hedef/görev
-- ----------------------------------------------------------------------------

insert into public.partner_monthly_targets (partner_id, year, month, target_revenue, target_meetings, currency, admin_note)
select pp.profile_id, extract(year from current_date)::int, extract(month from current_date)::int, 15000, 8, 'USD',
  'Otomatik oluşturulan başlangıç hedefi — founder buradan güncelleyebilir.'
from public.partner_profiles pp
where not exists (
  select 1 from public.partner_monthly_targets t
  where t.partner_id = pp.profile_id
    and t.year = extract(year from current_date)::int
    and t.month = extract(month from current_date)::int
);

-- NOT: bu ortamda public.partner_meetings.status kolonu, herhangi bir
-- migration dosyasinda tanimli olmayan (yani daha once elle olusturulmus)
-- bir "meeting_status" enum tipindedir -- asagidaki VALUES listesindeki
-- duz metin literalleri hedef kolonun gercek tipine acikca donusturuluyor,
-- aksi halde Postgres "column status is of type meeting_status but
-- expression is of type text" hatasi verir (SQLSTATE 42804).
insert into public.partner_meetings (partner_id, title, meeting_date, notes, status)
select pp.profile_id, m.title, current_date + m.offset_days, m.notes, m.status::public.meeting_status
from public.partner_profiles pp
cross join (values
  ('Tanışma toplantısı — potansiyel müşteri', -6, 'İlk görüşme yapıldı, teklif hazırlanıyor.', 'completed'),
  ('GOLMS demo sunumu', -2, 'Ürün demosu, İK ekibiyle.', 'completed'),
  ('Teklif takip görüşmesi', 3, null, 'scheduled')
) as m(title, offset_days, notes, status)
where not exists (select 1 from public.partner_meetings pm where pm.partner_id = pp.profile_id);

insert into public.partner_tasks (partner_id, title, description, due_date, status)
select pp.profile_id, t.title, t.description, current_date + t.offset_days, t.status
from public.partner_profiles pp
cross join (values
  ('Teklif takibi yap', 'Bekleyen teklifler için müşteriyi ara.', 2, 'open'),
  ('Yeni lead''leri havuza ekle', 'Bu haftaki networking temaslarını sisteme gir.', 5, 'open'),
  ('Onboarding materyallerini incele', 'Kaynaklar bölümündeki satış konuşması ve ürün tanıtımlarını gözden geçir.', -1, 'done')
) as t(title, description, offset_days, status)
where not exists (select 1 from public.partner_tasks pt where pt.partner_id = pp.profile_id);

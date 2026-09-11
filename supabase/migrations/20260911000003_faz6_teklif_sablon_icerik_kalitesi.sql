-- Faz 6 — Teklif şablonu içerik kalitesi (V4 revizyon turu)
--
-- Kullanıcı isteği (birebir): "teklif şablonlarını daha kaliteli yap ... teklif şablonları daha
-- kaliteli gerçekçi ve daha detaylı olsun ... teklif şablon modülünü geliştir daha iyi hale getir".
--
-- lib/proposals/template-studio.ts içindeki createStudioSections() artık respongo.com/tr ve
-- respongo.com/en'den alınan gerçek ürün tanımları, özellikler ve şirket rakamlarıyla (17+ yıl,
-- 400+ kurum, 3.000+ proje, 5M+ kullanıcı, 15+ ülke) çok daha zengin bir varsayılan içerik
-- üretiyor — ama bu SADECE YENİ oluşturulan/kopyalanan şablonları etkiler. Canlı ortamda halihazırda
-- var olan 6 varsayılan şablonun (5 ürün + genel ekosistem) bölümleri, eski (jenerik/boş) içerikle
-- zaten oluşturulmuş durumda. Bu migration o satırları GÜNCELLİYOR — ama SADECE hâlâ eski
-- jenerik/boş haliyle duran satırları: kullanıcı/founder bir bölümü elle düzenlediyse (metin artık
-- eski kalıpla eşleşmiyorsa, ya da kapsam listesi artık boş değilse) migration o satıra DOKUNMAZ.
-- Böylece hem idempotent hem de yapılan manuel düzenlemeleri asla ezmeyen güvenli bir güncelleme.

-- 1) "cover" ve "product_info" bölümlerinin gövde metinleri — sadece hâlâ eski jenerik kalıpla
--    eşleşiyorsa güncellenir.
update public.proposal_template_sections s
set
  body_tr = case pt.product
    when 'golms' then 'Respongo''nun 17+ yıllık kurumsal öğrenme deneyimiyle kurulan GOLMS Kurumsal Öğrenme Platformu, eğitim operasyonunuzu atama, takip, sertifikasyon ve raporlamayla tek merkezden yönetmenizi sağlar. Bugün 400''den fazla kurumun ve 5 milyondan fazla kullanıcının güvendiği aynı sistemi kurumunuza özel olarak tasarlıyoruz.'
    when 'golxp' then 'GOLXP Öğrenme Deneyimi Platformu, eğitimi bir zorunluluktan bir alışkanlığa dönüştürür: her çalışan, rolüne, hedeflerine ve ilgi alanlarına göre kişiselleştirilmiş kendi öğrenme akışını ve beceri haritasını görür. Respongo''nun 5 milyondan fazla kullanıcıya ulaşan platform deneyimini kurumunuza taşıyoruz.'
    when 'gocatalog' then 'GOCATALOG ile beklemeden başlıyorsunuz: Respongo, isEazy Skills, Cegos, Udemy Business ve LinkedIn Learning gibi ortaklardan derlenen, 22''den fazla dilde güncel bir hazır eğitim kütüphanesine anında erişim. 400''den fazla kurumun tercih ettiği içerik ekosistemini kurumunuza açıyoruz.'
    when 'gofactory' then 'GOFACTORY ile kuruma özel içerik üretiyoruz: sistemli, ölçülebilir ve markanıza birebir. Öğrenme tasarımından 2D/3D animasyona, canlı çekimden VR/360° deneyimlere kadar uçtan uca prodüksiyonu, SCORM/xAPI standartlarında paketleyerek teslim ediyoruz — 3.000''den fazla tamamlanmış projenin deneyimiyle.'
    when 'gotools' then 'GOTOOLS ile kurum içi içerik üretimini dış bağımlılık olmadan hızlandırıyorsunuz. Craft ve isEazy Author gibi bulut tabanlı yazarlık araçlarıyla ekibiniz, kurumsal şablonlar ve marka kiti üzerinden hızlı, tutarlı içerik üretip anında güncelleyebilir.'
    else 'Respongo, 17+ yıllık uzmanlığı, 400''den fazla kurumsal müşterisi ve 5 milyondan fazla kullanıcıya ulaşan öğrenme ekosistemiyle içerik üretimini, teknoloji platformlarını ve danışmanlığı tek çatı altında birleştirir. Bu teklif, kurumunuzun ihtiyacına en uygun Respongo çözümünü/çözümlerini bir araya getirir.'
  end,
  body_en = case pt.product
    when 'golms' then 'Built on Respongo''s 17+ years of enterprise learning experience, the GOLMS Learning Management Platform lets you manage assignments, tracking, certification and reporting from a single hub — the same system trusted by 400+ organisations and 5M+ users worldwide, tailored to yours.'
    when 'golxp' then 'The GOLXP Learning Experience Platform turns training from an obligation into a habit: every employee gets a personalised learning flow and skill map based on their role, goals and interests. We bring Respongo''s platform experience — already reaching 5M+ users — to your organisation.'
    when 'gocatalog' then 'With GOCATALOG you start without waiting: instant access to an up-to-date, ready-to-use training library spanning 22+ languages, curated from partners including Respongo, isEazy Skills, Cegos, Udemy Business and LinkedIn Learning — the same content ecosystem chosen by 400+ organisations.'
    when 'gofactory' then 'GOFACTORY produces content tailored to your organisation — systematic, measurable and true to your brand. From learning design to 2D/3D animation, live-action and VR/360° experiences, we deliver end-to-end production packaged to SCORM/xAPI standards, backed by 3,000+ completed projects.'
    when 'gotools' then 'GOTOOLS lets you accelerate in-house content production without external dependencies. With cloud-based authoring tools like Craft and isEazy Author, your team can produce fast, consistent content on corporate templates and a brand kit — and update it instantly.'
    else 'With 17+ years of expertise, 400+ corporate clients and a learning ecosystem reaching 5M+ users, Respongo brings content production, technology platforms and consulting together under one roof. This proposal combines the Respongo solution(s) best suited to your organisation''s needs.'
  end
from public.proposal_templates pt
where s.template_id = pt.id
  and pt.is_default_for_product = true
  and s.section_type = 'cover'
  and s.body_tr like 'Kurumunuza özel%çözüm önerisi%';

update public.proposal_template_sections s
set
  body_tr = case pt.product
    when 'golms' then 'GOLMS; yetkinlik, uyum (compliance) ve tamamlama takibini tek panelde birleştirir. SSO, İK/HRIS sistemleri, Microsoft Teams ve Zoom ile hazır entegrasyonlar sunar; çevrimdışı kullanılabilen mobil öğrenme desteğiyle sahadaki ekipler de eğitim operasyonunun dışında kalmaz. Amaç: eğitim yönetiminin manuel iş yükünü azaltıp raporlamayı gerçek zamanlı hale getirmek.'
    when 'golxp' then 'GOLXP; yapay zekâ destekli, beceri odaklı içerik keşfi ile çalışana rolüne ve hedeflerine uygun önerileri otomatik sunar. Yetkinlik açığı görünürlüğü, yöneticilerin ekip bazında gelişim ihtiyacını netleştirmesini sağlarken; kullanıcı üretimi içerik ve sosyal öğrenme özellikleri, bilgi paylaşımını LMS''in ötesine taşır.'
    when 'gocatalog' then 'GOCATALOG, kurumunuzun kendi özel içerik üretimini beklemeden eğitime başlamasını sağlar. 22''den fazla dilde, düzenli güncellenen bir kütüphaneyle departman ve rol bazlı atama yapabilir; ilerleyen dönemde GOFACTORY ile üretilecek kuruma özel içerikle kütüphaneyi tamamlayabilirsiniz.'
    when 'gofactory' then 'GOFACTORY ekibi, öğrenme tasarımı uzmanlığını kurumunuzun marka diliyle birleştirir: senaryo ve storyboard aşamasından, 2D/3D animasyon, canlı çekim ve VR/360° deneyimlere kadar geniş bir prodüksiyon yelpazesi sunar. Tüm çıktılar SCORM/xAPI paketlenerek GOLMS veya mevcut sisteminize sorunsuz entegre edilir.'
    when 'gotools' then 'GOTOOLS; Craft ve isEazy Author bulut tabanlı yazarlık araçlarını, kurumunuza özel şablonlar ve marka kitiyle birlikte devreye alır. İçerik ekibiniz dış ajansa bağımlı kalmadan üretim yapar, güncellemeleri dakikalar içinde yayına alır ve marka tutarlılığını her modülde korur.'
    else 'Respongo ekosistemi; öğrenme yönetimi (GOLMS), öğrenme deneyimi (GOLXP), hazır içerik kütüphanesi (GOCATALOG), kuruma özel içerik üretimi (GOFACTORY) ve içerik üretim araçlarını (GOTOOLS) tek bir stratejinin parçaları olarak sunar — 15''ten fazla ülkede, 20''den fazla sektörde kanıtlanmış bir yaklaşımla.'
  end,
  body_en = case pt.product
    when 'golms' then 'GOLMS brings competency, compliance and completion tracking together on a single dashboard. It ships with ready SSO, HRIS, Microsoft Teams and Zoom integrations, plus offline-capable mobile learning so field teams stay covered. The goal: less manual overhead running training operations, and real-time reporting instead of spreadsheets.'
    when 'golxp' then 'GOLXP uses AI-powered, skills-based content discovery to automatically surface recommendations matched to each employee''s role and goals. Skill-gap visibility gives managers a clear view of team-level development needs, while user-generated content and social learning extend knowledge-sharing beyond the LMS.'
    when 'gocatalog' then 'GOCATALOG lets your organisation start training immediately, without waiting on custom content production. With a regularly refreshed library spanning 22+ languages, you can assign by department and role — and later complement it with bespoke content produced through GOFACTORY.'
    when 'gofactory' then 'The GOFACTORY team pairs learning-design expertise with your brand''s voice, offering a full production range — from script and storyboard through 2D/3D animation, live-action and VR/360° experiences. Every deliverable is SCORM/xAPI packaged for seamless integration with GOLMS or your existing system.'
    when 'gotools' then 'GOTOOLS deploys the Craft and isEazy Author cloud authoring tools together with templates and a brand kit built for your organisation. Your content team produces without relying on external agencies, ships updates in minutes, and keeps brand consistency across every module.'
    else 'The Respongo ecosystem brings learning management (GOLMS), learning experience (GOLXP), a ready-made content library (GOCATALOG), custom content production (GOFACTORY) and authoring tools (GOTOOLS) together as parts of one strategy — an approach proven across 15+ countries and 20+ industries.'
  end
from public.proposal_templates pt
where s.template_id = pt.id
  and pt.is_default_for_product = true
  and s.section_type = 'product_info'
  and s.body_tr like '%kurumun hedefleri, mevcut ekosistemi ve ölçülebilir çıktıları için yapılandırılır%';

-- 2) "scope" (kapsam) bölümünün dahil/hariç listeleri — sadece hâlâ tamamen boşsa doldurulur.
update public.proposal_template_sections s
set content = s.content || (case pt.product
    when 'golms' then '{"included_tr":["Kurumsal yapı ve rol/departman tanımlarının GOLMS''e aktarılması","SSO, HRIS, Microsoft Teams ve Zoom entegrasyon kurulumu","Yönetici ve içerik sorumlusu eğitimi","Canlıya geçiş ve ilk 30 gün yerinde destek"],"included_en":["Migrating your organisational structure and role/department definitions into GOLMS","SSO, HRIS, Microsoft Teams and Zoom integration setup","Administrator and content-owner training","Go-live and 30 days of hands-on support"],"excluded_tr":["Kapsam dışı özel entegrasyon geliştirmeleri","Üçüncü taraf lisans bedelleri (SSO sağlayıcı, HRIS vb.)"],"excluded_en":["Custom integration development outside this scope","Third-party licence fees (SSO provider, HRIS, etc.)"]}'
    when 'golxp' then '{"included_tr":["Rol ve hedef bazlı öğrenme akışı kurgusu","Yapay zekâ destekli içerik önerisi motorunun devreye alınması","Yetkinlik haritası ve beceri açığı analizi kurulumu","Yönetici paneli eğitimi ve canlı destek"],"included_en":["Role- and goal-based learning flow configuration","Activating the AI-powered content recommendation engine","Skill map and skill-gap analysis setup","Manager dashboard training and live support"],"excluded_tr":["Özel içerik üretimi (GOFACTORY kapsamındadır)","Üçüncü taraf içerik lisans bedelleri"],"excluded_en":["Custom content production (covered separately under GOFACTORY)","Third-party content licence fees"]}'
    when 'gocatalog' then '{"included_tr":["22+ dilde hazır kütüphaneye erişim tanımlama","Departman/rol bazlı atama kurgusu","Kullanım ve tamamlama raporlama panelinin devreye alınması","İlk 90 gün kullanım desteği"],"included_en":["Provisioning access to the 22+ language ready-made library","Department/role-based assignment setup","Activating the usage and completion reporting dashboard","90 days of onboarding support"],"excluded_tr":["Kurum içi özel içerik üretimi","GOLMS/GOLXP dışında üçüncü taraf platform entegrasyonu"],"excluded_en":["In-house custom content production","Third-party platform integrations outside GOLMS/GOLXP"]}'
    when 'gofactory' then '{"included_tr":["İçerik keşif ve öğrenme tasarımı çalıştayı","Senaryo, storyboard ve görsel tasarım","SCORM/xAPI paketleme ve kalite kontrolü","1 revizyon turu"],"included_en":["Discovery and learning-design workshop","Script, storyboard and visual design","SCORM/xAPI packaging and QA","One round of revisions"],"excluded_tr":["3D/VR prodüksiyon (talep halinde ayrı teklif kapsamına eklenir)","Seslendirme/dublaj için üçüncü taraf stüdyo bedelleri"],"excluded_en":["3D/VR production (added under a separate scope on request)","Third-party voice-over/dubbing studio fees"]}'
    when 'gotools' then '{"included_tr":["Craft / isEazy Author lisanslarının kurulumu","Kurumsal şablon ve marka kiti tanımlama","İçerik ekibi için yazarlık eğitimi","İlk 60 gün teknik destek"],"included_en":["Craft / isEazy Author licence setup","Corporate template and brand kit configuration","Authoring training for your content team","60 days of technical support"],"excluded_tr":["Kurum içi ekip tarafından üretilecek içeriklerin kendisi","Üçüncü taraf stok görsel/video lisansları"],"excluded_en":["The content itself, produced by your in-house team","Third-party stock image/video licences"]}'
    else '{"included_tr":["Mevcut sistemlerin ve ihtiyaçların keşfi","Doğru Respongo ürün/ürünlerinin belirlenmesi","Uygulama planı ve zaman çizelgesi","Canlıya geçiş ve takip"],"included_en":["Discovery of current systems and needs","Identifying the right Respongo product(s)","Implementation plan and timeline","Go-live and follow-up"],"excluded_tr":["Kapsam dışı özel geliştirmeler","Üçüncü taraf lisans ve altyapı bedelleri"],"excluded_en":["Out-of-scope custom development","Third-party licence and infrastructure fees"]}'
  end)::jsonb
from public.proposal_templates pt
where s.template_id = pt.id
  and pt.is_default_for_product = true
  and s.section_type = 'scope'
  and coalesce(s.content->'included_tr', '[]'::jsonb) = '[]'::jsonb
  and coalesce(s.content->'included_en', '[]'::jsonb) = '[]'::jsonb;

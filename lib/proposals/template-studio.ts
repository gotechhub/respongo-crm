export type StudioProduct = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools" | null;

export type StudioSectionSeed = {
  section_type: string;
  legal_region: "tr" | "us" | null;
  sort_order: number;
  title_tr: string;
  title_en: string;
  body_tr: string;
  body_en: string;
  content: Record<string, unknown>;
};

export type StudioLanguage = "tr" | "en";

export const STUDIO_PRODUCTS: { key: StudioProduct; label: string; trName: string; enName: string; accent: string; coverImage: string | null }[] = [
  { key: "golms", label: "GOLMS", trName: "GOLMS Kurumsal Öğrenme Platformu", enName: "GOLMS Learning Management Platform", accent: "#2563eb", coverImage: "/proposal-assets/golms-dashboard.avif" },
  { key: "golxp", label: "GOLXP", trName: "GOLXP Öğrenme Deneyimi", enName: "GOLXP Learning Experience Platform", accent: "#7c3aed", coverImage: "/proposal-assets/golxp-dashboard.avif" },
  { key: "gocatalog", label: "GOCATALOG", trName: "GOCATALOG Hazır Eğitim Kataloğu", enName: "GOCATALOG Ready-to-Use Learning Catalog", accent: "#0f766e", coverImage: "/proposal-assets/gocatalog-learning.avif" },
  { key: "gofactory", label: "GOFACTORY", trName: "GOFACTORY Özel İçerik Üretimi", enName: "GOFACTORY Custom Learning Content", accent: "#ea580c", coverImage: "/proposal-assets/gofactory-content.avif" },
  { key: "gotools", label: "GOTOOLS", trName: "GOTOOLS İçerik Üretim Araçları", enName: "GOTOOLS Authoring Tools", accent: "#0891b2", coverImage: "/proposal-assets/gotools-craft.avif" },
  { key: null, label: "RESPONGO", trName: "Respongo Öğrenme Ekosistemi", enName: "Respongo Learning Ecosystem", accent: "#172554", coverImage: "/proposal-assets/respongo-ecosystem.avif" },
];

export function studioProduct(key: StudioProduct) {
  return STUDIO_PRODUCTS.find((product) => product.key === key) ?? STUDIO_PRODUCTS[5];
}

/** Artık her ürün için TEK bir şablon adı — içerik zaten TR + EN'i aynı satırda taşıyor. */
export function starterTemplateName(product: StudioProduct): string {
  const item = studioProduct(product);
  return `${item.label} · Kurumsal Teklif Şablonu`;
}

const titles: Record<string, { tr: string; en: string }> = {
  cover: { tr: "Teklif", en: "Proposal" },
  customer_info: { tr: "Müşteri Bilgileri", en: "Customer details" },
  scope: { tr: "Kapsam", en: "Scope" },
  product_info: { tr: "Çözüm Hakkında", en: "About the solution" },
  technical_specs: { tr: "Teknik Özellikler ve Güvenlik", en: "Technical Specifications & Security" },
  implementation_timeline: { tr: "Uygulama Planı", en: "Implementation Plan" },
  support_sla: { tr: "Destek ve Hizmet Seviyesi (SLA)", en: "Support & Service Level Agreement" },
  legal_tr: { tr: "Ticari ve Hukuki Şartlar", en: "Commercial & legal terms" },
  legal_us: { tr: "Uluslararası Ticari ve Hukuki Şartlar", en: "International commercial & legal terms" },
  bank_info: { tr: "Ödeme Bilgileri", en: "Payment details" },
  signature: { tr: "Onay", en: "Acceptance" },
};

// V5 (2026-09-11): Kullanıcının açık ve sert geri bildirimi — "teklif şablonu çok önemli ve sen
// çok kötü yapıyorsun bunu acil düzelt ... teknik detaylar ve teklif koşulları gerçekçi ve en iyi
// şekilde yap". Üç YENİ bölüm eklendi (teknik özellikler/güvenlik, uygulama planı, destek/SLA) ve
// "ticari şartlar" artık boş bırakılmıyor — respongo.com/tr/yasal/guvenlik sayfasından doğrulanmış
// gerçek güvenlik iddialarına (SOC 2 Type II uyumu, ISO 27001 çerçevesi, KVKK/GDPR, VAPT, MFA)
// dayanıyor; site "detaylar talep üzerine yazılı paylaşılır" dediği için biz de aynı temkinli dili
// koruyoruz — Respongo'nun sahip olmadığı bir sertifikayı iddia etmiyoruz. Ticari/hukuki şartlar
// gerçekçi bir SAAS sözleşmesi taslağı olarak yazıldı ama HER İKİ bölüm de en üstte "bu bir taslaktır,
// hukuk danışmanınızca onaylanmalıdır" uyarısı taşıyor — böylece founder gerçek, kullanılabilir bir
// başlangıç metni alıyor ama bunu hukuki tavsiye gibi sunmuyoruz.
// V6 (2026-09-12) — Kullanıcı: "teklif şablonlarını ... uzun teknik ürün bilgisi gibi her şeyi
// ekle ... şablon formatlarını beğenmedim baştan sona yeniden tasarla". Tek düz madde listesi
// yerine 4 kategoriye ayrılmış, daha derinlikli bir teknik özellik seti — gerçek dünya teklif
// yazılımlarının (Proposify/PandaDoc) "Technical Specifications" bölümlerinde olduğu gibi.
// Geriye dönük uyumluluk için hem kategorili (groups) hem düz (items_tr/items_en, gruplardan
// otomatik türetilir) alanlar content'te birlikte tutuluyor — eski render kodu/veri kırılmaz.
type TechnicalGroup = { labelTr: string; labelEn: string; itemsTr: string[]; itemsEn: string[] };

const TECHNICAL_GROUPS: TechnicalGroup[] = [
  {
    labelTr: "Güvenlik ve Uyumluluk",
    labelEn: "Security & Compliance",
    itemsTr: [
      "Bilgi güvenliği yönetiminde ISO 27001 çerçevesiyle uyumlu kontroller",
      "SOC 2 Type II ilkelerine uygun bağımsız denetim yaklaşımı",
      "Aktarımda (TLS 1.2+) ve beklemede (AES-256) endüstri standardı şifreleme",
      "KVKK (6698) ve GDPR gereksinimlerine uygun veri işleme yaklaşımı; talep halinde ayrı bir Veri İşleme Sözleşmesi (DPA) imzalanabilir",
      "Rol tabanlı yetkilendirme (RBAC), en az ayrıcalık ilkesi ve çok faktörlü kimlik doğrulama (MFA)",
      "Periyodik zafiyet taramaları ve bağımsız sızma testleri (VAPT), yılda en az bir kez",
    ],
    itemsEn: [
      "Information security controls aligned with the ISO 27001 framework",
      "Independent-audit approach following SOC 2 Type II principles",
      "Industry-standard encryption in transit (TLS 1.2+) and at rest (AES-256)",
      "Data processing aligned with KVKK (Turkish DPL) and GDPR requirements; a separate Data Processing Agreement (DPA) can be executed on request",
      "Role-based access control (RBAC), least-privilege principle and multi-factor authentication (MFA)",
      "Periodic vulnerability scans and independent penetration testing (VAPT), at least annually",
    ],
  },
  {
    labelTr: "Altyapı ve Güvenilirlik",
    labelEn: "Infrastructure & Reliability",
    itemsTr: [
      "Bulut tabanlı, kurulum gerektirmeyen erişim — güncel bir web tarayıcısı yeterlidir",
      "%99,5 hedeflenen aylık çalışma süresi (uptime); gerçek taahhüt hizmet sözleşmesinde (SLA) belirtilir",
      "Düzenli otomatik yedekleme ve periyodik geri dönüş (restore) testleri",
      "Kurtarma süresi/nokta hedefleri (RTO/RPO) hizmet sözleşmesinde belirtilir",
      "Frankfurt (AB) bölgesinde barındırılan veritabanı altyapısı",
    ],
    itemsEn: [
      "Cloud-based, no-install access — a current web browser is sufficient",
      "Target of 99.5% monthly uptime; the contractual commitment is defined in the service agreement (SLA)",
      "Regular automated backups and periodic restore testing",
      "Recovery time/point objectives (RTO/RPO) are defined in the service agreement",
      "Database infrastructure hosted in the Frankfurt (EU) region",
    ],
  },
  {
    labelTr: "Entegrasyonlar ve Standartlar",
    labelEn: "Integrations & Standards",
    itemsTr: [
      "SSO (SAML 2.0 / OpenID Connect), HRIS, Microsoft Teams ve Zoom ile hazır entegrasyonlar",
      "Açık REST API ve webhook desteği; üçüncü taraf sistemlerle özel entegrasyon geliştirilebilir",
      "SCORM 1.2/2004 ve xAPI (Tin Can) içerik standartlarıyla tam uyumluluk",
      "CSV/Excel toplu içe/dışa aktarım ve otomatik kullanıcı senkronizasyonu",
    ],
    itemsEn: [
      "Ready-made SSO (SAML 2.0 / OpenID Connect), HRIS, Microsoft Teams and Zoom integrations",
      "Open REST API and webhook support; custom integrations with third-party systems can be developed",
      "Full compliance with SCORM 1.2/2004 and xAPI (Tin Can) content standards",
      "Bulk CSV/Excel import/export and automated user provisioning sync",
    ],
  },
  {
    labelTr: "Erişilebilirlik ve Dil Desteği",
    labelEn: "Accessibility & Language Support",
    itemsTr: [
      "22'den fazla dilde içerik ve arayüz desteği",
      "Çevrimdışı çalışabilen mobil öğrenme deneyimi (iOS/Android)",
      "WCAG 2.1 AA ilkelerini gözeten arayüz tasarımı",
    ],
    itemsEn: [
      "Content and interface support in 22+ languages",
      "Offline-capable mobile learning experience (iOS/Android)",
      "Interface design that follows WCAG 2.1 AA principles",
    ],
  },
];

function technicalSpecsContent(): Record<string, unknown> {
  return {
    groups: TECHNICAL_GROUPS.map((g) => ({
      label_tr: g.labelTr,
      label_en: g.labelEn,
      items_tr: g.itemsTr,
      items_en: g.itemsEn,
    })),
    // Eski (V5) düz liste render'ları için geriye dönük uyumluluk — gruplardan otomatik türetilir.
    items_tr: TECHNICAL_GROUPS.flatMap((g) => g.itemsTr),
    items_en: TECHNICAL_GROUPS.flatMap((g) => g.itemsEn),
  };
}
const SUPPORT_SLA_TR = [
  "Kritik (P1 — sistem tamamen erişilemez): 7/24 kanal, ilk yanıt 2 saat içinde",
  "Yüksek (P2 — önemli bir işlev çalışmıyor): iş günü içinde ilk yanıt 4 saat içinde",
  "Normal (P3 — genel soru/talep): ilk yanıt 1 iş günü içinde",
  "Destek kanalları: destek@respongo.com (TR) / support@respongo.com (Global) ve uygulama içi destek merkezi",
  "Standart destek saatleri: Pazartesi–Cuma 09:00–18:00 (TRT); kritik öncelik 7/24 karşılanır",
  "Kurumsal (Enterprise) paketlerde atanmış bir Müşteri Başarı Yöneticisi (CSM) eşlik eder",
];
const SUPPORT_SLA_EN = [
  "Critical (P1 — system fully inaccessible): 24/7 channel, first response within 2 hours",
  "High (P2 — a major function is broken): first response within 4 business hours",
  "Normal (P3 — general question/request): first response within 1 business day",
  "Support channels: destek@respongo.com (TR) / support@respongo.com (Global) and the in-app support centre",
  "Standard support hours: Monday–Friday 09:00–18:00 (TRT); critical priority is covered 24/7",
  "Enterprise packages include a dedicated Customer Success Manager (CSM)",
];
const LEGAL_DRAFT_NOTICE_TR = "[TASLAK — bu bölüm hukuk danışmanınızca onaylanmadan yürürlüğe girmemelidir]\n\n";
const LEGAL_DRAFT_NOTICE_EN = "[DRAFT — this section must be reviewed and approved by your legal counsel before it takes effect]\n\n";
const LEGAL_TR_BODY = LEGAL_DRAFT_NOTICE_TR + [
  "Ödeme Şartları: Faturalar teklifin onaylanmasını takiben düzenlenir; ödeme vadesi, aksi kararlaştırılmadıkça fatura tarihinden itibaren 30 gündür. Gecikme halinde yasal gecikme faizi uygulanabilir.",
  "Yenileme: Lisans/hizmet süresi sona ermeden en az 30 gün önce taraflardan biri yazılı olarak fesih bildirmediği sürece sözleşme aynı şartlarla 1 yıl daha uzar.",
  "Fesih: Taraflardan biri esaslı bir yükümlülüğünü ihlal eder ve 30 günlük yazılı ihtara rağmen düzeltmezse, diğer taraf sözleşmeyi feshedebilir.",
  "Gizlilik: Taraflar, işbu teklif kapsamında öğrendikleri ticari ve teknik bilgileri üçüncü kişilerle paylaşmayacak, karşılıklı gizlilik yükümlülüğüne uyacaktır.",
  "Fikri Mülkiyet: Respongo platformları ve alt yapısına ait tüm fikri mülkiyet hakları Respongo'ya aittir; müşteri kendi verileri ve platformda ürettiği içerik üzerindeki haklarını korur.",
  "Kişisel Verilerin Korunması: Taraflar 6698 sayılı KVKK kapsamındaki yükümlülüklerini yerine getirir; veri işleme ilişkisinin detayları ayrı bir Veri İşleme Sözleşmesi (DPA) ile belirlenebilir.",
  "Sorumluluk Sınırı: Respongo'nun bu teklife dayalı sözleşmeden doğan toplam sorumluluğu, ilgili 12 aylık dönemde ödenen toplam bedeli aşamaz; dolaylı zararlar kapsam dışıdır.",
  "Mücbir Sebep: Taraflar, makul kontrolleri dışındaki mücbir sebep hallerinde yükümlülüklerini yerine getirememekten sorumlu tutulamaz.",
  "Uygulanacak Hukuk ve Yetki: İşbu teklife ve doğacak sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır; uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir.",
  "Geçerlilik: Bu teklif, hazırlanma tarihinden itibaren 30 gün geçerlidir.",
].map((line) => `• ${line}`).join("\n");
// Türkiye pazarı şartlarının İngilizce çevirisi — legal_region='tr' satırında body_en olarak
// kullanılır (aynı Türk hukuku/KVKK/İstanbul yetkisi geçerli, sadece OKUMA dili İngilizce).
const LEGAL_TR_BODY_EN = LEGAL_DRAFT_NOTICE_EN + [
  "Payment Terms: Invoices are issued following acceptance of this proposal; payment is due within 30 days of the invoice date unless otherwise agreed. Late payment may be subject to statutory interest.",
  "Renewal: Unless either party gives written notice of termination at least 30 days before the term ends, the agreement automatically renews for a further 1-year term under the same terms.",
  "Termination: Either party may terminate for uncured material breach following 30 days' written notice.",
  "Confidentiality: Each party will keep the other's confidential business and technical information disclosed under this proposal confidential, on a mutual basis.",
  "Intellectual Property: Respongo retains all intellectual property rights in its platforms and infrastructure; the customer retains rights to its own data and to content it produces on the platform.",
  "Data Protection: The parties will meet their obligations under the Turkish Personal Data Protection Law (KVKK No. 6698); a separate Data Processing Agreement (DPA) can be executed to govern the details.",
  "Limitation of Liability: Respongo's total liability under any agreement resulting from this proposal is capped at the fees paid in the preceding 12 months, excluding indirect or consequential damages.",
  "Force Majeure: Neither party is liable for failure to perform due to causes beyond its reasonable control.",
  "Governing Law & Jurisdiction: This proposal and any resulting agreement are governed by the laws of the Republic of Türkiye; disputes are subject to the courts and execution offices of Istanbul (Merkez), unless the definitive agreement specifies otherwise.",
  "Validity: This proposal is valid for 30 days from the date of preparation.",
].map((line) => `• ${line}`).join("\n");

// V6 (2026-09-12) — GERÇEK HATA DÜZELTMESİ: legal_region='us' (Global) satırı önceki sürümde
// legal_region='tr' satırıyla BİREBİR AYNI içeriği taşıyordu (sadece başlık farklıydı) — yani
// "uluslararası" şartlar aslında hiç var olmuyordu, sadece Türkiye şartlarının bir kopyasıydı.
// Aşağıdaki metin, uluslararası/global müşteriler için GERÇEKTEN farklı maddeler içerir: KVKK
// yerine GDPR referansı, USD/EUR faturalama varsayımı ve sıradan İstanbul mahkemeleri yerine
// sınır ötesi SaaS sözleşmelerinde yaygın olan bir tahkim (arbitration) hükmü.
const LEGAL_GLOBAL_BODY_TR = LEGAL_DRAFT_NOTICE_TR + [
  "Ödeme Şartları: Faturalar USD veya EUR olarak düzenlenir; ödeme vadesi, aksi kararlaştırılmadıkça fatura tarihinden itibaren 30 gündür. Banka transfer masrafları alıcıya aittir.",
  "Yenileme: Lisans/hizmet süresi sona ermeden en az 30 gün önce taraflardan biri yazılı olarak fesih bildirmediği sürece sözleşme aynı şartlarla 1 yıl daha uzar.",
  "Fesih: Taraflardan biri esaslı bir yükümlülüğünü ihlal eder ve 30 günlük yazılı ihtara rağmen düzeltmezse, diğer taraf sözleşmeyi feshedebilir.",
  "Gizlilik: Taraflar, işbu teklif kapsamında öğrendikleri ticari ve teknik bilgileri üçüncü kişilerle paylaşmayacak, karşılıklı gizlilik yükümlülüğüne uyacaktır.",
  "Fikri Mülkiyet: Respongo platformları ve alt yapısına ait tüm fikri mülkiyet hakları Respongo'ya aittir; müşteri kendi verileri ve platformda ürettiği içerik üzerindeki haklarını korur.",
  "Kişisel Verilerin Korunması: Respongo, müşterinin bulunduğu ülkede uygulanabilir olduğu ölçüde Genel Veri Koruma Tüzüğü'ne (GDPR) uygun bir veri işleme yaklaşımı benimser; detaylar ayrı bir Veri İşleme Sözleşmesi (DPA) ile belirlenebilir.",
  "Sorumluluk Sınırı: Respongo'nun bu teklife dayalı sözleşmeden doğan toplam sorumluluğu, ilgili 12 aylık dönemde ödenen toplam bedeli aşamaz; dolaylı zararlar kapsam dışıdır.",
  "Mücbir Sebep: Taraflar, makul kontrolleri dışındaki mücbir sebep hallerinde yükümlülüklerini yerine getirememekten sorumlu tutulamaz.",
  "Uygulanacak Hukuk ve Uyuşmazlık Çözümü: İşbu teklife ve doğacak sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır; taraflar arasındaki uyuşmazlıklar, aksi kararlaştırılmadıkça İstanbul'da, İngilizce dilinde, tek hakemli tahkim yoluyla çözülür.",
  "Geçerlilik: Bu teklif, hazırlanma tarihinden itibaren 30 gün geçerlidir.",
].map((line) => `• ${line}`).join("\n");
const LEGAL_GLOBAL_BODY_EN = LEGAL_DRAFT_NOTICE_EN + [
  "Payment Terms: Invoices are issued in USD or EUR; payment is due within 30 days of the invoice date unless otherwise agreed. Bank transfer fees are borne by the payer.",
  "Renewal: Unless either party gives written notice of termination at least 30 days before the term ends, the agreement automatically renews for a further 1-year term under the same terms.",
  "Termination: Either party may terminate for uncured material breach following 30 days' written notice.",
  "Confidentiality: Each party will keep the other's confidential business and technical information disclosed under this proposal confidential, on a mutual basis.",
  "Intellectual Property: Respongo retains all intellectual property rights in its platforms and infrastructure; the customer retains rights to its own data and to content it produces on the platform.",
  "Data Protection: Respongo adopts a data processing approach aligned with the General Data Protection Regulation (GDPR) to the extent applicable in the customer's jurisdiction; details can be governed by a separate Data Processing Agreement (DPA).",
  "Limitation of Liability: Respongo's total liability under any agreement resulting from this proposal is capped at the fees paid in the preceding 12 months, excluding indirect or consequential damages.",
  "Force Majeure: Neither party is liable for failure to perform due to causes beyond its reasonable control.",
  "Governing Law & Dispute Resolution: This proposal and any resulting agreement are governed by the laws of the Republic of Türkiye; unless otherwise agreed, disputes are finally resolved by sole-arbitrator arbitration seated in Istanbul, conducted in English.",
  "Validity: This proposal is valid for 30 days from the date of preparation.",
].map((line) => `• ${line}`).join("\n");

// V4 (2026-09-11): Kullanıcının açık isteği — "teklif şablonlarını daha kaliteli yap ... daha
// kaliteli gerçekçi ve daha detaylı olsun" — respongo.com/tr ve /en'den alınan GERÇEK ürün
// tanımları, öne çıkan özellikler ve şirket rakamları (17+ yıl, 400+ kurum, 3.000+ proje,
// 5M+ kullanıcı, 15+ ülke) burada her ürün için ayrı ayrı işleniyor. Eskiden tek satırlık
// jenerik bir cümle + tamamen boş kapsam listeleri vardı; artık her yeni/kopyalanan şablon
// gerçekçi, dolu bir ön izlemeyle başlıyor (kullanıcı yine de dilediği gibi düzenleyebilir).
type ProposalCopy = {
  coverTr: string; coverEn: string;
  productTr: string; productEn: string;
  includedTr: string[]; includedEn: string[];
  excludedTr: string[]; excludedEn: string[];
  implementationTr: string[]; implementationEn: string[];
};

type ProposalCopyKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools" | "general";

const PROPOSAL_COPY: Record<ProposalCopyKey, ProposalCopy> = {
  golms: {
    coverTr: "Respongo'nun 17+ yıllık kurumsal öğrenme deneyimiyle kurulan GOLMS Kurumsal Öğrenme Platformu, eğitim operasyonunuzu atama, takip, sertifikasyon ve raporlamayla tek merkezden yönetmenizi sağlar. Bugün 400'den fazla kurumun ve 5 milyondan fazla kullanıcının güvendiği aynı sistemi kurumunuza özel olarak tasarlıyoruz.",
    coverEn: "Built on Respongo's 17+ years of enterprise learning experience, the GOLMS Learning Management Platform lets you manage assignments, tracking, certification and reporting from a single hub — the same system trusted by 400+ organisations and 5M+ users worldwide, tailored to yours.",
    productTr: "GOLMS; yetkinlik, uyum (compliance) ve tamamlama takibini tek panelde birleştirir. SSO, İK/HRIS sistemleri, Microsoft Teams ve Zoom ile hazır entegrasyonlar sunar; çevrimdışı kullanılabilen mobil öğrenme desteğiyle sahadaki ekipler de eğitim operasyonunun dışında kalmaz. Amaç: eğitim yönetiminin manuel iş yükünü azaltıp raporlamayı gerçek zamanlı hale getirmek.",
    productEn: "GOLMS brings competency, compliance and completion tracking together on a single dashboard. It ships with ready SSO, HRIS, Microsoft Teams and Zoom integrations, plus offline-capable mobile learning so field teams stay covered. The goal: less manual overhead running training operations, and real-time reporting instead of spreadsheets.",
    includedTr: ["Kurumsal yapı ve rol/departman tanımlarının GOLMS'e aktarılması", "SSO, HRIS, Microsoft Teams ve Zoom entegrasyon kurulumu", "Yönetici ve içerik sorumlusu eğitimi", "Canlıya geçiş ve ilk 30 gün yerinde destek"],
    includedEn: ["Migrating your organisational structure and role/department definitions into GOLMS", "SSO, HRIS, Microsoft Teams and Zoom integration setup", "Administrator and content-owner training", "Go-live and 30 days of hands-on support"],
    excludedTr: ["Kapsam dışı özel entegrasyon geliştirmeleri", "Üçüncü taraf lisans bedelleri (SSO sağlayıcı, HRIS vb.)"],
    excludedEn: ["Custom integration development outside this scope", "Third-party licence fees (SSO provider, HRIS, etc.)"],
    implementationTr: ["1. Hafta — Keşif ve kurumsal yapı/rol planlaması", "2–3. Hafta — Kurulum, SSO/HRIS entegrasyonu ve içerik aktarımı", "4. Hafta — Yönetici eğitimi ve pilot grup", "5. Hafta — Canlıya geçiş ve ilk 30 gün yerinde destek"],
    implementationEn: ["Week 1 — Discovery and organisational/role planning", "Weeks 2–3 — Setup, SSO/HRIS integration and content migration", "Week 4 — Administrator training and pilot group", "Week 5 — Go-live and 30 days of hands-on support"],
  },
  golxp: {
    coverTr: "GOLXP Öğrenme Deneyimi Platformu, eğitimi bir zorunluluktan bir alışkanlığa dönüştürür: her çalışan, rolüne, hedeflerine ve ilgi alanlarına göre kişiselleştirilmiş kendi öğrenme akışını ve beceri haritasını görür. Respongo'nun 5 milyondan fazla kullanıcıya ulaşan platform deneyimini kurumunuza taşıyoruz.",
    coverEn: "The GOLXP Learning Experience Platform turns training from an obligation into a habit: every employee gets a personalised learning flow and skill map based on their role, goals and interests. We bring Respongo's platform experience — already reaching 5M+ users — to your organisation.",
    productTr: "GOLXP; yapay zekâ destekli, beceri odaklı içerik keşfi ile çalışana rolüne ve hedeflerine uygun önerileri otomatik sunar. Yetkinlik açığı görünürlüğü, yöneticilerin ekip bazında gelişim ihtiyacını netleştirmesini sağlarken; kullanıcı üretimi içerik ve sosyal öğrenme özellikleri, bilgi paylaşımını LMS'in ötesine taşır.",
    productEn: "GOLXP uses AI-powered, skills-based content discovery to automatically surface recommendations matched to each employee's role and goals. Skill-gap visibility gives managers a clear view of team-level development needs, while user-generated content and social learning extend knowledge-sharing beyond the LMS.",
    includedTr: ["Rol ve hedef bazlı öğrenme akışı kurgusu", "Yapay zekâ destekli içerik önerisi motorunun devreye alınması", "Yetkinlik haritası ve beceri açığı analizi kurulumu", "Yönetici paneli eğitimi ve canlı destek"],
    includedEn: ["Role- and goal-based learning flow configuration", "Activating the AI-powered content recommendation engine", "Skill map and skill-gap analysis setup", "Manager dashboard training and live support"],
    excludedTr: ["Özel içerik üretimi (GOFACTORY kapsamındadır)", "Üçüncü taraf içerik lisans bedelleri"],
    excludedEn: ["Custom content production (covered separately under GOFACTORY)", "Third-party content licence fees"],
    implementationTr: ["1. Hafta — Rol/hedef bazlı akış planlaması", "2–3. Hafta — Kurulum ve yapay zekâ önerisi motorunun devreye alınması", "4. Hafta — Yönetici paneli eğitimi", "5. Hafta — Canlıya geçiş ve kullanım takibi"],
    implementationEn: ["Week 1 — Role/goal-based flow planning", "Weeks 2–3 — Setup and activation of the AI recommendation engine", "Week 4 — Manager dashboard training", "Week 5 — Go-live and usage follow-up"],
  },
  gocatalog: {
    coverTr: "GOCATALOG ile beklemeden başlıyorsunuz: Respongo, isEazy Skills, Cegos, Udemy Business ve LinkedIn Learning gibi ortaklardan derlenen, 22'den fazla dilde güncel bir hazır eğitim kütüphanesine anında erişim. 400'den fazla kurumun tercih ettiği içerik ekosistemini kurumunuza açıyoruz.",
    coverEn: "With GOCATALOG you start without waiting: instant access to an up-to-date, ready-to-use training library spanning 22+ languages, curated from partners including Respongo, isEazy Skills, Cegos, Udemy Business and LinkedIn Learning — the same content ecosystem chosen by 400+ organisations.",
    productTr: "GOCATALOG, kurumunuzun kendi özel içerik üretimini beklemeden eğitime başlamasını sağlar. 22'den fazla dilde, düzenli güncellenen bir kütüphaneyle departman ve rol bazlı atama yapabilir; ilerleyen dönemde GOFACTORY ile üretilecek kuruma özel içerikle kütüphaneyi tamamlayabilirsiniz.",
    productEn: "GOCATALOG lets your organisation start training immediately, without waiting on custom content production. With a regularly refreshed library spanning 22+ languages, you can assign by department and role — and later complement it with bespoke content produced through GOFACTORY.",
    includedTr: ["22+ dilde hazır kütüphaneye erişim tanımlama", "Departman/rol bazlı atama kurgusu", "Kullanım ve tamamlama raporlama panelinin devreye alınması", "İlk 90 gün kullanım desteği"],
    includedEn: ["Provisioning access to the 22+ language ready-made library", "Department/role-based assignment setup", "Activating the usage and completion reporting dashboard", "90 days of onboarding support"],
    excludedTr: ["Kurum içi özel içerik üretimi", "GOLMS/GOLXP dışında üçüncü taraf platform entegrasyonu"],
    excludedEn: ["In-house custom content production", "Third-party platform integrations outside GOLMS/GOLXP"],
    implementationTr: ["1. Hafta — Erişim tanımlama ve atama kurgusu", "2. Hafta — Departman/rol bazlı yayına alma", "3. Hafta — Kullanım raporlama ve ince ayar"],
    implementationEn: ["Week 1 — Access provisioning and assignment setup", "Week 2 — Department/role-based rollout", "Week 3 — Usage reporting and fine-tuning"],
  },
  gofactory: {
    coverTr: "GOFACTORY ile kuruma özel içerik üretiyoruz: sistemli, ölçülebilir ve markanıza birebir. Öğrenme tasarımından 2D/3D animasyona, canlı çekimden VR/360° deneyimlere kadar uçtan uca prodüksiyonu, SCORM/xAPI standartlarında paketleyerek teslim ediyoruz — 3.000'den fazla tamamlanmış projenin deneyimiyle.",
    coverEn: "GOFACTORY produces content tailored to your organisation — systematic, measurable and true to your brand. From learning design to 2D/3D animation, live-action and VR/360° experiences, we deliver end-to-end production packaged to SCORM/xAPI standards, backed by 3,000+ completed projects.",
    productTr: "GOFACTORY ekibi, öğrenme tasarımı uzmanlığını kurumunuzun marka diliyle birleştirir: senaryo ve storyboard aşamasından, 2D/3D animasyon, canlı çekim ve VR/360° deneyimlere kadar geniş bir prodüksiyon yelpazesi sunar. Tüm çıktılar SCORM/xAPI paketlenerek GOLMS veya mevcut sisteminize sorunsuz entegre edilir.",
    productEn: "The GOFACTORY team pairs learning-design expertise with your brand's voice, offering a full production range — from script and storyboard through 2D/3D animation, live-action and VR/360° experiences. Every deliverable is SCORM/xAPI packaged for seamless integration with GOLMS or your existing system.",
    includedTr: ["İçerik keşif ve öğrenme tasarımı çalıştayı", "Senaryo, storyboard ve görsel tasarım", "SCORM/xAPI paketleme ve kalite kontrolü", "1 revizyon turu"],
    includedEn: ["Discovery and learning-design workshop", "Script, storyboard and visual design", "SCORM/xAPI packaging and QA", "One round of revisions"],
    excludedTr: ["3D/VR prodüksiyon (talep halinde ayrı teklif kapsamına eklenir)", "Seslendirme/dublaj için üçüncü taraf stüdyo bedelleri"],
    excludedEn: ["3D/VR production (added under a separate scope on request)", "Third-party voice-over/dubbing studio fees"],
    implementationTr: ["1–2. Hafta — Keşif ve öğrenme tasarımı çalıştayı", "3–6. Hafta — Prodüksiyon (senaryo, görsel/animasyon, seslendirme)", "7. Hafta — Revizyon turu", "8. Hafta — Teslim, SCORM/xAPI paketleme ve entegrasyon (süre proje kapsamına göre değişir)"],
    implementationEn: ["Weeks 1–2 — Discovery and learning-design workshop", "Weeks 3–6 — Production (script, visuals/animation, voice-over)", "Week 7 — Revision round", "Week 8 — Delivery, SCORM/xAPI packaging and integration (duration varies by project scope)"],
  },
  gotools: {
    coverTr: "GOTOOLS ile kurum içi içerik üretimini dış bağımlılık olmadan hızlandırıyorsunuz. Craft ve isEazy Author gibi bulut tabanlı yazarlık araçlarıyla ekibiniz, kurumsal şablonlar ve marka kiti üzerinden hızlı, tutarlı içerik üretip anında güncelleyebilir.",
    coverEn: "GOTOOLS lets you accelerate in-house content production without external dependencies. With cloud-based authoring tools like Craft and isEazy Author, your team can produce fast, consistent content on corporate templates and a brand kit — and update it instantly.",
    productTr: "GOTOOLS; Craft ve isEazy Author bulut tabanlı yazarlık araçlarını, kurumunuza özel şablonlar ve marka kitiyle birlikte devreye alır. İçerik ekibiniz dış ajansa bağımlı kalmadan üretim yapar, güncellemeleri dakikalar içinde yayına alır ve marka tutarlılığını her modülde korur.",
    productEn: "GOTOOLS deploys the Craft and isEazy Author cloud authoring tools together with templates and a brand kit built for your organisation. Your content team produces without relying on external agencies, ships updates in minutes, and keeps brand consistency across every module.",
    includedTr: ["Craft / isEazy Author lisanslarının kurulumu", "Kurumsal şablon ve marka kiti tanımlama", "İçerik ekibi için yazarlık eğitimi", "İlk 60 gün teknik destek"],
    includedEn: ["Craft / isEazy Author licence setup", "Corporate template and brand kit configuration", "Authoring training for your content team", "60 days of technical support"],
    excludedTr: ["Kurum içi ekip tarafından üretilecek içeriklerin kendisi", "Üçüncü taraf stok görsel/video lisansları"],
    excludedEn: ["The content itself, produced by your in-house team", "Third-party stock image/video licences"],
    implementationTr: ["1. Hafta — Lisans ve marka kiti kurulumu", "2. Hafta — İçerik ekibi için yazarlık eğitimi", "3. Hafta — İlk içeriklerin yayına alınması"],
    implementationEn: ["Week 1 — Licence and brand-kit setup", "Week 2 — Authoring training for your content team", "Week 3 — First content pieces go live"],
  },
  general: {
    coverTr: "Respongo, 17+ yıllık uzmanlığı, 400'den fazla kurumsal müşterisi ve 5 milyondan fazla kullanıcıya ulaşan öğrenme ekosistemiyle içerik üretimini, teknoloji platformlarını ve danışmanlığı tek çatı altında birleştirir. Bu teklif, kurumunuzun ihtiyacına en uygun Respongo çözümünü/çözümlerini bir araya getirir.",
    coverEn: "With 17+ years of expertise, 400+ corporate clients and a learning ecosystem reaching 5M+ users, Respongo brings content production, technology platforms and consulting together under one roof. This proposal combines the Respongo solution(s) best suited to your organisation's needs.",
    productTr: "Respongo ekosistemi; öğrenme yönetimi (GOLMS), öğrenme deneyimi (GOLXP), hazır içerik kütüphanesi (GOCATALOG), kuruma özel içerik üretimi (GOFACTORY) ve içerik üretim araçlarını (GOTOOLS) tek bir stratejinin parçaları olarak sunar — 15'ten fazla ülkede, 20'den fazla sektörde kanıtlanmış bir yaklaşımla.",
    productEn: "The Respongo ecosystem brings learning management (GOLMS), learning experience (GOLXP), a ready-made content library (GOCATALOG), custom content production (GOFACTORY) and authoring tools (GOTOOLS) together as parts of one strategy — an approach proven across 15+ countries and 20+ industries.",
    includedTr: ["Mevcut sistemlerin ve ihtiyaçların keşfi", "Doğru Respongo ürün/ürünlerinin belirlenmesi", "Uygulama planı ve zaman çizelgesi", "Canlıya geçiş ve takip"],
    includedEn: ["Discovery of current systems and needs", "Identifying the right Respongo product(s)", "Implementation plan and timeline", "Go-live and follow-up"],
    excludedTr: ["Kapsam dışı özel geliştirmeler", "Üçüncü taraf lisans ve altyapı bedelleri"],
    excludedEn: ["Out-of-scope custom development", "Third-party licence and infrastructure fees"],
    implementationTr: ["1. Hafta — Mevcut sistemlerin ve ihtiyaçların keşfi", "2. Hafta — Doğru Respongo ürün/ürünlerinin ve mimarinin belirlenmesi", "3–4. Hafta — Kurulum ve entegrasyon", "5. Hafta — Canlıya geçiş ve takip"],
    implementationEn: ["Week 1 — Discovery of current systems and needs", "Week 2 — Identifying the right Respongo product(s) and architecture", "Weeks 3–4 — Setup and integration", "Week 5 — Go-live and follow-up"],
  },
};

function proposalCopyFor(product: StudioProduct): ProposalCopy {
  return PROPOSAL_COPY[(product ?? "general") as ProposalCopyKey];
}

// Legal copy intentionally remains empty: it must be supplied and approved by Respongo's counsel.
// Teklif Şablonları 2.0: her bölüm TR ve EN içeriğini AYNI satırda taşır — düzenleyicide iki dil
// yan yana, tek kaydetme ile güncellenir. Bu yüzden başlangıç şablonu da her zaman iki dili birden doldurur.
export function createStudioSections(product: StudioProduct = null): StudioSectionSeed[] {
  const item = studioProduct(product);
  const copy = proposalCopyFor(product);
  return [
    { section_type: "cover", legal_region: null, sort_order: 10, title_tr: titles.cover.tr, title_en: titles.cover.en, body_tr: copy.coverTr, body_en: copy.coverEn, content: { cover_image: item.coverImage, accent: item.accent } },
    { section_type: "customer_info", legal_region: null, sort_order: 20, title_tr: titles.customer_info.tr, title_en: titles.customer_info.en, body_tr: "", body_en: "", content: {} },
    { section_type: "scope", legal_region: null, sort_order: 30, title_tr: titles.scope.tr, title_en: titles.scope.en, body_tr: "", body_en: "", content: { included_tr: copy.includedTr, included_en: copy.includedEn, excluded_tr: copy.excludedTr, excluded_en: copy.excludedEn } },
    { section_type: "product_info", legal_region: null, sort_order: 40, title_tr: titles.product_info.tr, title_en: titles.product_info.en, body_tr: copy.productTr, body_en: copy.productEn, content: { cover_image: item.coverImage, accent: item.accent } },
    { section_type: "technical_specs", legal_region: null, sort_order: 50, title_tr: titles.technical_specs.tr, title_en: titles.technical_specs.en, body_tr: "", body_en: "", content: technicalSpecsContent() },
    { section_type: "implementation_timeline", legal_region: null, sort_order: 60, title_tr: titles.implementation_timeline.tr, title_en: titles.implementation_timeline.en, body_tr: "", body_en: "", content: { phases_tr: copy.implementationTr, phases_en: copy.implementationEn } },
    { section_type: "support_sla", legal_region: null, sort_order: 70, title_tr: titles.support_sla.tr, title_en: titles.support_sla.en, body_tr: "", body_en: "", content: { tiers_tr: SUPPORT_SLA_TR, tiers_en: SUPPORT_SLA_EN } },
    { section_type: "legal_terms", legal_region: "tr", sort_order: 80, title_tr: titles.legal_tr.tr, title_en: titles.legal_tr.en, body_tr: LEGAL_TR_BODY, body_en: LEGAL_TR_BODY_EN, content: { review_required: true } },
    { section_type: "legal_terms", legal_region: "us", sort_order: 90, title_tr: titles.legal_us.tr, title_en: titles.legal_us.en, body_tr: LEGAL_GLOBAL_BODY_TR, body_en: LEGAL_GLOBAL_BODY_EN, content: { review_required: true } },
    { section_type: "bank_info", legal_region: null, sort_order: 100, title_tr: titles.bank_info.tr, title_en: titles.bank_info.en, body_tr: "", body_en: "", content: { bank_name: "", account_name: "", iban: "", swift: "", currency: "" } },
    { section_type: "signature", legal_region: null, sort_order: 110, title_tr: titles.signature.tr, title_en: titles.signature.en, body_tr: "", body_en: "", content: {} },
  ];
}

export function sectionDisplayName(type: string, region: "tr" | "us" | null): string {
  if (type === "legal_terms") return region === "us" ? "Ticari ve hukuki şartlar · Global" : "Ticari ve hukuki şartlar · Türkiye";
  return {
    cover: "Kapak", customer_info: "Müşteri bilgileri", scope: "Kapsam", product_info: "Ürün anlatımı",
    technical_specs: "Teknik özellikler ve güvenlik", implementation_timeline: "Uygulama planı", support_sla: "Destek ve SLA",
    bank_info: "Ödeme bilgileri", signature: "Onay & imza",
  }[type] ?? "Özel bölüm";
}

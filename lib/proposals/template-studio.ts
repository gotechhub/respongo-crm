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
  legal_tr: { tr: "Ticari Şartlar", en: "Commercial terms" },
  legal_us: { tr: "Uluslararası Ticari Şartlar", en: "International commercial terms" },
  bank_info: { tr: "Ödeme Bilgileri", en: "Payment details" },
  signature: { tr: "Onay", en: "Acceptance" },
};

// Legal copy intentionally remains empty: it must be supplied and approved by Respongo's counsel.
// Teklif Şablonları 2.0: her bölüm TR ve EN içeriğini AYNI satırda taşır — düzenleyicide iki dil
// yan yana, tek kaydetme ile güncellenir. Bu yüzden başlangıç şablonu da her zaman iki dili birden doldurur.
export function createStudioSections(product: StudioProduct = null): StudioSectionSeed[] {
  const item = studioProduct(product);
  const productBodyTr = `${item.trName}; kurumun hedefleri, mevcut ekosistemi ve ölçülebilir çıktıları için yapılandırılır.`;
  const productBodyEn = `${item.enName} is structured around your organisation's goals, existing ecosystem, and measurable outcomes.`;
  const coverBodyTr = `Kurumunuza özel ${item.label} çözüm önerisi`;
  const coverBodyEn = `A tailored ${item.label} solution proposal for your organisation`;
  return [
    { section_type: "cover", legal_region: null, sort_order: 10, title_tr: titles.cover.tr, title_en: titles.cover.en, body_tr: coverBodyTr, body_en: coverBodyEn, content: { cover_image: item.coverImage, accent: item.accent } },
    { section_type: "customer_info", legal_region: null, sort_order: 20, title_tr: titles.customer_info.tr, title_en: titles.customer_info.en, body_tr: "", body_en: "", content: {} },
    { section_type: "scope", legal_region: null, sort_order: 30, title_tr: titles.scope.tr, title_en: titles.scope.en, body_tr: "", body_en: "", content: { included_tr: [], included_en: [], excluded_tr: [], excluded_en: [] } },
    { section_type: "product_info", legal_region: null, sort_order: 40, title_tr: titles.product_info.tr, title_en: titles.product_info.en, body_tr: productBodyTr, body_en: productBodyEn, content: { cover_image: item.coverImage, accent: item.accent } },
    { section_type: "legal_terms", legal_region: "tr", sort_order: 50, title_tr: titles.legal_tr.tr, title_en: titles.legal_tr.en, body_tr: "", body_en: "", content: { review_required: true } },
    { section_type: "legal_terms", legal_region: "us", sort_order: 60, title_tr: titles.legal_us.tr, title_en: titles.legal_us.en, body_tr: "", body_en: "", content: { review_required: true } },
    { section_type: "bank_info", legal_region: null, sort_order: 70, title_tr: titles.bank_info.tr, title_en: titles.bank_info.en, body_tr: "", body_en: "", content: { bank_name: "", account_name: "", iban: "", swift: "", currency: "" } },
    { section_type: "signature", legal_region: null, sort_order: 80, title_tr: titles.signature.tr, title_en: titles.signature.en, body_tr: "", body_en: "", content: {} },
  ];
}

export function sectionDisplayName(type: string, region: "tr" | "us" | null): string {
  if (type === "legal_terms") return region === "us" ? "Hukuki şartlar · Global" : "Hukuki şartlar · Türkiye";
  return {
    cover: "Kapak", customer_info: "Müşteri bilgileri", scope: "Kapsam", product_info: "Ürün anlatımı", bank_info: "Ödeme bilgileri", signature: "Onay & imza",
  }[type] ?? "Özel bölüm";
}

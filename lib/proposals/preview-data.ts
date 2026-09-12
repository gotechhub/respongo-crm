import type { StudioProduct } from "./template-studio";

export type PreviewLanguage = "tr" | "en";

export type PreviewLine = {
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  quantity: number;
  unitTr: string;
  unitEn: string;
  unitPrice: number;
  currency: "USD" | "TRY";
  discountPercent?: number;
};

// V6 (2026-09-12) — Kullanıcının bulduğu somut hata: bu dosyadaki örnek müşteri ve kalem verisi
// SADECE Türkçe idi (tek bir alan seti, dile göre değişmiyordu). Önizlemede TR/EN değiştirince
// "bazı yerler değişmiyor" şikayetinin ASIL kaynağı buydu — kalem adları, açıklamalar, ünvan,
// "hazırlayan" metni ve tarihler her zaman Türkçe kalıyordu. Artık her alan iki dilde ayrı tutuluyor
// ve tarihler Intl.DateTimeFormat ile locale'e göre biçimleniyor (sabit string değil).
export const PREVIEW_CUSTOMER = {
  company: "Atlas Teknoloji A.Ş.", // Şirket adı özel isimdir, dile göre çevrilmez.
  contactTr: "Ayşe Demir · İnsan ve Kültür Direktörü",
  contactEn: "Ayşe Demir · Director of People & Culture",
  contactEmail: "ayse.demir@atlasteknoloji.com",
  preparedByTr: "Respongo Çözüm Danışmanlığı",
  preparedByEn: "Respongo Solutions Consulting",
  reference: "RSP-2026-DEMO-014",
  // 2026-09-30 / 2026-09-01 — sabit dizeler yerine gerçek Date nesnesi, locale'e göre biçimlenir.
  validUntilDate: new Date(Date.UTC(2026, 8, 30)),
  preparedDate: new Date(Date.UTC(2026, 8, 1)),
};

export function formatPreviewDate(date: Date, language: PreviewLanguage): string {
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Örnek önizlemede KDV oranı, teklif sihirbazındaki gerçek varsayılanla aynı mantığı izler:
// TRY (yurt içi) kalemler için %20 KDV, USD (ihracat/yurt dışı) kalemler için %0 (istisna).
// Gerçek tekliflerde bu oran her zaman kullanıcı tarafından düzenlenebilir.
export function previewVatRate(currency: "USD" | "TRY"): number {
  return currency === "TRY" ? 20 : 0;
}

export const PREVIEW_BANK_INFO = {
  bankName: "Ziraat Bankası",
  accountName: "Respongo Teknoloji A.Ş.",
  iban: "TR12 3456 7890 1234 5678 9012 34",
  swift: "TCZBTR2AXXX",
};

export function previewLines(product: StudioProduct): PreviewLine[] {
  switch (product) {
    case "golms": return [
      { nameTr: "GOLMS · 1.000 kullanıcı lisansı", nameEn: "GOLMS · 1,000-user licence", descriptionTr: "Bulut tabanlı LMS, yıllık lisans", descriptionEn: "Cloud-based LMS, annual licence", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 8500, currency: "USD" },
      { nameTr: "Tek seferlik kurulum ve konfigürasyon", nameEn: "One-time setup and configuration", descriptionTr: "GoCloud-SaaS ortamı", descriptionEn: "GoCloud SaaS environment", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 5000, currency: "USD" },
      { nameTr: "SSO entegrasyonu", nameEn: "SSO integration", descriptionTr: "Tek oturum açma entegrasyonu", descriptionEn: "Single sign-on integration", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 2800, currency: "USD", discountPercent: 10 },
    ];
    case "golxp": return [
      { nameTr: "GOLXP · 500 kullanıcı lisansı", nameEn: "GOLXP · 500-user licence", descriptionTr: "Skills Intelligence ve AI destekli deneyim", descriptionEn: "Skills Intelligence and AI-powered experience", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 9000, currency: "USD" },
      { nameTr: "Yetkinlik mimarisi başlangıç paketi", nameEn: "Skills architecture starter package", descriptionTr: "Rol, beceri ve öğrenme yolculuğu tasarımı", descriptionEn: "Role, skill and learning-journey design", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 4500, currency: "USD" },
      { nameTr: "Neura AI etkinleştirme", nameEn: "Neura AI activation", descriptionTr: "Yönetici yapılandırması ve başlangıç eğitimi", descriptionEn: "Administrator configuration and onboarding training", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 2500, currency: "USD", discountPercent: 15 },
    ];
    case "gocatalog": return [
      { nameTr: "GOCATALOG · 250 kullanıcı", nameEn: "GOCATALOG · 250 users", descriptionTr: "Hazır eğitim kataloğu; kullanıcı başı yıllık lisans", descriptionEn: "Ready-made training catalogue; per-user annual licence", quantity: 250, unitTr: "kullanıcı/yıl", unitEn: "user/year", unitPrice: 405, currency: "USD" },
      { nameTr: "GOLMS katalog entegrasyonu", nameEn: "GOLMS catalogue integration", descriptionTr: "Katalog erişimi ve SSO yapılandırması", descriptionEn: "Catalogue access and SSO configuration", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 2800, currency: "USD" },
    ];
    case "gofactory": return [
      { nameTr: "Etkileşimli video ve animasyon", nameEn: "Interactive video and animation", descriptionTr: "30 dakikalık özel e-öğrenme içeriği", descriptionEn: "30-minute custom e-learning content", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 300000, currency: "TRY" },
      { nameTr: "Sanal eğitmen liderliğinde eğitim", nameEn: "Virtual instructor-led training", descriptionTr: "60 dakikalık canlı çevrim içi oturum", descriptionEn: "60-minute live online session", quantity: 2, unitTr: "oturum", unitEn: "session", unitPrice: 35000, currency: "TRY", discountPercent: 10 },
    ];
    case "gotools": return [
      { nameTr: "Vyond Professional", nameEn: "Vyond Professional", descriptionTr: "Video ve animasyon aracı", descriptionEn: "Video and animation tool", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 1199, currency: "USD" },
      { nameTr: "iSpring / Author Pro", nameEn: "iSpring / Author Pro", descriptionTr: "Eğitim yazarlık aracı", descriptionEn: "Course authoring tool", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 2244, currency: "USD" },
      { nameTr: "JivoChat Professional", nameEn: "JivoChat Professional", descriptionTr: "1 temsilci canlı destek lisansı", descriptionEn: "1-agent live chat licence", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 9240, currency: "USD" },
    ];
    default: return [
      { nameTr: "GOLMS · 1.000 kullanıcı lisansı", nameEn: "GOLMS · 1,000-user licence", descriptionTr: "Öğrenme yönetimi platformu", descriptionEn: "Learning management platform", quantity: 1, unitTr: "yıl", unitEn: "year", unitPrice: 8500, currency: "USD" },
      { nameTr: "GOCATALOG · 250 kullanıcı", nameEn: "GOCATALOG · 250 users", descriptionTr: "Hazır içerik kataloğu", descriptionEn: "Ready-made content catalogue", quantity: 250, unitTr: "kullanıcı/yıl", unitEn: "user/year", unitPrice: 405, currency: "USD" },
      { nameTr: "GOLXP başlangıç paketi", nameEn: "GOLXP starter package", descriptionTr: "Yetkinlik ve deneyim tasarımı", descriptionEn: "Skills and experience design", quantity: 1, unitTr: "proje", unitEn: "project", unitPrice: 4500, currency: "USD", discountPercent: 5 },
    ];
  }
}

export function formatPreviewPrice(value: number, currency: "USD" | "TRY", language: PreviewLanguage = "tr") {
  return new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

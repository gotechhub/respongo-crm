import type { StudioProduct } from "./template-studio";

export type PreviewLine = {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: "USD" | "TRY";
  discountPercent?: number;
};

export const PREVIEW_CUSTOMER = {
  company: "Atlas Teknoloji A.Ş.",
  contact: "Ayşe Demir · İnsan ve Kültür Direktörü",
  contactEmail: "ayse.demir@atlasteknoloji.com",
  preparedBy: "Respongo Çözüm Danışmanlığı",
  reference: "RSP-2026-DEMO-014",
  validUntil: "30 Eylül 2026",
  preparedDate: "1 Eylül 2026",
};

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
      { name: "GOLMS · 1.000 kullanıcı lisansı", description: "Bulut tabanlı LMS, yıllık lisans", quantity: 1, unit: "yıl", unitPrice: 8500, currency: "USD" },
      { name: "Tek seferlik kurulum ve konfigürasyon", description: "GoCloud-SaaS ortamı", quantity: 1, unit: "proje", unitPrice: 5000, currency: "USD" },
      { name: "SSO entegrasyonu", description: "Tek oturum açma entegrasyonu", quantity: 1, unit: "proje", unitPrice: 2800, currency: "USD", discountPercent: 10 },
    ];
    case "golxp": return [
      { name: "GOLXP · 500 kullanıcı lisansı", description: "Skills Intelligence ve AI destekli deneyim", quantity: 1, unit: "yıl", unitPrice: 9000, currency: "USD" },
      { name: "Yetkinlik mimarisi başlangıç paketi", description: "Rol, beceri ve öğrenme yolculuğu tasarımı", quantity: 1, unit: "proje", unitPrice: 4500, currency: "USD" },
      { name: "Neura AI etkinleştirme", description: "Yönetici yapılandırması ve başlangıç eğitimi", quantity: 1, unit: "proje", unitPrice: 2500, currency: "USD", discountPercent: 15 },
    ];
    case "gocatalog": return [
      { name: "GOCATALOG · 250 kullanıcı", description: "Hazır eğitim kataloğu; kullanıcı başı yıllık lisans", quantity: 250, unit: "kullanıcı/yıl", unitPrice: 405, currency: "USD" },
      { name: "GOLMS katalog entegrasyonu", description: "Katalog erişimi ve SSO yapılandırması", quantity: 1, unit: "proje", unitPrice: 2800, currency: "USD" },
    ];
    case "gofactory": return [
      { name: "Etkileşimli video ve animasyon", description: "30 dakikalık özel e-öğrenme içeriği", quantity: 1, unit: "proje", unitPrice: 300000, currency: "TRY" },
      { name: "Sanal eğitmen liderliğinde eğitim", description: "60 dakikalık canlı çevrim içi oturum", quantity: 2, unit: "oturum", unitPrice: 35000, currency: "TRY", discountPercent: 10 },
    ];
    case "gotools": return [
      { name: "Vyond Professional", description: "Video ve animasyon aracı", quantity: 1, unit: "yıl", unitPrice: 1199, currency: "USD" },
      { name: "iSpring / Author Pro", description: "Eğitim yazarlık aracı", quantity: 1, unit: "yıl", unitPrice: 2244, currency: "USD" },
      { name: "JivoChat Professional", description: "1 temsilci canlı destek lisansı", quantity: 1, unit: "yıl", unitPrice: 9240, currency: "USD" },
    ];
    default: return [
      { name: "GOLMS · 1.000 kullanıcı lisansı", description: "Öğrenme yönetimi platformu", quantity: 1, unit: "yıl", unitPrice: 8500, currency: "USD" },
      { name: "GOCATALOG · 250 kullanıcı", description: "Hazır içerik kataloğu", quantity: 250, unit: "kullanıcı/yıl", unitPrice: 405, currency: "USD" },
      { name: "GOLXP başlangıç paketi", description: "Yetkinlik ve deneyim tasarımı", quantity: 1, unit: "proje", unitPrice: 4500, currency: "USD", discountPercent: 5 },
    ];
  }
}

export function formatPreviewPrice(value: number, currency: "USD" | "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

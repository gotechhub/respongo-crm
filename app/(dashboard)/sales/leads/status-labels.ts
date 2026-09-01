// Lead pipeline durumu ve kaynak etiketleri — tek doğru kaynak, liste ve detay
// sayfası burada tanımlanan aynı map'leri kullanır (bkz. Proje&Görev modülündeki
// aynı desen).
import type { LeadStatus } from "./actions";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  yeni: "Yeni",
  gorusme: "Görüşme",
  teklif: "Teklif",
  musteri: "Müşteri",
  kaybedildi: "Kaybedildi",
};

export const LEAD_STATUS_CLASS: Record<LeadStatus, string> = {
  yeni: "bg-golms-tint text-golms",
  gorusme: "bg-gocatalog-tint text-gocatalog",
  teklif: "bg-golxp-tint text-golxp",
  musteri: "bg-gofactory-tint text-gofactory",
  kaybedildi: "bg-rg-surface-alt text-rg-ink-faint",
};

export const EDITABLE_LEAD_STATUSES: LeadStatus[] = ["yeni", "gorusme", "teklif", "kaybedildi"];

export type LeadSource =
  | "manual"
  | "referral"
  | "sales_rep"
  | "apollo"
  | "website_form"
  | "ad_google"
  | "ad_linkedin"
  | "ad_instagram"
  | "ad_youtube"
  | "social_other"
  | "other";

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  manual: "Manuel giriş",
  referral: "Referans",
  sales_rep: "Satış temsilcisi",
  apollo: "Apollo.io",
  website_form: "Web sitesi formu",
  ad_google: "Google Ads",
  ad_linkedin: "LinkedIn Ads",
  ad_instagram: "Instagram Ads",
  ad_youtube: "YouTube Ads",
  social_other: "Diğer sosyal medya",
  other: "Diğer",
};

// Kampanya kanalı etiketleri — TEK KAYNAK, sunucu bileşenlerinden güvenle
// okunabilsin diye kasıtlı olarak "use client" DEĞİL.
//
// Daha önce bu obje "use client" işaretli campaign-form.tsx içinden export
// ediliyordu ve marketing/page.tsx ile marketing/[id]/page.tsx (ikisi de
// sunucu bileşeni) buradan dinamik bir anahtarla (CAMPAIGN_CHANNEL_LABEL[
// row.channel]) okuyordu. Bu, Destek Merkezi ve Lisanslar sayfalarını
// çökerten "Could not find the module ... in the React Client Manifest"
// hatasıyla AYNI kök nedene sahip (bkz. lib/product-labels.ts) — henüz
// kullanıcı tarafından /marketing sayfasında tetiklenip raporlanmamıştı
// ama aynı koşullarda kaçınılmaz olarak aynı şekilde çökecekti, bu yüzden
// proaktif olarak burada da düzeltildi.
export type CampaignChannel =
  | "google_ads"
  | "linkedin_ads"
  | "instagram_ads"
  | "youtube_ads"
  | "facebook_ads"
  | "tiktok_ads"
  | "email"
  | "content"
  | "webinar"
  | "event"
  | "referral_program"
  | "partnership"
  | "other";

export const CAMPAIGN_CHANNEL_LABEL: Record<CampaignChannel, string> = {
  google_ads: "Google Reklamları",
  linkedin_ads: "LinkedIn Reklamları",
  instagram_ads: "Instagram Reklamları",
  youtube_ads: "YouTube Reklamları",
  facebook_ads: "Meta (Facebook) Reklamları",
  tiktok_ads: "TikTok Reklamları",
  email: "E-posta Kampanyası",
  content: "İçerik Pazarlaması",
  webinar: "Webinar",
  event: "Etkinlik",
  referral_program: "Referans Programı",
  partnership: "İş Ortaklığı",
  other: "Diğer",
};

export const CAMPAIGN_CHANNEL_KEYS = Object.keys(CAMPAIGN_CHANNEL_LABEL) as CampaignChannel[];

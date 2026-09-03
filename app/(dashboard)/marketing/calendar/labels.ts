// Sosyal medya içerik takvimi platform/durum etiketleri — tek doğru kaynak
// (bkz. bölüm E'deki lead status-labels.ts ile aynı desen).
import type { SocialPlatform, SocialPostStatus } from "./actions";

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X (Twitter)",
  blog: "Blog / respongo.com",
  other: "Diğer",
};

export const SOCIAL_PLATFORM_KEYS = Object.keys(SOCIAL_PLATFORM_LABEL) as SocialPlatform[];

export const SOCIAL_STATUS_LABEL: Record<SocialPostStatus, string> = {
  draft: "Taslak",
  scheduled: "Planlandı",
  published: "Yayınlandı",
  cancelled: "İptal",
};

export const SOCIAL_STATUS_CLASS: Record<SocialPostStatus, string> = {
  draft: "bg-rg-surface-alt text-rg-ink-faint",
  scheduled: "bg-golxp-tint text-golxp",
  published: "bg-gofactory-tint text-gofactory",
  cancelled: "bg-destructive/10 text-destructive",
};

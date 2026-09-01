import type { TicketPriority, TicketStatus } from "./actions";

// İç ekip + müşteri portalı sayfalarının TAMAMI bu tek dosyadan okur —
// durum/öncelik etiketi veya rengi iki yerde ayrı ayrı tanımlanıp
// birbirinden sapmasın diye (ör. portal'da "İşlemde" yazıp CRM'de
// "İnceleniyor" yazması gibi tutarsızlıklar).
export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  waiting_customer: "Müşteri Yanıtı Bekleniyor",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
};

export const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-golxp-tint text-golxp",
  waiting_customer: "bg-gotools-tint text-gotools",
  resolved: "bg-gofactory-tint text-gofactory",
  closed: "bg-rg-surface-alt text-rg-ink-faint",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

export const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "bg-rg-surface-alt text-rg-ink-faint",
  normal: "bg-golms-tint text-golms",
  high: "bg-gotools-tint text-gotools",
  urgent: "bg-destructive/10 text-destructive",
};

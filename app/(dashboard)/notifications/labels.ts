// V2 Revizeler bölüm H: Bildirimler & Takvim/Zamanlama — bildirim tipleri için
// ortak Türkçe etiketler/ikon-renk sınıfları. Hem bildirim çanı (topbar) hem
// /notifications sayfası hem de cron digest e-postası aynı sözlüğü kullanır.

export type NotificationType =
  | "task_due_soon"
  | "task_overdue"
  | "proposal_expiring"
  | "proposal_expired"
  | "invoice_overdue"
  | "license_expiring"
  | "support_ticket_stale"
  | "partner_meeting_upcoming"
  | "partner_task_overdue"
  | "customer_request_stale";

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  task_due_soon: "Yaklaşan Görev",
  task_overdue: "Gecikmiş Görev",
  proposal_expiring: "Yaklaşan Teklif Süresi",
  proposal_expired: "Süresi Dolmuş Teklif",
  invoice_overdue: "Vadesi Geçmiş Fatura",
  license_expiring: "Yaklaşan Lisans Yenileme",
  support_ticket_stale: "Yanıt Bekleyen Destek Talebi",
  partner_meeting_upcoming: "Yaklaşan Toplantı",
  partner_task_overdue: "Gecikmiş İş Ortağı Görevi",
  customer_request_stale: "Bekleyen Müşteri Talebi",
};

// "overdue"/"expired"/"stale" tonundakiler kırmızı (dikkat), "upcoming"/"soon"/
// "expiring" tonundakiler amber (yaklaşan) olarak gruplanır.
const URGENT_TYPES: NotificationType[] = [
  "task_overdue",
  "proposal_expired",
  "invoice_overdue",
  "support_ticket_stale",
  "partner_task_overdue",
  "customer_request_stale",
];

export function isUrgentNotification(type: NotificationType): boolean {
  return URGENT_TYPES.includes(type);
}

export const NOTIFICATION_TYPE_CLASS: Record<NotificationType, string> = Object.fromEntries(
  (Object.keys(NOTIFICATION_TYPE_LABEL) as NotificationType[]).map((t) => [
    t,
    isUrgentNotification(t) ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600",
  ])
) as Record<NotificationType, string>;

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

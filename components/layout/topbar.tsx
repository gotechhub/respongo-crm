import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { getUiLocale } from "@/lib/locale-server";
import type { NotificationRow } from "@/app/(dashboard)/notifications/labels";

// V2 Revizeler bölüm H: Bildirimler sistemde "her zaman açık" olacağı için bu
// bileşen async Server Component'e çevrildi — her sayfa yüklemesinde (30+ yerden
// aynı şekilde <Topbar title=... /> olarak çağrıldığı için, prop değişikliği
// gerekmedi) taze bildirim/okunmamış sayısı çekiliyor.
export async function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getUiLocale();

  let notifications: NotificationRow[] = [];
  let unreadCount = 0;

  if (user) {
    const [{ data: recent }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, body, link_url, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);
    notifications = (recent ?? []) as NotificationRow[];
    unreadCount = count ?? 0;
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-[22px] font-bold text-rg-ink">{title}</h1>
        {subtitle && <div className="text-[13px] text-rg-ink-soft">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2.5">
        {/* Eskiden burada dekoratif, hiçbir şey yapmayan sabit bir "Ara..."
            kutusu vardı (gerçek bir <input> bile değildi). Kaldırıldı —
            gerçek arama zaten her modülün kendi listesinde (SearchInput
            bileşeni) çalışıyor; olmayan bir global arama vaat etmek yanıltıcıydı. */}
        <LocaleToggle active={locale} />
        <NotificationBell initialNotifications={notifications} unreadCount={unreadCount} />
      </div>
    </div>
  );
}

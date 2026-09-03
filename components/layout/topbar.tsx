import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/layout/notification-bell";
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
        <div className="flex w-[220px] items-center gap-2 rounded-[10px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink-faint">
          <Search className="h-3.5 w-3.5" />
          Ara...
        </div>
        <div className="flex overflow-hidden rounded-[10px] border border-rg-line bg-rg-surface">
          <span className="bg-golms-tint px-[11px] py-2 text-[11.5px] font-semibold text-golms">
            TR
          </span>
          <span className="px-[11px] py-2 text-[11.5px] font-semibold text-rg-ink-faint">
            EN
          </span>
        </div>
        <NotificationBell initialNotifications={notifications} unreadCount={unreadCount} />
      </div>
    </div>
  );
}

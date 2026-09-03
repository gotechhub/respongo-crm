import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_TYPE_LABEL, isUrgentNotification, type NotificationRow } from "./labels";
import { MarkAllReadButton, NotificationRowItem } from "./notification-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = searchParams.filter === "unread" ? "unread" : "all";

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, link_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(150);

  if (filter === "unread") {
    query = query.eq("is_read", false);
  }

  const { data } = await query;
  const rows = (data ?? []) as NotificationRow[];

  return (
    <>
      <Topbar title="Bildirimler" subtitle="Gecikmiş ve yaklaşan kayıtlar için tüm bildirimlerin." />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link
            href="/notifications"
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
              filter === "all" ? "bg-primary text-white" : "border border-rg-line text-rg-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            Tümü
          </Link>
          <Link
            href="/notifications?filter=unread"
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
              filter === "unread" ? "bg-primary text-white" : "border border-rg-line text-rg-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            Okunmamış
          </Link>
        </div>
        <MarkAllReadButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-[12.5px] text-rg-ink-faint">
            {filter === "unread" ? "Okunmamış bildirim yok." : "Henüz bildirim yok."}
          </div>
        )}
        {rows.map((n) => (
          <NotificationRowItem key={n.id} notification={n} label={NOTIFICATION_TYPE_LABEL[n.type]} urgent={isUrgentNotification(n.type)} />
        ))}
      </div>
    </>
  );
}

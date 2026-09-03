"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(dashboard)/notifications/actions";
import { NOTIFICATION_TYPE_LABEL, isUrgentNotification, type NotificationRow } from "@/app/(dashboard)/notifications/labels";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export function NotificationBell({
  initialNotifications,
  unreadCount,
}: {
  initialNotifications: NotificationRow[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleItemClick(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-rg-line bg-rg-surface text-rg-ink-soft hover:text-primary"
        aria-label="Bildirimler"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[340px] overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
          <div className="flex items-center justify-between border-b border-rg-line px-3.5 py-2.5">
            <span className="text-[12.5px] font-bold text-rg-ink">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3 w-3" />
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {initialNotifications.length === 0 && (
              <div className="px-3.5 py-8 text-center text-[12px] text-rg-ink-faint">Bildirim yok.</div>
            )}
            {initialNotifications.map((n) => (
              <Link
                key={n.id}
                href={n.link_url || "/notifications"}
                onClick={() => !n.is_read && handleItemClick(n.id)}
                className={cn(
                  "block border-b border-rg-line px-3.5 py-2.5 last:border-b-0 hover:bg-rg-surface-alt",
                  !n.is_read && "bg-primary/[.03]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-[7px] py-[1px] text-[9.5px] font-bold",
                      isUrgentNotification(n.type) ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    )}
                  >
                    {NOTIFICATION_TYPE_LABEL[n.type]}
                  </span>
                  <span className="shrink-0 text-[10px] text-rg-ink-faint">{timeAgo(n.created_at)}</span>
                </div>
                <div className="mt-1 text-[12.3px] font-medium text-rg-ink">{n.title}</div>
                {n.body && <div className="mt-0.5 text-[11px] text-rg-ink-soft">{n.body}</div>}
              </Link>
            ))}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-rg-line px-3.5 py-2.5 text-center text-[11.5px] font-semibold text-primary hover:bg-rg-surface-alt"
          >
            Tüm bildirimleri gör
          </Link>
        </div>
      )}
    </div>
  );
}

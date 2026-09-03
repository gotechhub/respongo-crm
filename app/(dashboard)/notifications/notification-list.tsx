"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import type { NotificationRow } from "./labels";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        await markAllNotificationsRead();
        router.refresh();
      })}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-[10px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink-soft hover:border-primary hover:text-primary disabled:opacity-50"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      Tümünü okundu işaretle
    </button>
  );
}

export function NotificationRowItem({
  notification,
  label,
  urgent,
}: {
  notification: NotificationRow;
  label: string;
  urgent: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!notification.is_read) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        router.refresh();
      });
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-rg-line px-4 py-3.5 last:border-b-0 hover:bg-rg-surface-alt",
        !notification.is_read && "bg-primary/[.03]"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-[8px] py-[2px] text-[10px] font-bold", urgent ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600")}>
            {label}
          </span>
          {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
        <div className="mt-1 text-[13px] font-semibold text-rg-ink">{notification.title}</div>
        {notification.body && <div className="mt-0.5 text-[12px] text-rg-ink-soft">{notification.body}</div>}
      </div>
      <span className="shrink-0 text-[11px] text-rg-ink-faint">{fmtDateTime(notification.created_at)}</span>
    </div>
  );

  if (!notification.link_url) {
    return (
      <button onClick={handleClick} disabled={isPending} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={notification.link_url} onClick={handleClick}>
      {content}
    </Link>
  );
}

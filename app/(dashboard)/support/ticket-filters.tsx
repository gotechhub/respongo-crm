"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Archive, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, PRIORITY_LABEL } from "./status-labels";
import type { TicketPriority, TicketStatus } from "./actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] font-semibold text-rg-ink outline-none focus:border-primary";

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const isArchiveView = searchParams.get("archived") === "1";

  return (
    <div className="flex items-center gap-2">
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className={inputClass}
      >
        <option value="">Tüm Durumlar</option>
        {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("priority") ?? ""}
        onChange={(e) => setParam("priority", e.target.value)}
        className={inputClass}
      >
        <option value="">Tüm Öncelikler</option>
        {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABEL[p]}
          </option>
        ))}
      </select>

      {/* DERS (2026-09-11): kullanıcı isteği — "arşivle yapılabilir ve arşivi
          de geçmişe dönük görüntüleyebilmeliyiz". Aktif/Arşiv iki ayrı GÖRÜNÜM
          — filtre değil, çünkü ikisi birbirini dışlıyor (bir talep ya aktif
          listede ya arşivde görünür, asla ikisinde birden). */}
      <div className="ml-1 flex items-center gap-1 rounded-[8px] border border-rg-line bg-rg-surface p-1">
        <button
          type="button"
          onClick={() => setParam("archived", "")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors",
            !isArchiveView ? "bg-primary text-white" : "text-rg-ink-soft hover:bg-rg-surface-alt"
          )}
        >
          <Inbox className="h-3.5 w-3.5" /> Aktif
        </button>
        <button
          type="button"
          onClick={() => setParam("archived", "1")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors",
            isArchiveView ? "bg-primary text-white" : "text-rg-ink-soft hover:bg-rg-surface-alt"
          )}
        >
          <Archive className="h-3.5 w-3.5" /> Arşiv
        </button>
      </div>
    </div>
  );
}

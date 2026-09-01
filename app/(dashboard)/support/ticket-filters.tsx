"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
    </div>
  );
}

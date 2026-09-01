"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PROJECT_STATUS_LABEL } from "./status-labels";
import type { ProjectStatus } from "./actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] font-semibold text-rg-ink outline-none focus:border-primary";

export function ProjectFilters() {
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
    <select
      value={searchParams.get("status") ?? ""}
      onChange={(e) => setParam("status", e.target.value)}
      className={inputClass}
    >
      <option value="">Tüm Durumlar</option>
      {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
        <option key={s} value={s}>
          {PROJECT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

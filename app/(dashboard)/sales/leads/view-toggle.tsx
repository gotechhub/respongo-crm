"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { List, Kanban } from "lucide-react";

const VIEWS: { value: "list" | "kanban"; label: string; icon: typeof List }[] = [
  { value: "list", label: "Liste", icon: List },
  { value: "kanban", label: "Pipeline", icon: Kanban },
];

/**
 * Liste / Pipeline (Kanban) görünüm anahtarı — `view` URL parametresini
 * yönetir. RegionTabs/SearchInput ile aynı desen: durum URL'de, sayfa
 * yenilense/paylaşılsa bile korunur.
 */
export function LeadsViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("view") === "kanban" ? "kanban" : "list";

  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-rg-line bg-rg-surface p-1">
      {VIEWS.map((v) => {
        const params = new URLSearchParams(searchParams.toString());
        if (v.value === "list") {
          params.delete("view");
        } else {
          params.set("view", v.value);
        }
        const href = `${pathname}?${params.toString()}`;
        const active = current === v.value;
        const Icon = v.icon;
        return (
          <Link
            key={v.value}
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              active ? "bg-primary text-white" : "text-rg-ink-soft hover:bg-rg-surface-alt"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}

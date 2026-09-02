"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";

const TABS: { value: Region | ""; label: string }[] = [
  { value: "", label: "Tümü" },
  { value: "tr", label: REGION_LABELS_TR.tr },
  { value: "global", label: REGION_LABELS_TR.global },
];

/**
 * TR / Global havuz ayrımı için pill-stil sekmeler — `RegionFilter`
 * dropdown'unun aynı `region` URL parametresini kullanan, daha görsel
 * alternatifi (bölüm E: Lead Havuzu Gelişmiş Mimarisi). Sadece tüm bölgeleri
 * görebilen roller (founder) için anlamlıdır — diğer roller RLS ile zaten
 * kendi bölgesine kilitlenir, `visible` prop'uyla sayfa bazında gösterilir.
 */
export function RegionTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("region") ?? "";

  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-rg-line bg-rg-surface p-1">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value) {
          params.set("region", tab.value);
        } else {
          params.delete("region");
        }
        params.set("page", "1");
        const href = `${pathname}?${params.toString()}`;
        const active = current === tab.value;
        return (
          <Link
            key={tab.value || "all"}
            href={href}
            className={`rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              active ? "bg-primary text-white" : "text-rg-ink-soft hover:bg-rg-surface-alt"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

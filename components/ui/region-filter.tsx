"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { REGION_LABELS_TR } from "@/lib/roles";

/**
 * URL'deki `region` parametresini yöneten filtre — sadece tüm bölgeleri
 * görebilen roller (founder) için anlamlıdır; diğer roller için RLS zaten
 * kendi bölgesine kilitler, bu yüzden `visible` prop'u ile sayfa bazında
 * gösterilip gösterilmeyeceği kontrol edilir.
 */
export function RegionFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("region") ?? "";

  function update(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("region", next);
    } else {
      params.delete("region");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => update(e.target.value)}
      className="rounded-[10px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] font-semibold text-rg-ink outline-none focus:border-primary"
    >
      <option value="">Tüm Bölgeler</option>
      <option value="tr">{REGION_LABELS_TR.tr}</option>
      <option value="global">{REGION_LABELS_TR.global}</option>
    </select>
  );
}

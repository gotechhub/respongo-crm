"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

/**
 * Standart liste alt bilgisi: "sayfa başına 10/20/50" + önceki/sonraki sayfa.
 * URL search params (page, pageSize) üzerinden çalışır — bu yüzden server
 * component'lerdeki liste sayfalarıyla (Supabase .range() ile) doğrudan uyumlu.
 * Her yeni modül tablosu (müşteriler, lead'ler, teklifler, projeler, vb.)
 * bu bileşeni kullanmalı — tekrar tekrar aynı deseni yazmak yerine.
 */
export function Pagination({ totalCount, page, pageSize }: { totalCount: number; page: number; pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const from = totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const to = Math.min(clampedPage * pageSize, totalCount);

  function go(newPage: number, newPageSize?: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    if (newPageSize) params.set("pageSize", String(newPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  const btnClass =
    "flex h-7 w-7 items-center justify-center rounded-[7px] text-rg-ink-soft transition-colors hover:bg-rg-surface-alt disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rg-line px-4 py-3">
      <div className="flex items-center gap-2 text-[12px] text-rg-ink-soft">
        <span>Sayfa başına</span>
        <select
          value={pageSize}
          onChange={(e) => go(1, Number(e.target.value))}
          className="rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] font-semibold text-rg-ink"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-rg-ink-faint">
          {totalCount === 0 ? "Kayıt yok" : `${from}–${to} / ${totalCount} kayıt`}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <button className={btnClass} disabled={clampedPage <= 1} onClick={() => go(1)} title="İlk sayfa">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button className={btnClass} disabled={clampedPage <= 1} onClick={() => go(clampedPage - 1)} title="Önceki">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[64px] text-center text-[12px] font-semibold text-rg-ink">
          {clampedPage} / {totalPages}
        </span>
        <button
          className={btnClass}
          disabled={clampedPage >= totalPages}
          onClick={() => go(clampedPage + 1)}
          title="Sonraki"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          className={btnClass}
          disabled={clampedPage >= totalPages}
          onClick={() => go(totalPages)}
          title="Son sayfa"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

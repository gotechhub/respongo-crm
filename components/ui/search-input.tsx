"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * URL'deki `q` parametresini yöneten, debounce'lu arama kutusu. Her yeni
 * modül listesi (müşteriler, lead'ler, teklifler, projeler, şirketler...)
 * bu bileşeni kullanmalı — arama yapıldığında sayfa 1'e döner.
 */
export function SearchInput({ placeholder = "Ara..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function update(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("q", next);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
  }

  return (
    <div className="flex w-[240px] items-center gap-2 rounded-[10px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink">
      <Search className="h-3.5 w-3.5 shrink-0 text-rg-ink-faint" />
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-rg-ink outline-none placeholder:text-rg-ink-faint"
      />
      {value && (
        <button onClick={() => update("")} className="shrink-0 text-rg-ink-faint hover:text-rg-ink" title="Temizle">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

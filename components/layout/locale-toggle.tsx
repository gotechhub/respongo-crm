"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUiLocale } from "@/app/(dashboard)/locale-actions";
import type { UiLocale } from "@/lib/locale";

/**
 * Sağ üstteki TR/EN anahtarı. Önceden tamamen dekoratifti (hiçbir onClick/state
 * yoktu) — artık gerçek bir tercihi (bkz. lib/locale.ts) cookie'ye yazıp
 * sunucu bileşenlerini yeniden render ettiriyor.
 */
export function LocaleToggle({ active }: { active: UiLocale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(locale: UiLocale) {
    if (locale === active || isPending) return;
    startTransition(async () => {
      await setUiLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex overflow-hidden rounded-[10px] border border-rg-line bg-rg-surface">
      {(["tr", "en"] as const).map((locale) => (
        <button
          key={locale}
          onClick={() => select(locale)}
          disabled={isPending}
          title={locale === "tr" ? "Arayüz dilini Türkçe yap" : "Switch interface language to English"}
          className={`px-[11px] py-2 text-[11.5px] font-semibold uppercase transition-colors disabled:cursor-wait ${
            active === locale ? "bg-golms-tint text-golms" : "text-rg-ink-faint hover:bg-rg-surface-alt"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}

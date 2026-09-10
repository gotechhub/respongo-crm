"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { clearDemoData } from "./actions";

export function DemoDataPanel({ hasDemoData }: { hasDemoData: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ total: number } | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await clearDemoData();
      if (res.ok) {
        const total = Object.values(res.deletedCounts).reduce((a, b) => a + b, 0);
        setResult({ total });
        setConfirming(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (!hasDemoData && !result) {
    return (
      <p className="text-[12.2px] text-rg-ink-faint">
        Şu anda sistemde işaretli demo verisi yok — panellerdeki her şey gerçek veri.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.2px] text-rg-ink-soft">
        Örnek şirket, lead, teklif, proje, fatura ve destek talebi gibi tanıtım amaçlı demo kayıtları tek
        tıkla, gerçek verine hiç dokunmadan silinir.
      </p>

      {result && (
        <div className="rounded-[8px] border border-gofactory/30 bg-gofactory/10 px-3 py-2 text-[12px] font-medium text-gofactory">
          {result.total} demo kaydı silindi.
        </div>
      )}

      {error && (
        <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] font-medium text-destructive">
          {error}
        </div>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!hasDemoData}
          className="inline-flex w-fit items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Demo Verilerini Temizle
        </button>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-[12.2px] font-medium text-rg-ink">
              Tüm demo şirket/lead/teklif/proje/fatura/destek kaydı kalıcı olarak silinecek. Bu işlem geri
              alınamaz. Emin misin?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-destructive px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Evet, Sil
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

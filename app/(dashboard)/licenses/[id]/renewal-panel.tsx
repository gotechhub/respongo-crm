"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Ban, RotateCcw } from "lucide-react";
import { cancelLicense, reactivateLicense, renewLicense, type RenewLicenseInput } from "../actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export type RenewalRow = {
  id: string;
  previous_end_date: string;
  new_end_date: string;
  amount: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function emptyRenewal(currentEndDate: string, currency: string): RenewLicenseInput {
  const next = new Date(currentEndDate);
  next.setFullYear(next.getFullYear() + 1);
  return {
    newEndDate: next.toISOString().slice(0, 10),
    amount: null,
    currency,
    notes: "",
  };
}

export function RenewalPanel({
  licenseId,
  currentEndDate,
  currency,
  status,
  renewals,
}: {
  licenseId: string;
  currentEndDate: string;
  currency: string;
  status: "active" | "cancelled";
  renewals: RenewalRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RenewLicenseInput>(emptyRenewal(currentEndDate, currency));
  const [error, setError] = useState("");

  function set<K extends keyof RenewLicenseInput>(key: K, value: RenewLicenseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await renewLicense(licenseId, form);
      if (result.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleCancel() {
    if (!confirm("Bu lisansı iptal etmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await cancelLicense(licenseId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleReactivate() {
    setError("");
    startTransition(async () => {
      const result = await reactivateLicense(licenseId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Yenileme Geçmişi</div>
        <div className="flex items-center gap-1.5">
          {status === "active" ? (
            <>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Yenile
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[11.5px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                İptal Et
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Yeniden Aktifleştir
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded-[10px] border border-rg-line p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
                Yeni Bitiş Tarihi
              </label>
              <input
                type="date"
                value={form.newEndDate}
                onChange={(e) => set("newEndDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
                Yeni Tutar (opsiyonel)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Değişmiyorsa boş bırak"
                value={form.amount ?? ""}
                onChange={(e) => set("amount", e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              />
            </div>
          </div>
          <input placeholder="Not" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Yenilemeyi Kaydet
          </button>
        </form>
      )}

      {renewals.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">Henüz yenileme kaydı yok.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {renewals.map((r) => (
            <div key={r.id} className="rounded-[8px] bg-rg-surface-alt px-3 py-2">
              <div className="text-[12.5px] font-semibold text-rg-ink">
                {fmtDate(r.previous_end_date)} → {fmtDate(r.new_end_date)}
              </div>
              <div className="text-[11px] text-rg-ink-faint">
                {r.amount != null && r.currency ? fmtMoney(r.amount, r.currency) + " · " : ""}
                {fmtDate(r.created_at)}
                {r.notes && ` · ${r.notes}`}
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 text-[12px] text-destructive">{error}</div>}
    </div>
  );
}

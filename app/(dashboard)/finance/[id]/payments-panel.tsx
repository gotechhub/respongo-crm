"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { deletePayment, recordPayment, type PaymentInput, type PaymentMethod } from "../actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Havale/EFT",
  credit_card: "Kredi Kartı",
  cash: "Nakit",
  other: "Diğer",
};
const METHOD_KEYS = Object.keys(METHOD_LABEL) as PaymentMethod[];

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paid_at: string;
  reference_no: string | null;
  notes: string | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function emptyPayment(currency: string): PaymentInput {
  return {
    amount: 0,
    currency,
    method: "bank_transfer",
    paidAt: new Date().toISOString().slice(0, 10),
    referenceNo: "",
    notes: "",
  };
}

export function PaymentsPanel({
  invoiceId,
  currency,
  invoiceStatus,
  payments,
  remaining,
}: {
  invoiceId: string;
  currency: string;
  invoiceStatus: string;
  payments: PaymentRow[];
  remaining: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaymentInput>(emptyPayment(currency));
  const [error, setError] = useState("");

  function set<K extends keyof PaymentInput>(key: K, value: PaymentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await recordPayment(invoiceId, form);
      if (result.ok) {
        setForm(emptyPayment(currency));
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(paymentId: string) {
    if (!confirm("Bu ödeme kaydını silmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await deletePayment(paymentId, invoiceId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const canAdd = invoiceStatus !== "cancelled" && invoiceStatus !== "paid";

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Ödemeler</div>
        {canAdd && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line"
          >
            <Plus className="h-3.5 w-3.5" />
            Ödeme Ekle
          </button>
        )}
      </div>

      {remaining > 0 && invoiceStatus !== "cancelled" && (
        <div className="mb-4 rounded-[8px] bg-gocatalog-tint px-3 py-2 text-[12px] font-semibold text-gocatalog">
          Kalan bakiye: {fmtMoney(remaining, currency)}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded-[10px] border border-rg-line p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              placeholder="Tutar"
              value={form.amount || ""}
              onChange={(e) => set("amount", Number(e.target.value) || 0)}
              className={inputClass}
            />
            <select value={form.method} onChange={(e) => set("method", e.target.value as PaymentMethod)} className={inputClass}>
              {METHOD_KEYS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </select>
            <input type="date" value={form.paidAt} onChange={(e) => set("paidAt", e.target.value)} className={inputClass} />
            <input
              placeholder="Referans No"
              value={form.referenceNo}
              onChange={(e) => set("referenceNo", e.target.value)}
              className={inputClass}
            />
          </div>
          <input placeholder="Not" value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Kaydet
          </button>
        </form>
      )}

      {payments.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">Henüz ödeme kaydedilmedi.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-[8px] bg-rg-surface-alt px-3 py-2">
              <div>
                <div className="text-[12.5px] font-semibold text-rg-ink">{fmtMoney(p.amount, p.currency)}</div>
                <div className="text-[11px] text-rg-ink-faint">
                  {METHOD_LABEL[p.method]} · {fmtDate(p.paid_at)}
                  {p.reference_no && ` · ${p.reference_no}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className="text-destructive transition-colors hover:brightness-90 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 text-[12px] text-destructive">{error}</div>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateCommissionEntry } from "./actions";

export type CommissionEntryRow = {
  id: string;
  partnerId: string;
  partnerName: string;
  proposalId: string;
  proposalTitle: string;
  commissionRate: number;
  amount: number;
  currency: string;
  status: "unpaid" | "paid";
  paidAt: string | null;
  adminNote: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<CommissionEntryRow["status"], string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
};
const STATUS_CLASS: Record<CommissionEntryRow["status"], string> = {
  unpaid: "bg-golxp-tint text-golxp",
  paid: "bg-gofactory-tint text-gofactory",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtAmount(n: number, currency: string) {
  return currency + " " + n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({ row }: { row: CommissionEntryRow }) {
  const [status, setStatus] = useState(row.status);
  const [adminNote, setAdminNote] = useState(row.adminNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = status !== row.status || adminNote !== (row.adminNote ?? "");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateCommissionEntry(row.id, { status, adminNote });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line align-top">
      <td className="px-4 py-3">
        <div className="text-[12.8px] font-semibold text-rg-ink">{row.partnerName}</div>
        <div className="text-[11px] text-rg-ink-faint">{fmtDate(row.createdAt)}</div>
      </td>
      <td className="max-w-[220px] px-4 py-3 text-[12px] text-rg-ink-soft">
        <div className="truncate">{row.proposalTitle}</div>
      </td>
      <td className="px-4 py-3 text-[12.5px] font-semibold text-rg-ink">{fmtAmount(row.amount, row.currency)}</td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">%{row.commissionRate}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CommissionEntryRow["status"])}
          className={
            "rounded-full border px-2.5 py-1 text-[11px] font-bold outline-none " + STATUS_CLASS[status]
          }
          style={{ borderColor: "transparent" }}
        >
          <option value="unpaid">{STATUS_LABEL.unpaid}</option>
          <option value="paid">{STATUS_LABEL.paid}</option>
        </select>
        {row.paidAt && status === "paid" && (
          <div className="mt-1 text-[10.5px] text-rg-ink-faint">{fmtDate(row.paidAt)}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="İç not..."
          className="w-full min-w-[140px] rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleSave}
          disabled={isPending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
        {error && <div className="mt-1 max-w-[160px] text-[11px] text-destructive">{error}</div>}
      </td>
    </tr>
  );
}

export function CommissionPanel({ entries }: { entries: CommissionEntryRow[] }) {
  const totalsByCurrency: Record<string, { unpaid: number; paid: number }> = {};
  entries.forEach((e) => {
    totalsByCurrency[e.currency] = totalsByCurrency[e.currency] ?? { unpaid: 0, paid: 0 };
    totalsByCurrency[e.currency][e.status] += e.amount;
  });

  return (
    <div className="flex flex-col gap-4">
      {Object.keys(totalsByCurrency).length > 0 && (
        <div className="flex flex-wrap gap-4">
          {Object.entries(totalsByCurrency).map(([currency, t]) => (
            <div key={currency} className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
              <div className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">{currency}</div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-[12px] text-golxp">Ödenmedi: <strong>{fmtAmount(t.unpaid, currency)}</strong></span>
                <span className="text-[12px] text-gofactory">Ödendi: <strong>{fmtAmount(t.paid, currency)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Ortak</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Teklif</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Tutar</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Oran</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">İç Not</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <Row key={row.id} row={row} />
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Henüz komisyon kaydı yok — bir teklif kabul edildiğinde ilgili iş ortağı için otomatik oluşur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

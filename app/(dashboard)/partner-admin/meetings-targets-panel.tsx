"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { upsertPartnerMonthlyTarget } from "./actions";

export type MeetingsTargetRow = {
  partnerId: string;
  partnerName: string;
  targetRevenue: number | null;
  targetMeetings: number | null;
  currency: string;
  adminNote: string | null;
  actualRevenue: number;
  actualMeetings: number;
  scheduledMeetings: number;
};

const CURRENCIES = ["USD", "EUR", "TRY", "GBP"];

function fmtAmount(n: number, currency: string) {
  return currency + " " + n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Row({ row, year, month }: { row: MeetingsTargetRow; year: number; month: number }) {
  const [targetRevenue, setTargetRevenue] = useState(row.targetRevenue?.toString() ?? "");
  const [targetMeetings, setTargetMeetings] = useState(row.targetMeetings?.toString() ?? "");
  const [currency, setCurrency] = useState(row.currency);
  const [adminNote, setAdminNote] = useState(row.adminNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    targetRevenue !== (row.targetRevenue?.toString() ?? "") ||
    targetMeetings !== (row.targetMeetings?.toString() ?? "") ||
    currency !== row.currency ||
    adminNote !== (row.adminNote ?? "");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const parsedRevenue = targetRevenue.trim() === "" ? null : Number(targetRevenue);
      const parsedMeetings = targetMeetings.trim() === "" ? null : Number(targetMeetings);
      if (parsedRevenue !== null && Number.isNaN(parsedRevenue)) {
        setError("Ciro hedefi geçerli bir sayı olmalı.");
        return;
      }
      if (parsedMeetings !== null && Number.isNaN(parsedMeetings)) {
        setError("Toplantı hedefi geçerli bir sayı olmalı.");
        return;
      }
      const result = await upsertPartnerMonthlyTarget(row.partnerId, year, month, {
        targetRevenue: parsedRevenue,
        targetMeetings: parsedMeetings,
        currency,
        adminNote,
      });
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
      </td>
      <td className="px-4 py-3 text-[12.5px] text-rg-ink-soft">
        <span className="font-semibold text-rg-ink">{row.actualMeetings}</span>
        {row.targetMeetings != null ? ` / ${row.targetMeetings}` : ""}
        <div className="text-[10.5px] text-rg-ink-faint">bu ay planlanan: {row.scheduledMeetings}</div>
      </td>
      <td className="px-4 py-3 text-[12.5px] text-rg-ink-soft">
        <span className="font-semibold text-rg-ink">{fmtAmount(row.actualRevenue, currency)}</span>
        {row.targetRevenue != null ? ` / ${fmtAmount(row.targetRevenue, currency)}` : ""}
      </td>
      <td className="px-4 py-3">
        <input
          value={targetMeetings}
          onChange={(e) => setTargetMeetings(e.target.value)}
          placeholder="—"
          className="w-16 rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={targetRevenue}
          onChange={(e) => setTargetRevenue(e.target.value)}
          placeholder="—"
          className="w-24 rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        />
      </td>
      <td className="px-4 py-3">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

export function MeetingsTargetsPanel({
  rows,
  year,
  month,
  monthLabel,
}: {
  rows: MeetingsTargetRow[];
  year: number;
  month: number;
  monthLabel: string;
}) {
  const totalActualMeetings = rows.reduce((sum, r) => sum + r.actualMeetings, 0);
  const totalTargetMeetings = rows.reduce((sum, r) => sum + (r.targetMeetings ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
          <div className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
            {monthLabel} — Toplam Tamamlanan Toplantı
          </div>
          <div className="mt-1 text-[15px] font-bold text-rg-ink">
            {totalActualMeetings}
            {totalTargetMeetings > 0 ? ` / ${totalTargetMeetings}` : ""}
          </div>
        </div>
        <div className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
          <div className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
            Hedefi Girilmiş Ortak
          </div>
          <div className="mt-1 text-[15px] font-bold text-rg-ink">
            {rows.filter((r) => r.targetMeetings != null || r.targetRevenue != null).length} / {rows.length}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Ortak</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Toplantı (gerçek/hedef)
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Ciro (gerçek/hedef)
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Toplantı Hedefi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Ciro Hedefi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Para Birimi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">İç Not</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Row key={row.partnerId} row={row} year={year} month={month} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Henüz kayıtlı satış iş ortağı yok.
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

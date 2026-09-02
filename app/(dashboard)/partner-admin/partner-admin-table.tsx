"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { updatePartnerAdmin } from "./actions";

export type PartnerAdminRow = {
  partnerProfileId: string;
  profileId: string;
  fullName: string | null;
  email: string;
  region: Region | null;
  companyName: string | null;
  country: string | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  commissionRate: number | null;
  status: "pending_review" | "active" | "suspended";
  adminNote: string | null;
};

const STATUS_OPTIONS: PartnerAdminRow["status"][] = ["pending_review", "active", "suspended"];
const STATUS_LABEL: Record<PartnerAdminRow["status"], string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  suspended: "Askıya Alındı",
};

function Row({ row }: { row: PartnerAdminRow }) {
  const [commissionRate, setCommissionRate] = useState(row.commissionRate?.toString() ?? "");
  const [status, setStatus] = useState(row.status);
  const [adminNote, setAdminNote] = useState(row.adminNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    commissionRate !== (row.commissionRate?.toString() ?? "") || status !== row.status || adminNote !== (row.adminNote ?? "");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const parsed = commissionRate.trim() === "" ? null : Number(commissionRate);
      if (parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
        setError("Komisyon oranı 0-100 arasında bir sayı olmalı.");
        return;
      }
      const result = await updatePartnerAdmin(row.partnerProfileId, {
        commissionRate: parsed,
        status,
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
        <div className="text-[12.8px] font-semibold text-rg-ink">{row.fullName || "(isim girilmemiş)"}</div>
        <div className="text-[11.5px] text-rg-ink-faint">{row.email}</div>
        <div className="mt-0.5 text-[11px] text-rg-ink-faint">
          {row.region ? REGION_LABELS_TR[row.region] : "—"}
        </div>
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        <div>{row.companyName || "—"}</div>
        <div className="text-[11px] text-rg-ink-faint">{row.country || "—"}</div>
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        {row.onboardingCompleted ? "Tamamlandı" : `Adım ${row.onboardingStep}/5`}
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PartnerAdminRow["status"])}
          className="rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <input
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="—"
            className="w-16 rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
          />
          <span className="text-[12px] text-rg-ink-faint">%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="İç not..."
          className="w-full min-w-[160px] rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
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

export function PartnerAdminTable({ rows }: { rows: PartnerAdminRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Ortak</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Firma</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Kayıt</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Komisyon</th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">İç Not</th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.partnerProfileId} row={row} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Henüz kayıtlı satış iş ortağı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

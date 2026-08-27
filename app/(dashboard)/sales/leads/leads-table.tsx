"use client";

import { Suspense, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { Pagination } from "@/components/ui/pagination";
import { convertLeadToCustomer, updateLeadStatus, type LeadStatus } from "./actions";

export type LeadRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: LeadStatus;
  value_estimate: number | null;
  currency: string;
  region: Region | null;
  owner_id: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  yeni: "Yeni",
  gorusme: "Görüşme",
  teklif: "Teklif",
  musteri: "Müşteri",
  kaybedildi: "Kaybedildi",
};

const STATUS_CLASS: Record<LeadStatus, string> = {
  yeni: "bg-golms-tint text-golms",
  gorusme: "bg-gocatalog-tint text-gocatalog",
  teklif: "bg-golxp-tint text-golxp",
  musteri: "bg-gofactory-tint text-gofactory",
  kaybedildi: "bg-rg-surface-alt text-rg-ink-faint",
};

const EDITABLE_STATUSES: LeadStatus[] = ["yeni", "gorusme", "teklif", "kaybedildi"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function LeadRowItem({ row, ownerName }: { row: LeadRow; ownerName: string }) {
  const [status, setStatus] = useState<LeadStatus>(row.status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleStatusChange(next: LeadStatus) {
    setStatus(next);
    setError("");
    startTransition(async () => {
      const result = await updateLeadStatus(row.id, next);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        setError(result.error);
        setStatus(row.status);
      }
    });
  }

  function handleConvert() {
    setError("");
    startTransition(async () => {
      const result = await convertLeadToCustomer(row.id);
      if (result.ok) {
        setStatus("musteri");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line">
      <td className="px-4 py-3">
        <div className="text-[12.8px] font-semibold text-rg-ink">{row.company_name}</div>
        <div className="text-[11.5px] text-rg-ink-faint">
          {row.contact_name || "—"}
          {row.contact_email ? ` · ${row.contact_email}` : ""}
        </div>
      </td>
      <td className="px-4 py-3">
        {status === "musteri" || status === "kaybedildi" ? (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " +
              STATUS_CLASS[status]
            }
          >
            {STATUS_LABEL[status]}
          </span>
        ) : (
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
            className="rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
          >
            {EDITABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}
        {saved && <Check className="ml-1.5 inline h-3.5 w-3.5 text-gofactory" />}
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        {row.region ? REGION_LABELS_TR[row.region] : "—"}
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{ownerName}</td>
      <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.created_at)}</td>
      <td className="px-4 py-3 text-right">
        {status !== "musteri" && status !== "kaybedildi" && (
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Müşteriye Dönüştür
          </button>
        )}
        {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
      </td>
    </tr>
  );
}

export function LeadsTable({
  rows,
  ownerNames,
  pagination,
}: {
  rows: LeadRow[];
  ownerNames: Record<string, string>;
  pagination?: { totalCount: number; page: number; pageSize: number };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse">
        <thead>
          <tr className="bg-rg-surface-alt text-left">
            <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Firma
            </th>
            <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Durum
            </th>
            <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Bölge
            </th>
            <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Sahibi
            </th>
            <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Tarih
            </th>
            <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <LeadRowItem key={row.id} row={row} ownerName={row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                Henüz müşteri adayı yok — Müşteri Havuzu&apos;ndan bir kayıt lead&apos;e çevirebilirsin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      {pagination && (
        <Suspense fallback={<div className="h-[52px]" />}>
          <Pagination totalCount={pagination.totalCount} page={pagination.page} pageSize={pagination.pageSize} />
        </Suspense>
      )}
    </div>
  );
}

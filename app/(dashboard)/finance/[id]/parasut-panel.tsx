"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Send, XCircle } from "lucide-react";
import { syncInvoiceToParasutAction } from "../actions";

type SyncStatus = "not_applicable" | "pending" | "synced" | "failed";

const STATUS_META: Record<SyncStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  not_applicable: { label: "Kapsam Dışı (TR değil)", cls: "bg-rg-surface-alt text-rg-ink-faint", icon: <Clock className="h-3.5 w-3.5" /> },
  pending: { label: "Gönderilmedi", cls: "bg-gocatalog-tint text-gocatalog", icon: <Clock className="h-3.5 w-3.5" /> },
  synced: { label: "Paraşüt'e Gönderildi", cls: "bg-gofactory-tint text-gofactory", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  failed: { label: "Gönderim Başarısız", cls: "bg-destructive/10 text-destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ParasutPanel({
  invoiceId,
  syncStatus,
  parasutInvoiceNo,
  parasutError,
  parasutSyncedAt,
}: {
  invoiceId: string;
  syncStatus: SyncStatus;
  parasutInvoiceNo: string | null;
  parasutError: string | null;
  parasutSyncedAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const meta = STATUS_META[syncStatus];

  function handleSync() {
    setError("");
    startTransition(async () => {
      const result = await syncInvoiceToParasutAction(invoiceId);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  if (syncStatus === "not_applicable") return null;

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-rg-ink">Paraşüt</span>
        <span className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold " + meta.cls}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {parasutInvoiceNo && (
        <div className="mb-2 text-[12px] text-rg-ink-soft">
          Resmi Fatura No: <span className="font-semibold text-rg-ink">{parasutInvoiceNo}</span>
        </div>
      )}
      {parasutSyncedAt && (
        <div className="mb-3 text-[11.5px] text-rg-ink-faint">Gönderim: {fmtDateTime(parasutSyncedAt)}</div>
      )}
      {parasutError && (
        <div className="mb-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {parasutError}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}

      {syncStatus !== "synced" && (
        <button
          type="button"
          onClick={handleSync}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Paraşüt’e Gönder
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import {
  customerAcceptProposal,
  customerRejectProposal,
  customerRequestProposalRevision,
} from "../../../../(dashboard)/sales/proposals/actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

// Müşterinin "sent" durumundaki bir teklife verdiği gerçek karar — bu ekran
// sadece status === "sent" iken render ediliyor (bkz. page.tsx).
export function CustomerDecisionPanel({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [note, setNote] = useState("");

  function handleAccept() {
    setError("");
    startTransition(async () => {
      const result = await customerAcceptProposal(proposalId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleReject() {
    if (!confirm("Bu teklifi reddetmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await customerRejectProposal(proposalId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleRequestRevision() {
    if (!note.trim()) {
      setError("Ne değişmesini istediğini kısaca yazman gerekiyor.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await customerRequestProposalRevision(proposalId, note);
      if (result.ok) {
        setNote("");
        setRevisionOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3 text-[13px] font-bold text-rg-ink">Bu teklif için kararın nedir?</div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-gofactory px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <CheckCircle2 className="h-3.5 w-3.5" />
          Kabul Ediyorum
        </button>
        <button
          type="button"
          onClick={() => setRevisionOpen((v) => !v)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-4 py-2.5 text-[12.8px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
        >
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Revizyon İstiyorum
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-[12.8px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reddediyorum
        </button>
      </div>

      {revisionOpen && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Teklifte ne değişmesini istiyorsun? (ör. fiyat, kapsam, süre)"
            className={`${inputClass} resize-y`}
          />
          <button
            type="button"
            onClick={handleRequestRevision}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-gotools px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Talebi Gönder
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

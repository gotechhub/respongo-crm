"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, MessageSquareWarning } from "lucide-react";
import { approveProposal, requestProposalRevision, type ProposalStatus } from "../actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

// Onay akışının görsel katmanı — durum bazında 3 farklı görünüm:
// 1) pending_approval + kurucu  -> Onayla / Revizyon İste aksiyonları
// 2) pending_approval + kurucu DEĞİL -> "kurucu onayı bekleniyor" bilgi kartı
// 3) revision_requested (herkes) -> kurucunun revizyon notu
export function ProposalApprovalPanel({
  proposalId,
  status,
  approvalNote,
  customerNote,
  isFounder,
}: {
  proposalId: string;
  status: ProposalStatus;
  approvalNote: string | null;
  customerNote: string | null;
  isFounder: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  function handleApprove() {
    setError("");
    startTransition(async () => {
      const result = await approveProposal(proposalId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleRequestRevision() {
    if (!note.trim()) {
      setError("Revizyon notu yazman gerekiyor.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await requestProposalRevision(proposalId, note);
      if (result.ok) {
        setNote("");
        setNoteOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (status === "pending_approval") {
    if (isFounder) {
      return (
        <div className="flex flex-col gap-3 rounded-2xl bg-gocatalog-tint p-5">
          <div className="flex items-center gap-2 text-[12.8px] font-bold text-gocatalog">
            <Clock className="h-4 w-4" />
            Bu teklif eşik üzerinde — onayını bekliyor.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-gofactory px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <CheckCircle2 className="h-3.5 w-3.5" />
              Onayla ve Gönder
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen((v) => !v)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
            >
              <MessageSquareWarning className="h-3.5 w-3.5" />
              Revizyon İste
            </button>
          </div>
          {noteOpen && (
            <div className="flex flex-col gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Satışçıya iletilecek revizyon notu (ör. iskonto oranını düşür, tutarı gözden geçir)..."
                className={`${inputClass} resize-y`}
              />
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={isPending}
                className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-gotools px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Notu Gönder
              </button>
            </div>
          )}
          {error && <span className="text-[12px] text-destructive">{error}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-gocatalog-tint px-5 py-3.5 text-[12.5px] font-semibold text-gocatalog">
        <Clock className="h-4 w-4 shrink-0" />
        Bu teklif eşik üzerinde — kurucu onayı bekleniyor.
      </div>
    );
  }

  if (status === "revision_requested" && approvalNote) {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-gotools-tint px-5 py-3.5 text-[12.5px] text-gotools">
        <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-bold">Kurucu revizyon istedi:</div>
          <div className="mt-0.5 text-rg-ink-soft">{approvalNote}</div>
        </div>
      </div>
    );
  }

  // Müşteri portalından gelen revizyon talebi — kurucunun iç notundan
  // (approvalNote) ayrı, farklı renkle gösteriliyor ki kaynağı net olsun.
  if (status === "revision_requested" && customerNote) {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-golxp-tint px-5 py-3.5 text-[12.5px] text-golxp">
        <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-bold">Müşteri revizyon istedi:</div>
          <div className="mt-0.5 text-rg-ink-soft">{customerNote}</div>
        </div>
      </div>
    );
  }

  return null;
}

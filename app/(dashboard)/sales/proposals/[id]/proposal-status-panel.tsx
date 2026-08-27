"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProposal, updateProposalStatus, type ProposalStatus } from "../actions";

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Taslak",
  pending_approval: "Onay Bekliyor",
  revision_requested: "Revizyon İstendi",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const STATUS_CLASS: Record<ProposalStatus, string> = {
  draft: "bg-rg-surface-alt text-rg-ink-faint",
  pending_approval: "bg-gocatalog-tint text-gocatalog",
  revision_requested: "bg-gotools-tint text-gotools",
  sent: "bg-golxp-tint text-golxp",
  accepted: "bg-gofactory-tint text-gofactory",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-rg-surface-alt text-rg-ink-faint",
};

// draft ve revision_requested durumundan gönderme artık ProposalEditor'daki
// "Teklifi Gönder" butonuyla yapılıyor (eşik kontrolü + kalem düzenleme bir
// arada olduğu için). pending_approval'dan çıkış ProposalApprovalPanel'de
// (sadece kurucu). Burada sadece "sent" sonrası gerçek müşteri kararı elle
// işaretleniyor.
const NEXT_STATUSES: Record<ProposalStatus, Extract<ProposalStatus, "accepted" | "rejected" | "expired">[]> = {
  draft: [],
  pending_approval: [],
  revision_requested: [],
  sent: ["accepted", "rejected", "expired"],
  accepted: [],
  rejected: [],
  expired: [],
};

export function ProposalStatusPanel({ proposalId, initialStatus }: { proposalId: string; initialStatus: ProposalStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleStatusChange(next: Extract<ProposalStatus, "accepted" | "rejected" | "expired">) {
    setError("");
    startTransition(async () => {
      const result = await updateProposalStatus(proposalId, next);
      if (result.ok) {
        setStatus(next);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Bu teklifi kalıcı olarak silmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteProposal(proposalId);
      if (result.ok) {
        router.push("/sales/proposals");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-[10px] py-1.5 text-[11.5px] font-bold " +
            STATUS_CLASS[status]
          }
        >
          {STATUS_LABEL[status]}
        </span>
        {NEXT_STATUSES[status].map((next) => (
          <button
            key={next}
            onClick={() => handleStatusChange(next)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {STATUS_LABEL[next]} yap
          </button>
        ))}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="ml-auto inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>
      </div>
      {error && (
        <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

export { STATUS_LABEL as PROPOSAL_STATUS_LABEL, STATUS_CLASS as PROPOSAL_STATUS_CLASS };

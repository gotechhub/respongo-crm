"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateProposalApprovalMethod } from "../actions";

// V2 Revizeler bölüm A/B: satışçı/founder, teklif henüz taslak/revizyon aşamasındayken hangi
// onay yönteminin bekleneceğini seçer. Teklif "sent" ve sonrasında bu artık salt-okunur alan
// olarak proposal-detail sayfasında InfoField ile gösteriliyor (bkz. page.tsx) — burada
// SADECE isEditable=true iken render ediliyor.
export function ApprovalMethodSelector({
  proposalId,
  currentMethod,
}: {
  proposalId: string;
  currentMethod: "e_approval" | "signed_upload";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleChange(method: "e_approval" | "signed_upload") {
    if (method === currentMethod) return;
    setError("");
    startTransition(async () => {
      const result = await updateProposalApprovalMethod(proposalId, method);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Onay Yöntemi</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleChange("e_approval")}
          disabled={isPending}
          className={
            "rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors " +
            (currentMethod === "e_approval"
              ? "bg-primary text-white"
              : "border border-rg-line bg-rg-surface text-rg-ink-soft hover:bg-rg-surface-alt")
          }
        >
          E-Onay
        </button>
        <button
          type="button"
          onClick={() => handleChange("signed_upload")}
          disabled={isPending}
          className={
            "rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors " +
            (currentMethod === "signed_upload"
              ? "bg-primary text-white"
              : "border border-rg-line bg-rg-surface text-rg-ink-soft hover:bg-rg-surface-alt")
          }
        >
          İmzalı Yükleme
        </button>
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-rg-ink-faint" />}
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

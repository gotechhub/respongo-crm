"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { archiveTicket, unarchiveTicket } from "./actions";

// Liste satırında ve talep detayında aynı arşiv/arşivden-çıkar davranışını
// tek yerden sağlayan küçük bir istemci bileşeni — DERS: destek talebi
// kaydı asla silinmez (bkz. support_tickets migration yorumu), arşivleme
// sadece görünürlüğü değiştirir.
export function ArchiveToggleButton({
  ticketId,
  isArchived,
  size = "sm",
}: {
  ticketId: string;
  isArchived: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = isArchived ? await unarchiveTicket(ticketId) : await archiveTicket(ticketId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        title={isArchived ? "Arşivden çıkar" : "Arşivle"}
        className={
          "inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt disabled:opacity-50 " +
          (size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2 text-[12px]")
        }
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isArchived ? (
          <ArchiveRestore className="h-3.5 w-3.5" />
        ) : (
          <Archive className="h-3.5 w-3.5" />
        )}
        {isArchived ? "Arşivden Çıkar" : "Arşivle"}
      </button>
      {error && <span className="text-[10.5px] text-destructive">{error}</span>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateCustomerRequestStatus } from "./actions";
import { REQUEST_STATUS_LABEL, type CustomerRequestStatus } from "@/lib/customer-request-labels";

const STATUSES = Object.keys(REQUEST_STATUS_LABEL) as CustomerRequestStatus[];

export function RequestStatusControl({
  requestId,
  currentStatus,
  currentNote,
}: {
  requestId: string;
  currentStatus: CustomerRequestStatus;
  currentNote: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateCustomerRequestStatus(requestId, status, note);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-rg-surface-alt p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              "rounded-[7px] px-2.5 py-1 text-[11px] font-semibold transition-colors " +
              (status === s
                ? "bg-primary text-white"
                : "border border-rg-line bg-rg-surface text-rg-ink-soft hover:bg-rg-surface-alt")
            }
          >
            {REQUEST_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Müşteriye görünecek not (opsiyonel)..."
        className="resize-y rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12px] text-rg-ink outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || (status === currentStatus && note === (currentNote ?? ""))}
        className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        Kaydet
      </button>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

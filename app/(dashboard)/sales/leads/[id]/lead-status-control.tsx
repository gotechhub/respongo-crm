"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { convertLeadToCustomer, updateLeadStatus, type LeadStatus } from "../actions";
import { LEAD_STATUS_LABEL, LEAD_STATUS_CLASS, EDITABLE_LEAD_STATUSES } from "../status-labels";

export function LeadStatusControl({
  leadId,
  status,
  convertedCustomerId,
}: {
  leadId: string;
  status: LeadStatus;
  convertedCustomerId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleChange(next: LeadStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, next);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleConvert() {
    setError("");
    startTransition(async () => {
      const result = await convertLeadToCustomer(leadId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const isFinal = status === "musteri" || status === "kaybedildi";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {isFinal ? (
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-[10px] py-1 text-[11px] font-bold " +
            LEAD_STATUS_CLASS[status]
          }
        >
          {LEAD_STATUS_LABEL[status]}
        </span>
      ) : (
        <>
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => handleChange(e.target.value as LeadStatus)}
            className={
              "rounded-full border-none px-[10px] py-1 text-[11px] font-bold outline-none disabled:opacity-60 " +
              LEAD_STATUS_CLASS[status]
            }
          >
            {EDITABLE_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Müşteriye Dönüştür
          </button>
        </>
      )}
      {status === "musteri" && convertedCustomerId && (
        <Link
          href={`/sales/customers/${convertedCustomerId}`}
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          Müşteri kaydına git →
        </Link>
      )}
      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
    </div>
  );
}

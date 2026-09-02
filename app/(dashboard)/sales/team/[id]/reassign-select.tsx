"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { reassignOwner, type ReassignableKind } from "../actions";

export type ReassignOption = { id: string; label: string };

export function ReassignSelect({
  kind,
  recordId,
  options,
}: {
  kind: ReassignableKind;
  recordId: string;
  options: ReassignOption[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleReassign() {
    if (!value) return;
    setError("");
    startTransition(async () => {
      const result = await reassignOwner(kind, recordId, value);
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gofactory">
        <Check className="h-3.5 w-3.5" /> Devredildi
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[11.5px] text-rg-ink outline-none focus:border-primary"
      >
        <option value="">Devret...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleReassign}
        disabled={!value || isPending}
        className="inline-flex items-center gap-1 rounded-[8px] bg-primary px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-40"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        Onayla
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}

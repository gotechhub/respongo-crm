"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { InvoiceFormFields, type CustomerOption, type UnbilledProposal } from "../invoice-form";
import { deleteInvoice, updateInvoice, updateInvoiceStatus, type InvoiceInput, type InvoiceStatus } from "../actions";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Taslak",
  sent: "Kesildi",
  paid: "Ödendi",
  cancelled: "İptal Edildi",
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-rg-surface-alt text-rg-ink-faint",
  sent: "bg-golxp-tint text-golxp",
  paid: "bg-gofactory-tint text-gofactory",
  cancelled: "bg-destructive/10 text-destructive",
};

const NEXT_ACTIONS: Record<InvoiceStatus, { to: InvoiceStatus; label: string; cls: string }[]> = {
  draft: [
    { to: "sent", label: "Faturayı Kes", cls: "bg-golxp text-white hover:brightness-[1.08]" },
    { to: "cancelled", label: "İptal Et", cls: "bg-destructive text-white hover:brightness-[1.08]" },
  ],
  sent: [{ to: "cancelled", label: "İptal Et", cls: "bg-destructive text-white hover:brightness-[1.08]" }],
  paid: [],
  cancelled: [],
};

export function InvoiceStatusPanel({
  invoiceId,
  initialStatus,
  initial,
  customers,
  proposals,
}: {
  invoiceId: string;
  initialStatus: InvoiceStatus;
  initial: InvoiceInput;
  customers: CustomerOption[];
  proposals: UnbilledProposal[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<InvoiceInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof InvoiceInput>(key: K, value: InvoiceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTransition(next: InvoiceStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, next);
      if (result.ok) {
        setStatus(next);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateInvoice(invoiceId, form);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Bu faturayı kalıcı olarak silmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result.ok) {
        router.push("/finance");
      } else {
        setError(result.error);
      }
    });
  }

  const locked = status === "paid";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={"inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold " + STATUS_CLASS[status]}>
          {STATUS_LABEL[status]}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {NEXT_ACTIONS[status].map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => handleTransition(action.to)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50 ${action.cls}`}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {action.label}
            </button>
          ))}
          {!locked && (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt"
              >
                {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Vazgeç" : "Düzenle"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <InvoiceFormFields form={form} set={set} customers={customers} proposals={proposals} />
          <div className="col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Güncelle
            </button>
          </div>
        </form>
      )}
      {error && (
        <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

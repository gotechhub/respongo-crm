"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createTicketFromPortal } from "../../../(dashboard)/support/actions";
import { PRODUCT_LABEL } from "../../../(dashboard)/support/ticket-form";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL);

export function NewTicketForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [product, setProduct] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createTicketFromPortal(customerId, subject, product || null);
      if (result.ok) {
        setSubject("");
        setProduct("");
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Yeni Destek Talebi"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Konu *</label>
            <input
              placeholder="Sorununu kısaca özetle"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>İlgili Ürün (opsiyonel)</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={inputClass}>
              <option value="">Genel destek</option>
              {PRODUCT_KEYS.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Talebi Gönder
            </button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

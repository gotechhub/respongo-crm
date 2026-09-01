"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createTicket, type TicketInput, type TicketPriority } from "./actions";

export const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL);

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  urgent: "Acil",
};

export const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
export const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type CustomerOption = { id: string; company_name: string };

function emptyTicket(): TicketInput {
  return { customerId: "", subject: "", product: null, priority: "normal" };
}

export function TicketCreateForm({ customers }: { customers: CustomerOption[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TicketInput>(emptyTicket());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof TicketInput>(key: K, value: TicketInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createTicket(form);
      if (result.ok) {
        setForm(emptyTicket());
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Yeni Talep"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Müşteri *</label>
            <select value={form.customerId} onChange={(e) => set("customerId", e.target.value)} className={inputClass}>
              <option value="">Seç</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ürün (opsiyonel)</label>
            <select value={form.product ?? ""} onChange={(e) => set("product", e.target.value || null)} className={inputClass}>
              <option value="">Genel destek</option>
              {PRODUCT_KEYS.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Öncelik</label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as TicketPriority)}
              className={inputClass}
            >
              {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3 flex flex-col gap-1.5">
            <label className={labelClass}>Konu *</label>
            <input
              placeholder="ör. GOLMS raporlama ekranında hata"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kaydet
            </button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

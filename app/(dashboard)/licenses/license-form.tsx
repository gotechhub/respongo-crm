"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createLicense, type LicenseInput } from "./actions";

const CURRENCIES = ["USD", "EUR", "TRY", "GBP"];

export const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL);

export const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
export const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type CustomerOption = { id: string; company_name: string };
export type AcceptedProposal = {
  id: string;
  title: string;
  customer_id: string | null;
  total_amount: number;
  currency: string;
};

export function LicenseFormFields({
  form,
  set,
  customers,
  proposals,
}: {
  form: LicenseInput;
  set: <K extends keyof LicenseInput>(key: K, value: LicenseInput[K]) => void;
  customers: CustomerOption[];
  proposals: AcceptedProposal[];
}) {
  function applyProposal(proposalId: string) {
    set("proposalId", proposalId || null);
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      set("amount", Number(proposal.total_amount));
      set("currency", proposal.currency);
      if (proposal.customer_id) set("customerId", proposal.customer_id);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Kaynak Teklif (opsiyonel)</label>
        <select value={form.proposalId ?? ""} onChange={(e) => applyProposal(e.target.value)} className={inputClass}>
          <option value="">Doğrudan lisans (teklifsiz)</option>
          {proposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} — {p.total_amount.toLocaleString("tr-TR")} {p.currency}
            </option>
          ))}
        </select>
      </div>
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
        <label className={labelClass}>Ürün *</label>
        <select value={form.product} onChange={(e) => set("product", e.target.value)} className={inputClass}>
          {PRODUCT_KEYS.map((p) => (
            <option key={p} value={p}>
              {PRODUCT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Lisans Adı (opsiyonel)</label>
        <input
          placeholder="ör. GOLMS - 500 kullanıcı paketi"
          value={form.licenseName}
          onChange={(e) => set("licenseName", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Kullanıcı Sayısı (opsiyonel)</label>
        <input
          type="number"
          min={0}
          value={form.seatCount ?? ""}
          onChange={(e) => set("seatCount", e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        />
      </div>
      <div />
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Tutar</label>
        <input
          type="number"
          min={0}
          value={form.amount || ""}
          onChange={(e) => set("amount", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Para Birimi</label>
        <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputClass}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div />
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Başlangıç Tarihi</label>
        <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bitiş/Yenileme Tarihi *</label>
        <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputClass} />
      </div>
      <div />
      <div className="col-span-3 flex flex-col gap-1.5">
        <label className={labelClass}>Not</label>
        <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
      </div>
    </>
  );
}

export function emptyLicense(): LicenseInput {
  return {
    customerId: "",
    proposalId: null,
    product: "golms",
    licenseName: "",
    seatCount: null,
    amount: 0,
    currency: "USD",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: "",
  };
}

export function LicenseCreateForm({
  customers,
  proposals,
}: {
  customers: CustomerOption[];
  proposals: AcceptedProposal[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LicenseInput>(emptyLicense());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof LicenseInput>(key: K, value: LicenseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createLicense(form);
      if (result.ok) {
        setForm(emptyLicense());
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
          {showForm ? "Vazgeç" : "Yeni Lisans"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <LicenseFormFields form={form} set={set} customers={customers} proposals={proposals} />
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

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Power, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { updateCustomer, toggleCustomerActive, type CustomerInput } from "../actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export function CustomerDetailPanel({
  customerId,
  initial,
  isActive,
}: {
  customerId: string;
  initial: CustomerInput;
  isActive: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomerInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [active, setActive] = useState(isActive);

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateCustomer(customerId, form);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleToggleActive() {
    setError("");
    startTransition(async () => {
      const result = await toggleCustomerActive(customerId, !active);
      if (result.ok) {
        setActive((v) => !v);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className={
            "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 " +
            (active
              ? "bg-gofactory-tint text-gofactory hover:brightness-95"
              : "bg-rg-surface-alt text-rg-ink-faint hover:brightness-95")
          }
        >
          <Power className="h-3.5 w-3.5" />
          {active ? "Aktif" : "Pasif"}
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt"
        >
          {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          {editing ? "Vazgeç" : "Düzenle"}
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Firma Adı *</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Yetkili Kişi</label>
            <input
              value={form.primaryContactName}
              onChange={(e) => set("primaryContactName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Bölge</label>
            <select
              value={form.region}
              onChange={(e) => set("region", e.target.value as Region | "")}
              className={inputClass}
            >
              <option value="">Belirtilmedi</option>
              <option value="tr">{REGION_LABELS_TR.tr}</option>
              <option value="global">{REGION_LABELS_TR.global}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>E-posta</label>
            <input
              type="email"
              value={form.primaryContactEmail}
              onChange={(e) => set("primaryContactEmail", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Telefon</label>
            <input
              value={form.primaryContactPhone}
              onChange={(e) => set("primaryContactPhone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ülke</label>
            <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass} />
          </div>
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

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createProject, type ProjectInput } from "./actions";

export const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
export const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type CustomerOption = { id: string; company_name: string };

function emptyProject(): ProjectInput {
  return { customerId: "", name: "", description: "", startDate: "", endDate: "" };
}

export function ProjectCreateForm({ customers }: { customers: CustomerOption[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProjectInput>(emptyProject());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createProject(form);
      if (result.ok) {
        setForm(emptyProject());
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
          {showForm ? "Vazgeç" : "Yeni Proje"}
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
            <label className={labelClass}>Başlangıç Tarihi</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Bitiş / Hedef Tarihi</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-1.5">
            <label className={labelClass}>Proje Adı *</label>
            <input
              placeholder="ör. GOLMS Entegrasyon Projesi"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-1.5">
            <label className={labelClass}>Açıklama</label>
            <textarea
              rows={2}
              placeholder="Proje kapsamı, notlar..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass + " resize-y"}
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

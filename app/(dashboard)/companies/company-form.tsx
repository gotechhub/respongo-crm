"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { createCompany, type CompanyInput } from "./actions";

const EMPLOYEE_BRACKETS = ["1-10", "11-50", "51-200", "201-500", "500+"];

export const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
export const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export function CompanyFormFields({
  form,
  set,
}: {
  form: CompanyInput;
  set: <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Şirket Adı *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ünvan (Resmi)</label>
        <input
          value={form.legalName}
          onChange={(e) => set("legalName", e.target.value)}
          placeholder="... Yazılım ve Danışmanlık A.Ş."
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bölge *</label>
        <select value={form.region} onChange={(e) => set("region", e.target.value as Region)} className={inputClass}>
          <option value="tr">{REGION_LABELS_TR.tr}</option>
          <option value="global">{REGION_LABELS_TR.global}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Web Sitesi</label>
        <input
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Sektör</label>
        <input
          value={form.industry}
          onChange={(e) => set("industry", e.target.value)}
          placeholder="ör. Üretim, Perakende, Finans..."
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Çalışan Sayısı</label>
        <select value={form.employeeCount} onChange={(e) => set("employeeCount", e.target.value)} className={inputClass}>
          <option value="">Seç</option>
          {EMPLOYEE_BRACKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ülke</label>
        <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Şehir</label>
        <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Vergi Dairesi</label>
        <input value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Vergi No</label>
        <input value={form.taxNo} onChange={(e) => set("taxNo", e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label className={labelClass}>Adres</label>
        <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-3 flex flex-col gap-1.5">
        <label className={labelClass}>Not</label>
        <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
      </div>
    </>
  );
}

export const EMPTY_COMPANY: CompanyInput = {
  name: "",
  legalName: "",
  website: "",
  industry: "",
  country: "",
  city: "",
  address: "",
  taxOffice: "",
  taxNo: "",
  employeeCount: "",
  notes: "",
  region: "tr",
};

export function CompanyCreateForm({ defaultRegion }: { defaultRegion: Region | null }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CompanyInput>({ ...EMPTY_COMPANY, region: defaultRegion ?? "tr" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createCompany(form);
      if (result.ok) {
        setForm({ ...EMPTY_COMPANY, region: defaultRegion ?? "tr" });
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
          {showForm ? "Vazgeç" : "Yeni Şirket Ekle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <CompanyFormFields form={form} set={set} />
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

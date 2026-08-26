"use client";

import { Suspense, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { Pagination } from "@/components/ui/pagination";
import { createContact, deleteContact, setPrimaryContact, updateContact, type ContactInput } from "./actions";

export type ContactRow = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  is_primary: boolean;
  region: Region | null;
  owner_id: string | null;
  created_at: string;
};

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

function emptyForm(companyId: string | null, region: Region): ContactInput {
  return {
    companyId,
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    mobilePhone: "",
    isPrimary: false,
    notes: "",
    region,
  };
}

function ContactFormFields({
  form,
  set,
  companies,
}: {
  form: ContactInput;
  set: <K extends keyof ContactInput>(key: K, value: ContactInput[K]) => void;
  companies?: { id: string; name: string }[];
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ad *</label>
        <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Soyad</label>
        <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ünvan / Pozisyon</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </div>
      {companies && (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Şirket</label>
          <select
            value={form.companyId ?? ""}
            onChange={(e) => set("companyId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">Bağımsız (şirketsiz)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>E-posta</label>
        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Telefon</label>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Cep Telefonu</label>
        <input value={form.mobilePhone} onChange={(e) => set("mobilePhone", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bölge *</label>
        <select value={form.region} onChange={(e) => set("region", e.target.value as Region)} className={inputClass}>
          <option value="tr">{REGION_LABELS_TR.tr}</option>
          <option value="global">{REGION_LABELS_TR.global}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-[12px] text-rg-ink-soft">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => set("isPrimary", e.target.checked)}
          className="h-3.5 w-3.5 accent-primary"
        />
        Birincil kişi
      </label>
      <div className="col-span-full flex flex-col gap-1.5">
        <label className={labelClass}>Not</label>
        <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
      </div>
    </>
  );
}

function ContactRowItem({
  row,
  ownerName,
  showCompanyColumn,
  companyName,
  onEdit,
}: {
  row: ContactRow;
  ownerName: string;
  showCompanyColumn: boolean;
  companyName?: string;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fullName = `${row.first_name} ${row.last_name ?? ""}`.trim();

  function handleSetPrimary() {
    if (!row.company_id) return;
    setError("");
    startTransition(async () => {
      const result = await setPrimaryContact(row.id, row.company_id!);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm(`"${fullName}" kişisini silmek istediğine emin misin?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteContact(row.id, row.company_id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <tr className="border-t border-rg-line">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-[12.8px] font-semibold text-rg-ink">
          {fullName}
          {row.is_primary && <Star className="h-3 w-3 fill-golxp text-golxp" />}
        </div>
        <div className="text-[11.5px] text-rg-ink-faint">{row.title || "—"}</div>
      </td>
      {showCompanyColumn && (
        <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
          {row.company_id ? (
            <Link href={`/companies/${row.company_id}`} className="hover:text-primary">
              {companyName ?? "—"}
            </Link>
          ) : (
            "—"
          )}
        </td>
      )}
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        {row.email || "—"}
        {row.phone ? ` · ${row.phone}` : ""}
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        {row.region ? REGION_LABELS_TR[row.region] : "—"}
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{ownerName}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {row.company_id && !row.is_primary && (
            <button
              onClick={handleSetPrimary}
              disabled={isPending}
              title="Birincil kişi yap"
              className="flex h-7 w-7 items-center justify-center rounded-[7px] text-rg-ink-soft transition-colors hover:bg-rg-surface-alt disabled:opacity-40"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onEdit}
            title="Düzenle"
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-rg-ink-soft transition-colors hover:bg-rg-surface-alt"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Sil"
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
      </td>
    </tr>
  );
}

export function ContactsPanel({
  rows,
  ownerNames,
  companyNames,
  companies,
  fixedCompanyId,
  defaultRegion,
  pagination,
}: {
  rows: ContactRow[];
  ownerNames: Record<string, string>;
  companyNames?: Record<string, string>;
  /** verilirse standalone /contacts sayfasındaki şirket seçici için kullanılır */
  companies?: { id: string; name: string }[];
  /** verilirse şirket detay sayfasından çağrılıyordur — form hep bu şirkete bağlı açılır */
  fixedCompanyId?: string;
  defaultRegion: Region | null;
  /** verilirse tablo altına sayfalama eklenir (standalone /contacts sayfası) */
  pagination?: { totalCount: number; page: number; pageSize: number };
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm(fixedCompanyId ?? null, defaultRegion ?? "tr"));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const showCompanyColumn = !fixedCompanyId;

  function set<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(fixedCompanyId ?? null, defaultRegion ?? "tr"));
    setShowForm(true);
  }

  function openEdit(row: ContactRow) {
    setEditingId(row.id);
    setForm({
      companyId: row.company_id,
      firstName: row.first_name,
      lastName: row.last_name ?? "",
      title: row.title ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      mobilePhone: row.mobile_phone ?? "",
      isPrimary: row.is_primary,
      notes: "",
      region: row.region ?? "tr",
    });
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = editingId
        ? await updateContact(editingId, form, form.companyId)
        : await createContact(form);
      if (result.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm(fixedCompanyId ?? null, defaultRegion ?? "tr"));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Yeni Kişi Ekle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <ContactFormFields form={form} set={set} companies={showCompanyColumn ? companies ?? [] : undefined} />
          <div className="col-span-full flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? "Güncelle" : "Kaydet"}
            </button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Kişi
                </th>
                {showCompanyColumn && (
                  <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                    Şirket
                  </th>
                )}
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  İletişim
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bölge
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Sahibi
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ContactRowItem
                  key={row.id}
                  row={row}
                  ownerName={row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"}
                  showCompanyColumn={showCompanyColumn}
                  companyName={row.company_id ? companyNames?.[row.company_id] : undefined}
                  onEdit={() => openEdit(row)}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showCompanyColumn ? 6 : 5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Henüz kişi kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Suspense fallback={<div className="h-[52px]" />}>
            <Pagination totalCount={pagination.totalCount} page={pagination.page} pageSize={pagination.pageSize} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

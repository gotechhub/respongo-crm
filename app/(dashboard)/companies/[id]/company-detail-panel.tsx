"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Power, Trash2, X } from "lucide-react";
import { CompanyFormFields } from "../company-form";
import { deleteCompany, toggleCompanyActive, updateCompany, type CompanyInput } from "../actions";

export function CompanyDetailPanel({
  companyId,
  initial,
  isActive,
}: {
  companyId: string;
  initial: CompanyInput;
  isActive: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [active, setActive] = useState(isActive);

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateCompany(companyId, form);
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
      const result = await toggleCompanyActive(companyId, !active);
      if (result.ok) {
        setActive((v) => !v);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`"${form.name}" şirketini kalıcı olarak silmek istediğine emin misin?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteCompany(companyId);
      if (result.ok) {
        router.push("/companies");
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
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>
      </div>

      {editing && (
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

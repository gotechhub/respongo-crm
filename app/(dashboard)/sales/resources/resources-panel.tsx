"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ExternalLink, Loader2, Plus, Trash2, X } from "lucide-react";
import { createResource, deleteResource, type ResourceInput } from "./actions";

export type ResourceRow = {
  id: string;
  category: string;
  title_tr: string;
  title_en: string;
  body_tr: string | null;
  body_en: string | null;
  url: string | null;
  sort_order: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  general: "Genel",
  sales_pitch: "Satış Konuşması",
  product: "Ürün Tanıtımı",
  glossary: "Sektörel Sözlük",
  onboarding: "Kayıt / Onboarding",
  audience: "Hedef Kitle & Karar Verici",
};

function groupByCategory(rows: ResourceRow[]) {
  const groups: Record<string, ResourceRow[]> = {};
  rows.forEach((r) => {
    groups[r.category] = groups[r.category] ?? [];
    groups[r.category].push(r);
  });
  return groups;
}

export function ResourcesPanel({ resources, canManage }: { resources: ResourceRow[]; canManage: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ResourceInput>({
    category: "general",
    titleTr: "",
    titleEn: "",
    bodyTr: "",
    bodyEn: "",
    url: "",
    sortOrder: 0,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createResource(form);
      if (result.ok) {
        setForm({ category: "general", titleTr: "", titleEn: "", bodyTr: "", bodyEn: "", url: "", sortOrder: 0 });
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteResource(id);
    });
  }

  const groups = groupByCategory(resources);

  return (
    <div className="flex flex-col gap-5">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Vazgeç" : "Yeni Kaynak Ekle"}
          </button>
        </div>
      )}

      {canManage && showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            >
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Sıra</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Başlık (TR) *</label>
            <input
              required
              value={form.titleTr}
              onChange={(e) => setForm({ ...form, titleTr: e.target.value })}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Başlık (EN) *</label>
            <input
              required
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Açıklama (TR)</label>
            <textarea
              value={form.bodyTr}
              onChange={(e) => setForm({ ...form, bodyTr: e.target.value })}
              rows={3}
              className="resize-y rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Açıklama (EN)</label>
            <textarea
              value={form.bodyEn}
              onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
              rows={3}
              className="resize-y rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Bağlantı (opsiyonel)</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1">
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

      {resources.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Henüz kaynak eklenmemiş.
        </div>
      ) : (
        Object.entries(groups).map(([category, items]) => (
          <div key={category} className="rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
            <div className="border-b border-rg-line px-5 py-3.5 text-[13px] font-bold text-rg-ink">
              {CATEGORY_LABEL[category] ?? category}
            </div>
            <div className="flex flex-col divide-y divide-rg-line">
              {items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="text-[12.8px] font-semibold text-rg-ink">
                        {r.title_tr} <span className="text-rg-ink-faint">/ {r.title_en}</span>
                      </div>
                      {r.body_tr && <p className="mt-1 text-[12px] text-rg-ink-soft">{r.body_tr}</p>}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                        >
                          Bağlantıyı aç <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="shrink-0 text-rg-ink-faint transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

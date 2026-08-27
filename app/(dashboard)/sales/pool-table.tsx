"use client";

import { Suspense, useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { Pagination } from "@/components/ui/pagination";
import { convertPoolToLead, createPoolEntry } from "./actions";

export type PoolRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  source: string | null;
  country: string | null;
  region: Region | null;
  owner_id: string | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function PoolRowItem({
  row,
  ownerName,
}: {
  row: PoolRow;
  ownerName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleConvert() {
    setError("");
    startTransition(async () => {
      const result = await convertPoolToLead(row.id);
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line">
      <td className="px-4 py-3">
        <div className="text-[12.8px] font-semibold text-rg-ink">{row.company_name}</div>
        <div className="text-[11.5px] text-rg-ink-faint">
          {row.contact_name || "—"}
          {row.contact_email ? ` · ${row.contact_email}` : ""}
        </div>
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{row.source || "—"}</td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
        {row.region ? REGION_LABELS_TR[row.region] : "—"}
      </td>
      <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{ownerName}</td>
      <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.created_at)}</td>
      <td className="px-4 py-3 text-right">
        {done ? (
          <span className="text-[11.5px] font-semibold text-gofactory">Lead oluşturuldu ✓</span>
        ) : (
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
            Lead&apos;e Çevir
          </button>
        )}
        {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
      </td>
    </tr>
  );
}

export function PoolTable({
  rows,
  ownerNames,
  defaultRegion,
  pagination,
}: {
  rows: PoolRow[];
  ownerNames: Record<string, string>;
  defaultRegion: Region | null;
  pagination?: { totalCount: number; page: number; pageSize: number };
}) {
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [region, setRegion] = useState<Region | "">(defaultRegion ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function resetForm() {
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setSource("");
    setCountry("");
    setNotes("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!region) {
      setError("Bölge seçmen gerekiyor.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createPoolEntry({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        source,
        country,
        notes,
        region,
      });
      if (result.ok) {
        resetForm();
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Yeni Kayıt Ekle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Firma Adı *
            </label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Yetkili Kişi
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Bölge *
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            >
              <option value="" disabled>
                Seç
              </option>
              <option value="tr">{REGION_LABELS_TR.tr}</option>
              <option value="global">{REGION_LABELS_TR.global}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              E-posta
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Telefon
            </label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Kaynak
            </label>
            <input
              placeholder="fuar, referans, web formu..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Ülke
            </label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Not
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
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

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Firma
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Kaynak
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Bölge
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Sahibi
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Tarih
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PoolRowItem key={row.id} row={row} ownerName={row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Havuzda henüz kayıt yok.
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

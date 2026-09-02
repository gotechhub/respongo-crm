"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, Loader2, Upload } from "lucide-react";
import type { Region } from "@/lib/roles";
import { importPoolExcel } from "./import-actions";

// Satış Havuzu (customer_pool) için Excel toplu içe aktarma paneli —
// `sales/leads/import-panel.tsx` ile aynı görsel/etkileşim deseni.
export function PoolImportPanel({ isFounder }: { isFounder: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [region, setRegion] = useState<Region | "">("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    totalRows: number;
    insertedCount: number;
    duplicateCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Önce bir Excel (.xlsx) dosyası seç.");
      return;
    }
    setError("");
    setSummary(null);
    const fd = new FormData();
    fd.append("file", file);
    if (isFounder && region) fd.append("region", region);

    startTransition(async () => {
      const result = await importPoolExcel(fd);
      if (result.ok) {
        setSummary(result);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mb-3 rounded-[10px] border border-rg-line bg-rg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-[12.5px] font-semibold text-rg-ink"
      >
        <span className="flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5 text-rg-ink-faint" />
          Excel ile Toplu İçe Aktarım
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-rg-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="border-t border-rg-line px-3.5 py-3.5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <a
              href="/api/customer-pool/template"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-bg px-3 py-1.5 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Örnek Şablon İndir
            </a>
            <a
              href="/api/customer-pool/export"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-bg px-3 py-1.5 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Mevcut Listeyi Excel&apos;e Aktar
            </a>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-rg-ink-faint">Dosya</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="text-[12px] text-rg-ink-soft file:mr-2 file:rounded-[6px] file:border-0 file:bg-rg-surface-alt file:px-2.5 file:py-1.5 file:text-[11.5px] file:font-semibold"
              />
            </div>
            {isFounder ? (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-rg-ink-faint">Bölge (dosyadaki sütunu geçersiz kılar)</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region | "")}
                  className="rounded-[8px] border border-rg-line bg-rg-bg px-2.5 py-1.5 text-[12px] text-rg-ink outline-none focus:border-primary"
                >
                  <option value="">Dosyadaki bölgeyi kullan</option>
                  <option value="tr">Türkiye</option>
                  <option value="global">Global</option>
                </select>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleImport}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              İçe Aktar
            </button>
          </div>

          {error ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          ) : null}

          {summary ? (
            <div className="mt-3 rounded-[8px] bg-rg-surface-alt px-3.5 py-3 text-[12px] text-rg-ink-soft">
              <p className="flex items-center gap-1.5 font-semibold text-rg-ink">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {summary.totalRows} satır işlendi — {summary.insertedCount} eklendi, {summary.duplicateCount} zaten
                vardı (atlandı), {summary.errorCount} uyarı.
              </p>
              {summary.errors.length > 0 ? (
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11.5px] text-rg-ink-faint">
                  {summary.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

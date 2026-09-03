"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateSystemSettings, type SystemSettingsInput } from "./actions";
import type { Region } from "@/lib/roles";

const inputClass =
  "w-full rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint";

const CURRENCIES = ["USD", "EUR", "TRY", "GBP"];
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function SystemSettingsForm({ initial }: { initial: SystemSettingsInput }) {
  const [form, setForm] = useState<SystemSettingsInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateSystemSettings(form);
      if (result.ok) {
        setMessage({ type: "ok", text: "Sistem ayarları güncellendi." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Şirket Yasal Unvanı</span>
          <input
            className={inputClass}
            value={form.companyLegalName}
            onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })}
            placeholder="ör. Respongo Teknoloji A.Ş."
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Varsayılan Para Birimi</span>
          <select
            className={inputClass}
            value={form.defaultCurrency}
            onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Varsayılan Bölge</span>
          <select
            className={inputClass}
            value={form.defaultRegion}
            onChange={(e) => setForm({ ...form, defaultRegion: e.target.value as Region })}
          >
            <option value="tr">Türkiye</option>
            <option value="global">Global</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Mali Yıl Başlangıcı</span>
          <select
            className={inputClass}
            value={form.fiscalYearStartMonth}
            onChange={(e) => setForm({ ...form, fiscalYearStartMonth: Number(e.target.value) })}
          >
            {MONTHS_TR.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Saat Dilimi</span>
          <input
            className={inputClass}
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            placeholder="Europe/Istanbul"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Tarih Formatı</span>
          <select
            className={inputClass}
            value={form.dateFormat}
            onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
          >
            <option value="DD.MM.YYYY">31.12.2026</option>
            <option value="MM/DD/YYYY">12/31/2026</option>
            <option value="YYYY-MM-DD">2026-12-31</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Oturum Zaman Aşımı (dakika)</span>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.sessionTimeoutMinutes}
            onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="mt-2 rounded-[10px] border border-dashed border-rg-line p-3.5">
        <label className="flex items-center gap-2.5 text-[12.8px] font-semibold text-rg-ink">
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          Bakım Modu — tüm kullanıcılara üst bantta bir bildirim göster
        </label>
        {form.maintenanceMode && (
          <input
            className={inputClass + " mt-2.5"}
            value={form.maintenanceMessage}
            onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
            placeholder="ör. Bu akşam 22:00-23:00 arası bakım nedeniyle kesinti yaşanabilir."
          />
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12.2px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Kaydet
        </button>
        {message && (
          <span className={`text-[11.8px] font-medium ${message.type === "ok" ? "text-golxp" : "text-destructive"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

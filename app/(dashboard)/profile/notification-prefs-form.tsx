"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateNotificationPreferences, type DigestFrequency } from "./actions";

const FREQUENCY_OPTIONS: { value: DigestFrequency; label: string }[] = [
  { value: "daily", label: "Her gün" },
  { value: "weekly", label: "Haftada bir (Pazartesi)" },
  { value: "off", label: "Hiç gönderme" },
];

export function NotificationPrefsForm({
  initialEnabled,
  initialFrequency,
}: {
  initialEnabled: boolean;
  initialFrequency: DigestFrequency;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [frequency, setFrequency] = useState<DigestFrequency>(initialFrequency);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(nextEnabled: boolean, nextFrequency: DigestFrequency) {
    startTransition(async () => {
      const res = await updateNotificationPreferences({ emailNotificationsEnabled: nextEnabled, digestFrequency: nextFrequency });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-1 text-[14px] font-bold text-rg-ink">Mail Bildirim Ayarları</div>
      <p className="mb-4 text-[12.5px] text-rg-ink-soft">
        Gecikmiş görevler, yaklaşan lisans yenilemeleri, teklif süreleri ve benzeri konularda GO CRM sana
        e-posta ile özet gönderebilir. Bu ayar sadece kendi hesabını etkiler.
      </p>

      <label className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-rg-line px-3.5 py-3">
        <div>
          <div className="text-[12.8px] font-semibold text-rg-ink">E-posta bildirimleri</div>
          <div className="text-[11.5px] text-rg-ink-faint">Kapatırsan hiç mail almazsın (uygulama içi bildirim çanı etkilenmez).</div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            save(e.target.checked, frequency);
          }}
          className="h-5 w-5 accent-primary"
        />
      </label>

      <div className="mb-1 text-[11.5px] font-semibold text-rg-ink-soft">Sıklık</div>
      <div className="flex flex-wrap gap-2">
        {FREQUENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={!enabled || isPending}
            onClick={() => {
              setFrequency(opt.value);
              save(enabled, opt.value);
            }}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-40 ${
              frequency === opt.value
                ? "bg-primary text-white"
                : "border border-rg-line text-rg-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-gofactory">
          <Check className="h-3.5 w-3.5" />
          Kaydedildi
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProfileInfo } from "@/lib/profile/actions";

const inputClass =
  "w-full rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

// V2 Revizeler bölüm I: "detaylı profil ayarları (tüm kullanıcı tipleri)" — Ad Soyad
// ve Telefon herkes için ortak, düzenlenebilir alanlar. E-posta/Rol/Bölge bilinçli
// olarak BURADA yok (salt-okunur olarak sayfanın kendisinde gösteriliyor) — e-posta
// değişikliği Supabase Auth doğrulama akışı gerektirir (kapsam dışı), rol/bölge zaten
// DB seviyesinde (trg_profiles_protect_admin_fields) kilitli.
export function ProfileInfoForm({
  initialFullName,
  initialPhone,
}: {
  initialFullName: string;
  initialPhone: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfileInfo({ fullName, phone });
      if (result.ok) {
        setMessage({ type: "ok", text: "Kaydedildi." });
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  const dirty = fullName !== initialFullName || phone !== initialPhone;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Ad Soyad</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Telefon</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+90 5xx xxx xx xx"
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-2.5 sm:col-span-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !dirty || !fullName.trim()}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12.2px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
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

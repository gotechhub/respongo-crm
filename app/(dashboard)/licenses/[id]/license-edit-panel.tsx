"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import { updateLicense, type LicenseInput } from "../actions";
import { LicenseFormFields, type AcceptedProposal, type CustomerOption } from "../license-form";

// Lisans yönetimi modülünde "düzenle" seçeneği eksikti (kullanıcı geri bildirimi:
// "lisans yönetimi düzelt seçeneği olması lazım"). updateLicense() server action'ı
// zaten VARDI ama hiçbir UI onu çağırmıyordu — RenewalPanel sadece bitiş tarihi/tutar
// uzatan bir "yenileme" akışıydı, müşteri/ürün/kullanıcı sayısı gibi temel alanları
// değiştiremiyordunuz. Bu bileşen, oluşturma formuyla AYNI LicenseFormFields'i yeniden
// kullanarak (tek kaynak, iki mod) tam bir düzenleme akışı ekliyor.
export function LicenseEditPanel({
  license,
  customers,
  proposals,
}: {
  license: LicenseInput & { id: string };
  customers: CustomerOption[];
  proposals: AcceptedProposal[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LicenseInput>(license);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof LicenseInput>(key: K, value: LicenseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateLicense(license.id, form);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setForm(license);
          setEditing(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line"
      >
        <Pencil className="h-3.5 w-3.5" />
        Düzenle
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="col-span-3 mt-4 grid grid-cols-3 gap-3 rounded-[10px] border border-rg-line bg-rg-surface-alt p-4"
    >
      <LicenseFormFields form={form} set={set} customers={customers} proposals={proposals} />
      <div className="col-span-3 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Değişiklikleri Kaydet
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-rg-line px-3.5 py-2 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-line disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Vazgeç
        </button>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </form>
  );
}

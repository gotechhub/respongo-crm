"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";
import { createTestAccounts, type CreatedTestAccount } from "./test-accounts-actions";
import { ROLE_LABELS_TR } from "@/lib/roles";

// Kullanıcı isteği: "satış iş ortakları ve satış ekibi için test hesapları oluştur
// ve içleri dolu olsun onların panellerine de giriş yapabileyim". Bu panel tek
// tıkla 4 test hesabı (2 satış ekibi + 2 iş ortağı) oluşturur/günceller, her birini
// gerçekçi verilerle doldurur. Giriş için şifreye GEREK YOK — yukarıdaki "Master
// Admin View-As" panelinden isimleriyle arayıp "Görüntüle" demek yeterli; şifre
// sadece istenirse doğrudan giriş için de gösteriliyor.
export function TestAccountsPanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CreatedTestAccount[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createTestAccounts();
      if (result.ok) {
        setAccounts(result.accounts);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function copyPassword(password: string) {
    navigator.clipboard?.writeText(password).then(() => {
      setCopied(password);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.2px] text-rg-ink-soft">
        Tek tıkla 2 satış ekibi + 2 iş ortağı test hesabı oluşturur (zaten varsa günceller), her birine
        gerçekçi lead/müşteri/teklif/görev verisi doldurur. Bu hesapları görüntülemek için yukarıdaki
        <strong> Master Admin View-As </strong> panelinden isimleriyle arayıp &quot;Görüntüle&quot;ye
        basman yeterli — ayrıca şifreyle doğrudan giriş de yapılabilir.
      </p>

      {error && (
        <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] font-medium text-destructive">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
        Test Hesaplarını Oluştur / Güncelle
      </button>

      {accounts && accounts.length > 0 && (
        <div className="mt-1 overflow-hidden rounded-[10px] border border-rg-line">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Hesap</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Rol</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Şifre</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email} className="border-t border-rg-line/60">
                  <td className="px-3 py-2 text-[12px]">
                    <div className="font-semibold text-rg-ink">{a.fullName}</div>
                    <div className="text-[10.8px] text-rg-ink-faint">{a.email}</div>
                  </td>
                  <td className="px-3 py-2 text-[11.8px] text-rg-ink-soft">{ROLE_LABELS_TR[a.role]}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => copyPassword(a.password)}
                      className="inline-flex items-center gap-1 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[11px] font-mono text-rg-ink-soft hover:bg-rg-surface-alt"
                    >
                      {copied === a.password ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {a.password}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-[11.5px] text-rg-ink-faint">
                    {a.alreadyExisted ? "Zaten vardı, veriler güncellendi" : "Yeni oluşturuldu"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

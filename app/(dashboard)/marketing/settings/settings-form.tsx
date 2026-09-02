"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { saveBrevoCredentials, updateMarketingPreferences, testBrevoConnectionAction } from "./actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type MarketingSettingsDisplay = {
  has_api_key: boolean;
  brevo_list_id_tr: string | null;
  brevo_list_id_global: string | null;
  auto_sync_newsletter: boolean;
  is_active: boolean;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string | null;
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function MarketingSettingsForm({ settings }: { settings: MarketingSettingsDisplay | null }) {
  const [apiKey, setApiKey] = useState("");
  const [listIdTr, setListIdTr] = useState(settings?.brevo_list_id_tr ?? "");
  const [listIdGlobal, setListIdGlobal] = useState(settings?.brevo_list_id_global ?? "");
  const [autoSync, setAutoSync] = useState(settings?.auto_sync_newsletter ?? true);

  const [savePending, startSave] = useTransition();
  const [prefPending, startPref] = useTransition();
  const [testPending, startTest] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [prefMsg, setPrefMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSaveCredentials() {
    setSaveMsg(null);
    startSave(async () => {
      const result = await saveBrevoCredentials({ apiKey, listIdTr, listIdGlobal });
      if (result.ok) {
        setSaveMsg({ ok: true, text: "Brevo bilgileri kaydedildi. Şimdi bağlantıyı test edebilirsin." });
        setApiKey("");
      } else {
        setSaveMsg({ ok: false, text: result.error });
      }
    });
  }

  function handleSavePreferences() {
    setPrefMsg(null);
    startPref(async () => {
      const result = await updateMarketingPreferences(autoSync);
      setPrefMsg(result.ok ? { ok: true, text: "Tercih kaydedildi." } : { ok: false, text: result.error });
    });
  }

  function handleTest() {
    setTestMsg(null);
    startTest(async () => {
      const result = await testBrevoConnectionAction();
      setTestMsg({ ok: result.ok, text: result.message });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[13px] font-bold text-rg-ink">Brevo Bülten Bağlantısı</span>
          {settings?.is_active ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gofactory-tint px-[9px] py-1 text-[11px] font-bold text-gofactory">
              <CheckCircle2 className="h-3 w-3" /> Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rg-surface-alt px-[9px] py-1 text-[11px] font-bold text-rg-ink-faint">
              <XCircle className="h-3 w-3" /> Bağlı Değil
            </span>
          )}
        </div>
        <p className="mb-4 text-[12px] text-rg-ink-soft">
          API anahtarını Brevo hesabından (Ayarlar → SMTP &amp; API → API Keys) al. TR ve Global için ayrı Brevo
          listesi ID&apos;si tanımlayabilirsin (Brevo&apos;da Contacts → Lists altında görünen sayısal ID). Bu
          alanlar veritabanında şifreli tutulur, kaydettikten sonra API anahtarı tekrar görüntülenemez.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>
              API Anahtarı {settings?.has_api_key && <span className="normal-case text-rg-ink-faint">(kayıtlı — değiştirmek için doldur)</span>}
            </label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>TR Liste ID</label>
            <input value={listIdTr} onChange={(e) => setListIdTr(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Global Liste ID</label>
            <input value={listIdGlobal} onChange={(e) => setListIdGlobal(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSaveCredentials}
            disabled={savePending}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {savePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Bilgileri Kaydet
          </button>
          <button
            onClick={handleTest}
            disabled={testPending}
            className="inline-flex items-center gap-2 rounded-[10px] border border-rg-line bg-rg-surface px-4 py-2.5 text-[12.8px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {testPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Bağlantıyı Test Et
          </button>
        </div>
        {saveMsg && (
          <div className={"mt-3 text-[12px] " + (saveMsg.ok ? "text-gofactory" : "text-destructive")}>{saveMsg.text}</div>
        )}
        {testMsg && (
          <div className={"mt-2 text-[12px] " + (testMsg.ok ? "text-gofactory" : "text-destructive")}>{testMsg.text}</div>
        )}
        {settings?.last_test_at && !testMsg && (
          <div className="mt-2 text-[11.5px] text-rg-ink-faint">
            Son test: {fmtDateTime(settings.last_test_at)} — {settings.last_test_message ?? "—"}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-1 text-[13px] font-bold text-rg-ink">Otomasyon Tercihleri</div>
        <p className="mb-4 text-[12px] text-rg-ink-soft">
          Bu tercih, müşteri profilindeki &quot;Bültene Kayıtlı&quot; anahtarı ve web sitesi lead formundaki bülten
          kutusu işaretlendiğinde otomatik Brevo senkronizasyonunun yapılıp yapılmayacağını belirler.
        </p>
        <label className="flex items-center gap-2.5 text-[12.8px] text-rg-ink">
          <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} className="h-4 w-4" />
          Bülten aboneliği değiştiğinde otomatik Brevo&apos;ya senkronize et
        </label>
        <div className="mt-4">
          <button
            onClick={handleSavePreferences}
            disabled={prefPending}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {prefPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Tercihi Kaydet
          </button>
        </div>
        {prefMsg && (
          <div className={"mt-3 text-[12px] " + (prefMsg.ok ? "text-gofactory" : "text-destructive")}>{prefMsg.text}</div>
        )}
      </div>

      <div className="rounded-2xl bg-gocatalog-tint p-5 text-[12.5px] text-rg-ink-soft">
        <span className="font-bold text-rg-ink">Web sitesi entegrasyonu:</span> respongo.com&apos;daki form,
        <code className="mx-1 rounded bg-rg-surface px-1.5 py-0.5 text-[11.5px]">/api/webhooks/website-lead</code>
        adresine <code className="mx-1 rounded bg-rg-surface px-1.5 py-0.5 text-[11.5px]">WEBSITE_LEAD_WEBHOOK_SECRET</code>
        ortam değişkenindeki sırla POST isteği göndererek yeni lead oluşturabilir — bu, site tarafından ayrıca
        yapılandırılmalı.
      </div>
    </div>
  );
}

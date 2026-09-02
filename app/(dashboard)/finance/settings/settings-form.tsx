"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { saveParasutCredentials, updateParasutPreferences, testParasutConnectionAction } from "./actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type ParasutSettingsDisplay = {
  client_id: string | null;
  has_client_secret: boolean;
  username: string | null;
  has_password: boolean;
  company_id: string | null;
  is_active: boolean;
  auto_generate_invoice: boolean;
  auto_send_to_customer: boolean;
  default_vat_rate: number;
  token_expires_at: string | null;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string | null;
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ParasutSettingsForm({ settings }: { settings: ParasutSettingsDisplay | null }) {
  const [clientId, setClientId] = useState(settings?.client_id ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [username, setUsername] = useState(settings?.username ?? "");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState(settings?.company_id ?? "");

  const [autoGenerate, setAutoGenerate] = useState(settings?.auto_generate_invoice ?? true);
  const [autoSend, setAutoSend] = useState(settings?.auto_send_to_customer ?? false);
  const [vatRate, setVatRate] = useState(settings?.default_vat_rate ?? 20);

  const [savePending, startSave] = useTransition();
  const [prefPending, startPref] = useTransition();
  const [testPending, startTest] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [prefMsg, setPrefMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSaveCredentials() {
    setSaveMsg(null);
    startSave(async () => {
      const result = await saveParasutCredentials({ clientId, clientSecret, username, password, companyId });
      if (result.ok) {
        setSaveMsg({ ok: true, text: "Kimlik bilgileri kaydedildi. Şimdi bağlantıyı test edebilirsin." });
        setClientSecret("");
        setPassword("");
      } else {
        setSaveMsg({ ok: false, text: result.error });
      }
    });
  }

  function handleSavePreferences() {
    setPrefMsg(null);
    startPref(async () => {
      const result = await updateParasutPreferences({
        autoGenerateInvoice: autoGenerate,
        autoSendToCustomer: autoSend,
        defaultVatRate: vatRate,
      });
      setPrefMsg(result.ok ? { ok: true, text: "Tercihler kaydedildi." } : { ok: false, text: result.error });
    });
  }

  function handleTest() {
    setTestMsg(null);
    startTest(async () => {
      const result = await testParasutConnectionAction();
      setTestMsg({ ok: result.ok, text: result.message });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[13px] font-bold text-rg-ink">Paraşüt Bağlantısı</span>
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
          client_id/client_secret’ı Paraşüt destek ekibinden (Profesyonel pakette API erişimi mevcut) iste. Firma
          numaranı Paraşüt hesap ayarlarından öğrenebilirsin. Bu alanlar veritabanında şifreli tutulur, kaydettikten
          sonra tekrar görüntülenemez.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Client ID</label>
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Client Secret {settings?.has_client_secret && <span className="normal-case text-rg-ink-faint">(kayıtlı — değiştirmek için doldur)</span>}
            </label>
            <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Paraşüt E-posta (kullanıcı adı)</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Paraşüt Şifresi {settings?.has_password && <span className="normal-case text-rg-ink-faint">(kayıtlı — değiştirmek için doldur)</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Firma Numarası (company_id)</label>
            <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSaveCredentials}
            disabled={savePending}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {savePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Kimlik Bilgilerini Kaydet
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
          Bu ayarlar sadece Türkiye (TR) bölgesindeki teklifler için geçerli — Global/Amerika tarafı henüz ayrı ve
          manuel bir akış (muhasebe hesabı açılmadı).
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 text-[12.8px] text-rg-ink">
            <input type="checkbox" checked={autoGenerate} onChange={(e) => setAutoGenerate(e.target.checked)} className="h-4 w-4" />
            Teklif kabul edilince TR’de otomatik taslak fatura oluştur
          </label>
          <label className="flex items-center gap-2.5 text-[12.8px] text-rg-ink">
            <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} className="h-4 w-4" />
            Bağlantı aktifken taslak faturayı otomatik Paraşüt’e gönder (e-Arşiv oluştur)
          </label>
          <div className="flex flex-col gap-1.5" style={{ maxWidth: 220 }}>
            <label className={labelClass}>Varsayılan KDV Oranı (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSavePreferences}
            disabled={prefPending}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {prefPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Tercihleri Kaydet
          </button>
        </div>
        {prefMsg && (
          <div className={"mt-3 text-[12px] " + (prefMsg.ok ? "text-gofactory" : "text-destructive")}>{prefMsg.text}</div>
        )}
      </div>

      <div className="rounded-2xl bg-gocatalog-tint p-5 text-[12.5px] text-rg-ink-soft">
        <span className="font-bold text-rg-ink">Önemli:</span> “Paraşüt’e gönder” adımı e-Arşiv belgesini oluşturur.
        Müşteriye otomatik e-posta gitmesi için Paraşüt hesabındaki <b>Ayarlar → e-Arşiv Fatura</b> bölümünde
        “otomatik e-posta gönderimi” seçeneğinin AÇIK olması gerekir — bu, Paraşüt’ün kendi hesap ayarıdır, buradan
        değiştirilemez.
      </div>
    </div>
  );
}

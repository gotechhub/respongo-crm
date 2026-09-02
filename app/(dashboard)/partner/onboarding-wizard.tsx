"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  savePartnerAgreementStep,
  savePartnerCompanyStep,
  savePartnerBankStep,
  savePartnerInterestsStep,
  completePartnerOnboarding,
  type PartnerCompanyInput,
  type PartnerBankInput,
} from "./actions";

export type PartnerProfileRow = {
  id: string;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  company_name: string | null;
  tax_no: string | null;
  website: string | null;
  country: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  iban: string | null;
  swift: string | null;
  product_interests: string[];
  agreement_accepted_at: string | null;
  commission_rate: number | null;
  status: "pending_review" | "active" | "suspended";
  admin_note: string | null;
};

const PRODUCTS = [
  { key: "GOLMS", label: "GOLMS — AI destekli LMS" },
  { key: "GOLXP", label: "GOLXP — Öğrenme deneyimi platformu" },
  { key: "GOCATALOG", label: "GOCATALOG — Hazır eğitim kataloğu" },
  { key: "GOFACTORY", label: "GOFACTORY — Kuruma özel içerik üretimi" },
  { key: "GOTOOLS", label: "GOTOOLS — AI mikro-öğrenme araçları" },
];

const STEPS = ["Sözleşme", "Firma Bilgileri", "Ödeme Bilgileri", "İlgi Alanları", "Özet"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div
            className={
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold " +
              (i < current
                ? "bg-gofactory text-white"
                : i === current
                  ? "bg-primary text-white"
                  : "bg-rg-surface-alt text-rg-ink-faint")
            }
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span
            className={
              "hidden text-[11.5px] font-semibold sm:inline " +
              (i <= current ? "text-rg-ink" : "text-rg-ink-faint")
            }
          >
            {label}
          </span>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-rg-line" />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export function PartnerOnboardingWizard({ partnerProfile }: { partnerProfile: PartnerProfileRow }) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(partnerProfile.onboarding_step, 4));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [accepted, setAccepted] = useState(!!partnerProfile.agreement_accepted_at);
  const [company, setCompany] = useState<PartnerCompanyInput>({
    companyName: partnerProfile.company_name ?? "",
    taxNo: partnerProfile.tax_no ?? "",
    website: partnerProfile.website ?? "",
    country: partnerProfile.country ?? "",
    address: partnerProfile.address ?? "",
  });
  const [bank, setBank] = useState<PartnerBankInput>({
    bankName: partnerProfile.bank_name ?? "",
    bankAccountName: partnerProfile.bank_account_name ?? "",
    iban: partnerProfile.iban ?? "",
    swift: partnerProfile.swift ?? "",
  });
  const [interests, setInterests] = useState<string[]>(partnerProfile.product_interests ?? []);

  function toggleInterest(key: string) {
    setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function goNext(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleComplete() {
    setError("");
    startTransition(async () => {
      const result = await completePartnerOnboarding();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-2xl border border-rg-line bg-rg-surface p-7 shadow-rg">
      <StepIndicator current={step} />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-[10px] bg-rg-surface-alt p-4 text-[12.5px] leading-relaxed text-rg-ink-soft">
            Respongo satış iş ortağı olarak platforma hoş geldin. Devam etmeden önce iş ortaklığı şartlarını
            (komisyon esasları, marka kullanımı, gizlilik) kabul etmen gerekiyor. Tam sözleşme metni onay
            sonrası e-posta ile ayrıca gönderilecek.
          </div>
          <label className="flex items-start gap-2.5 text-[12.5px] text-rg-ink">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-rg-line"
            />
            İş ortaklığı şartlarını okudum ve kabul ediyorum.
          </label>
          <button
            onClick={() => goNext(() => savePartnerAgreementStep(accepted))}
            disabled={!accepted || isPending}
            className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Devam Et
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Firma Adı *">
              <input
                value={company.companyName}
                onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Vergi No">
              <input
                value={company.taxNo}
                onChange={(e) => setCompany({ ...company, taxNo: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Web Sitesi">
              <input
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </Field>
            <Field label="Ülke">
              <input
                value={company.country}
                onChange={(e) => setCompany({ ...company, country: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Adres">
                <input
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
          <button
            onClick={() => goNext(() => savePartnerCompanyStep(company))}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Devam Et
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-rg-ink-faint">
            Komisyon ödemelerinin yapılacağı hesap bilgileri — istersen daha sonra da doldurabilirsin.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Banka Adı">
              <input
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Hesap Sahibi">
              <input
                value={bank.bankAccountName}
                onChange={(e) => setBank({ ...bank, bankAccountName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="IBAN">
              <input
                value={bank.iban}
                onChange={(e) => setBank({ ...bank, iban: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="SWIFT/BIC">
              <input
                value={bank.swift}
                onChange={(e) => setBank({ ...bank, swift: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <button
            onClick={() => goNext(() => savePartnerBankStep(bank))}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Devam Et
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-rg-ink-faint">
            Hangi ürünlerde satış yapmak istersin? (birden fazla seçebilirsin)
          </p>
          <div className="flex flex-col gap-2">
            {PRODUCTS.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2.5 rounded-[10px] border border-rg-line px-3.5 py-2.5 text-[12.5px] text-rg-ink"
              >
                <input
                  type="checkbox"
                  checked={interests.includes(p.key)}
                  onChange={() => toggleInterest(p.key)}
                  className="h-4 w-4 shrink-0 rounded border-rg-line"
                />
                {p.label}
              </label>
            ))}
          </div>
          <button
            onClick={() => goNext(() => savePartnerInterestsStep(interests))}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Devam Et
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-[10px] bg-rg-surface-alt p-4 text-[12.5px] text-rg-ink-soft">
            <div className="mb-2 font-semibold text-rg-ink">Özet</div>
            <div>Firma: {company.companyName || "—"}</div>
            <div>Ülke: {company.country || "—"}</div>
            <div>İlgi alanları: {interests.length ? interests.join(", ") : "—"}</div>
          </div>
          <p className="text-[12px] text-rg-ink-faint">
            Kaydını tamamladığında bilgilerin Süper Admin&apos;e iletilecek. Hesabın onaylandığında (genelde
            1-2 iş günü içinde) tam erişim açılacak.
          </p>
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Onayla ve Tamamla
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[11.5px] text-destructive">{error}</p>}
    </div>
  );
}

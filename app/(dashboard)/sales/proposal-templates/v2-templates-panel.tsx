"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Loader2 } from "lucide-react";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { Logo } from "@/components/ui/logo";
import { cloneProposalTemplate, updateTemplateSection, type SectionInput, type TemplateProduct } from "./actions";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCT_ORDER = ["golms", "golxp", "gocatalog", "gofactory", "gotools", "genel"];

const SECTION_LABEL: Record<string, string> = {
  cover: "Kapak",
  customer_info: "Müşteri Bilgisi",
  scope: "Kapsam (Dahil / Hariç)",
  product_info: "Ürün Bilgisi",
  bank_info: "Banka Bilgileri",
  signature: "Onay & İmza",
  custom: "Özel Bölüm",
};

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[10.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type V2Section = {
  id: string;
  section_type: string;
  legal_region: "tr" | "us" | null;
  sort_order: number;
  title_tr: string | null;
  title_en: string | null;
  body_tr: string | null;
  body_en: string | null;
  content: Record<string, unknown>;
};

export type V2Template = {
  id: string;
  name: string;
  product: TemplateProduct;
  isActive: boolean;
  isDefaultForProduct: boolean;
  clonedFromId: string | null;
  sections: V2Section[];
};

function sectionLabel(section: V2Section): string {
  if (section.section_type === "legal_terms") {
    return section.legal_region === "us" ? "Hukuki Şartlar (US)" : "Hukuki Şartlar (TR)";
  }
  return SECTION_LABEL[section.section_type] ?? section.section_type;
}

function toLines(value: unknown): string {
  return Array.isArray(value) ? value.join("\n") : "";
}
function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function SectionEditor({ section, readOnly }: { section: V2Section; readOnly: boolean }) {
  const [titleTr, setTitleTr] = useState(section.title_tr ?? "");
  const [titleEn, setTitleEn] = useState(section.title_en ?? "");
  const [bodyTr, setBodyTr] = useState(section.body_tr ?? "");
  const [bodyEn, setBodyEn] = useState(section.body_en ?? "");
  const [bankName, setBankName] = useState(String(section.content.bank_name ?? ""));
  const [accountName, setAccountName] = useState(String(section.content.account_name ?? ""));
  const [iban, setIban] = useState(String(section.content.iban ?? ""));
  const [swift, setSwift] = useState(String(section.content.swift ?? ""));
  const [currency, setCurrency] = useState(String(section.content.currency ?? ""));
  const [includedTr, setIncludedTr] = useState(toLines(section.content.included_tr));
  const [includedEn, setIncludedEn] = useState(toLines(section.content.included_en));
  const [excludedTr, setExcludedTr] = useState(toLines(section.content.excluded_tr));
  const [excludedEn, setExcludedEn] = useState(toLines(section.content.excluded_en));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function handleSave() {
    setError("");
    setSaved(false);
    let content: Record<string, unknown> = section.content;
    if (section.section_type === "bank_info") {
      content = { bank_name: bankName, account_name: accountName, iban, swift, currency };
    } else if (section.section_type === "scope") {
      content = {
        included_tr: fromLines(includedTr),
        included_en: fromLines(includedEn),
        excluded_tr: fromLines(excludedTr),
        excluded_en: fromLines(excludedEn),
      };
    }
    const input: SectionInput = { titleTr, titleEn, bodyTr, bodyEn, content };
    startTransition(async () => {
      const result = await updateTemplateSection(section.id, input);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-rg-line bg-rg-surface-alt p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-bold text-rg-ink">{sectionLabel(section)}</span>
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[7px] bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Kaydet
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Başlık (TR)</label>
          <input disabled={readOnly} value={titleTr} onChange={(e) => setTitleTr(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Title (EN)</label>
          <input disabled={readOnly} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
        </div>
      </div>

      {section.section_type === "scope" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Dahil olanlar (TR, satır satır)</label>
            <textarea disabled={readOnly} rows={4} value={includedTr} onChange={(e) => setIncludedTr(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Included (EN, one per line)</label>
            <textarea disabled={readOnly} rows={4} value={includedEn} onChange={(e) => setIncludedEn(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Dahil olmayanlar (TR, satır satır)</label>
            <textarea disabled={readOnly} rows={4} value={excludedTr} onChange={(e) => setExcludedTr(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Excluded (EN, one per line)</label>
            <textarea disabled={readOnly} rows={4} value={excludedEn} onChange={(e) => setExcludedEn(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Metin (TR)</label>
            <textarea disabled={readOnly} rows={4} value={bodyTr} onChange={(e) => setBodyTr(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Text (EN)</label>
            <textarea disabled={readOnly} rows={4} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} className={`${inputClass} resize-y disabled:opacity-70`} />
          </div>
        </div>
      )}

      {section.section_type === "bank_info" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Banka</label>
            <input disabled={readOnly} value={bankName} onChange={(e) => setBankName(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Hesap Adı</label>
            <input disabled={readOnly} value={accountName} onChange={(e) => setAccountName(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>IBAN</label>
            <input disabled={readOnly} value={iban} onChange={(e) => setIban(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>SWIFT</label>
            <input disabled={readOnly} value={swift} onChange={(e) => setSwift(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Para Birimi</label>
            <input disabled={readOnly} value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} disabled:opacity-70`} />
          </div>
        </div>
      )}

      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
      {saved && !error && <span className="text-[11px] text-rg-ink-faint">Kaydedildi.</span>}
    </div>
  );
}

function V2TemplateCard({ template, isFounder }: { template: V2Template; isFounder: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleClone() {
    setError("");
    startTransition(async () => {
      const result = await cloneProposalTemplate(template.id);
      if (result.ok) {
        setOpen(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="flex items-center justify-between gap-2 border-b border-rg-line bg-rg-surface-alt px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-rg-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="font-display text-[12.8px] font-bold text-rg-ink">{template.name}</span>
          {template.isDefaultForProduct && (
            <span className="inline-flex items-center rounded-full bg-golms-tint px-2 py-0.5 text-[10px] font-bold uppercase text-golms">
              Varsayılan
            </span>
          )}
          {template.clonedFromId && (
            <span className="inline-flex items-center rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10px] font-bold text-rg-ink-faint">
              Kopya
            </span>
          )}
          <span className="text-[11px] text-rg-ink-faint">{template.sections.length} bölüm</span>
        </button>
        {isFounder && (
          <button
            type="button"
            onClick={handleClone}
            disabled={isPending}
            title="Bu şablonu klonla"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            Kopyala
          </button>
        )}
      </div>

      {error && <div className="px-4 pt-2 text-[11.5px] text-destructive">{error}</div>}

      {open && (
        <div className="flex flex-col gap-3 px-4 py-4">
          {template.sections.map((section) => (
            <SectionEditor key={section.id} section={section} readOnly={!isFounder} />
          ))}
        </div>
      )}
    </div>
  );
}

export function V2TemplatesPanel({ templates, isFounder }: { templates: V2Template[]; isFounder: boolean }) {
  const grouped: Record<string, V2Template[]> = {};
  templates.forEach((t) => {
    const key = t.product ?? "genel";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14.5px] font-bold text-rg-ink">Teklif Şablonları 2.0</h2>
        {!isFounder && (
          <span className="text-[11px] text-rg-ink-faint">Düzenleme yetkisi sadece Süper Admin&apos;de.</span>
        )}
      </div>

      {templates.length === 0 && (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
          Henüz bölüm bazlı şablon yok.
        </div>
      )}

      {PRODUCT_ORDER.filter((key) => grouped[key]?.length).map((key) => (
        <div key={key} className="flex flex-col gap-3">
          {key !== "genel" && PRODUCT_LOGO[key] ? (
            <Logo product={key as keyof typeof PRODUCT_LOGO} alt={PRODUCT_LABEL[key]} className="h-5 w-auto" />
          ) : (
            <span className="text-[12px] font-bold text-rg-ink-soft">Genel Ekosistem</span>
          )}
          <div className="flex flex-col gap-3">
            {grouped[key].map((t) => (
              <V2TemplateCard key={t.id} template={t} isFounder={isFounder} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

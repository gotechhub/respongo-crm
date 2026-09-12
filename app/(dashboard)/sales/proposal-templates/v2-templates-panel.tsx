"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { deleteCustomTemplateSection, updateTemplateSection, type SectionInput, type TemplateProduct } from "./actions";

const SECTION_LABEL: Record<string, string> = { cover: "Kapak", customer_info: "Müşteri bilgisi", scope: "Kapsam", product_info: "Ürün detayları", technical_specs: "Teknik özellikler ve güvenlik", implementation_timeline: "Uygulama planı", support_sla: "Destek ve SLA", bank_info: "Banka bilgileri", signature: "Onay ve imza", custom: "Özel bölüm" };
const inputClass = "w-full rounded-lg border border-rg-line bg-rg-surface px-3 py-2 text-[13px] text-rg-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "text-[10px] font-bold uppercase tracking-[.08em] text-rg-ink-faint";

export type V2Section = { id: string; section_type: string; legal_region: "tr" | "us" | null; sort_order: number; title_tr: string | null; title_en: string | null; body_tr: string | null; body_en: string | null; content: Record<string, unknown> };
export type V2Template = { id: string; name: string; product: TemplateProduct; language: "tr" | "en"; isActive: boolean; isDefaultForProduct: boolean; clonedFromId: string | null; sections: V2Section[] };

/** Bölümün müşteri/kullanıcıya gösterilecek etiketi — liste sayfası, sol menü ve
 * önizleme HEPSİ bu tek fonksiyonu kullanır, böylece etiketler asla birbirinden sapmaz. */
export function sectionLabel(section: V2Section) {
  if (section.section_type === "legal_terms") return section.legal_region === "us" ? "Hukuki şartlar · US" : "Hukuki şartlar · TR";
  return SECTION_LABEL[section.section_type] ?? section.section_type;
}
function lines(value: unknown) { return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; }

/** Bir bölümün "tamamlandı" sayılıp sayılmayacağı — liste sayfasındaki ilerleme
 * çubuğu ile düzenleyicideki sol menü rozetleri AYNI mantığı paylaşır.
 *
 * Şablonlar artık TR + EN içeriği aynı satırda taşıdığı için "tamamlandı" varsayılan olarak
 * HER İKİ dilin de dolu olmasını ister — tek istisna hukuki şartlar: TR bölgesi sadece Türkçe,
 * US/Global bölgesi sadece İngilizce metin gerektirir (canlı verideki doğru/kasıtlı yapı budur). */
export function isSectionComplete(section: V2Section) {
  if (section.section_type === "scope") {
    return lines(section.content.included_tr).length > 0 && lines(section.content.included_en).length > 0;
  }
  if (section.section_type === "bank_info") return Boolean(section.content.bank_name || section.content.iban);
  if (section.section_type === "legal_terms") {
    return section.legal_region === "us" ? Boolean(section.body_en) : Boolean(section.body_tr);
  }
  if (section.section_type === "technical_specs") {
    return lines(section.content.items_tr).length > 0 && lines(section.content.items_en).length > 0;
  }
  if (section.section_type === "implementation_timeline") {
    return lines(section.content.phases_tr).length > 0 && lines(section.content.phases_en).length > 0;
  }
  if (section.section_type === "support_sla") {
    return lines(section.content.tiers_tr).length > 0 && lines(section.content.tiers_en).length > 0;
  }
  return Boolean((section.title_tr || section.body_tr) && (section.title_en || section.body_en));
}

function ListField({ title, value, onChange, disabled }: { title: string; value: string[]; onChange: (value: string[]) => void; disabled: boolean }) {
  const update = (index: number, next: string) => onChange(value.map((item, i) => i === index ? next : item));
  return <div className="rounded-xl border border-rg-line bg-rg-surface-alt p-3"><div className="mb-2 flex items-center justify-between"><span className={labelClass}>{title}</span><button type="button" disabled={disabled} onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Madde ekle</button></div><div className="space-y-1.5">{value.map((item, i) => <div key={`${i}-${item}`} className="flex gap-1.5"><input disabled={disabled} value={item} onChange={(e) => update(i, e.target.value)} placeholder="Kapsam maddesi" className={inputClass} /><button type="button" disabled={disabled} onClick={() => onChange(value.filter((_, index) => index !== i))} aria-label="Maddeyi sil" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-rg-ink-faint hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>{value.length === 0 && <p className="py-2 text-[12px] text-rg-ink-faint">Henüz madde eklenmedi.</p>}</div>;
}

/** Tek bir belge bölümünün düzenleme formu. Artık şablon düzenleyicisinin ORTA sütununda, solda
 * bölüm menüsü + sağda tam önizleme ile birlikte kullanılır — ve kullanıcının açıkça istediği gibi,
 * Türkçe ile İngilizce içerik burada YAN YANA, tek "Kaydet" ile aynı anda güncellenir. */
export function SectionWorkspace({ section, isFounder, onDeleted }: { section: V2Section; isFounder: boolean; onDeleted: () => void }) {
  const [titleTr, setTitleTr] = useState(section.title_tr ?? "");
  const [titleEn, setTitleEn] = useState(section.title_en ?? "");
  const [bodyTr, setBodyTr] = useState(section.body_tr ?? "");
  const [bodyEn, setBodyEn] = useState(section.body_en ?? "");
  const [includedTr, setIncludedTr] = useState(lines(section.content.included_tr));
  const [includedEn, setIncludedEn] = useState(lines(section.content.included_en));
  const [excludedTr, setExcludedTr] = useState(lines(section.content.excluded_tr));
  const [excludedEn, setExcludedEn] = useState(lines(section.content.excluded_en));
  const [bank, setBank] = useState({ bank_name: String(section.content.bank_name ?? ""), account_name: String(section.content.account_name ?? ""), iban: String(section.content.iban ?? ""), swift: String(section.content.swift ?? "") });
  // technical_specs/implementation_timeline/support_sla — her biri tek bir TR + tek bir EN liste
  // taşır (scope'un dahil/hariç ikilisinden farklı olarak tek listeli), o yüzden aynı iki state
  // üç bölüm tipi arasında paylaşılıyor (bir SectionWorkspace her zaman TEK bir bölümü düzenler).
  const singleListKey = section.section_type === "technical_specs" ? "items" : section.section_type === "implementation_timeline" ? "phases" : section.section_type === "support_sla" ? "tiers" : null;
  const [singleListTr, setSingleListTr] = useState(singleListKey ? lines(section.content[`${singleListKey}_tr`]) : []);
  const [singleListEn, setSingleListEn] = useState(singleListKey ? lines(section.content[`${singleListKey}_en`]) : []);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    setTitleTr(section.title_tr ?? "");
    setTitleEn(section.title_en ?? "");
    setBodyTr(section.body_tr ?? "");
    setBodyEn(section.body_en ?? "");
    setIncludedTr(lines(section.content.included_tr));
    setIncludedEn(lines(section.content.included_en));
    setExcludedTr(lines(section.content.excluded_tr));
    setExcludedEn(lines(section.content.excluded_en));
    setBank({ bank_name: String(section.content.bank_name ?? ""), account_name: String(section.content.account_name ?? ""), iban: String(section.content.iban ?? ""), swift: String(section.content.swift ?? "") });
    const key = section.section_type === "technical_specs" ? "items" : section.section_type === "implementation_timeline" ? "phases" : section.section_type === "support_sla" ? "tiers" : null;
    setSingleListTr(key ? lines(section.content[`${key}_tr`]) : []);
    setSingleListEn(key ? lines(section.content[`${key}_en`]) : []);
  }, [section]);

  const content = useMemo(() => {
    if (section.section_type === "scope") {
      return {
        ...section.content,
        included_tr: includedTr.map((x) => x.trim()).filter(Boolean),
        included_en: includedEn.map((x) => x.trim()).filter(Boolean),
        excluded_tr: excludedTr.map((x) => x.trim()).filter(Boolean),
        excluded_en: excludedEn.map((x) => x.trim()).filter(Boolean),
      };
    }
    if (section.section_type === "bank_info") return { ...section.content, ...bank };
    if (singleListKey) {
      return {
        ...section.content,
        [`${singleListKey}_tr`]: singleListTr.map((x) => x.trim()).filter(Boolean),
        [`${singleListKey}_en`]: singleListEn.map((x) => x.trim()).filter(Boolean),
      };
    }
    return section.content;
  }, [section, includedTr, includedEn, excludedTr, excludedEn, bank, singleListKey, singleListTr, singleListEn]);

  function save() {
    setMessage("");
    const input: SectionInput = { titleTr, titleEn, bodyTr, bodyEn, content };
    startTransition(async () => {
      const result = await updateTemplateSection(section.id, input);
      setMessage(result.ok ? "Kaydedildi" : result.error);
      if (result.ok) router.refresh();
    });
  }
  function remove() {
    startTransition(async () => {
      const result = await deleteCustomTemplateSection(section.id);
      if (result.ok) {
        onDeleted();
        router.refresh();
      } else setMessage(result.error);
    });
  }

  const legal = section.section_type === "legal_terms";
  const isScope = section.section_type === "scope";
  const isBank = section.section_type === "bank_info";
  const isSingleList = Boolean(singleListKey);
  const singleListTitle = singleListKey === "items" ? "Madde" : singleListKey === "phases" ? "Aşama" : "Seviye";
  const langBadge = "inline-block rounded-full bg-rg-surface px-2 py-0.5 text-[10px] font-bold text-rg-ink-soft";
  const langCol = "space-y-3 rounded-xl border border-rg-line bg-rg-surface-alt p-3.5";

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <header className="flex items-start justify-between gap-4 border-b border-rg-line px-5 py-4">
        <div>
          <h3 className="font-display text-[16px] font-bold text-rg-ink">{sectionLabel(section)}</h3>
          <p className="mt-1 text-[11.5px] text-rg-ink-faint">
            Türkçe ve İngilizce içerik burada bir arada — tek &quot;Kaydet&quot; ikisini birden günceller.
          </p>
        </div>
        {isFounder && (
          <div className="flex gap-2">
            {section.section_type === "custom" && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="grid h-9 w-9 place-items-center rounded-lg border border-rg-line text-rg-ink-faint hover:border-destructive hover:text-destructive"
                title="Özel bölümü sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Kaydet
            </button>
          </div>
        )}
      </header>

      <div className="space-y-4 p-5">
        {legal && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-900">
            Bu metin hukuki inceleme gerektirir. Onaylanmış şartları buraya ekleyin.{" "}
            {section.legal_region === "us"
              ? "Bu bölge (US/Global) için genellikle yalnızca İngilizce metin yeterlidir."
              : "Bu bölge (Türkiye) için genellikle yalnızca Türkçe metin yeterlidir."}
          </div>
        )}

        {!isScope && !isBank && !isSingleList && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={langCol}>
              <span className={langBadge}>Türkçe</span>
              <div>
                <label className={labelClass}>Bölüm başlığı</label>
                <input disabled={!isFounder} value={titleTr} onChange={(e) => setTitleTr(e.target.value)} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className={labelClass}>Belge metni</label>
                <textarea
                  disabled={!isFounder}
                  rows={legal ? 12 : 8}
                  value={bodyTr}
                  onChange={(e) => setBodyTr(e.target.value)}
                  placeholder="Bu bölümün müşteri tarafından görülecek Türkçe metni"
                  className={`${inputClass} mt-1 resize-y leading-6`}
                />
              </div>
            </div>
            <div className={langCol}>
              <span className={langBadge}>English</span>
              <div>
                <label className={labelClass}>Section title</label>
                <input disabled={!isFounder} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className={labelClass}>Document text</label>
                <textarea
                  disabled={!isFounder}
                  rows={legal ? 12 : 8}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  placeholder="The English text customers will see for this section"
                  className={`${inputClass} mt-1 resize-y leading-6`}
                />
              </div>
            </div>
          </div>
        )}

        {isScope && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={langCol}>
              <span className={langBadge}>Türkçe</span>
              <ListField title="Dahil olanlar" value={includedTr} onChange={setIncludedTr} disabled={!isFounder} />
              <ListField title="Dahil olmayanlar" value={excludedTr} onChange={setExcludedTr} disabled={!isFounder} />
            </div>
            <div className={langCol}>
              <span className={langBadge}>English</span>
              <ListField title="Included" value={includedEn} onChange={setIncludedEn} disabled={!isFounder} />
              <ListField title="Excluded" value={excludedEn} onChange={setExcludedEn} disabled={!isFounder} />
            </div>
          </div>
        )}

        {isSingleList && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={langCol}>
              <span className={langBadge}>Türkçe</span>
              <ListField title={`${singleListTitle} (Türkçe)`} value={singleListTr} onChange={setSingleListTr} disabled={!isFounder} />
            </div>
            <div className={langCol}>
              <span className={langBadge}>English</span>
              <ListField title={`${singleListTitle} (English)`} value={singleListEn} onChange={setSingleListEn} disabled={!isFounder} />
            </div>
          </div>
        )}

        {isBank && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Banka</label>
              <input disabled={!isFounder} value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>Hesap adı</label>
              <input disabled={!isFounder} value={bank.account_name} onChange={(e) => setBank({ ...bank, account_name: e.target.value })} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>IBAN</label>
              <input disabled={!isFounder} value={bank.iban} onChange={(e) => setBank({ ...bank, iban: e.target.value })} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className={labelClass}>SWIFT / BIC</label>
              <input disabled={!isFounder} value={bank.swift} onChange={(e) => setBank({ ...bank, swift: e.target.value })} className={`${inputClass} mt-1`} />
            </div>
            <p className="text-[11px] text-rg-ink-faint sm:col-span-2">Banka bilgileri dilden bağımsızdır, tek seferde girilir.</p>
          </div>
        )}

        {message && <p className={message === "Kaydedildi" ? "text-[12px] text-gofactory" : "text-[12px] text-destructive"}>{message}</p>}
      </div>
    </section>
  );
}

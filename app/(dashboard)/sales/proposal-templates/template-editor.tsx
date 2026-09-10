"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { cloneProposalTemplate, createCustomTemplateSection } from "./actions";
import { SectionWorkspace, isSectionComplete, sectionLabel, type V2Template } from "./v2-templates-panel";
import { TemplatePreview } from "./template-preview";

const PRODUCT_LABEL: Record<string, string> = { golms: "GOLMS", golxp: "GOLXP", gocatalog: "GOCATALOG", gofactory: "GOFACTORY", gotools: "GOTOOLS" };
const inputClass = "w-full rounded-lg border border-rg-line bg-rg-surface px-3 py-2 text-[13px] text-rg-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

/**
 * Tek bir şablonun tam belge düzenleyicisi — kendi sayfasında (/sales/proposal-templates/[id]) açılır.
 *
 * Düzen kullanıcının açıkça istediği yapı: SOLDA tüm belge bölümlerinin dikey menüsü (artık eskisi gibi
 * kaydırmalı/yatay bir şerit değil — her bölüm her zaman tek bakışta görünür), ORTADA seçili bölümün
 * düzenleme formu, SAĞDA müşterinin göreceği TAM belge önizlemesi (küçük bir mockup değil, PDF ile birebir
 * aynı gerçek TemplatePreview bileşeni) — düzenlerken sonucu anında, gerçek haliyle görürsünüz.
 */
export function TemplateDocumentEditor({
  template,
  isFounder,
  siblings,
}: {
  template: V2Template;
  isFounder: boolean;
  /** Aynı ürün için var olan diğer şablonlar (ör. kopyalanmış sürümler, eski dil kopyaları) — hızlı geçiş için. */
  siblings: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [sectionId, setSectionId] = useState(template.sections[0]?.id ?? "");
  const [customTitleTr, setCustomTitleTr] = useState("");
  const [customTitleEn, setCustomTitleEn] = useState("");
  const [previewLanguage, setPreviewLanguage] = useState<"tr" | "en">("tr");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!template.sections.some((s) => s.id === sectionId)) setSectionId(template.sections[0]?.id ?? "");
  }, [template, sectionId]);

  if (template.sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-rg-line p-10 text-center text-[12px] text-rg-ink-faint">
        Bu şablonun henüz belge bölümü yok.
      </div>
    );
  }

  const section = template.sections.find((s) => s.id === sectionId) ?? template.sections[0];
  const completedCount = template.sections.filter((s) => isSectionComplete(s)).length;

  function addSection() {
    setMessage("");
    startTransition(async () => {
      const result = await createCustomTemplateSection(template.id, customTitleTr, customTitleEn);
      if (result.ok) {
        setCustomTitleTr("");
        setCustomTitleEn("");
        setMessage("Özel bölüm eklendi.");
        router.refresh();
      } else setMessage(result.error);
    });
  }

  function clone() {
    setMessage("");
    startTransition(async () => {
      const result = await cloneProposalTemplate(template.id);
      setMessage(result.ok ? "Şablon kopyalandı — kütüphaneden açabilirsin." : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rg-line bg-rg-surface-alt px-4 py-3">
        <div className="flex items-center gap-2.5">
          {template.product && PRODUCT_LOGO[template.product] ? (
            <Logo product={template.product} alt={PRODUCT_LABEL[template.product]} className="h-5 w-16 object-contain object-left" />
          ) : (
            <span className="text-[11px] font-bold tracking-[.1em] text-rg-ink">RESPONGO</span>
          )}
          <div>
            <p className="text-[12.5px] font-semibold text-rg-ink">{template.name}</p>
            <p className="text-[10.5px] text-rg-ink-faint">
              TR + EN · {completedCount}/{template.sections.length} bölüm tamamlandı
              {template.isDefaultForProduct ? " · Varsayılan" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {siblings.length > 0 && (
            <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
              <span className="text-[11px] text-rg-ink-faint">Bu ürün için diğerleri:</span>
              {siblings.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  href={`/sales/proposal-templates/${s.id}`}
                  className="rounded-lg bg-rg-surface px-2.5 py-1.5 text-[11px] font-semibold text-rg-ink-soft hover:bg-rg-line"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
          {isFounder ? (
            <button
              type="button"
              disabled={pending}
              onClick={clone}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rg-line bg-rg-surface px-3 py-2 text-[12px] font-semibold text-rg-ink disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Şablonu kopyala
            </button>
          ) : (
            <span className="text-[12px] text-rg-ink-faint">Düzenleme yetkisi Süper Admin&apos;dedir.</span>
          )}
        </div>
      </div>

      {message && <p className="text-[12px] text-rg-ink-soft">{message}</p>}

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_420px]">
        {/* SOL — belge bölümlerinin dikey menüsü. Artık yatay kaydırmalı bir şerit değil; 8 bölümün
            hepsi her zaman aynı anda görünür, tamamlanma durumu rozetle işaretlenir. */}
        <nav className="h-max space-y-1 rounded-2xl border border-rg-line bg-rg-surface p-2 xl:sticky xl:top-4">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.1em] text-rg-ink-faint">Belge bölümleri</p>
          {template.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[12.5px] font-semibold transition ${
                s.id === section.id ? "bg-rg-ink text-white" : "text-rg-ink-soft hover:bg-rg-surface-alt"
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSectionComplete(s) ? "bg-gofactory" : "bg-amber-400"}`} />
              <span className="min-w-0 flex-1 truncate">{sectionLabel(s)}</span>
            </button>
          ))}
          {isFounder && (
            <div className="mt-2 space-y-1.5 border-t border-rg-line pt-2">
              <label className="block px-1 text-[10px] font-bold uppercase tracking-[.1em] text-rg-ink-faint">Özel bölüm ekle</label>
              <div className="space-y-1.5 px-1">
                <input
                  value={customTitleTr}
                  onChange={(e) => setCustomTitleTr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSection();
                  }}
                  placeholder="Başlık (TR)"
                  className={`${inputClass} text-[12px]`}
                />
                <div className="flex gap-1.5">
                  <input
                    value={customTitleEn}
                    onChange={(e) => setCustomTitleEn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSection();
                    }}
                    placeholder="Title (EN)"
                    className={`${inputClass} text-[12px]`}
                  />
                  <button
                    type="button"
                    disabled={pending || (!customTitleTr.trim() && !customTitleEn.trim())}
                    onClick={addSection}
                    aria-label="Bölüm ekle"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-rg-ink px-2.5 text-white disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ORTA — seçili bölümün içerik düzenleyicisi; TR ve EN aynı formda yan yana */}
        <div className="min-w-0">
          {section && (
            <SectionWorkspace
              key={section.id}
              section={section}
              isFounder={isFounder}
              onDeleted={() => setSectionId(template.sections.find((s) => s.id !== section.id)?.id ?? "")}
            />
          )}
        </div>

        {/* SAĞ — müşterinin göreceği tam belge önizlemesi, PDF ile birebir aynı yapı. Şablon
            içeriği artık her iki dili birden taşıdığı için önizleme dili burada bağımsız seçilir. */}
        <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto">
          <div className="mb-2 flex justify-end gap-1.5">
            {(["tr", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setPreviewLanguage(lang)}
                className={`rounded-lg px-3 py-1.5 text-[11.5px] font-semibold ${
                  previewLanguage === lang ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft hover:bg-rg-line"
                }`}
              >
                {lang === "tr" ? "Türkçe önizleme" : "English preview"}
              </button>
            ))}
          </div>
          <TemplatePreview template={template} language={previewLanguage} />
        </div>
      </div>
    </div>
  );
}

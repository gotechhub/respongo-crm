"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Copy, FilePlus2, Layers3, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { STUDIO_PRODUCTS, type StudioProduct } from "@/lib/proposals/template-studio";
import { cloneProposalTemplate, createStarterTemplateLibrary } from "./actions";
import { V2TemplatesPanel, type V2Template } from "./v2-templates-panel";
import { TemplatePreview } from "./template-preview";

const languageLabel = (language: "tr" | "en") => language === "tr" ? "Türkçe" : "English";
const productKey = (value: StudioProduct) => value ?? "general";

export function ProposalStudio({ templates, isFounder }: { templates: V2Template[]; isFounder: boolean }) {
  const router = useRouter();
  const [product, setProduct] = useState<StudioProduct>("golms");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selectedProduct = STUDIO_PRODUCTS.find((entry) => entry.key === product) ?? STUDIO_PRODUCTS[5];
  const visible = useMemo(() => templates.filter((template) => template.product === product && template.language === language), [templates, product, language]);
  const libraryCount = useMemo(() => new Set(templates.map((template) => `${productKey(template.product)}:${template.language}`)).size, [templates]);

  function seedLibrary() {
    setError(""); setNotice("");
    startTransition(async () => {
      const result = await createStarterTemplateLibrary();
      if (!result.ok) { setError(result.error); return; }
      setNotice(`${result.created ?? 0} başlangıç şablonu eklendi; ${result.skipped ?? 0} mevcut şablon korundu.`);
      router.refresh();
    });
  }

  function cloneTemplate(id: string) {
    setError(""); setNotice("");
    startTransition(async () => {
      const result = await cloneProposalTemplate(id);
      if (!result.ok) { setError(result.error); return; }
      setNotice("Şablon kopyalandı. Aşağıdaki bölüm düzenleyicide içeriğini özelleştirebilirsin.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="relative overflow-hidden bg-[#0d1b3a] px-6 py-7 text-white">
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 20%, #60a5fa, transparent 28%), radial-gradient(circle at 18% 100%, #7c3aed, transparent 35%)" }} />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-blue-200"><Sparkles className="h-4 w-4" /> Respongo Teklif Stüdyosu</div>
              <h2 className="font-display text-2xl font-bold">Her ürün için ayrı tasarlanmış, sürümlenebilir teklif deneyimi</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">12 ana şablon: 5 ürün ve Respongo ekosistemi için Türkçe ile İngilizce ayrı tasarımlar. Şablonu kopyala, belge bölümlerini düzenle, teklifin müşteriye giden sürümünü denetle.</p>
            </div>
            <div className="min-w-[150px] rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-bold">{libraryCount}/12</div><div className="mt-0.5 text-xs text-blue-100">ana şablon hazır</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="text-sm text-rg-ink-soft">Hukuki şartlar, onaylanmış TR ve Global metinler girilene kadar eksik durumunda kalır.</p>
          {isFounder && <button type="button" disabled={isPending} onClick={seedLibrary} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 className="h-4 w-4" />{isPending ? "Hazırlanıyor…" : "12 başlangıç şablonunu oluştur"}</button>}
        </div>
      </section>

      <section className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-display text-lg font-bold text-rg-ink">Tasarım kütüphanesi</h2><p className="mt-1 text-sm text-rg-ink-soft">Ürünü ve belge dilini seç. Her kart farklı kapak görseli, renk ve ürün anlatımıyla hazırlanır.</p></div>
          <div className="flex rounded-lg bg-rg-surface-alt p-1">
            {(["tr", "en"] as const).map((value) => <button key={value} type="button" onClick={() => setLanguage(value)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${language === value ? "bg-rg-surface text-primary shadow-sm" : "text-rg-ink-soft"}`}>{languageLabel(value)}</button>)}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {STUDIO_PRODUCTS.map((entry) => <button key={productKey(entry.key)} type="button" onClick={() => setProduct(entry.key)} className={`rounded-xl border p-3 text-left transition ${product === entry.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-rg-line bg-rg-bg hover:border-primary/50"}`}>
            {entry.key && PRODUCT_LOGO[entry.key] ? <Logo product={entry.key} alt={entry.label} className="h-5 w-auto" /> : <span className="text-xs font-bold tracking-[.14em] text-rg-ink">RESPONGO</span>}
            <span className="mt-4 block text-xs font-medium text-rg-ink-soft">{entry.key ? entry.label : "Genel teklif"}</span>
          </button>)}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-rg-ink-faint">{languageLabel(language)}</p><h2 className="font-display text-xl font-bold text-rg-ink">{language === "tr" ? selectedProduct.trName : selectedProduct.enName}</h2></div><span className="rounded-full bg-rg-surface-alt px-2.5 py-1 text-xs font-semibold text-rg-ink-soft">{visible.length} şablon</span></div>
            {visible.length === 0 ? <div className="rounded-xl border border-dashed border-rg-line bg-rg-bg p-8 text-center"><Layers3 className="mx-auto h-6 w-6 text-rg-ink-faint" /><p className="mt-3 text-sm font-semibold text-rg-ink">Bu ürün ve dil için şablon yok.</p><p className="mt-1 text-sm text-rg-ink-soft">Başlangıç kütüphanesini oluşturduğunda bu tasarım sekiz belge bölümüyle hazır gelir.</p></div> : <div className="grid gap-3 md:grid-cols-2">{visible.map((template) => <article key={template.id} className="rounded-xl border border-rg-line bg-rg-bg p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-rg-ink">{template.name}</h3><p className="mt-1 text-sm text-rg-ink-soft">{template.sections.length}/8 belge bölümü · {template.isActive ? "Yayında" : "Taslak"}</p></div>{template.isDefaultForProduct && <span className="rounded-full bg-golms-tint px-2 py-1 text-[11px] font-bold text-golms">Varsayılan</span>}</div><div className="mt-4 flex gap-2"><button type="button" onClick={() => cloneTemplate(template.id)} disabled={!isFounder || isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-rg-line bg-rg-surface px-3 py-2 text-sm font-semibold text-rg-ink disabled:opacity-50"><Copy className="h-3.5 w-3.5" />Kopyala</button><a href="#belge-bolumleri" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary">Düzenle <ChevronRight className="h-3.5 w-3.5" /></a></div></article>)}</div>}
          </div>
          <aside className="relative min-h-[250px] overflow-hidden bg-[#12234a] p-5 text-white">
            {selectedProduct.coverImage && <Image src={selectedProduct.coverImage} alt="" fill sizes="310px" className="object-cover opacity-30" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1733] via-[#0c1733]/45 to-transparent" />
            <div className="relative flex h-full flex-col justify-end"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-200">Kapak yönü</p><h3 className="mt-2 font-display text-xl font-bold">{language === "tr" ? selectedProduct.trName : selectedProduct.enName}</h3><p className="mt-2 text-sm text-blue-100">Ürün logosu, ürün görseli ve teklifin ticari mesajı kapakta birlikte çalışır.</p></div>
          </aside>
        </div>
      </section>
      {(notice || error) && <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-destructive" : "text-golms"}`}>{error || <><CheckCircle2 className="mr-1 inline h-4 w-4" />{notice}</>}</p>}
      {visible[0] && <TemplatePreview template={visible[0]} />}
      <section id="belge-bolumleri" className="scroll-mt-6"><div className="mb-3"><h2 className="font-display text-lg font-bold text-rg-ink">Belge bölümleri</h2><p className="mt-1 text-sm text-rg-ink-soft">Şablon içeriği burada düzenlenir. Bu ekran sonraki aşamada gerçek HTML belge önizlemesi ve teklif sürümleriyle birleşecek.</p></div><V2TemplatesPanel templates={templates} isFounder={isFounder} /></section>
    </div>
  );
}

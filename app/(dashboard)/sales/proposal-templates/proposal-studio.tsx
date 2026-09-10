"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Copy, FilePlus2, Layers3, Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { STUDIO_PRODUCTS, type StudioProduct } from "@/lib/proposals/template-studio";
import { cloneProposalTemplate, createStarterTemplateLibrary } from "./actions";
import { isSectionComplete, type V2Template } from "./v2-templates-panel";

const productKey = (value: StudioProduct) => value ?? "general";
const ALL_PRODUCTS = "__all__" as const;
/** Bir şablonun listede varsayılan/aktif olarak sayılıp sayılmayacağı — eski "dil başına ayrı
 * satır" düzeninden kalan, artık bilgi bakımından fazladan olan kopyalar (kullanıcı klonu olmayan,
 * varsayılan da olmayan satırlar) varsayılan görünümde gizlenir ama SİLİNMEZ: bazı geçmiş teklifler
 * hâlâ bu satırlara referans veriyor. "Yedekleri göster" ile her zaman erişilebilir kalırlar. */
const isPrimaryTemplate = (t: V2Template) => t.isDefaultForProduct || t.clonedFromId !== null;

export function ProposalStudio({ templates, isFounder }: { templates: V2Template[]; isFounder: boolean }) {
  const router = useRouter();
  const [productFilter, setProductFilter] = useState<StudioProduct | typeof ALL_PRODUCTS>(ALL_PRODUCTS);
  const [showLegacy, setShowLegacy] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const legacyCount = useMemo(() => templates.filter((t) => !isPrimaryTemplate(t)).length, [templates]);
  const libraryCount = useMemo(
    () => new Set(templates.filter((t) => t.isDefaultForProduct).map((template) => productKey(template.product))).size,
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return templates
      .filter((t) => showLegacy || isPrimaryTemplate(t))
      .filter((t) => productFilter === ALL_PRODUCTS || t.product === productFilter)
      .filter((t) => !q || t.name.toLocaleLowerCase("tr-TR").includes(q))
      .sort((a, b) => {
        const pa = STUDIO_PRODUCTS.findIndex((p) => p.key === a.product);
        const pb = STUDIO_PRODUCTS.findIndex((p) => p.key === b.product);
        if (pa !== pb) return pa - pb;
        if (a.isDefaultForProduct !== b.isDefaultForProduct) return a.isDefaultForProduct ? -1 : 1;
        return a.name.localeCompare(b.name, "tr");
      });
  }, [templates, productFilter, showLegacy, query]);

  function seedLibrary() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await createStarterTemplateLibrary();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(`${result.created ?? 0} başlangıç şablonu eklendi; ${result.skipped ?? 0} mevcut şablon korundu.`);
      router.refresh();
    });
  }

  function cloneTemplate(id: string) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await cloneProposalTemplate(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Şablon kopyalandı. Aşağıdaki listeden açıp içeriğini özelleştirebilirsin.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="relative overflow-hidden bg-[#0d1b3a] px-6 py-7 text-white">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(circle at 80% 20%, #60a5fa, transparent 28%), radial-gradient(circle at 18% 100%, #7c3aed, transparent 35%)",
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-blue-200">
                <Sparkles className="h-4 w-4" /> Respongo Teklif Stüdyosu
              </div>
              <h2 className="font-display text-2xl font-bold">Her ürün için tek, çift dilli bir teklif şablonu</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                6 ana şablon: 5 ürün ve Respongo ekosistemi için — her biri Türkçe ile İngilizceyi AYNI satırda taşır.
                Listeden bir şablon aç — bölümler solda, iki dil orta sütunda yan yana, tam önizleme sağda.
              </p>
            </div>
            <div className="min-w-[150px] rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-bold">{libraryCount}/{STUDIO_PRODUCTS.length}</div>
              <div className="mt-0.5 text-xs text-blue-100">ana şablon hazır</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="text-sm text-rg-ink-soft">Hukuki şartlar, onaylanmış TR ve Global metinler girilene kadar eksik durumunda kalır.</p>
          {isFounder && (
            <button
              type="button"
              disabled={isPending}
              onClick={seedLibrary}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <FilePlus2 className="h-4 w-4" />
              {isPending ? "Hazırlanıyor…" : "12 başlangıç şablonunu oluştur"}
            </button>
          )}
        </div>
      </section>

      {(notice || error) && (
        <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-destructive" : "text-golms"}`}>
          {error || (
            <>
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              {notice}
            </>
          )}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rg-line p-5">
          <div>
            <h2 className="font-display text-lg font-bold text-rg-ink">Şablon kütüphanesi</h2>
            <p className="mt-1 text-sm text-rg-ink-soft">Düzenlemek istediğin şablonu aç — bölümler ve tam önizleme tek ekranda.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rg-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Şablon ara"
                className="w-44 rounded-lg border border-rg-line bg-rg-bg py-1.5 pl-8 pr-2.5 text-[12.5px] text-rg-ink outline-none focus:border-primary"
              />
            </div>
            {legacyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowLegacy((v) => !v)}
                title="Eski, dil başına ayrı satır düzeninden kalan ve artık kullanılmayan yedek şablonlar — geçmiş teklifler hâlâ bunlara bağlı olabileceği için silinmedi."
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                  showLegacy ? "bg-rg-ink text-white" : "bg-rg-surface-alt text-rg-ink-soft hover:bg-rg-line"
                }`}
              >
                {showLegacy ? `Yedekleri gizle` : `${legacyCount} yedeği göster`}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-rg-line px-5 py-3">
          <button
            type="button"
            onClick={() => setProductFilter(ALL_PRODUCTS)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
              productFilter === ALL_PRODUCTS ? "bg-rg-ink text-white" : "bg-rg-surface-alt text-rg-ink-soft hover:bg-rg-line"
            }`}
          >
            Tüm ürünler
          </button>
          {STUDIO_PRODUCTS.map((entry) => (
            <button
              key={productKey(entry.key)}
              type="button"
              onClick={() => setProductFilter(entry.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                productFilter === entry.key ? "bg-rg-ink text-white" : "bg-rg-surface-alt text-rg-ink-soft hover:bg-rg-line"
              }`}
            >
              {entry.key ? entry.label : "Genel"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Layers3 className="mx-auto h-6 w-6 text-rg-ink-faint" />
            <p className="mt-3 text-sm font-semibold text-rg-ink">Bu filtreye uyan şablon yok.</p>
            <p className="mt-1 text-sm text-rg-ink-soft">Filtreleri temizle ya da başlangıç kütüphanesini oluştur.</p>
          </div>
        ) : (
          <ul className="divide-y divide-rg-line">
            {filtered.map((template) => {
              const productMeta = STUDIO_PRODUCTS.find((p) => p.key === template.product) ?? STUDIO_PRODUCTS[5];
              const completedCount = template.sections.filter((s) => isSectionComplete(s)).length;
              const totalCount = Math.max(1, template.sections.length);
              return (
                <li key={template.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-rg-surface-alt/60">
                  <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-rg-line bg-rg-bg">
                    {template.product && PRODUCT_LOGO[template.product] ? (
                      <Logo product={template.product} alt={productMeta.label} className="h-4 w-auto" />
                    ) : (
                      <span className="text-[10px] font-bold tracking-[.1em] text-rg-ink">RESPONGO</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-rg-ink">{template.name}</p>
                      {template.isDefaultForProduct ? (
                        <span className="rounded-full bg-golms-tint px-2 py-0.5 text-[10px] font-bold text-golms">Varsayılan</span>
                      ) : template.clonedFromId ? (
                        <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10px] font-bold text-rg-ink-soft">Kopya</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Yedek · kullanımdan kalktı</span>
                      )}
                      <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10px] font-bold text-rg-ink-soft">TR + EN</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          template.isActive ? "bg-gofactory/10 text-gofactory" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {template.isActive ? "Yayında" : "Taslak"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-rg-ink-faint">{productMeta.trName}</p>
                  </div>
                  <div className="flex w-40 shrink-0 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rg-surface-alt">
                      <div
                        className={`h-full rounded-full ${completedCount === template.sections.length ? "bg-gofactory" : "bg-amber-400"}`}
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-rg-ink-soft">
                      {completedCount}/{template.sections.length}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isFounder && (
                      <button
                        type="button"
                        onClick={() => cloneTemplate(template.id)}
                        disabled={isPending}
                        title="Şablonu kopyala"
                        className="grid h-9 w-9 place-items-center rounded-lg border border-rg-line text-rg-ink-faint hover:border-primary hover:text-primary disabled:opacity-40"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/sales/proposal-templates/${template.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-white"
                    >
                      Düzenle <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

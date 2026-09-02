"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { Logo } from "@/components/ui/logo";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { createProposal, type ProductKey, type ProposalWizardInput } from "./actions";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL) as ProductKey[];

export type LeadOption = { id: string; company_name: string; region: Region | null; currency: string };
export type CustomerOption = { id: string; company_name: string; region: Region | null };
export type PriceListOption = {
  id: string;
  name: string;
  product: ProductKey;
  currency: string;
  items: { id: string; name: string; description: string | null; unit: string; unit_price: number }[];
};
export type TemplateOption = {
  id: string;
  name: string;
  product: ProductKey | null;
  language: "tr" | "en";
  description: string | null;
  valid_days: number;
  // Teklif Şablonları 2.0: bölüm bazlı (proposal_template_sections'ı olan) şablonlar TR+EN
  // içeriği tek satırda taşır — sihirbazın dil seçicisiyle filtrelenmez, her zaman gösterilir.
  isBilingual: boolean;
};

type LineItem = {
  key: string;
  priceListItemId: string | null;
  product: ProductKey;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

const STEPS = [
  { n: 1, label: "Hedef" },
  { n: 2, label: "Ürün & Kalemler" },
  { n: 3, label: "Fiyatlandırma" },
  { n: 4, label: "Şablon & Dil" },
  { n: 5, label: "Önizle & Gönder" },
] as const;

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProposalWizard({
  leads,
  customers,
  priceLists,
  templates,
  defaultCurrency,
}: {
  leads: LeadOption[];
  customers: CustomerOption[];
  priceLists: PriceListOption[];
  templates: TemplateOption[];
  defaultCurrency: string;
}) {
  const [step, setStep] = useState(1);
  const [targetType, setTargetType] = useState<"lead" | "customer">("customer");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [productFilter, setProductFilter] = useState<ProductKey | "all">("all");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [validUntil, setValidUntil] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customProduct, setCustomProduct] = useState<ProductKey>("golms");
  const [customPrice, setCustomPrice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const targetOptions = targetType === "lead" ? leads : customers;
  const selectedTarget = targetOptions.find((t) => t.id === targetId);

  function applyTarget(id: string) {
    setTargetId(id);
    const found = targetOptions.find((t) => t.id === id);
    if (found && !titleTouched) {
      setTitle(`${found.company_name} için Teklif`);
    }
    if (targetType === "lead") {
      const lead = leads.find((l) => l.id === id);
      if (lead) setCurrency(lead.currency);
    }
  }

  function addFromPriceList(pl: PriceListOption, item: PriceListOption["items"][number]) {
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        priceListItemId: item.id,
        product: pl.product,
        description: item.name,
        quantity: 1,
        unitPrice: item.unit_price,
        discountPercent: 0,
      },
    ]);
  }

  function addCustomItem() {
    if (!customDesc.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        priceListItemId: null,
        product: customProduct,
        description: customDesc.trim(),
        quantity: 1,
        unitPrice: Number(customPrice) || 0,
        discountPercent: 0,
      },
    ]);
    setCustomDesc("");
    setCustomPrice("");
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function applyBulkDiscount() {
    const pct = Number(bulkDiscount);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    setItems((prev) => prev.map((it) => ({ ...it, discountPercent: pct })));
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const grandTotal = items.reduce((s, it) => s + it.quantity * it.unitPrice * (1 - it.discountPercent / 100), 0);
    return { subtotal, discount: subtotal - grandTotal, grandTotal };
  }, [items]);

  const filteredTemplates = templates.filter(
    (t) =>
      (t.isBilingual || t.language === language) &&
      (productFilter === "all" || t.product === productFilter || t.product === null)
  );

  const visiblePriceLists =
    productFilter === "all" ? priceLists : priceLists.filter((pl) => pl.product === productFilter);

  const stepValid: Record<number, boolean> = {
    1: Boolean(targetId) && title.trim().length > 0,
    2: items.length > 0,
    3: true,
    4: true,
    5: true,
  };

  function goNext() {
    if (!stepValid[step]) return;
    setStep((s) => Math.min(5, s + 1));
  }
  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit(asDraft: boolean) {
    setError("");
    const input: ProposalWizardInput = {
      targetType,
      targetId,
      title: title.trim(),
      items: items.map((it) => ({
        priceListItemId: it.priceListItemId,
        product: it.product,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent,
      })),
      currency,
      validUntil,
      templateId,
      language,
      asDraft,
    };
    startTransition(async () => {
      const result = await createProposal(input);
      // Başarılıysa createProposal içeride redirect() çağırır — buraya
      // dönmez. Sadece hata durumunda normal dönüş olur.
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={() => s.n < step && setStep(s.n)}
              disabled={s.n > step}
              className={
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold transition-colors " +
                (s.n === step
                  ? "bg-primary text-white"
                  : s.n < step
                    ? "bg-gofactory-tint text-gofactory cursor-pointer"
                    : "bg-rg-surface-alt text-rg-ink-faint")
              }
            >
              {s.n < step ? <Check className="h-3.5 w-3.5" /> : s.n}
            </button>
            <span className={`hidden text-[11.5px] font-semibold sm:block ${s.n === step ? "text-rg-ink" : "text-rg-ink-faint"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-rg-line" />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-rg-line bg-rg-surface p-6 shadow-rg">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType("customer");
                  setTargetId("");
                }}
                className={
                  "rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors " +
                  (targetType === "customer" ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                }
              >
                Müşteri
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("lead");
                  setTargetId("");
                }}
                className={
                  "rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors " +
                  (targetType === "lead" ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                }
              >
                Müşteri Adayı (Lead)
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>{targetType === "lead" ? "Lead Seç *" : "Müşteri Seç *"}</label>
              <select value={targetId} onChange={(e) => applyTarget(e.target.value)} className={inputClass}>
                <option value="">Seç</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.company_name}
                    {t.region ? ` — ${REGION_LABELS_TR[t.region]}` : ""}
                  </option>
                ))}
              </select>
              {targetOptions.length === 0 && (
                <p className="text-[11.5px] text-rg-ink-faint">
                  {targetType === "lead" ? "Görebildiğin açık lead yok." : "Görebildiğin aktif müşteri yok."}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Teklif Başlığı *</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setProductFilter("all")}
                className={
                  "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors " +
                  (productFilter === "all" ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                }
              >
                Tümü
              </button>
              {PRODUCT_KEYS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProductFilter(p)}
                  className={
                    "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors " +
                    (productFilter === p ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                  }
                >
                  {PRODUCT_LABEL[p]}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {visiblePriceLists.map((pl) => (
                <div key={pl.id} className="overflow-hidden rounded-[10px] border border-rg-line">
                  <div className="flex items-center gap-2 border-b border-rg-line bg-rg-surface-alt px-3 py-2">
                    {PRODUCT_LOGO[pl.product] ? (
                      <Logo product={pl.product} alt={PRODUCT_LABEL[pl.product]} className="h-4 w-auto" />
                    ) : (
                      <span className="text-[11.5px] font-bold text-rg-ink">{PRODUCT_LABEL[pl.product]}</span>
                    )}
                    <span className="text-[11px] text-rg-ink-faint">{pl.name}</span>
                  </div>
                  <div className="flex flex-col">
                    {pl.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 border-t border-rg-line px-3 py-2 first:border-t-0"
                      >
                        <div>
                          <div className="text-[12px] font-semibold text-rg-ink">{item.name}</div>
                          <div className="text-[11px] text-rg-ink-faint">
                            {item.unit_price > 0 ? fmtMoney(item.unit_price, pl.currency) : "Teklife özel"} / {item.unit}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addFromPriceList(pl, item)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-primary text-white transition-colors hover:brightness-[1.08]"
                          title="Kalemi ekle"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {visiblePriceLists.length === 0 && (
                <p className="text-[11.5px] text-rg-ink-faint">Bu üründe fiyat listesi yok.</p>
              )}
            </div>

            <div className="rounded-[10px] border border-dashed border-rg-line p-3">
              <div className={`${labelClass} mb-2`}>Özel Kalem Ekle</div>
              <div className="grid grid-cols-4 gap-2">
                <input
                  placeholder="Açıklama"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className={`${inputClass} col-span-2`}
                />
                <select
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value as ProductKey)}
                  className={inputClass}
                >
                  {PRODUCT_KEYS.map((p) => (
                    <option key={p} value={p}>
                      {PRODUCT_LABEL[p]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Birim fiyat"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={addCustomItem}
                className="mt-2 inline-flex items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line"
              >
                <Plus className="h-3.5 w-3.5" />
                Ekle
              </button>
            </div>

            <div>
              <div className={`${labelClass} mb-2`}>Seçili Kalemler ({items.length})</div>
              {items.length === 0 ? (
                <p className="text-[11.5px] text-rg-ink-faint">Henüz kalem eklenmedi.</p>
              ) : (
                <div className="overflow-hidden rounded-[10px] border border-rg-line">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-rg-surface-alt text-left">
                        <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">Kalem</th>
                        <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">Adet</th>
                        <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">Birim Fiyat</th>
                        <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">İskonto %</th>
                        <th className="px-3 py-2 text-right text-[10.5px] font-bold uppercase text-rg-ink-faint">Toplam</th>
                        <th className="px-3 py-2">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.key} className="border-t border-rg-line">
                          <td className="px-3 py-2 text-[12px] font-semibold text-rg-ink">
                            {it.description}
                            <span className="ml-1.5 text-[10.5px] font-normal text-rg-ink-faint">
                              {PRODUCT_LABEL[it.product]}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) || 1 })}
                              className="w-16 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={it.unitPrice}
                              onChange={(e) => updateItem(it.key, { unitPrice: Number(e.target.value) || 0 })}
                              className="w-24 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={it.discountPercent}
                              onChange={(e) => updateItem(it.key, { discountPercent: Number(e.target.value) || 0 })}
                              className="w-16 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] font-semibold text-rg-ink">
                            {fmtMoney(it.quantity * it.unitPrice * (1 - it.discountPercent / 100), currency)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(it.key)}
                              className="text-destructive transition-colors hover:brightness-90"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Para Birimi</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Geçerlilik Tarihi</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Tüm Kalemlere İskonto Uygula</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="%"
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                  <button
                    type="button"
                    onClick={applyBulkDiscount}
                    className="shrink-0 rounded-[8px] bg-rg-surface-alt px-3 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-line"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[10px] border border-rg-line bg-rg-surface-alt p-4">
              <div className="flex items-center justify-between text-[12.5px] text-rg-ink-soft">
                <span>Ara Toplam</span>
                <span>{fmtMoney(totals.subtotal, currency)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[12.5px] text-rg-ink-soft">
                <span>Toplam İskonto</span>
                <span>-{fmtMoney(totals.discount, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-rg-line pt-2 text-[15px] font-bold text-rg-ink">
                <span>Genel Toplam</span>
                <span>{fmtMoney(totals.grandTotal, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={
                  "rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors " +
                  (language === "tr" ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                }
              >
                Türkçe
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={
                  "rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors " +
                  (language === "en" ? "bg-primary text-white" : "bg-rg-surface-alt text-rg-ink-soft")
                }
              >
                English
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTemplateId("")}
                className={
                  "rounded-[10px] border p-3.5 text-left transition-colors " +
                  (templateId === "" ? "border-primary bg-accent" : "border-rg-line bg-rg-surface hover:bg-rg-surface-alt")
                }
              >
                <div className="text-[12.5px] font-bold text-rg-ink">Şablonsuz devam et</div>
                <div className="mt-1 text-[11.5px] text-rg-ink-faint">
                  Teklif dokümanı standart şirket şablonuyla oluşturulur.
                </div>
              </button>
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={
                    "rounded-[10px] border p-3.5 text-left transition-colors " +
                    (templateId === t.id ? "border-primary bg-accent" : "border-rg-line bg-rg-surface hover:bg-rg-surface-alt")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-rg-ink">
                      {t.name}
                      {t.isBilingual && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-golms-tint px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-golms">
                          2.0
                        </span>
                      )}
                    </span>
                    <span className="text-[10.5px] font-semibold text-rg-ink-faint">{t.valid_days} gün</span>
                  </div>
                  {t.description && <div className="mt-1 text-[11.5px] text-rg-ink-faint">{t.description}</div>}
                </button>
              ))}
            </div>
            {filteredTemplates.length === 0 && (
              <p className="text-[11.5px] text-rg-ink-faint">
                Seçilen dilde bu ürüne özel şablon yok — şablonsuz devam edebilirsin.
              </p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-[12.5px]">
              <div>
                <div className={labelClass}>Hedef</div>
                <div className="mt-1 font-semibold text-rg-ink">{selectedTarget?.company_name ?? "—"}</div>
              </div>
              <div>
                <div className={labelClass}>Başlık</div>
                <div className="mt-1 font-semibold text-rg-ink">{title}</div>
              </div>
              <div>
                <div className={labelClass}>Şablon / Dil</div>
                <div className="mt-1 font-semibold text-rg-ink">
                  {templates.find((t) => t.id === templateId)?.name ?? "Şablonsuz"} · {language.toUpperCase()}
                </div>
              </div>
              <div>
                <div className={labelClass}>Geçerlilik</div>
                <div className="mt-1 font-semibold text-rg-ink">{validUntil || "Belirtilmedi"}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-rg-line">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-rg-surface-alt text-left">
                    <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">Kalem</th>
                    <th className="px-3 py-2 text-[10.5px] font-bold uppercase text-rg-ink-faint">Adet</th>
                    <th className="px-3 py-2 text-right text-[10.5px] font-bold uppercase text-rg-ink-faint">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.key} className="border-t border-rg-line">
                      <td className="px-3 py-2 text-[12px] text-rg-ink">{it.description}</td>
                      <td className="px-3 py-2 text-[12px] text-rg-ink-soft">{it.quantity}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-semibold text-rg-ink">
                        {fmtMoney(it.quantity * it.unitPrice * (1 - it.discountPercent / 100), currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-[10px] border border-rg-line bg-rg-surface-alt p-4 text-[15px] font-bold text-rg-ink">
              <span>Genel Toplam</span>
              <span>{fmtMoney(totals.grandTotal, currency)}</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-rg-line bg-rg-surface px-4 py-2.5 text-[12.8px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Taslak Olarak Kaydet
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Oluştur ve Gönder
              </button>
              {error && <span className="text-[12px] text-destructive">{error}</span>}
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-rg-line bg-rg-surface px-4 py-2.5 text-[12.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Geri
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!stepValid[step]}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            İleri
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

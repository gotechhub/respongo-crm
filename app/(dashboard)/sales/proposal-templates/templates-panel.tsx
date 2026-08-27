"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { Logo } from "@/components/ui/logo";
import {
  createProposalTemplate,
  createTemplateItem,
  deleteProposalTemplate,
  deleteTemplateItem,
  toggleTemplateActive,
  updateProposalTemplate,
  updateTemplateItem,
  type TemplateInput,
  type TemplateItemInput,
  type TemplateProduct,
} from "./actions";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCT_ORDER = ["golms", "golxp", "gocatalog", "gofactory", "gotools", "genel"];
const PRODUCT_KEYS = ["golms", "golxp", "gocatalog", "gofactory", "gotools"] as const;

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export type PriceListItemRef = { name: string; unit: string; unit_price: number } | null;

export type TemplateItem = {
  id: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  price_list_item_id: string | null;
  price_list_items: PriceListItemRef | PriceListItemRef[] | null;
};

export type ProposalTemplate = {
  id: string;
  name: string;
  product: TemplateProduct;
  language: "tr" | "en";
  description: string | null;
  valid_days: number;
  intro_text: string | null;
  terms_text: string | null;
  is_active: boolean;
  proposal_template_items: TemplateItem[];
};

export type PriceListForPicker = {
  id: string;
  name: string;
  product: string;
  currency: string;
  items: { id: string; name: string; description: string | null; unit: string; unit_price: number }[];
};

function itemRef(item: TemplateItem): PriceListItemRef {
  const v = item.price_list_items;
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

const EMPTY_TEMPLATE: TemplateInput = {
  name: "",
  product: "golms",
  language: "tr",
  description: "",
  validDays: 30,
  introText: "",
  termsText: "",
};

function TemplateFormFields({
  form,
  set,
}: {
  form: TemplateInput;
  set: <K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Şablon Adı *</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ürün</label>
        <select
          value={form.product ?? ""}
          onChange={(e) => set("product", (e.target.value || null) as TemplateProduct)}
          className={inputClass}
        >
          <option value="">Genel Ekosistem</option>
          {PRODUCT_KEYS.map((p) => (
            <option key={p} value={p}>
              {PRODUCT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Dil</label>
        <select
          value={form.language}
          onChange={(e) => set("language", e.target.value as "tr" | "en")}
          className={inputClass}
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Geçerlilik (gün)</label>
        <input
          type="number"
          min={1}
          value={form.validDays}
          onChange={(e) => set("validDays", Number(e.target.value) || 1)}
          className={inputClass}
        />
      </div>
      <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass}>Kısa Açıklama</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass}>Giriş Metni</label>
        <textarea
          value={form.introText}
          onChange={(e) => set("introText", e.target.value)}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass}>Koşullar Metni</label>
        <textarea
          value={form.termsText}
          onChange={(e) => set("termsText", e.target.value)}
          rows={3}
          className={`${inputClass} resize-y`}
        />
        <p className="text-[10.8px] text-rg-ink-faint">
          Metin içinde <code>{"{valid_days}"}</code> yazarsan, görüntülenirken geçerlilik gün sayısıyla değiştirilir.
        </p>
      </div>
    </div>
  );
}

function NewTemplateForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TemplateInput>(EMPTY_TEMPLATE);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await createProposalTemplate(form);
      if (result.ok) {
        setForm(EMPTY_TEMPLATE);
        setOpen(false);
        onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[1.08]"
      >
        <Plus className="h-3.5 w-3.5" />
        Yeni Şablon
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Yeni Şablon</div>
        <button onClick={() => setOpen(false)} className="text-rg-ink-faint hover:text-rg-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <TemplateFormFields form={form} set={set} />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Şablonu Oluştur
        </button>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </div>
  );
}

function TemplateItemRow({
  item,
  onSave,
  onRemove,
  disabled,
}: {
  item: TemplateItem;
  onSave: (patch: Partial<TemplateItemInput>) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [unitPrice, setUnitPrice] = useState(String(item.unit_price));
  const [discountPercent, setDiscountPercent] = useState(String(item.discount_percent));

  return (
    <tr className="border-t border-rg-line first:border-t-0">
      <td className="px-3 py-2 text-[12px] font-semibold text-rg-ink">
        {itemRef(item)?.name ?? item.description ?? "—"}
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          onBlur={() => onSave({ unitPrice: Number(unitPrice) || 0 })}
          disabled={disabled}
          className="w-24 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          max={100}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          onBlur={() => onSave({ discountPercent: Number(discountPercent) || 0 })}
          disabled={disabled}
          title="İskonto %"
          className="w-16 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-destructive transition-colors hover:brightness-90 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function ItemsEditor({
  template,
  priceLists,
  onChanged,
}: {
  template: ProposalTemplate;
  priceLists: PriceListForPicker[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const visiblePriceLists = template.product
    ? priceLists.filter((pl) => pl.product === template.product)
    : priceLists;

  function addFromPriceList(item: PriceListForPicker["items"][number]) {
    setError("");
    startTransition(async () => {
      const input: TemplateItemInput = {
        priceListItemId: item.id,
        description: item.name,
        quantity: 1,
        unitPrice: item.unit_price,
        discountPercent: 0,
      };
      const result = await createTemplateItem(template.id, input);
      if (result.ok) onChanged();
      else setError(result.error);
    });
  }

  function addCustomItem() {
    if (!customDesc.trim()) return;
    setError("");
    startTransition(async () => {
      const input: TemplateItemInput = {
        priceListItemId: null,
        description: customDesc.trim(),
        quantity: 1,
        unitPrice: Number(customPrice) || 0,
        discountPercent: 0,
      };
      const result = await createTemplateItem(template.id, input);
      if (result.ok) {
        setCustomDesc("");
        setCustomPrice("");
        onChanged();
      } else {
        setError(result.error);
      }
    });
  }

  function saveItem(item: TemplateItem, patch: Partial<TemplateItemInput>) {
    setError("");
    startTransition(async () => {
      const input: TemplateItemInput = {
        priceListItemId: item.price_list_item_id,
        description: item.description ?? "",
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent,
        ...patch,
      };
      const result = await updateTemplateItem(item.id, input);
      if (result.ok) onChanged();
      else setError(result.error);
    });
  }

  function removeItem(id: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteTemplateItem(id);
      if (result.ok) onChanged();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-rg-line pt-3">
      <div className={labelClass}>Kalemler</div>
      {template.proposal_template_items.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-rg-line">
          <table className="w-full border-collapse">
            <tbody>
              {template.proposal_template_items.map((item) => (
                <TemplateItemRow
                  key={item.id}
                  item={item}
                  disabled={isPending}
                  onSave={(patch) => saveItem(item, patch)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visiblePriceLists.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visiblePriceLists.flatMap((pl) =>
            pl.items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isPending}
                onClick={() => addFromPriceList(item)}
                className="inline-flex items-center gap-1 rounded-full bg-rg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-line disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                {item.name}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          placeholder="Özel kalem açıklaması"
          value={customDesc}
          onChange={(e) => setCustomDesc(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <input
          type="number"
          placeholder="Fiyat"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          className={`${inputClass} w-24`}
        />
        <button
          type="button"
          onClick={addCustomItem}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-2 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Ekle
        </button>
      </div>
      {error && <span className="text-[12px] text-destructive">{error}</span>}
    </div>
  );
}

function TemplateCard({
  template,
  priceLists,
  isFounder,
}: {
  template: ProposalTemplate;
  priceLists: PriceListForPicker[];
  isFounder: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TemplateInput>({
    name: template.name,
    product: template.product,
    language: template.language,
    description: template.description ?? "",
    validDays: template.valid_days,
    introText: template.intro_text ?? "",
    termsText: template.terms_text ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function refresh() {
    router.refresh();
  }

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateProposalTemplate(template.id, form);
      if (result.ok) {
        setEditing(false);
        refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleToggleActive() {
    setError("");
    startTransition(async () => {
      const result = await toggleTemplateActive(template.id, !template.is_active);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm(`"${template.name}" şablonunu kalıcı olarak silmek istediğine emin misin?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteProposalTemplate(template.id);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="flex items-center justify-between border-b border-rg-line bg-rg-surface-alt px-4 py-3">
        <div>
          <span
            className={
              "mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase " +
              (template.language === "tr" ? "bg-golms-tint text-golms" : "bg-golxp-tint text-golxp")
            }
          >
            {template.language}
          </span>
          <span className="font-display text-[12.8px] font-bold text-rg-ink">{template.name}</span>
          {!template.is_active && (
            <span className="ml-2 inline-flex items-center rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10.5px] font-bold text-rg-ink-faint">
              Pasif
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-rg-ink-faint">{template.valid_days} gün geçerli</span>
          {isFounder && (
            <>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isPending}
                title={template.is_active ? "Pasif yap" : "Aktif yap"}
                className="flex h-7 w-7 items-center justify-center rounded-[7px] text-rg-ink-faint transition-colors hover:bg-rg-line disabled:opacity-50"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                title={editing ? "Vazgeç" : "Düzenle"}
                className="flex h-7 w-7 items-center justify-center rounded-[7px] text-rg-ink-faint transition-colors hover:bg-rg-line"
              >
                {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                title="Sil"
                className="flex h-7 w-7 items-center justify-center rounded-[7px] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3.5">
        {editing ? (
          <>
            <TemplateFormFields form={form} set={set} />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </>
        ) : (
          <>
            {template.description && <p className="text-[11.5px] italic text-rg-ink-faint">{template.description}</p>}
            {template.intro_text && (
              <p className="text-[12.5px] leading-relaxed text-rg-ink-soft">{template.intro_text}</p>
            )}
            {template.proposal_template_items.length > 0 && (
              <table className="w-full border-collapse">
                <tbody>
                  {template.proposal_template_items.map((item) => {
                    const ref = itemRef(item);
                    return (
                      <tr key={item.id} className="border-t border-rg-line">
                        <td className="py-1.5 pr-2 text-[11.8px] font-semibold text-rg-ink">
                          {ref?.name ?? item.description ?? "—"}
                        </td>
                        <td className="py-1.5 text-right text-[11px] text-rg-ink-faint">
                          {item.unit_price > 0 ? `${item.unit_price.toLocaleString("tr-TR")}` : "Teklife özel"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {template.terms_text && (
              <p className="border-t border-rg-line pt-2.5 text-[10.8px] leading-relaxed text-rg-ink-faint">
                {template.terms_text.replace("{valid_days}", String(template.valid_days))}
              </p>
            )}
          </>
        )}

        {isFounder && editing && <ItemsEditor template={template} priceLists={priceLists} onChanged={refresh} />}
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </div>
  );
}

export function TemplatesPanel({
  templates,
  priceLists,
  isFounder,
}: {
  templates: ProposalTemplate[];
  priceLists: PriceListForPicker[];
  isFounder: boolean;
}) {
  const router = useRouter();

  const grouped: Record<string, ProposalTemplate[]> = {};
  templates.forEach((t) => {
    const key = t.product ?? "genel";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  Object.values(grouped).forEach((list) => list.sort((a, b) => a.language.localeCompare(b.language)));

  return (
    <div className="flex flex-col gap-8">
      {isFounder && <NewTemplateForm onCreated={() => router.refresh()} />}

      {templates.length === 0 && (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
          Henüz teklif şablonu yok.
        </div>
      )}
      {PRODUCT_ORDER.filter((key) => grouped[key]?.length).map((key) => (
        <div key={key} className="flex flex-col gap-3">
          {key !== "genel" && PRODUCT_LOGO[key] ? (
            <Logo product={key as keyof typeof PRODUCT_LOGO} alt={PRODUCT_LABEL[key]} className="h-6 w-auto" />
          ) : (
            <h2 className="font-display text-[13.5px] font-bold text-rg-ink">Genel Ekosistem</h2>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {grouped[key].map((t) => (
              <TemplateCard key={t.id} template={t} priceLists={priceLists} isFounder={isFounder} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

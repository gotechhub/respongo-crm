"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import {
  addProposalItem,
  deleteProposalItem,
  submitProposal,
  updateProposalItem,
  type ProductKey,
  type ProposalItemInput,
} from "../actions";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL) as ProductKey[];

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export type EditableProposalItem = {
  id: string;
  product: ProductKey;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  price_list_item_id: string | null;
};

export type PriceListForEditor = {
  id: string;
  name: string;
  product: ProductKey;
  items: { id: string; name: string; description: string | null; unit: string; unit_price: number }[];
};

function ProposalItemRow({
  item,
  currency,
  onSave,
  onRemove,
  disabled,
}: {
  item: EditableProposalItem;
  currency: string;
  onSave: (patch: Partial<Pick<ProposalItemInput, "quantity" | "unitPrice" | "discountPercent">>) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState(String(item.unit_price));
  const [discountPercent, setDiscountPercent] = useState(String(item.discount_percent));

  return (
    <tr className="border-t border-rg-line first:border-t-0">
      <td className="px-3 py-2 text-[12px] font-semibold text-rg-ink">
        {item.description || "—"}
        <span className="ml-1.5 text-[10.5px] font-normal text-rg-ink-faint">{PRODUCT_LABEL[item.product]}</span>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => onSave({ quantity: Number(quantity) || 1 })}
          disabled={disabled}
          className="w-16 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[12px] text-rg-ink outline-none focus:border-primary disabled:opacity-50"
        />
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
      <td className="px-3 py-2 text-right text-[12.5px] font-semibold text-rg-ink">
        {item.line_total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {currency}
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

export function ProposalEditor({
  proposalId,
  currency,
  items,
  priceLists,
}: {
  proposalId: string;
  currency: string;
  items: EditableProposalItem[];
  priceLists: PriceListForEditor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customProduct, setCustomProduct] = useState<ProductKey>("golms");

  function refresh() {
    router.refresh();
  }

  function addFromPriceList(product: ProductKey, item: PriceListForEditor["items"][number]) {
    setError("");
    startTransition(async () => {
      const input: ProposalItemInput = {
        priceListItemId: item.id,
        product,
        description: item.name,
        quantity: 1,
        unitPrice: item.unit_price,
        discountPercent: 0,
      };
      const result = await addProposalItem(proposalId, input);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  function addCustomItem() {
    if (!customDesc.trim()) return;
    setError("");
    startTransition(async () => {
      const input: ProposalItemInput = {
        priceListItemId: null,
        product: customProduct,
        description: customDesc.trim(),
        quantity: 1,
        unitPrice: Number(customPrice) || 0,
        discountPercent: 0,
      };
      const result = await addProposalItem(proposalId, input);
      if (result.ok) {
        setCustomDesc("");
        setCustomPrice("");
        refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function saveItem(itemId: string, patch: Partial<Pick<ProposalItemInput, "quantity" | "unitPrice" | "discountPercent">>) {
    setError("");
    startTransition(async () => {
      const result = await updateProposalItem(itemId, proposalId, patch);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  function removeItem(itemId: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteProposalItem(itemId, proposalId);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await submitProposal(proposalId);
      if (result.ok) refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Kalemleri Düzenle</div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || items.length === 0}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <Send className="h-3.5 w-3.5" />
          Teklifi Gönder
        </button>
      </div>

      {items.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-rg-line">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Kalem</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Adet</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Fiyat</th>
                <th className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">İsk.%</th>
                <th className="px-3 py-2 text-right text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Toplam
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ProposalItemRow
                  key={item.id}
                  item={item}
                  currency={currency}
                  disabled={isPending}
                  onSave={(patch) => saveItem(item.id, patch)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {priceLists.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {priceLists.flatMap((pl) =>
            pl.items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isPending}
                onClick={() => addFromPriceList(pl.product, item)}
                className="inline-flex items-center gap-1 rounded-full bg-rg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-line disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                {item.name}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
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

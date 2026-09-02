"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createCustomerRequest, type ProductKey } from "../actions";
import { REQUEST_TYPE_LABEL, type CustomerRequestType } from "@/lib/customer-request-labels";

const REQUEST_TYPES = Object.keys(REQUEST_TYPE_LABEL) as CustomerRequestType[];
const PRODUCTS: ProductKey[] = ["golms", "golxp", "gocatalog", "gofactory", "gotools"];
const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export type LicenseOption = { id: string; product: ProductKey; license_name: string | null };

export function NewRequestForm({ licenses }: { licenses: LicenseOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [requestType, setRequestType] = useState<CustomerRequestType>("purchase");
  const [product, setProduct] = useState<ProductKey | "">("");
  const [relatedLicenseId, setRelatedLicenseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const needsProduct = requestType === "purchase" || requestType === "new_product";
  const needsLicense = requestType === "renewal";

  function reset() {
    setRequestType("purchase");
    setProduct("");
    setRelatedLicenseId("");
    setTitle("");
    setDescription("");
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError("Kısa bir başlık yazman gerekiyor.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createCustomerRequest({
        requestType,
        product: product || null,
        relatedLicenseId: relatedLicenseId || null,
        title,
        description,
      });
      if (result.ok) {
        reset();
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-5 inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
      >
        <Plus className="h-3.5 w-3.5" />
        Yeni Talep Oluştur
      </button>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Yeni Talep</div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-[6px] text-rg-ink-faint hover:bg-rg-surface-alt"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
            Talep Türü
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REQUEST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRequestType(t)}
                className={
                  "rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors " +
                  (requestType === t
                    ? "bg-primary text-white"
                    : "border border-rg-line bg-rg-surface text-rg-ink-soft hover:bg-rg-surface-alt")
                }
              >
                {REQUEST_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {needsProduct && (
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Ürün
            </label>
            <select value={product} onChange={(e) => setProduct(e.target.value as ProductKey)} className={inputClass}>
              <option value="">Seçiniz</option>
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>
                  {PRODUCT_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsLicense && (
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
              Hangi Lisans?
            </label>
            <select value={relatedLicenseId} onChange={(e) => setRelatedLicenseId(e.target.value)} className={inputClass}>
              <option value="">Seçiniz</option>
              {licenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {PRODUCT_LABEL[l.product]}
                  {l.license_name ? ` — ${l.license_name}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
            Başlık
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ör. GOLXP için 50 ek kullanıcı lisansı"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
            Detay (opsiyonel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="İhtiyacınla ilgili eklemek istediğin detaylar..."
            className={`${inputClass} resize-y`}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-gofactory px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Talebi Gönder
        </button>

        {error && <p className="text-[12px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}

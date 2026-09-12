"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { PRODUCT_LOGO } from "@/lib/product-logos";
import { Logo } from "@/components/ui/logo";
import {
  createPriceList,
  createPriceListItem,
  deletePriceList,
  deletePriceListItem,
  togglePriceListActive,
  updatePriceList,
  updatePriceListItem,
  type PriceListInput,
  type PriceListItemInput,
} from "./actions";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCTS = ["golms", "golxp", "gocatalog", "gofactory", "gotools"] as const;

const REGION_LABEL: Record<string, string> = {
  tr: "Türkiye",
  global: "Global",
};

export type PriceListItemRow = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number;
};

export type PriceListRow = {
  id: string;
  name: string;
  product: string;
  currency: string;
  region: "tr" | "global" | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  price_list_items: PriceListItemRow[];
};

const EMPTY_LIST_FORM: PriceListInput = {
  name: "",
  product: "golms",
  currency: "USD",
  region: "",
  isActive: true,
  validFrom: "",
  validUntil: "",
};

const EMPTY_ITEM_FORM: PriceListItemInput = {
  name: "",
  description: "",
  unit: "adet",
  unitPrice: 0,
};

function RegionBadge({ region }: { region: "tr" | "global" | null }) {
  if (!region) {
    return (
      <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
        Ortak (TR + Global)
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.3px] ${
        region === "tr" ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600"
      }`}
    >
      {REGION_LABEL[region]}
    </span>
  );
}

function fieldClass() {
  return "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
}

function ListForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isPending,
  error,
  submitLabel,
  restrictToRegion,
}: {
  form: PriceListInput;
  setForm: (f: PriceListInput) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string;
  submitLabel: string;
  // region_admin sadece kendi bölgesinde liste oluşturabilir/düzenleyebilir
  // (RLS — 20260911000011 — zaten zorluyor); burada seçici kilitlenerek
  // kullanıcı hiç reddedilecek bir seçenek görmüyor.
  restrictToRegion: "tr" | "global" | null;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg sm:grid-cols-3"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Liste Adı *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={fieldClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Ürün *</label>
        <select
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value as PriceListInput["product"] })}
          className={fieldClass()}
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {PRODUCT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Para Birimi *</label>
        <input
          required
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
          placeholder="USD / TRY / EUR"
          className={fieldClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Bölge</label>
        <select
          value={form.region}
          disabled={Boolean(restrictToRegion)}
          onChange={(e) => setForm({ ...form, region: e.target.value as PriceListInput["region"] })}
          className={`${fieldClass()} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {restrictToRegion ? (
            <option value={restrictToRegion}>{restrictToRegion === "tr" ? "Türkiye" : "Global"}</option>
          ) : (
            <>
              <option value="">Ortak (TR + Global)</option>
              <option value="tr">Sadece Türkiye</option>
              <option value="global">Sadece Global</option>
            </>
          )}
        </select>
        {restrictToRegion && (
          <span className="text-[10.5px] text-rg-ink-faint">Bölge yöneticisi olarak sadece kendi bölgende liste yönetebilirsin.</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Geçerlilik Başlangıcı</label>
        <input
          type="date"
          value={form.validFrom}
          onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
          className={fieldClass()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">Geçerlilik Bitişi</label>
        <input
          type="date"
          value={form.validUntil}
          onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          className={fieldClass()}
        />
      </div>
      <label className="col-span-2 flex items-center gap-2 text-[12.5px] text-rg-ink sm:col-span-3">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-rg-line accent-primary"
        />
        Aktif (kullanıcılara gösterilsin)
      </label>
      <div className="col-span-2 flex items-center gap-3 pt-1 sm:col-span-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-rg-line px-3.5 py-2.5 text-[12.5px] font-semibold text-rg-ink-faint transition-colors hover:bg-rg-surface-alt"
        >
          <X className="h-3.5 w-3.5" />
          Vazgeç
        </button>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </form>
  );
}

export function PriceListsPanel({
  priceLists,
  canManage,
  restrictToRegion = null,
}: {
  priceLists: PriceListRow[];
  canManage: boolean;
  // founder için null (kısıtsız); region_admin için kendi bölgesi — hem yeni
  // liste formunun varsayılanını hem de hangi kartların düzenlenebilir
  // göründüğünü belirler (bkz. canManageList).
  restrictToRegion?: "tr" | "global" | null;
}) {
  const [isPending, startTransition] = useTransition();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<PriceListInput>({ ...EMPTY_LIST_FORM, region: restrictToRegion ?? "" });
  const [newError, setNewError] = useState("");

  // region_admin ortak (region IS NULL) listeleri GÖREBİLİR (RLS —
  // price_lists_region_admin_view_shared) ama DÜZENLEYEMEZ — sadece kendi
  // bölgesindeki listeleri yönetebilir. Founder için her zaman true.
  function canManageList(list: PriceListRow) {
    return canManage && (!restrictToRegion || list.region === restrictToRegion);
  }

  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PriceListInput>(EMPTY_LIST_FORM);
  const [editError, setEditError] = useState("");

  const [addItemListId, setAddItemListId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<PriceListItemInput>(EMPTY_ITEM_FORM);
  const [itemError, setItemError] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState<PriceListItemInput>(EMPTY_ITEM_FORM);
  const [editItemError, setEditItemError] = useState("");

  function startEditList(list: PriceListRow) {
    setEditingListId(list.id);
    setEditError("");
    setEditForm({
      name: list.name,
      product: list.product as PriceListInput["product"],
      currency: list.currency,
      region: list.region ?? "",
      isActive: list.is_active,
      validFrom: list.valid_from ?? "",
      validUntil: list.valid_until ?? "",
    });
  }

  function handleCreateList(e: FormEvent) {
    e.preventDefault();
    setNewError("");
    startTransition(async () => {
      const result = await createPriceList(newForm);
      if (result.ok) {
        setNewForm(EMPTY_LIST_FORM);
        setShowNewForm(false);
      } else {
        setNewError(result.error);
      }
    });
  }

  function handleUpdateList(e: FormEvent) {
    e.preventDefault();
    if (!editingListId) return;
    setEditError("");
    startTransition(async () => {
      const result = await updatePriceList(editingListId, editForm);
      if (result.ok) {
        setEditingListId(null);
      } else {
        setEditError(result.error);
      }
    });
  }

  function handleDeleteList(list: PriceListRow) {
    if (!window.confirm(`"${list.name}" fiyat listesini ve içindeki ${list.price_list_items.length} kalemi kalıcı olarak silmek istediğine emin misin?`)) {
      return;
    }
    startTransition(async () => {
      await deletePriceList(list.id);
    });
  }

  function handleToggleActive(list: PriceListRow) {
    startTransition(async () => {
      await togglePriceListActive(list.id, !list.is_active);
    });
  }

  function handleAddItem(e: FormEvent, listId: string) {
    e.preventDefault();
    setItemError("");
    startTransition(async () => {
      const result = await createPriceListItem(listId, itemForm);
      if (result.ok) {
        setItemForm(EMPTY_ITEM_FORM);
        setAddItemListId(null);
      } else {
        setItemError(result.error);
      }
    });
  }

  function startEditItem(item: PriceListItemRow) {
    setEditingItemId(item.id);
    setEditItemError("");
    setEditItemForm({
      name: item.name,
      description: item.description ?? "",
      unit: item.unit,
      unitPrice: item.unit_price,
    });
  }

  function handleUpdateItem(e: FormEvent) {
    e.preventDefault();
    if (!editingItemId) return;
    setEditItemError("");
    startTransition(async () => {
      const result = await updatePriceListItem(editingItemId, editItemForm);
      if (result.ok) {
        setEditingItemId(null);
      } else {
        setEditItemError(result.error);
      }
    });
  }

  function handleDeleteItem(item: PriceListItemRow) {
    if (!window.confirm(`"${item.name}" kalemini silmek istediğine emin misin?`)) return;
    startTransition(async () => {
      await deletePriceListItem(item.id);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowNewForm((v) => !v);
              setNewError("");
            }}
            className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
          >
            {showNewForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showNewForm ? "Vazgeç" : "Yeni Fiyat Listesi Ekle"}
          </button>
        </div>
      )}

      {canManage && showNewForm && (
        <ListForm
          form={newForm}
          setForm={setNewForm}
          onSubmit={handleCreateList}
          onCancel={() => setShowNewForm(false)}
          isPending={isPending}
          error={newError}
          submitLabel="Listeyi Oluştur"
          restrictToRegion={restrictToRegion}
        />
      )}

      {priceLists.length === 0 && (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[11.5px] text-rg-ink-faint">
          Aramanla eşleşen ürün, kalem veya bölge yok.
        </div>
      )}

      {priceLists.map((list) => (
        <div
          key={list.id}
          className={`overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg ${!list.is_active ? "opacity-60" : ""}`}
        >
          {editingListId === list.id ? (
            <div className="border-b border-rg-line bg-rg-surface-alt p-4">
              <ListForm
                form={editForm}
                setForm={setEditForm}
                onSubmit={handleUpdateList}
                onCancel={() => setEditingListId(null)}
                isPending={isPending}
                error={editError}
                submitLabel="Kaydet"
                restrictToRegion={restrictToRegion}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rg-line bg-rg-surface-alt px-4 py-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {PRODUCT_LOGO[list.product] ? (
                  <Logo product={list.product as keyof typeof PRODUCT_LOGO} alt={PRODUCT_LABEL[list.product]} className="h-5 w-auto" />
                ) : (
                  <span className="font-display text-[13px] font-bold text-rg-ink">
                    {PRODUCT_LABEL[list.product] ?? list.product}
                  </span>
                )}
                <span className="text-[11.5px] text-rg-ink-faint">{list.name}</span>
                <RegionBadge region={list.region} />
                {!list.is_active && (
                  <span className="rounded-full bg-rg-ink-faint/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                    Pasif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-rg-ink-faint">{list.currency}</span>
                {canManageList(list) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(list)}
                      title={list.is_active ? "Pasifleştir" : "Aktifleştir"}
                      className="rounded-[7px] p-1.5 text-rg-ink-faint transition-colors hover:bg-rg-surface hover:text-rg-ink"
                    >
                      <Check className={`h-3.5 w-3.5 ${list.is_active ? "text-emerald-600" : ""}`} />
                    </button>
                    <button
                      onClick={() => startEditList(list)}
                      title="Listeyi düzenle"
                      className="rounded-[7px] p-1.5 text-rg-ink-faint transition-colors hover:bg-rg-surface hover:text-rg-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list)}
                      title="Listeyi sil"
                      className="rounded-[7px] p-1.5 text-rg-ink-faint transition-colors hover:bg-rg-surface hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">Kalem</th>
                <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">Açıklama</th>
                <th className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">Birim</th>
                <th className="px-4 py-2 text-right text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                  Birim Fiyat
                </th>
                {canManageList(list) && <th className="w-[70px] px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {(list.price_list_items ?? []).map((item) =>
                editingItemId === item.id ? (
                  <tr key={item.id} className="border-t border-rg-line bg-rg-surface-alt">
                    <td colSpan={canManageList(list) ? 5 : 4} className="px-4 py-3">
                      <form onSubmit={handleUpdateItem} className="flex flex-wrap items-end gap-2">
                        <input
                          required
                          value={editItemForm.name}
                          onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                          placeholder="Kalem adı"
                          className={`${fieldClass()} min-w-[160px] flex-1`}
                        />
                        <input
                          value={editItemForm.description}
                          onChange={(e) => setEditItemForm({ ...editItemForm, description: e.target.value })}
                          placeholder="Açıklama"
                          className={`${fieldClass()} min-w-[180px] flex-1`}
                        />
                        <input
                          required
                          value={editItemForm.unit}
                          onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })}
                          placeholder="Birim"
                          className={`${fieldClass()} w-[110px]`}
                        />
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          value={editItemForm.unitPrice}
                          onChange={(e) => setEditItemForm({ ...editItemForm, unitPrice: Number(e.target.value) })}
                          placeholder="Birim fiyat"
                          className={`${fieldClass()} w-[130px]`}
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
                        >
                          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-rg-line px-3 py-2 text-[12px] font-semibold text-rg-ink-faint transition-colors hover:bg-rg-surface"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {editItemError && <span className="text-[11.5px] text-destructive">{editItemError}</span>}
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-t border-rg-line">
                    <td className="px-4 py-2.5 text-[12.5px] font-semibold text-rg-ink">{item.name}</td>
                    <td className="px-4 py-2.5 text-[11.5px] text-rg-ink-faint">{item.description || "—"}</td>
                    <td className="px-4 py-2.5 text-[12px] text-rg-ink-soft">{item.unit}</td>
                    <td className="px-4 py-2.5 text-right text-[12.5px] font-semibold text-rg-ink">
                      {item.unit_price > 0 ? `${item.unit_price.toLocaleString("tr-TR")} ${list.currency}` : "Teklife özel"}
                    </td>
                    {canManageList(list) && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEditItem(item)}
                            title="Düzenle"
                            className="rounded-[7px] p-1.5 text-rg-ink-faint transition-colors hover:bg-rg-surface-alt hover:text-rg-ink"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="Sil"
                            className="rounded-[7px] p-1.5 text-rg-ink-faint transition-colors hover:bg-rg-surface-alt hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )}
              {canManageList(list) && addItemListId === list.id && (
                <tr className="border-t border-rg-line bg-rg-surface-alt">
                  <td colSpan={5} className="px-4 py-3">
                    <form onSubmit={(e) => handleAddItem(e, list.id)} className="flex flex-wrap items-end gap-2">
                      <input
                        required
                        autoFocus
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        placeholder="Kalem adı"
                        className={`${fieldClass()} min-w-[160px] flex-1`}
                      />
                      <input
                        value={itemForm.description}
                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                        placeholder="Açıklama"
                        className={`${fieldClass()} min-w-[180px] flex-1`}
                      />
                      <input
                        required
                        value={itemForm.unit}
                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                        placeholder="Birim"
                        className={`${fieldClass()} w-[110px]`}
                      />
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.unitPrice}
                        onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                        placeholder="Birim fiyat"
                        className={`${fieldClass()} w-[130px]`}
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
                      >
                        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddItemListId(null)}
                        className="inline-flex items-center gap-1 rounded-[8px] border border-rg-line px-3 py-2 text-[12px] font-semibold text-rg-ink-faint transition-colors hover:bg-rg-surface"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {itemError && <span className="text-[11.5px] text-destructive">{itemError}</span>}
                    </form>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {canManageList(list) && addItemListId !== list.id && (
            <div className="border-t border-rg-line px-4 py-2.5">
              <button
                onClick={() => {
                  setAddItemListId(list.id);
                  setItemForm(EMPTY_ITEM_FORM);
                  setItemError("");
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Kalem Ekle
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

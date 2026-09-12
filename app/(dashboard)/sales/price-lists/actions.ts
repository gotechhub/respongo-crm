"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const PRODUCTS = ["golms", "golxp", "gocatalog", "gofactory", "gotools"] as const;
const REGIONS = ["tr", "global"] as const;

export type PriceListInput = {
  name: string;
  product: (typeof PRODUCTS)[number];
  currency: string;
  region: "" | (typeof REGIONS)[number]; // "" = ortak (her iki bölge)
  isActive: boolean;
  validFrom: string; // "" veya "YYYY-MM-DD"
  validUntil: string;
};

export type PriceListItemInput = {
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
};

function validatePriceListInput(input: PriceListInput): string | null {
  if (!input.name.trim()) return "Liste adı zorunlu.";
  if (!PRODUCTS.includes(input.product)) return "Geçersiz ürün.";
  if (!input.currency.trim()) return "Para birimi zorunlu.";
  if (input.region && !REGIONS.includes(input.region)) return "Geçersiz bölge.";
  return null;
}

// price_lists — ekle/güncelle/sil. RLS (price_lists_founder_manage) yalnızca
// founder'a izin veriyor; count/error kontrolü yetkisiz çağrıyı reddeder.
export async function createPriceList(input: PriceListInput): Promise<ActionResult & { id?: string }> {
  const validationError = validatePriceListInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("price_lists")
    .insert({
      name: input.name.trim(),
      product: input.product,
      currency: input.currency.trim().toUpperCase(),
      region: input.region || null,
      is_active: input.isActive,
      valid_from: input.validFrom || null,
      valid_until: input.validUntil || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/sales/price-lists");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePriceList(id: string, input: PriceListInput): Promise<ActionResult> {
  const validationError = validatePriceListInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createClient();
  const { error, count } = await supabase
    .from("price_lists")
    .update(
      {
        name: input.name.trim(),
        product: input.product,
        currency: input.currency.trim().toUpperCase(),
        region: input.region || null,
        is_active: input.isActive,
        valid_from: input.validFrom || null,
        valid_until: input.validUntil || null,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu fiyat listesini düzenleme yetkin yok." };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

export async function deletePriceList(id: string): Promise<ActionResult> {
  const supabase = createClient();
  // price_list_items -> price_list_id ON DELETE CASCADE, kalemler otomatik silinir.
  const { error, count } = await supabase.from("price_lists").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu fiyat listesini silme yetkin yok." };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

export async function togglePriceListActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("price_lists")
    .update({ is_active: isActive }, { count: "exact" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu fiyat listesini düzenleme yetkin yok." };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

// price_list_items — ekle/güncelle/sil.
function validateItemInput(input: PriceListItemInput): string | null {
  if (!input.name.trim()) return "Kalem adı zorunlu.";
  if (!input.unit.trim()) return "Birim zorunlu.";
  if (Number.isNaN(input.unitPrice) || input.unitPrice < 0) return "Geçerli bir birim fiyat gir.";
  return null;
}

export async function createPriceListItem(priceListId: string, input: PriceListItemInput): Promise<ActionResult> {
  const validationError = validateItemInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createClient();
  const { error } = await supabase.from("price_list_items").insert({
    price_list_id: priceListId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    unit: input.unit.trim(),
    unit_price: input.unitPrice,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

export async function updatePriceListItem(id: string, input: PriceListItemInput): Promise<ActionResult> {
  const validationError = validateItemInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createClient();
  const { error, count } = await supabase
    .from("price_list_items")
    .update(
      {
        name: input.name.trim(),
        description: input.description.trim() || null,
        unit: input.unit.trim(),
        unit_price: input.unitPrice,
      },
      { count: "exact" }
    )
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu kalemi düzenleme yetkin yok." };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

export async function deletePriceListItem(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("price_list_items").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu kalemi silme yetkin yok." };
  revalidatePath("/sales/price-lists");
  return { ok: true };
}

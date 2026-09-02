"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ResourceInput = {
  category: string;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  url: string;
  sortOrder: number;
};

// Kaynak ekle/güncelle/sil — RLS (resources_founder_all) sadece founder'a izin
// veriyor, count kontrolü yetkisiz bir çağrıyı sessizce reddeder.
export async function createResource(input: ResourceInput): Promise<ActionResult> {
  if (!input.titleTr.trim() || !input.titleEn.trim()) {
    return { ok: false, error: "TR ve EN başlık zorunlu." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("resources").insert({
    category: input.category || "general",
    title_tr: input.titleTr,
    title_en: input.titleEn,
    body_tr: input.bodyTr || null,
    body_en: input.bodyEn || null,
    url: input.url || null,
    sort_order: input.sortOrder,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/sales/resources");
  return { ok: true };
}

export async function deleteResource(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("resources").delete({ count: "exact" }).eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaynağı silme yetkin yok." };
  }
  revalidatePath("/sales/resources");
  return { ok: true };
}

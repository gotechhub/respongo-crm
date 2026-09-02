"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ReassignableKind = "lead" | "pool" | "customer";

const TABLE_BY_KIND: Record<ReassignableKind, string> = {
  lead: "leads",
  pool: "customer_pool",
  customer: "customers",
};

const LABEL_BY_KIND: Record<ReassignableKind, string> = {
  lead: "Lead",
  pool: "Havuz kaydı",
  customer: "Müşteri",
};

// Bir lead/havuz kaydı/müşteriyi başka bir satış ekibi üyesine devreder.
// RLS zaten founder (her kayıt) ve region_admin (kendi bölgesindeki kayıtlar) için
// UPDATE'e izin veriyor — burada AYRICA iş kuralı kontrolü yapıyoruz: yeni sahip
// gerçekten satış ekibinde (sales_inhouse/region_admin) olmalı ve kaydın bölgesiyle
// aynı bölgede olmalı (bölgeler arası yanlışlıkla devir yapılmasını engellemek için).
export async function reassignOwner(
  kind: ReassignableKind,
  recordId: string,
  newOwnerId: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const callerRole = (callerProfile as { role: UserRole | null } | null)?.role;
  if (callerRole !== "founder" && callerRole !== "region_admin") {
    return { ok: false, error: "Devretme yetkin yok — sadece Süper Admin ve Bölge Yöneticileri devredebilir." };
  }

  const table = TABLE_BY_KIND[kind];

  const { data: record, error: recordError } = await supabase
    .from(table)
    .select("id, region")
    .eq("id", recordId)
    .single();
  if (recordError || !record) {
    return { ok: false, error: recordError?.message ?? `${LABEL_BY_KIND[kind]} bulunamadı.` };
  }

  const { data: newOwner, error: ownerError } = await supabase
    .from("profiles")
    .select("id, role, region, is_active")
    .eq("id", newOwnerId)
    .single();
  const owner = newOwner as { id: string; role: UserRole | null; region: Region | null; is_active: boolean } | null;
  if (ownerError || !owner) {
    return { ok: false, error: "Yeni sorumlu bulunamadı." };
  }
  if (owner.role !== "sales_inhouse" && owner.role !== "region_admin" && owner.role !== "founder") {
    return { ok: false, error: "Sadece satış ekibi üyelerine devredebilirsin." };
  }
  if (!owner.is_active) {
    return { ok: false, error: "Pasif bir kullanıcıya devredemezsin." };
  }
  const recordRegion = (record as { region: Region | null }).region;
  if (recordRegion && owner.region && owner.region !== recordRegion) {
    return { ok: false, error: "Kaydın bölgesiyle yeni sorumlunun bölgesi eşleşmiyor." };
  }

  const { error: updateError, count } = await supabase
    .from(table)
    .update({ owner_id: newOwnerId }, { count: "exact" })
    .eq("id", recordId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı devretme yetkin yok." };
  }

  revalidatePath("/sales/team");
  revalidatePath(`/sales/team/${newOwnerId}`);
  revalidatePath("/sales/leads");
  revalidatePath("/sales");
  revalidatePath("/sales/customers");
  return { ok: true };
}

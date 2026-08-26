"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type PoolEntryInput = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  country: string;
  notes: string;
  region: Region;
};

// Havuza yeni ham kayıt ekler (fuar, referans, inbound form vb.).
export async function createPoolEntry(input: PoolEntryInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error } = await supabase.from("customer_pool").insert({
    company_name: input.companyName,
    contact_name: input.contactName || null,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    source: input.source || null,
    country: input.country || null,
    notes: input.notes || null,
    region: input.region,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/sales");
  return { ok: true };
}

// Havuzdaki bir kaydı "Müşteri Adayı" (lead) haline getirir — havuz kaydı
// olduğu gibi kalır, leads tablosuna bağlantılı yeni bir satır açılır.
export async function convertPoolToLead(poolId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: pool, error: poolError } = await supabase
    .from("customer_pool")
    .select("id, company_name, contact_name, contact_email, contact_phone, region")
    .eq("id", poolId)
    .single();

  if (poolError || !pool) {
    return { ok: false, error: poolError?.message ?? "Havuz kaydı bulunamadı." };
  }

  const { error: insertError } = await supabase.from("leads").insert({
    customer_pool_id: pool.id,
    company_name: pool.company_name,
    contact_name: pool.contact_name,
    contact_email: pool.contact_email,
    contact_phone: pool.contact_phone,
    region: pool.region,
    owner_id: user.id,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/sales");
  revalidatePath("/sales/leads");
  return { ok: true };
}

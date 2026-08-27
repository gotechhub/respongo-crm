"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type CustomerInput = {
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  country: string;
  region: Region | "";
};

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.companyName.trim()) {
    return { ok: false, error: "Firma adı zorunlu." };
  }

  const { error, count } = await supabase
    .from("customers")
    .update(
      {
        company_name: input.companyName.trim(),
        primary_contact_name: input.primaryContactName || null,
        primary_contact_email: input.primaryContactEmail || null,
        primary_contact_phone: input.primaryContactPhone || null,
        country: input.country || null,
        region: input.region || null,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu müşteriyi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
  return { ok: true };
}

export async function toggleCustomerActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("customers")
    .update({ is_active: isActive }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu müşteriyi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
  return { ok: true };
}

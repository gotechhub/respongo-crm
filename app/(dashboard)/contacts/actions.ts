"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ContactInput = {
  companyId: string | null;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  mobilePhone: string;
  isPrimary: boolean;
  notes: string;
  region: Region;
};

function toRow(input: ContactInput) {
  return {
    company_id: input.companyId,
    first_name: input.firstName,
    last_name: input.lastName || null,
    title: input.title || null,
    email: input.email || null,
    phone: input.phone || null,
    mobile_phone: input.mobilePhone || null,
    is_primary: input.isPrimary,
    notes: input.notes || null,
    region: input.region,
  };
}

export async function createContact(input: ContactInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.firstName.trim()) {
    return { ok: false, error: "Kişinin adı zorunlu." };
  }

  const { error } = await supabase.from("contacts").insert({
    ...toRow(input),
    owner_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu şirkette zaten birincil bir kişi var — önce onu değiştir." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/contacts");
  if (input.companyId) revalidatePath(`/companies/${input.companyId}`);
  return { ok: true };
}

export async function updateContact(
  id: string,
  input: ContactInput,
  companyIdForRevalidate?: string | null
): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.firstName.trim()) {
    return { ok: false, error: "Kişinin adı zorunlu." };
  }

  const { error, count } = await supabase.from("contacts").update(toRow(input), { count: "exact" }).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu şirkette zaten birincil bir kişi var — önce onu değiştir." };
    }
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok." };
  }

  revalidatePath("/contacts");
  if (companyIdForRevalidate) revalidatePath(`/companies/${companyIdForRevalidate}`);
  return { ok: true };
}

export async function setPrimaryContact(id: string, companyId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { error: clearError } = await supabase
    .from("contacts")
    .update({ is_primary: false })
    .eq("company_id", companyId)
    .neq("id", id);
  if (clearError) {
    return { ok: false, error: clearError.message };
  }

  const { error, count } = await supabase
    .from("contacts")
    .update({ is_primary: true }, { count: "exact" })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Bu şirkette farklı bir sahibe ait birincil kişi zaten var — önce onu düzenle.",
      };
    }
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok." };
  }

  revalidatePath("/contacts");
  revalidatePath(`/companies/${companyId}`);
  return { ok: true };
}

export async function deleteContact(id: string, companyIdForRevalidate?: string | null): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("contacts").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı silme yetkin yok." };
  }

  revalidatePath("/contacts");
  if (companyIdForRevalidate) revalidatePath(`/companies/${companyIdForRevalidate}`);
  return { ok: true };
}

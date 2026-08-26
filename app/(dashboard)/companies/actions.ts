"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type CompanyInput = {
  name: string;
  legalName: string;
  website: string;
  industry: string;
  country: string;
  city: string;
  address: string;
  taxOffice: string;
  taxNo: string;
  employeeCount: string;
  notes: string;
  region: Region;
};

function toRow(input: CompanyInput) {
  return {
    name: input.name,
    legal_name: input.legalName || null,
    website: input.website || null,
    industry: input.industry || null,
    country: input.country || null,
    city: input.city || null,
    address: input.address || null,
    tax_office: input.taxOffice || null,
    tax_no: input.taxNo || null,
    employee_count: input.employeeCount || null,
    notes: input.notes || null,
    region: input.region,
  };
}

export async function createCompany(input: CompanyInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Şirket adı zorunlu." };
  }

  const { error } = await supabase.from("companies").insert({
    ...toRow(input),
    // Oluşturan kişi otomatik sahip olur — böylece kendi kaydını hemen
    // düzenleyebilir. Founder/Bölge Yöneticisi daha sonra sahibi değiştirebilir.
    owner_id: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/companies");
  return { ok: true };
}

export async function updateCompany(id: string, input: CompanyInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.name.trim()) {
    return { ok: false, error: "Şirket adı zorunlu." };
  }

  const { error, count } = await supabase
    .from("companies")
    .update(toRow(input), { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok." };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { ok: true };
}

export async function toggleCompanyActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("companies")
    .update({ is_active: isActive }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok." };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("companies")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı silme yetkin yok." };
  }

  revalidatePath("/companies");
  return { ok: true };
}

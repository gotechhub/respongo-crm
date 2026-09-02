"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

// Partner ilk kez /partner sayfasını açtığında partner_profiles satırı yoksa
// oluşturur (lazy provisioning). RLS (partner_profiles_self_insert) sadece
// partner_tr/partner_global rolündeki kullanıcının KENDİ profile_id'siyle
// insert yapmasına izin veriyor.
export async function ensurePartnerProfile(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: existing } = await supabase
    .from("partner_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: true };
  }

  const { error } = await supabase.from("partner_profiles").insert({ profile_id: user.id });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function updateOwnPartnerProfile(fields: Record<string, unknown>): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error, count } = await supabase
    .from("partner_profiles")
    .update(fields, { count: "exact" })
    .eq("profile_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Güncelleme başarısız — kaydını bulamadım." };
  }

  revalidatePath("/partner");
  return { ok: true };
}

// Onboarding adım 1: sözleşme/şartlar onayı.
export async function savePartnerAgreementStep(accepted: boolean): Promise<ActionResult> {
  if (!accepted) {
    return { ok: false, error: "Devam etmek için iş ortaklığı şartlarını onaylaman gerekiyor." };
  }
  return updateOwnPartnerProfile({
    agreement_accepted_at: new Date().toISOString(),
    onboarding_step: 1,
  });
}

export type PartnerCompanyInput = {
  companyName: string;
  taxNo: string;
  website: string;
  country: string;
  address: string;
};

// Onboarding adım 2: firma/iletişim bilgileri.
export async function savePartnerCompanyStep(input: PartnerCompanyInput): Promise<ActionResult> {
  if (!input.companyName.trim()) {
    return { ok: false, error: "Firma adı zorunlu." };
  }
  return updateOwnPartnerProfile({
    company_name: input.companyName,
    tax_no: input.taxNo || null,
    website: input.website || null,
    country: input.country || null,
    address: input.address || null,
    onboarding_step: 2,
  });
}

export type PartnerBankInput = {
  bankName: string;
  bankAccountName: string;
  iban: string;
  swift: string;
};

// Onboarding adım 3: komisyon ödemesi için banka bilgileri.
export async function savePartnerBankStep(input: PartnerBankInput): Promise<ActionResult> {
  return updateOwnPartnerProfile({
    bank_name: input.bankName || null,
    bank_account_name: input.bankAccountName || null,
    iban: input.iban || null,
    swift: input.swift || null,
    onboarding_step: 3,
  });
}

// Onboarding adım 4: ilgilendiği ürünler.
export async function savePartnerInterestsStep(productInterests: string[]): Promise<ActionResult> {
  return updateOwnPartnerProfile({
    product_interests: productInterests,
    onboarding_step: 4,
  });
}

// Onboarding adım 5: özet ekranından tamamlama. Durum kasıtlı olarak
// 'pending_review'da bırakılıyor — trigger zaten status'u founder olmayan
// bir çağrıda değiştirtmiyor, founder /partner-admin'den 'active' yapacak.
export async function completePartnerOnboarding(): Promise<ActionResult> {
  return updateOwnPartnerProfile({
    onboarding_step: 5,
    onboarding_completed_at: new Date().toISOString(),
  });
}

// --- Görevlerim (partner_tasks) ---

export type PartnerTaskInput = {
  title: string;
  description: string;
  dueDate: string; // "" veya "YYYY-MM-DD"
};

export async function createPartnerTask(input: PartnerTaskInput): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Görev başlığı zorunlu." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error } = await supabase.from("partner_tasks").insert({
    partner_id: user.id,
    title: input.title,
    description: input.description || null,
    due_date: input.dueDate || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function updatePartnerTaskStatus(taskId: string, status: "open" | "done"): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("partner_tasks")
    .update({ status }, { count: "exact" })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu görevi güncelleme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}

export async function deletePartnerTask(taskId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("partner_tasks").delete({ count: "exact" }).eq("id", taskId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu görevi silme yetkin yok." };
  }
  revalidatePath("/partner");
  return { ok: true };
}

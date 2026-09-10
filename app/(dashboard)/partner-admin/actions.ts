"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Region, UserRole } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireFounder(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((callerProfile as { role: UserRole | null } | null)?.role !== "founder") {
    return { ok: false, error: "Bu işlem için Süper Admin yetkisi gerekiyor." };
  }
  return { ok: true };
}

export type PartnerAdminUpdateInput = {
  commissionRate: number | null;
  status: "pending_review" | "active" | "suspended";
  adminNote: string;
  companyName: string;
  taxNo: string;
  website: string;
  country: string;
  address: string;
  bankName: string;
  bankAccountName: string;
  iban: string;
  swift: string;
};

// Komisyon oranı/durum/not + firma/banka bilgileri — SADECE founder
// değiştirebilir. RLS zaten partner_profiles_founder_all ile bunu garanti
// ediyor; komisyon/durum alanları için DB tarafında ayrıca
// trg_partner_profiles_protect trigger'ı founder olmayan bir çağrıda bu
// alanları sessizce eski değerine döndürüyor (bkz. migration). Firma/banka
// alanları normalde sadece partnerin kendisi tarafından dolduruluyordu
// (onboarding sihirbazı) — founder artık burada da düzenleyebiliyor
// (ör. partner yanlış IBAN girdiyse, ya da founder hesabı kendisi kurduysa).
export async function updatePartnerAdmin(
  partnerProfileId: string,
  input: PartnerAdminUpdateInput
): Promise<ActionResult> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from("partner_profiles")
    .update(
      {
        commission_rate: input.commissionRate,
        status: input.status,
        admin_note: input.adminNote || null,
        company_name: input.companyName || null,
        tax_no: input.taxNo || null,
        website: input.website || null,
        country: input.country || null,
        address: input.address || null,
        bank_name: input.bankName || null,
        bank_account_name: input.bankAccountName || null,
        iban: input.iban || null,
        swift: input.swift || null,
      },
      { count: "exact" }
    )
    .eq("id", partnerProfileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok — sadece Süper Admin değiştirebilir." };
  }

  revalidatePath("/partner-admin");
  return { ok: true };
}

export type CreatePartnerInput = {
  email: string;
  fullName: string;
  region: Region;
  companyName: string;
  taxNo: string;
  website: string;
  country: string;
  address: string;
  bankName: string;
  bankAccountName: string;
  iban: string;
  swift: string;
  commissionRate: number | null;
  status: "pending_review" | "active" | "suspended";
};

// Founder'ın tek adımda TAM bir iş ortağı hesabı oluşturmasını sağlar: daha
// önce bu mümkün değildi — hesap davet edildikten sonra firma/banka
// bilgilerini partnerin kendisinin 5 adımlı onboarding sihirbazından
// doldurması gerekiyordu. Şimdi founder tüm bilgileri biliyorsa direkt
// girebiliyor; partner ilk girişinde bu bilgileri hazır bulur (sadece
// iş ortaklığı şartlarını onaylaması yeterli olur).
export async function createPartnerWithProfile(input: CreatePartnerInput): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  if (!input.email.trim() || !input.fullName.trim()) {
    return { ok: false, error: "Ad Soyad ve e-posta zorunlu." };
  }
  if (!input.companyName.trim()) {
    return { ok: false, error: "Firma adı zorunlu." };
  }
  if (input.commissionRate !== null && (Number.isNaN(input.commissionRate) || input.commissionRate < 0 || input.commissionRate > 100)) {
    return { ok: false, error: "Komisyon oranı 0-100 arasında bir sayı olmalı." };
  }

  const role: UserRole = input.region === "tr" ? "partner_tr" : "partner_global";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://respongo-crm.vercel.app";
  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.fullName },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (inviteError || !invited?.user) {
    return { ok: false, error: inviteError?.message ?? "Davet gönderilemedi." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: input.fullName, role, region: input.region })
    .eq("id", invited.user.id);
  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  // partner_profiles satırı normal (session-scoped) client ile — founder
  // için RLS zaten tam erişim veriyor, admin client'a gerek yok.
  const supabase = createClient();
  const { error: partnerProfileError } = await supabase.from("partner_profiles").insert({
    profile_id: invited.user.id,
    company_name: input.companyName,
    tax_no: input.taxNo || null,
    website: input.website || null,
    country: input.country || null,
    address: input.address || null,
    bank_name: input.bankName || null,
    bank_account_name: input.bankAccountName || null,
    iban: input.iban || null,
    swift: input.swift || null,
    commission_rate: input.commissionRate,
    status: input.status,
    admin_note: "Founder tarafından doğrudan oluşturuldu (self-onboarding beklenmedi).",
  });
  if (partnerProfileError) {
    return {
      ok: false,
      error: `Hesap davet edildi ama iş ortağı profili oluşturulamadı: ${partnerProfileError.message}`,
    };
  }

  revalidatePath("/partner-admin");
  return { ok: true };
}

// Bir iş ortağını kaldırır. Gerçek silme YAPILMAZ — commission_entries,
// proposals, partner_meetings gibi tablolarda bu hesaba referans veren
// geçmiş (özellikle mali/komisyon) kayıtlar var. Bunun yerine: hesap
// pasifleştirilir (giriş yapamaz) VE partner_profiles.status='suspended'
// yapılır — komisyon geçmişi ve raporlama bozulmadan kalır.
export async function removePartner(partnerProfileId: string, profileId: string): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  const supabase = createClient();
  const [statusRes, activeRes] = await Promise.all([
    supabase.from("partner_profiles").update({ status: "suspended" }, { count: "exact" }).eq("id", partnerProfileId),
    supabase.from("profiles").update({ is_active: false }, { count: "exact" }).eq("id", profileId),
  ]);

  if (statusRes.error) return { ok: false, error: statusRes.error.message };
  if (activeRes.error) return { ok: false, error: activeRes.error.message };

  revalidatePath("/partner-admin");
  return { ok: true };
}

// Komisyon satırını ödendi/bekliyor olarak işaretle — SADECE founder.
// Satır otomatik olarak trg_calculate_partner_commission trigger'ıyla
// oluşuyor/güncelleniyor (proposal 'accepted' olduğunda); bu action sadece
// ödeme durumunu ve iç notu değiştiriyor, tutarı/oranı DEĞİŞTİRMİYOR.
export async function updateCommissionEntry(
  entryId: string,
  input: { status: "unpaid" | "paid"; adminNote: string }
): Promise<ActionResult> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from("commission_entries")
    .update(
      {
        status: input.status,
        paid_at: input.status === "paid" ? new Date().toISOString() : null,
        admin_note: input.adminNote || null,
      },
      { count: "exact" }
    )
    .eq("id", entryId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu komisyon kaydını güncelleme yetkin yok — sadece Süper Admin değiştirebilir." };
  }

  revalidatePath("/partner-admin");
  return { ok: true };
}

// --- Toplantı Takibi + Aylık Hedefler (partner_monthly_targets) ---

export type MonthlyTargetInput = {
  targetRevenue: number | null;
  targetMeetings: number | null;
  currency: string;
  adminNote: string;
};

// Bir iş ortağının belirli bir ay/yıl için hedefini oluşturur/günceller. RLS
// (partner_monthly_targets_founder_all + ..._region_admin_manage) zaten
// yalnızca founder/region_admin'in bunu yapmasına izin veriyor; benzersizlik
// partner_id+year+month unique constraint'iyle korunuyor, bu yüzden upsert
// kullanılıyor.
export async function upsertPartnerMonthlyTarget(
  partnerId: string,
  year: number,
  month: number,
  input: MonthlyTargetInput
): Promise<ActionResult> {
  if (input.targetRevenue !== null && (Number.isNaN(input.targetRevenue) || input.targetRevenue < 0)) {
    return { ok: false, error: "Ciro hedefi geçerli bir sayı olmalı." };
  }
  if (input.targetMeetings !== null && (Number.isNaN(input.targetMeetings) || input.targetMeetings < 0)) {
    return { ok: false, error: "Toplantı hedefi geçerli bir sayı olmalı." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("partner_monthly_targets").upsert(
    {
      partner_id: partnerId,
      year,
      month,
      target_revenue: input.targetRevenue,
      target_meetings: input.targetMeetings,
      currency: input.currency,
      admin_note: input.adminNote || null,
    },
    { onConflict: "partner_id,year,month" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/partner-admin");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type PartnerAdminUpdateInput = {
  commissionRate: number | null;
  status: "pending_review" | "active" | "suspended";
  adminNote: string;
};

// Komisyon oranı/durum/not — SADECE founder değiştirebilir. RLS zaten
// partner_profiles_founder_all ile bunu garanti ediyor; ayrıca DB tarafında
// trg_partner_profiles_protect trigger'ı founder olmayan bir çağrıda bu
// alanları sessizce eski değerine döndürüyor (bkz. migration).
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

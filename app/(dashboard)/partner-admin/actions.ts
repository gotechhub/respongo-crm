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

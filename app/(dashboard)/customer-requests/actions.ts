"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CustomerRequestStatus } from "@/lib/customer-request-labels";

type ActionResult = { ok: true } | { ok: false; error: string };

// Satış ekibi/region_admin/founder, müşteri portalından gelen bir talebi işleme alır —
// durum + opsiyonel bir not (müşteriye görünür, portal'daki request kartında gösteriliyor).
// handled_by otomatik olarak çağıran kullanıcı olarak set ediliyor.
export async function updateCustomerRequestStatus(
  id: string,
  status: CustomerRequestStatus,
  note: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { error, count } = await supabase
    .from("customer_requests")
    .update({ status, handled_note: note.trim() || null, handled_by: user.id }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu talebi güncelleme yetkin yok." };
  }

  revalidatePath("/customer-requests");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CustomerRequestType } from "@/lib/customer-request-labels";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ProductKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools";

export type CustomerRequestInput = {
  requestType: CustomerRequestType;
  product: ProductKey | null;
  relatedLicenseId: string | null;
  title: string;
  description: string;
};

// Müşteri portalından açılan satın alım/yenileme/yeni proje-ürün-hizmet talebi. customer_id
// müşterinin kendi hesabından (customer_users) çözülüyor — client'tan gelen bir ID'ye
// GÜVENİLMİYOR (RLS zaten aynı kontrolü tekrar yapıyor, ama net bir hata mesajı için burada
// da kontrol ediliyor). region ve submitted_by veritabanı tarafında (trigger / default
// auth.uid()) otomatik dolduruluyor.
export async function createCustomerRequest(input: CustomerRequestInput): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Talebin için kısa bir başlık yazman gerekiyor." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: link } = await supabase
    .from("customer_users")
    .select("customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!link) {
    return { ok: false, error: "Hesabın henüz bir müşteri şirketiyle eşleştirilmemiş." };
  }

  const { error } = await supabase.from("customer_requests").insert({
    customer_id: link.customer_id,
    request_type: input.requestType,
    product: input.product,
    related_license_id: input.relatedLicenseId,
    title: input.title.trim(),
    description: input.description.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/portal/requests");
  return { ok: true };
}

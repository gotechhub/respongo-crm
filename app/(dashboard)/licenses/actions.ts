"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type LicenseStatus = "active" | "cancelled";

export type LicenseInput = {
  customerId: string;
  proposalId: string | null;
  product: string;
  licenseName: string;
  seatCount: number | null;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export async function createLicense(input: LicenseInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.customerId) {
    return { ok: false, error: "Müşteri seçimi zorunlu." };
  }
  if (!input.product) {
    return { ok: false, error: "Ürün seçimi zorunlu." };
  }
  if (!input.endDate) {
    return { ok: false, error: "Bitiş/yenileme tarihi zorunlu." };
  }

  const { data: callerProfile } = await supabase.from("profiles").select("region").eq("id", user.id).single();

  const { error } = await supabase.from("licenses").insert({
    customer_id: input.customerId,
    proposal_id: input.proposalId,
    product: input.product,
    license_name: input.licenseName.trim() || null,
    seat_count: input.seatCount,
    amount: input.amount || 0,
    currency: input.currency || "USD",
    start_date: input.startDate || new Date().toISOString().slice(0, 10),
    end_date: input.endDate,
    notes: input.notes.trim() || null,
    region: (callerProfile as { region: string | null } | null)?.region ?? null,
    owner_id: user.id,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/licenses");
  return { ok: true };
}

export async function updateLicense(id: string, input: LicenseInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.customerId) {
    return { ok: false, error: "Müşteri seçimi zorunlu." };
  }
  if (!input.endDate) {
    return { ok: false, error: "Bitiş/yenileme tarihi zorunlu." };
  }

  const { error, count } = await supabase
    .from("licenses")
    .update(
      {
        customer_id: input.customerId,
        proposal_id: input.proposalId,
        product: input.product,
        license_name: input.licenseName.trim() || null,
        seat_count: input.seatCount,
        amount: input.amount || 0,
        currency: input.currency || "USD",
        start_date: input.startDate,
        notes: input.notes.trim() || null,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lisansı güncelleme yetkin yok." };
  }

  revalidatePath("/licenses");
  revalidatePath(`/licenses/${id}`);
  return { ok: true };
}

export async function cancelLicense(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("licenses")
    .update({ status: "cancelled" }, { count: "exact" })
    .eq("id", id)
    .eq("status", "active");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lisansı iptal etme yetkin yok (veya zaten iptal edilmiş)." };
  }

  revalidatePath("/licenses");
  revalidatePath(`/licenses/${id}`);
  return { ok: true };
}

export async function reactivateLicense(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("licenses")
    .update({ status: "active" }, { count: "exact" })
    .eq("id", id)
    .eq("status", "cancelled");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lisansı yeniden aktifleştirme yetkin yok." };
  }

  revalidatePath("/licenses");
  revalidatePath(`/licenses/${id}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Yenilemeler — append-only geçmiş (payments/invoices ile aynı mantık: bir
// yenileme kaydı asla değiştirilmez, licenses.end_date/amount'u ileri taşır).
// ----------------------------------------------------------------------------

export type RenewLicenseInput = {
  newEndDate: string;
  amount: number | null;
  currency: string | null;
  notes: string;
};

export async function renewLicense(licenseId: string, input: RenewLicenseInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.newEndDate) {
    return { ok: false, error: "Yeni bitiş tarihi zorunlu." };
  }

  const { data: license } = await supabase
    .from("licenses")
    .select("end_date, amount, currency, status")
    .eq("id", licenseId)
    .single();
  if (!license) {
    return { ok: false, error: "Lisans bulunamadı." };
  }
  if (license.status === "cancelled") {
    return { ok: false, error: "İptal edilmiş bir lisans yenilenemez — önce yeniden aktifleştir." };
  }
  if (input.newEndDate <= license.end_date) {
    return { ok: false, error: "Yeni bitiş tarihi, mevcut bitiş tarihinden ileride olmalı." };
  }

  const { error: renewalError } = await supabase.from("license_renewals").insert({
    license_id: licenseId,
    previous_end_date: license.end_date,
    new_end_date: input.newEndDate,
    amount: input.amount,
    currency: input.currency,
    notes: input.notes.trim() || null,
  });
  if (renewalError) {
    return { ok: false, error: renewalError.message };
  }

  const { error: updateError, count } = await supabase
    .from("licenses")
    .update(
      {
        end_date: input.newEndDate,
        amount: input.amount ?? license.amount,
        currency: input.currency ?? license.currency,
      },
      { count: "exact" }
    )
    .eq("id", licenseId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  if (!count) {
    return { ok: false, error: "Bu lisansı yenileme yetkin yok." };
  }

  revalidatePath("/licenses");
  revalidatePath(`/licenses/${licenseId}`);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type LeadStatus = "yeni" | "gorusme" | "teklif" | "musteri" | "kaybedildi";

// Bir lead'in pipeline durumunu günceller (Yeni / Görüşme / Teklif / Kaybedildi).
// "musteri" durumuna geçiş buradan değil convertLeadToCustomer'dan yapılmalı —
// çünkü o an ayrıca customers tablosunda gerçek bir kayıt açılması gerekiyor.
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<ActionResult> {
  if (status === "musteri") {
    return { ok: false, error: "Müşteriye çevirmek için 'Müşteriye Dönüştür' butonunu kullan." };
  }
  const supabase = createClient();
  const { error, count } = await supabase
    .from("leads")
    .update({ status }, { count: "exact" })
    .eq("id", leadId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı güncelleme yetkin yok." };
  }

  revalidatePath("/sales/leads");
  return { ok: true };
}

// Lead'i müşteriye dönüştürür: customers tablosunda yeni kayıt açar,
// leads.status = 'musteri' ve converted_customer_id set edilir.
export async function convertLeadToCustomer(leadId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, company_name, contact_name, contact_email, contact_phone, region")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { ok: false, error: leadError?.message ?? "Lead bulunamadı." };
  }

  const { data: customer, error: insertError } = await supabase
    .from("customers")
    .insert({
      lead_id: lead.id,
      company_name: lead.company_name,
      primary_contact_name: lead.contact_name,
      primary_contact_email: lead.contact_email,
      primary_contact_phone: lead.contact_phone,
      region: lead.region,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !customer) {
    return { ok: false, error: insertError?.message ?? "Müşteri kaydı oluşturulamadı." };
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "musteri", converted_customer_id: customer.id })
    .eq("id", leadId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/sales/leads");
  revalidatePath("/sales/customers");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Region } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type CustomerInput = {
  companyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  country: string;
  region: Region | "";
};

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.companyName.trim()) {
    return { ok: false, error: "Firma adı zorunlu." };
  }

  const { error, count } = await supabase
    .from("customers")
    .update(
      {
        company_name: input.companyName.trim(),
        primary_contact_name: input.primaryContactName || null,
        primary_contact_email: input.primaryContactEmail || null,
        primary_contact_phone: input.primaryContactPhone || null,
        country: input.country || null,
        region: input.region || null,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu müşteriyi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
  return { ok: true };
}

export async function toggleCustomerActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("customers")
    .update({ is_active: isActive }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu müşteriyi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bülten (Brevo) aboneliği — müşteri detay panelindeki toggle bunu çağırır.
// marketing_settings.auto_sync_newsletter açıksa Brevo'ya da senkronize edilir;
// kapalıysa (veya Brevo bağlantısı henüz kurulmadıysa) sadece CRM içindeki
// alan güncellenir — DB güncellemesi Brevo senkronizasyonunun başarısına bağlı
// DEĞİLDİR (Brevo geçici olarak erişilemez olsa bile kullanıcı tercihini
// CRM'e kaydedebilmeli, sonradan tekrar denenebilir).
// ---------------------------------------------------------------------------

export async function toggleCustomerNewsletter(id: string, subscribed: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("primary_contact_email, primary_contact_name, region")
    .eq("id", id)
    .single();

  if (fetchError || !customer) {
    return { ok: false, error: "Müşteri bulunamadı ya da görüntüleme yetkin yok." };
  }
  if (subscribed && !customer.primary_contact_email) {
    return { ok: false, error: "Bültene kaydetmek için önce müşterinin e-posta adresi girilmeli." };
  }

  const { error, count } = await supabase
    .from("customers")
    .update({ newsletter_subscribed: subscribed, newsletter_synced_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu müşteriyi güncelleme yetkin yok." };
  }

  if (customer.primary_contact_email) {
    const { isNewsletterAutoSyncEnabled, syncNewsletterSubscription } = await import("@/lib/brevo/client");
    if (await isNewsletterAutoSyncEnabled()) {
      await syncNewsletterSubscription({
        email: customer.primary_contact_email,
        name: customer.primary_contact_name,
        region: (customer.region as Region | null) ?? null,
        subscribe: subscribed,
      }).catch(() => null); // Brevo hatası CRM güncellemesini geri almaz, sessizce yutulur.
    }
  }

  revalidatePath("/sales/customers");
  revalidatePath(`/sales/customers/${id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Müşteri Portalı — erişim yönetimi. Bir müşteri şirketine "customer" rollü
// bir portal kullanıcısı davet eder (customer_users köprü tablosuyla eşler).
// RLS (customer_users_manage) sadece kurucu VEYA o müşterinin sahibi olan
// satışçının bunu yapabilmesine izin veriyor — service-role client
// kullanıldığı için burada AYRICA doğruluyoruz (RLS bypass edilir).
// ---------------------------------------------------------------------------

async function canManagePortalAccess(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  userId: string
): Promise<boolean> {
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if ((callerProfile as { role: string | null } | null)?.role === "founder") return true;

  const { data: customer } = await supabase.from("customers").select("owner_id").eq("id", customerId).single();
  return (customer as { owner_id: string | null } | null)?.owner_id === userId;
}

export async function inviteCustomerPortalUser(
  customerId: string,
  email: string,
  fullName: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!email.trim()) {
    return { ok: false, error: "E-posta zorunlu." };
  }
  if (!(await canManagePortalAccess(supabase, customerId, user.id))) {
    return { ok: false, error: "Bu müşteriye portal erişimi verme yetkin yok." };
  }

  const admin = createAdminClient();

  // E-posta zaten bir profile ait mi kontrol et — yeni davet mi, mevcut
  // hesabı bu müşteriye bağlama mı olduğuna göre dallanıyoruz.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  let profileId: string;

  if (existing) {
    const existingRole = (existing as { id: string; role: string | null }).role;
    if (existingRole && existingRole !== "customer") {
      return {
        ok: false,
        error: "Bu e-posta zaten bir ekip üyesine ait — müşteri portalı için kullanılamaz.",
      };
    }
    profileId = (existing as { id: string }).id;
    await admin.from("profiles").update({ role: "customer", full_name: fullName || undefined }).eq("id", profileId);
  } else {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://respongo-crm.vercel.app";
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
      data: { full_name: fullName },
      redirectTo: `${siteUrl}/auth/callback`,
    });

    if (inviteError || !invited?.user) {
      return { ok: false, error: inviteError?.message ?? "Davet gönderilemedi." };
    }

    profileId = invited.user.id;
    await admin.from("profiles").update({ full_name: fullName, role: "customer" }).eq("id", profileId);
  }

  // Bu profil zaten başka bir müşteriye bağlıysa (profile_id primary key),
  // önce eski bağlantıyı temizle — bir portal hesabı aynı anda tek bir
  // müşteri şirketine ait olabilir.
  const { error: linkError } = await admin
    .from("customer_users")
    .upsert({ profile_id: profileId, customer_id: customerId }, { onConflict: "profile_id" });

  if (linkError) {
    return { ok: false, error: linkError.message };
  }

  revalidatePath(`/sales/customers/${customerId}`);
  return { ok: true };
}

export async function removeCustomerPortalUser(profileId: string, customerId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!(await canManagePortalAccess(supabase, customerId, user.id))) {
    return { ok: false, error: "Bu müşterinin portal erişimini kaldırma yetkin yok." };
  }

  const { error, count } = await supabase
    .from("customer_users")
    .delete({ count: "exact" })
    .eq("profile_id", profileId)
    .eq("customer_id", customerId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu erişimi kaldırma yetkin yok ya da erişim zaten yok." };
  }

  revalidatePath(`/sales/customers/${customerId}`);
  return { ok: true };
}

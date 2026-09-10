"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inviteUser } from "@/app/(dashboard)/users/actions";
import type { Region, UserRole } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ReassignableKind = "lead" | "pool" | "customer";

const TABLE_BY_KIND: Record<ReassignableKind, string> = {
  lead: "leads",
  pool: "customer_pool",
  customer: "customers",
};

const LABEL_BY_KIND: Record<ReassignableKind, string> = {
  lead: "Lead",
  pool: "Havuz kaydı",
  customer: "Müşteri",
};

// Bir lead/havuz kaydı/müşteriyi başka bir satış ekibi üyesine devreder.
// RLS zaten founder (her kayıt) ve region_admin (kendi bölgesindeki kayıtlar) için
// UPDATE'e izin veriyor — burada AYRICA iş kuralı kontrolü yapıyoruz: yeni sahip
// gerçekten satış ekibinde (sales_inhouse/region_admin) olmalı ve kaydın bölgesiyle
// aynı bölgede olmalı (bölgeler arası yanlışlıkla devir yapılmasını engellemek için).
export async function reassignOwner(
  kind: ReassignableKind,
  recordId: string,
  newOwnerId: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const callerRole = (callerProfile as { role: UserRole | null } | null)?.role;
  if (callerRole !== "founder" && callerRole !== "region_admin") {
    return { ok: false, error: "Devretme yetkin yok — sadece Süper Admin ve Bölge Yöneticileri devredebilir." };
  }

  const table = TABLE_BY_KIND[kind];

  const { data: record, error: recordError } = await supabase
    .from(table)
    .select("id, region")
    .eq("id", recordId)
    .single();
  if (recordError || !record) {
    return { ok: false, error: recordError?.message ?? `${LABEL_BY_KIND[kind]} bulunamadı.` };
  }

  const { data: newOwner, error: ownerError } = await supabase
    .from("profiles")
    .select("id, role, region, is_active")
    .eq("id", newOwnerId)
    .single();
  const owner = newOwner as { id: string; role: UserRole | null; region: Region | null; is_active: boolean } | null;
  if (ownerError || !owner) {
    return { ok: false, error: "Yeni sorumlu bulunamadı." };
  }
  if (owner.role !== "sales_inhouse" && owner.role !== "region_admin" && owner.role !== "founder") {
    return { ok: false, error: "Sadece satış ekibi üyelerine devredebilirsin." };
  }
  if (!owner.is_active) {
    return { ok: false, error: "Pasif bir kullanıcıya devredemezsin." };
  }
  const recordRegion = (record as { region: Region | null }).region;
  if (recordRegion && owner.region && owner.region !== recordRegion) {
    return { ok: false, error: "Kaydın bölgesiyle yeni sorumlunun bölgesi eşleşmiyor." };
  }

  const { error: updateError, count } = await supabase
    .from(table)
    .update({ owner_id: newOwnerId }, { count: "exact" })
    .eq("id", recordId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kaydı devretme yetkin yok." };
  }

  revalidatePath("/sales/team");
  revalidatePath(`/sales/team/${newOwnerId}`);
  revalidatePath("/sales/leads");
  revalidatePath("/sales");
  revalidatePath("/sales/customers");
  return { ok: true };
}

// Satış Ekibi sayfasından doğrudan yeni üye davet eder — Kullanıcı & Yetki
// ekranına gitmeye gerek kalmaz. Rol sabit olarak "sales_inhouse" gönderilir;
// yetki/bölge kontrolü zaten inviteUser() içinde yapılıyor.
export async function inviteSalesTeamMember(
  email: string,
  fullName: string,
  region: Region | null
): Promise<ActionResult> {
  const result = await inviteUser(email, fullName, "sales_inhouse", region);
  if (result.ok) {
    revalidatePath("/sales/team");
  }
  return result;
}

// Ekip üyesinin ad/telefon/bölge bilgisini düzenler. Rol ve aktiflik durumu
// BİLEREK burada değiştirilmiyor — rol değişimi Kullanıcı & Yetki ekranında
// kalıyor (izin matrisiyle doğrudan ilişkili, ayrı bir karar), aktiflik ise
// removeTeamMember() ile birlikte yönetiliyor.
export async function updateTeamMemberProfile(
  profileId: string,
  fullName: string,
  phone: string,
  region: Region | null
): Promise<ActionResult> {
  if (!fullName.trim()) {
    return { ok: false, error: "Ad Soyad zorunlu." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  if (caller?.role !== "founder" && caller?.role !== "region_admin") {
    return { ok: false, error: "Ekip üyesi düzenleme yetkin yok." };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("region")
    .eq("id", profileId)
    .single();
  const targetRegion = (targetProfile as { region: Region | null } | null)?.region ?? null;
  if (caller.role === "region_admin" && targetRegion !== caller.region) {
    return { ok: false, error: "Sadece kendi bölgendeki ekip üyelerini düzenleyebilirsin." };
  }

  const { error, count } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim(), phone: phone.trim() || null, region }, { count: "exact" })
    .eq("id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu üyeyi düzenleme yetkin yok." };
  }

  revalidatePath("/sales/team");
  revalidatePath(`/sales/team/${profileId}`);
  return { ok: true };
}

export type OpenWorkloadCount = { poolCount: number; openLeadCount: number; activeCustomerCount: number; openProposalCount: number };

// Bir ekip üyesinin devam eden (kapanmamış) iş yükünü sayar — kaldırma işlemi
// öncesi UI'da "devretmen gerekiyor" uyarısını göstermek için kullanılır.
export async function getTeamMemberOpenWorkload(profileId: string): Promise<OpenWorkloadCount> {
  const supabase = createClient();
  const [poolRes, leadsRes, customersRes, proposalsRes] = await Promise.all([
    supabase.from("customer_pool").select("id", { count: "exact", head: true }).eq("owner_id", profileId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profileId)
      .not("status", "in", "(musteri,kaybedildi)"),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profileId)
      .eq("is_active", true),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profileId)
      .in("status", ["draft", "sent"]),
  ]);
  return {
    poolCount: poolRes.count ?? 0,
    openLeadCount: leadsRes.count ?? 0,
    activeCustomerCount: customersRes.count ?? 0,
    openProposalCount: proposalsRes.count ?? 0,
  };
}

// Bir ekip üyesini kaldırır. Gerçek silme YAPILMAZ — lead/müşteri/teklif gibi
// birçok tabloda bu profile referans veren geçmiş kayıtlar var (FK bütünlüğü +
// komisyon/performans geçmişinin bozulmaması için). Bunun yerine: devam eden
// açık işleri (havuz kaydı, açık lead, aktif müşteri, taslak/gönderilmiş
// teklif) varsa ZORUNLU olarak başka bir aktif ekip üyesine devredilir, sonra
// hesap pasifleştirilir (is_active=false) — böylece kişi giriş yapamaz ama
// geçmiş kayıtlar (kazanılmış teklifler, komisyon vb.) bozulmadan kalır.
export async function removeTeamMember(profileId: string, reassignToId: string | null): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  if (caller?.role !== "founder" && caller?.role !== "region_admin") {
    return { ok: false, error: "Ekip üyesi kaldırma yetkin yok." };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("region")
    .eq("id", profileId)
    .single();
  const targetRegion = (targetProfile as { region: Region | null } | null)?.region ?? null;
  if (caller.role === "region_admin" && targetRegion !== caller.region) {
    return { ok: false, error: "Sadece kendi bölgendeki ekip üyelerini kaldırabilirsin." };
  }

  const workload = await getTeamMemberOpenWorkload(profileId);
  const hasOpenWork =
    workload.poolCount > 0 || workload.openLeadCount > 0 || workload.activeCustomerCount > 0 || workload.openProposalCount > 0;

  if (hasOpenWork) {
    if (!reassignToId) {
      return {
        ok: false,
        error:
          "Bu üyenin devam eden açık işleri var (havuz/lead/müşteri/teklif) — kaldırmadan önce bunları başka bir ekip üyesine devretmen gerekiyor.",
      };
    }
    const { data: newOwner } = await supabase
      .from("profiles")
      .select("id, role, region, is_active")
      .eq("id", reassignToId)
      .single();
    const owner = newOwner as { id: string; role: UserRole | null; region: Region | null; is_active: boolean } | null;
    if (!owner || !owner.is_active) {
      return { ok: false, error: "Devredilecek kişi bulunamadı veya pasif." };
    }
    if (owner.role !== "sales_inhouse" && owner.role !== "region_admin" && owner.role !== "founder") {
      return { ok: false, error: "Sadece satış ekibi üyelerine devredebilirsin." };
    }

    const reassignResults = await Promise.all([
      supabase.from("customer_pool").update({ owner_id: reassignToId }).eq("owner_id", profileId),
      supabase.from("leads").update({ owner_id: reassignToId }).eq("owner_id", profileId).not("status", "in", "(musteri,kaybedildi)"),
      supabase.from("customers").update({ owner_id: reassignToId }).eq("owner_id", profileId).eq("is_active", true),
      supabase.from("proposals").update({ owner_id: reassignToId }).eq("owner_id", profileId).in("status", ["draft", "sent"]),
    ]);
    const reassignError = reassignResults.find((r) => r.error);
    if (reassignError?.error) {
      return { ok: false, error: `Devir sırasında hata: ${reassignError.error.message}` };
    }
  }

  const { error, count } = await supabase
    .from("profiles")
    .update({ is_active: false }, { count: "exact" })
    .eq("id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu üyeyi kaldırma yetkin yok." };
  }

  revalidatePath("/sales/team");
  revalidatePath("/sales/leads");
  revalidatePath("/sales/customers");
  revalidatePath("/users");
  return { ok: true };
}

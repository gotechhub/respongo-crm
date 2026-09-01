"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Region, UserRole } from "@/lib/roles";

type ActionResult = { ok: true } | { ok: false; error: string };

// Mevcut kullanıcının rol/bölge/aktiflik bilgisini günceller.
// RLS zaten sadece founder (her satır) ve region_admin (kendi bölgesi) için
// UPDATE'e izin veriyor — burada ekstra yetki kontrolüne gerek yok, veritabanı
// zaten yetkisiz bir güncellemeyi 0 satır etkileyerek sessizce reddeder.
export async function updateUserRoleRegion(
  profileId: string,
  role: UserRole,
  region: Region | null,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from("profiles")
    .update({ role, region, is_active: isActive }, { count: "exact" })
    .eq("id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kullanıcıyı güncelleme yetkin yok." };
  }

  revalidatePath("/users");
  return { ok: true };
}

// Yeni kullanıcı davet eder (Supabase Auth'a magic-link davet e-postası gönderir)
// ve profiline rol/bölge atar. Service-role client kullanır — bu yüzden çağıran
// kişinin gerçekten yetkili olduğunu burada AYRICA kontrol ediyoruz.
export async function inviteUser(
  email: string,
  fullName: string,
  role: UserRole,
  region: Region | null
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
    .select("role, region")
    .eq("id", user.id)
    .single();

  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;

  const isFounder = caller?.role === "founder";
  const isRegionAdmin = caller?.role === "region_admin";

  if (!isFounder && !isRegionAdmin) {
    return { ok: false, error: "Kullanıcı davet etme yetkin yok." };
  }
  // Bölge yöneticisi sadece kendi bölgesine kullanıcı davet edebilir.
  if (isRegionAdmin && region !== caller?.region) {
    return { ok: false, error: "Sadece kendi bölgene kullanıcı davet edebilirsin." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://respongo-crm.vercel.app";
  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name: fullName }, redirectTo: `${siteUrl}/auth/callback` }
  );

  if (inviteError || !invited?.user) {
    return { ok: false, error: inviteError?.message ?? "Davet gönderilemedi." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, role, region })
    .eq("id", invited.user.id);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  revalidatePath("/users");
  return { ok: true };
}

// Rol/İzin matrisi — hangi rolün hangi modülü görebildiğini/düzenleyebildiğini
// belirler (role_permissions tablosu). SADECE founder değiştirebilir — RLS
// zaten "role_permissions_founder_manage" ile bunu zorunlu kılıyor, burada
// count kontrolü founder olmayan bir çağrıyı sessizce reddeder.
export async function updateRolePermission(
  role: UserRole,
  moduleKey: string,
  canView: boolean,
  canEdit: boolean
): Promise<ActionResult> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from("role_permissions")
    .upsert(
      { role, module_key: moduleKey, can_view: canView, can_edit: canEdit },
      { onConflict: "role,module_key", count: "exact" }
    );

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu izni değiştirme yetkin yok — sadece Süper Admin değiştirebilir." };
  }

  revalidatePath("/users");
  return { ok: true };
}

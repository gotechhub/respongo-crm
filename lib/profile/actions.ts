"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

// V2 Revizeler bölüm I: "Fotoğraf yükleme, detaylı profil ayarları (tüm kullanıcı
// tipleri)" — bu dosyadaki 3 action hem app/(dashboard)/profile hem de
// app/(portal)/portal/account sayfalarından ORTAK kullanılıyor (DERS 26: iki ayrı
// kopya yazmak yerine paylaşılan tek bir action modülü). Üçü de SADECE çağıranın
// KENDİ satırını günceller (auth.uid() ile eşleşen id) — RLS zaten bunu zorunlu
// kılıyor (profiles_self_update: id = auth.uid()), ayrıca DERS 27/35 ile eklenen
// `trg_profiles_protect_admin_fields` tetikleyicisi role/region/is_active/email
// alanlarının bu yoldan ASLA değiştirilemeyeceğini veritabanı seviyesinde garanti
// ediyor — başkasının profilini bu action'lar üzerinden düzenlemek mümkün değil.
function revalidateProfilePages() {
  revalidatePath("/profile");
  revalidatePath("/portal/account");
}

export async function updateProfileInfo(input: {
  fullName: string;
  phone: string;
}): Promise<ActionResult> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();

  if (!fullName) {
    return { ok: false, error: "Ad Soyad boş olamaz." };
  }
  if (fullName.length > 120) {
    return { ok: false, error: "Ad Soyad çok uzun." };
  }
  if (phone.length > 40) {
    return { ok: false, error: "Telefon numarası çok uzun." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidateProfilePages();
  return { ok: true };
}

// Client taraflı yükleme (avatar-upload.tsx) dosyayı doğrudan Supabase Storage'a
// (bucket: avatars, kendi klasörü — bkz. migration i_profile_settings_avatar) attıktan
// SONRA bu action'ı çağırıp public URL'i profiles.avatar_url'e yazıyor. Dosyanın
// kendisi bir Server Action'a taşınmıyor (DERS: mevcut signed-documents yükleme
// deseniyle birebir aynı — client -> storage doğrudan, sadece sonucu DB'ye yaz).
export async function updateAvatarUrl(url: string): Promise<ActionResult> {
  if (!url || !url.startsWith("http")) {
    return { ok: false, error: "Geçersiz fotoğraf adresi." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidateProfilePages();
  return { ok: true };
}

export async function changePassword(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Şifre en az 8 karakter olmalı." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

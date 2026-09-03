"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// V2 Revizeler bölüm J: Master Admin View-As. Bu bir UI simülasyonu DEĞİL —
// Supabase'in resmi "kullanıcı olarak oturum açma" (impersonation) deseni:
// admin.generateLink(magiclink) ile hedef kullanıcı için tek kullanımlık bir
// token üretilir, verifyOtp ile bu token GERÇEK bir oturuma çevrilir. Böylece
// founder impersonation sırasında hedefin GERÇEK RLS izinleriyle geziniyor —
// ayrı bir rol simülasyon katmanı yazmaya (DERS 26: mevcut RLS'i yeniden
// kullan) hiç gerek kalmadı. Founder'ın kendi oturumu (access+refresh token)
// httpOnly bir cookie'de saklanıp "Normal Hesabına Dön" ile geri yükleniyor.
const RETURN_COOKIE = "vas_return";
const LOG_COOKIE = "vas_log_id";
const ACTIVE_COOKIE = "vas_active";
const COOKIE_MAX_AGE = 60 * 60 * 4; // 4 saat — bu süre sonunda cookie'ler kendiliğinden düşer

type ActionResult = { ok: true } | { ok: false; error: string };

export async function startViewAs(targetProfileId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "founder") {
    return { ok: false, error: "Bu işlemi yapma yetkin yok — sadece Süper Admin görüntüle-olarak kullanabilir." };
  }
  if (targetProfileId === user.id) {
    return { ok: false, error: "Kendi hesabın olarak görüntüleyemezsin." };
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, email, role, is_active")
    .eq("id", targetProfileId)
    .single();

  if (!target) return { ok: false, error: "Hedef kullanıcı bulunamadı." };
  if (target.role === "founder") {
    return { ok: false, error: "Başka bir Süper Admin olarak görüntüleyemezsin." };
  }
  if (target.is_active === false) {
    return { ok: false, error: "Pasif bir hesabı görüntüleyemezsin." };
  }
  if (!target.email) {
    return { ok: false, error: "Hedef kullanıcının e-posta adresi yok." };
  }

  // Founder'ın MEVCUT oturumunu (dönüş için) sakla — swap'tan ÖNCE.
  const {
    data: { session: founderSession },
  } = await supabase.auth.getSession();
  if (!founderSession) return { ok: false, error: "Mevcut oturum okunamadı." };

  // Denetim kaydı HER ZAMAN service-role ile yazılır (RLS'i bypass eder) —
  // çıkışta auth.uid() artık founder olmayabilir, o yüzden update de aynı
  // yolu kullanacak (bkz. endViewAs).
  const { data: logRow, error: logError } = await admin
    .from("view_as_audit_log")
    .insert({ founder_id: user.id, target_profile_id: target.id })
    .select("id")
    .single();
  if (logError || !logRow) {
    return { ok: false, error: "Denetim kaydı oluşturulamadı, işlem iptal edildi." };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target.email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    await admin.from("view_as_audit_log").delete().eq("id", logRow.id);
    return { ok: false, error: "Oturum bağlantısı oluşturulamadı: " + (linkError?.message ?? "bilinmeyen hata") };
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
    email: target.email,
  });
  if (verifyError) {
    await admin.from("view_as_audit_log").delete().eq("id", logRow.id);
    return { ok: false, error: "Oturum devralınamadı: " + verifyError.message };
  }

  const cookieStore = cookies();
  cookieStore.set(RETURN_COOKIE, JSON.stringify({
    access_token: founderSession.access_token,
    refresh_token: founderSession.refresh_token,
  }), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: COOKIE_MAX_AGE });
  cookieStore.set(LOG_COOKIE, logRow.id, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: COOKIE_MAX_AGE,
  });
  cookieStore.set(ACTIVE_COOKIE, "1", {
    httpOnly: false, secure: true, sameSite: "lax", path: "/", maxAge: COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function endViewAs(): Promise<ActionResult> {
  const cookieStore = cookies();
  const returnRaw = cookieStore.get(RETURN_COOKIE)?.value;
  const logId = cookieStore.get(LOG_COOKIE)?.value;

  cookieStore.set(RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(LOG_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(ACTIVE_COOKIE, "", { path: "/", maxAge: 0 });

  if (!returnRaw) {
    return { ok: false, error: "Geri dönülecek bir oturum bulunamadı — lütfen tekrar giriş yap." };
  }

  const admin = createAdminClient();
  if (logId) {
    await admin
      .from("view_as_audit_log")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", logId)
      .is("ended_at", null);
  }

  let parsed: { access_token: string; refresh_token: string };
  try {
    parsed = JSON.parse(returnRaw);
  } catch {
    return { ok: false, error: "Geri dönüş bilgisi bozuk — lütfen tekrar giriş yap." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.setSession({
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
  });
  if (error) {
    return { ok: false, error: "Oturuma geri dönülemedi (" + error.message + ") — lütfen tekrar giriş yap." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Layout'un cookie'yi okuyup banner göstermesi için (server component'ten
// çağrılabilir, cookies() salt-okunur context'te de çalışır).
export async function isViewAsActive(): Promise<boolean> {
  return cookies().get(ACTIVE_COOKIE)?.value === "1";
}

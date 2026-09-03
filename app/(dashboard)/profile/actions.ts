"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DigestFrequency = "daily" | "weekly" | "off";

// V2 Revizeler bölüm H: "Mail bildirim ayarlarını herkes kendi profilinden
// ayarlayabilecek." — bu action SADECE ÇAĞIRANIN KENDİ satırını günceller
// (auth.uid() ile eşleşen id), founder dahil başka birinin tercihini bu action
// üzerinden değiştirmek mümkün değil (module I'nin tam "Süper Admin başkası
// adına düzenler" özelliği ayrı bir kapsam — DERS 26: burada icat edilmedi).
export async function updateNotificationPreferences(input: {
  emailNotificationsEnabled: boolean;
  digestFrequency: DigestFrequency;
}): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({
      email_notifications_enabled: input.emailNotificationsEnabled,
      notification_digest_frequency: input.digestFrequency,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

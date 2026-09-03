"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Kullanıcı sadece KENDİ bildirimlerini işaretleyebilir — RLS (notifications_update_own)
// zaten bunu garanti ediyor, burada ek bir kontrol gerekmiyor (DERS 26).
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { UI_LOCALE_COOKIE, type UiLocale } from "@/lib/locale";

// Sağ üstteki TR/EN anahtarı buraya bağlanır. Herhangi bir yetki/rol kontrolü
// gerekmiyor — bu kişisel bir görüntüleme tercihi, veri değiştirmiyor.
export async function setUiLocale(locale: UiLocale): Promise<{ ok: true }> {
  cookies().set(UI_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // Kök layout'tan itibaren her şeyi yeniden doğrula — dil tercihine göre
  // içerik gösteren tüm sunucu bileşenleri (Topbar, Kaynaklar, ...) taze
  // cookie değeriyle yeniden render edilsin.
  revalidatePath("/", "layout");
  return { ok: true };
}

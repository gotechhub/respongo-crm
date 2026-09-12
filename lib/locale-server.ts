import { cookies } from "next/headers";
import { UI_LOCALE_COOKIE, type UiLocale } from "./locale";

// SADECE Server Component / Server Action içinde import edilmeli — next/headers
// kullanır. Client bileşenleri lib/locale.ts'ten (bu dosyadan DEĞİL) import
// etmeli; ayrım nedeni için bkz. lib/locale.ts başındaki not.
export function getUiLocale(): UiLocale {
  const value = cookies().get(UI_LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "tr";
}

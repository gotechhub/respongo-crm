// ============================================================================
// Arayüz dili tercihi — sağ üstteki TR/EN anahtarı — İZOMORFİK (client+server)
// kısım. next/headers gibi sunucu-özel bir import İÇERMEZ, bu yüzden hem
// Server Component'lerden hem "use client" bileşenlerinden güvenle import
// edilebilir. Cookie'yi GERÇEKTEN okuyan getUiLocale() bilinçli olarak
// lib/locale-server.ts'e ayrıldı — aksi halde bu dosyayı import eden HER
// client bileşeni (ör. resources-panel.tsx) next/headers'ı da client bundle'a
// çekmeye çalışır ve build hata verir.
//
// KAPSAM KARARI (bilinçli, kayıtlı): CRM'in binlerce satırlık arayüz metninin
// tamamı Türkçe hard-code edilmiş durumda (30+ sayfa, tüm buton/etiket/başlık
// metinleri doğrudan .tsx dosyalarında). Bunların TAMAMINI gerçek bir i18n
// altyapısına (next-intl vb. + tüm metinlerin çevirisi) taşımak günler süren
// ayrı bir proje — bu turun kapsamı değil ve yarım/yanlış yapılırsa "her
// yerde karışık dil" gibi daha kötü bir sonuç doğurur.
//
// Bunun yerine anahtar GERÇEK ve ÇALIŞIR bir tercihe bağlandı: veritabanında
// zaten HEM TR HEM EN olarak saklanan içerik (ör. resources.title_tr/title_en)
// artık kullanıcının seçtiği dile göre gösteriliyor — önceden bu tercih
// hiçbir yere bağlı değildi ve içerik ya hep TR gösteriliyordu ya da
// (Kaynaklar sayfasında olduğu gibi) iki dil yan yana basılıyordu. Tercih bir
// cookie'de tutulur, sunucu bileşenleri bunu doğrudan okur (localStorage
// değil — SSR'da ilk render'da doğru dili göstermek ve "yanıp sönme" olmadan
// çalışmak için).
// ============================================================================

export type UiLocale = "tr" | "en";

export const UI_LOCALE_COOKIE = "gocrm_ui_locale";

/** İkili (TR/EN) saklanan bir alan çiftinden, aktif dile göre metni seçer. */
export function pickLocaleText(locale: UiLocale, tr: string | null | undefined, en: string | null | undefined): string {
  if (locale === "en") {
    return (en && en.trim()) || tr || "";
  }
  return (tr && tr.trim()) || en || "";
}

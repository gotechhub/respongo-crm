import Image from "next/image";
import { PRODUCT_LOGO, RESPONGO_LOGO } from "@/lib/product-logos";

/**
 * Açık/koyu zemine göre otomatik logo değiştiren bileşen. JS/tema hook'u
 * gerektirmez — Tailwind'in `dark:` sınıfları <html>'deki `.dark` sınıfına
 * göre CSS seviyesinde geçiş yapar, bu yüzden Server Component'lerde de
 * (fiyat listeleri, teklif şablonları vb.) sorunsuz çalışır.
 *
 * product="respongo" → kurumsal logo. product="golms" | "golxp" | ... → ürün logosu.
 */
export function Logo({
  product,
  className,
  alt,
}: {
  product: "respongo" | keyof typeof PRODUCT_LOGO;
  className?: string;
  alt?: string;
}) {
  const pair = product === "respongo" ? RESPONGO_LOGO : PRODUCT_LOGO[product];
  if (!pair) return null;

  return (
    <>
      <Image
        src={pair.light.src}
        alt={alt ?? product}
        width={pair.light.width}
        height={pair.light.height}
        className={`${className ?? ""} dark:hidden`}
      />
      <Image
        src={pair.dark.src}
        alt={alt ?? product}
        width={pair.dark.width}
        height={pair.dark.height}
        className={`${className ?? ""} hidden dark:block`}
      />
    </>
  );
}

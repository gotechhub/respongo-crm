// respongo.com'dan indirilen gerçek ürün logoları — public/logos altında.
// Kaynak: kullanıcının D:\...\v2-26-08-2026\assets klasörü (site görselleri arşivi).
// Her ürünün hem normal (açık/renkli zemin için) hem white (koyu zemin / gece modu için)
// varyantı var — bkz. components/ui/logo.tsx (tema geçişini otomatik yapan bileşen).

export const PRODUCT_LOGO: Record<
  string,
  { light: { src: string; width: number; height: number }; dark: { src: string; width: number; height: number } }
> = {
  golms: {
    light: { src: "/logos/golms.avif", width: 385, height: 89 },
    dark: { src: "/logos/golms-white.avif", width: 342, height: 79 },
  },
  golxp: {
    light: { src: "/logos/golxp.avif", width: 324, height: 79 },
    dark: { src: "/logos/golxp-white.avif", width: 288, height: 70 },
  },
  gocatalog: {
    light: { src: "/logos/gocatalog.avif", width: 445, height: 58 },
    dark: { src: "/logos/gocatalog-white.avif", width: 396, height: 51 },
  },
  gofactory: {
    light: { src: "/logos/gofactory.avif", width: 449, height: 60 },
    dark: { src: "/logos/gofactory-white.avif", width: 399, height: 53 },
  },
  gotools: {
    light: { src: "/logos/gotools.avif", width: 444, height: 75 },
    dark: { src: "/logos/gotools-white.avif", width: 395, height: 67 },
  },
};

export const RESPONGO_LOGO = {
  light: { src: "/logos/respongo-color.avif", width: 288, height: 110 },
  dark: { src: "/logos/respongo-white.avif", width: 288, height: 110 },
};

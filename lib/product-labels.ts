// Ürün adı etiketleri — PROJE GENELİNDE TEK KAYNAK.
//
// ÖNEMLİ: Bu dosya kasıtlı olarak "use client" DEĞİL. Sunucu bileşenleri
// (ör. app/(dashboard)/support/page.tsx, app/(dashboard)/licenses/page.tsx)
// bu objeyi dinamik bir anahtarla (PRODUCT_LABEL[row.product]) okuyor.
//
// Daha önce PRODUCT_LABEL, "use client" ile işaretli ticket-form.tsx /
// license-form.tsx dosyalarından export ediliyordu. Next.js'in React Server
// Components modelinde bir "use client" dosyasının HER export'u (düz veri
// objeleri dahil) istemci tarafına opak bir referans olarak paketlenir; bir
// sunucu bileşeni bu objeye dinamik bir anahtarla (PRODUCT_LABEL['golms']
// gibi, sabit olmayan bir değişkenle) eriştiğinde React'in Flight
// serileştiricisi bunu yeni bir istemci referansı sanıp
// ".../ticket-form.tsx#PRODUCT_LABEL#golms" gibi var olmayan bir modül
// aramaya çalışıyor ve "Could not find the module ... in the React Client
// Manifest" hatasıyla sayfayı tamamen çöktürüyordu (Destek Merkezi'ne ve
// Lisanslar'a girerken alınan "server-side exception" hatasının kök nedeni
// buydu — bkz. digest 1888146048 ve ilişkili digest'ler).
//
// Çözüm: düz veri objelerini asla bir "use client" dosyasından sunucu
// bileşenine aktarma — bunun yerine burada, client olmayan paylaşılan bir
// dosyada tanımla. Hem client formları (ticket-form.tsx, license-form.tsx)
// hem sunucu sayfaları (page.tsx, [id]/page.tsx) buradan okur.
export type ProductKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools";

export const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

export const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL) as ProductKey[];

/**
 * KRİTİK: Bu dosyada KESİNLİKLE "use client" OLMAMALI.
 *
 * `parsePagination` sunucu (server) sayfa bileşenlerinde doğrudan çağrılan
 * saf bir yardımcı fonksiyondur. Daha önce `components/ui/pagination.tsx`
 * içinde (o dosya "use client" ile işaretli) tanımlıydı — bu, React Server
 * Components sınır kuralını ihlal ediyordu: bir "use client" modülünün TÜM
 * export'ları (bileşen olmayanlar dahil), o modül bir SUNUCU bileşeninde
 * import edildiğinde gerçek fonksiyon yerine bir "client reference" işaretçi
 * nesnesine dönüşür. Prodüksiyon build'inde bu işaretçi çağrılabilir bir
 * fonksiyon DEĞİLDİR — bu yüzden `parsePagination(...)` çağrısı üretimde
 * rastgele "(0 , x.y) is not a function" hatasına yol açıyordu (companies,
 * support, sales/proposals, marketing, sales/customers, contacts,
 * sales/leads, sales, finance, licenses, projects sayfalarının HEPSİ bu
 * dosyadan `parsePagination`'ı bir sunucu bileşeninde çağırıyordu).
 *
 * ÇÖZÜM (2026-09-03, kalıcı): `parsePagination`'ı "use client" İÇERMEYEN bu
 * ayrı dosyaya taşı. Böylece hem sunucu bileşenleri (page.tsx'ler) hem de
 * `components/ui/pagination.tsx` içindeki `Pagination` istemci bileşeni
 * bu dosyadan güvenle import edebilir — sınır ihlali ortadan kalkar.
 *
 * YENİ KURAL: Bundan sonra "use client" işaretli bir dosyadan React bileşeni
 * OLMAYAN (düz fonksiyon/sabit/yardımcı) hiçbir export, bir sunucu
 * bileşininde ASLA import edilip çağrılmamalı — böyle bir ihtiyaç çıkarsa
 * o yardımcı, "use client" İÇERMEYEN ayrı bir dosyaya taşınmalı.
 */

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Server component'lerde searchParams'tan page/pageSize okumak için ortak yardımcı. */
export function parsePagination(searchParams: { [key: string]: string | string[] | undefined }) {
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const rawPageSize = Array.isArray(searchParams.pageSize) ? searchParams.pageSize[0] : searchParams.pageSize;
  const page = Math.max(1, Number(rawPage) || 1);
  const pageSizeCandidate = Number(rawPageSize) || 20;
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeCandidate) ? pageSizeCandidate : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

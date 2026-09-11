// TCMB (Türkiye Cumhuriyet Merkez Bankası) döviz kuru bilgisi — kullanıcı
// isteği: "dashboard alanında merkez bankası dolar ve euro görebilelim
// anlık olarak." TCMB'nin resmi XML akışı iş günlerinde günde bir kez
// (öğle saatlerinde) güncellenir — piyasa "anlık"lığında değil ama
// istenen TAM OLARAK budur: bankaların kendi belirlediği efektif kur değil,
// TCMB'nin o günkü resmi kuru. Satış (ForexSelling) kuru gösteriliyor —
// bankaların döviz satarken kullandığı, halkın en çok bildiği referans kur.
export type TcmbRates = { usd: number | null; eur: number | null; date: string | null };

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

function extractForexSelling(xml: string, code: string): number | null {
  const blockMatch = xml.match(new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)</Currency>`));
  if (!blockMatch) return null;
  const sellingMatch = blockMatch[1].match(/<ForexSelling>\s*([\d.,]+)\s*<\/ForexSelling>/);
  if (!sellingMatch) return null;
  const value = parseFloat(sellingMatch[1].replace(",", "."));
  return Number.isNaN(value) ? null : value;
}

// Ağ hatası, zaman aşımı veya TCMB'nin geçici olarak erişilemez olması
// dashboard'un GERİ KALANINI ASLA bloklamamalı/çökertmemeli — bu yüzden her
// durumda (hata dahil) sessizce null alanlarla dönen bir sonuç üretir,
// hiçbir zaman reddetmez (Promise.all içinde diğer sorgularla birlikte
// güvenle kullanılabilsin diye).
export async function getTcmbRates(): Promise<TcmbRates> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let res: Response;
    try {
      res = await fetch(TCMB_URL, { signal: controller.signal, next: { revalidate: 3600 } });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      return { usd: null, eur: null, date: null };
    }
    const xml = await res.text();
    const dateMatch = xml.match(/Tarih_Date[^>]*Date="([^"]+)"/);
    return {
      usd: extractForexSelling(xml, "USD"),
      eur: extractForexSelling(xml, "EUR"),
      date: dateMatch?.[1] ?? null,
    };
  } catch {
    return { usd: null, eur: null, date: null };
  }
}

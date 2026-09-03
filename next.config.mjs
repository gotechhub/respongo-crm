/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // KRİTİK PRODÜKSİYON DÜZELTMESİ (2026-09-03): Sunucu tarafı minifikasyonu
    // Next.js 14.2.x'te bilinen bir webpack minifier hatasına (bkz. Next.js
    // GitHub issue'ları: rastgele "TypeError: (0 , x.y) is not a function"
    // hataları) yol açabiliyor — özellikle React Server Component sayfa
    // bundle'larında, birden fazla chunk'ın minifiye edilmiş değişken adları
    // çakıştığında ortaya çıkıyor. Bu, respongo-crm'de 26 Ağustos'tan beri
    // farklı sayfalarda (şirketler, destek, teklifler, pazarlama, müşteriler,
    // kişiler, lead'ler, satış havuzu) aralıklı "server-side exception"
    // çökmelerine yol açıyordu (bkz. Vercel runtime error digest'leri).
    // ÇÖZÜM: sunucu bundle'larının minifikasyonunu kapat — bundle boyutu
    // biraz artar ama bu sınıf hata tamamen ortadan kalkar. Bu, Next.js
    // ekibi ve topluluğu tarafından bu hata için belgelenmiş standart
    // geçici çözümdür.
    serverMinification: false,
  },
};

export default nextConfig;

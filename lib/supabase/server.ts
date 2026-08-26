import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// NOT: types/database.types.ts henüz gerçek şemadan generate edilmedi (placeholder).
// Bu yüzden <Database> generic'i şimdilik kullanılmıyor — build'i kırmamak için.
// `npx supabase gen types typescript` çalıştırılınca buraya geri eklenebilir.
//
// ÖNEMLİ: Next.js App Router, fetch() isteklerini varsayılan olarak cache'ler
// (Data Cache) — Supabase'in kendi istekleri de bunun dışında değil. Bu yüzden
// örn. bir profilin `role` alanı veritabanında değişse bile, sunucu tarafında
// eski (cache'lenmiş) sonuç dönebilir. `cache: "no-store"` ile bunu tamamen
// kapatıyoruz: her istek gerçek zamanlı, veritabanından taze veri getirir.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component — session refresh is handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // called from a Server Component — session refresh is handled by middleware
          }
        },
      },
    }
  );
}

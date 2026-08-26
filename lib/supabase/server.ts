import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// NOT: types/database.types.ts henüz gerçek şemadan generate edilmedi (placeholder).
// Bu yüzden <Database> generic'i şimdilik kullanılmıyor — build'i kırmamak için.
// `npx supabase gen types typescript` çalıştırılınca buraya geri eklenebilir.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

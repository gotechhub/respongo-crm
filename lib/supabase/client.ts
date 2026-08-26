import { createBrowserClient } from "@supabase/ssr";

// NOT: types/database.types.ts henüz gerçek şemadan generate edilmedi (placeholder).
// Bu yüzden <Database> generic'i şimdilik kullanılmıyor.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SADECE Server Action / Route Handler içinde kullanılır — asla client'a import edilmez.
// SUPABASE_SERVICE_ROLE_KEY, RLS'i tamamen bypass eder (kullanıcı davet etmek,
// başka bir kullanıcının adına profil güncellemek gibi admin işlemleri için gerekli).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}

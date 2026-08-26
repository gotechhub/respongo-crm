import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/roles";

// Bu layout kullanıcının rolünü/bölgesini her istekte veritabanından taze
// okumalı — Süper Admin bir rol atadığında sonuç anında yansımalı, bir
// önceki (cache'lenmiş) sayfa gösterilmemeli.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, role, region, is_active, created_at")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as ProfileRow | null;

  if (!typedProfile?.role) {
    // GEÇİCİ TEŞHİS BLOĞU — sorun çözülünce kaldırılacak.
    console.error("[dashboard-debug] role bos gorundu", {
      authUserId: user.id,
      authEmail: user.email,
      profile,
      profileError,
    });
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-md rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">
            Hesabın onay bekliyor
          </div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Giriş yaptın ({user.email}) ama hesabına henüz rol atanmadı. Süper
            Admin sana rol atadığı anda bu ekran otomatik değişecek.
          </p>
          <div className="mt-4 rounded-lg bg-rg-surface-alt p-3 text-left text-[10.5px] text-rg-ink-faint">
            <div>teşhis — auth id: {user.id}</div>
            <div>profil bulundu mu: {profile ? "evet" : "hayır"}</div>
            {profileError && (
              <div>hata: {profileError.message} (kod: {profileError.code})</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (typedProfile.is_active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">
            Hesabın pasif durumda
          </div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Erişimin geçici olarak kapatılmış. Sorun olduğunu düşünüyorsan
            Süper Admin ile iletişime geç.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[252px_1fr] bg-rg-bg">
      <Sidebar profile={typedProfile} />
      <main className="max-w-[1400px] px-[34px] pb-[60px] pt-[26px]">
        {children}
      </main>
    </div>
  );
}

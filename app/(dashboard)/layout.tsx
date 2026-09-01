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
    if (profileError) {
      // Sunucu loglarına düşer (kullanıcıya gösterilmez) — ileride benzer bir
      // sorun olursa Vercel Runtime Logs'tan teşhis etmek için.
      console.error("[dashboard] profil okunamadı", {
        authUserId: user.id,
        code: profileError.code,
        message: profileError.message,
      });
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">
            Hesabın onay bekliyor
          </div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Giriş yaptın ({user.email}) ama hesabına henüz rol atanmadı. Süper
            Admin sana rol atadığı anda bu ekran otomatik değişecek.
          </p>
        </div>
      </div>
    );
  }

  // "customer" rolü bu iç CRM arayüzünü hiç görmemeli — kendi portalına
  // yönlendirilir (bkz. app/(portal)).
  if (typedProfile.role === "customer") {
    redirect("/portal");
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

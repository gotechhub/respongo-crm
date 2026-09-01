import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/layout/portal-header";

// Müşteri Portalı — iç CRM'den (app/(dashboard)) TAMAMEN ayrı bir layout.
// Rol her istekte taze okunmalı (bir satışçı portal erişimini az önce
// kaldırmış olabilir).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as { role: string | null; is_active: boolean; full_name: string | null } | null;

  // Bu portal SADECE customer rolü için — bir ekip üyesi buraya gelirse
  // kendi paneline geri gönder.
  if (typedProfile?.role && typedProfile.role !== "customer") {
    redirect("/dashboard");
  }

  if (!typedProfile?.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">Hesabın onay bekliyor</div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Giriş yaptın ({user.email}) ama hesabına henüz erişim tanımlanmadı. Firman seninle ilgilenen
            kişiyle iletişime geçebilirsin.
          </p>
        </div>
      </div>
    );
  }

  if (typedProfile.is_active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">Erişimin pasif durumda</div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Portal erişimin geçici olarak kapatılmış. Sorun olduğunu düşünüyorsan firman seninle ilgilenen
            kişiyle iletişime geç.
          </p>
        </div>
      </div>
    );
  }

  const { data: link } = await supabase
    .from("customer_users")
    .select("customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!link) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rg-bg px-6">
        <div className="max-w-sm rounded-2xl border border-rg-line bg-rg-surface p-8 text-center shadow-rg">
          <div className="font-display text-lg font-bold text-rg-ink">Henüz bir hesaba bağlı değilsin</div>
          <p className="mt-2 text-[13px] text-rg-ink-soft">
            Giriş yaptın ({user.email}) ama hesabın henüz bir müşteri şirketiyle eşleştirilmemiş. Firman
            seninle ilgilenen kişiyle iletişime geçebilirsin.
          </p>
        </div>
      </div>
    );
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("company_name")
    .eq("id", link.customer_id)
    .single();

  return (
    <div className="min-h-screen bg-rg-bg">
      <PortalHeader companyName={customer?.company_name ?? "Portalım"} />
      <main className="mx-auto max-w-[900px] px-6 py-8">{children}</main>
    </div>
  );
}

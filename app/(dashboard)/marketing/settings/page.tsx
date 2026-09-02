import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { MarketingSettingsForm, type MarketingSettingsDisplay } from "./settings-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketingSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isFounder = profile?.role === "founder";

  if (!isFounder) {
    return (
      <>
        <Topbar title="Pazarlama Ayarları" subtitle="Brevo bülten bağlantısı" />
        <div className="rounded-2xl border border-rg-line bg-rg-surface p-6 text-[13px] text-rg-ink-soft shadow-rg">
          Bu sayfayı görüntüleme yetkin yok — pazarlama entegrasyon ayarları sadece Süper Admin tarafından yönetilir.
        </div>
      </>
    );
  }

  const { data: settingsRows } = await supabase.rpc("marketing_get_settings_display");
  const settings = (settingsRows?.[0] ?? null) as MarketingSettingsDisplay | null;

  return (
    <>
      <div className="mb-3">
        <Link
          href="/marketing"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pazarlamaya dön
        </Link>
      </div>
      <Topbar
        title="Pazarlama Ayarları"
        subtitle="Brevo bülten bağlantısı ve web sitesi lead webhook'u için gerekli bilgiler."
      />
      <MarketingSettingsForm settings={settings} />
    </>
  );
}

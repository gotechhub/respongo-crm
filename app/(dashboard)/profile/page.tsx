import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS_TR, REGION_LABELS_TR, type Region, type UserRole } from "@/lib/roles";
import { NotificationPrefsForm } from "./notification-prefs-form";
import type { DigestFrequency } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// V2 Revizeler bölüm H: "Mail bildirim ayarlarını herkes kendi profilinden
// ayarlayabilecek" gereksinimi için minimal bir profil sayfası. Fotoğraf yükleme,
// telefon/detaylı ayar düzenleme gibi TAM profil özellikleri bölüm I'nin (Kullanıcı
// Profili & Ayarlar) kapsamıdır — burada kasıtlı olarak sadece bölüm H'nin
// gereksinimi (bildirim tercihi) + salt-okunur kimlik bilgisi var (DERS 26: bir
// sonraki modülün işini burada erkenden yapmaya çalışmadık).
export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, region, email_notifications_enabled, notification_digest_frequency")
    .eq("id", user.id)
    .single();

  const p = profile as {
    full_name: string | null;
    email: string;
    role: UserRole | null;
    region: Region | null;
    email_notifications_enabled: boolean;
    notification_digest_frequency: DigestFrequency;
  } | null;

  return (
    <>
      <Topbar title="Profilim" subtitle="Hesap bilgilerin ve bildirim tercihlerin." />

      <div className="grid max-w-2xl gap-4">
        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[14px] font-bold text-rg-ink">Hesap Bilgileri</div>
          <div className="grid grid-cols-2 gap-4 text-[12.8px]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Ad Soyad</div>
              <div className="mt-0.5 text-rg-ink">{p?.full_name || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">E-posta</div>
              <div className="mt-0.5 text-rg-ink">{p?.email}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Rol</div>
              <div className="mt-0.5 text-rg-ink">{p?.role ? ROLE_LABELS_TR[p.role] : "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">Bölge</div>
              <div className="mt-0.5 text-rg-ink">{p?.region ? REGION_LABELS_TR[p.region] : "Global"}</div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-rg-ink-faint">
            Ad, fotoğraf ve diğer profil ayarları yakında (V2 Revizeler bölüm I) buraya eklenecek.
          </p>
        </div>

        <NotificationPrefsForm
          initialEnabled={p?.email_notifications_enabled ?? true}
          initialFrequency={p?.notification_digest_frequency ?? "daily"}
        />
      </div>
    </>
  );
}

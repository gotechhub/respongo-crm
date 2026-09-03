import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS_TR, REGION_LABELS_TR, type Region, type UserRole } from "@/lib/roles";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { NotificationPrefsForm } from "./notification-prefs-form";
import type { DigestFrequency } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// V2 Revizeler bölüm I: "Fotoğraf yükleme, detaylı profil ayarları (tüm kullanıcı
// tipleri), mail bildirim tercihleri." Bölüm H'de kurulan minimal sayfa (sadece
// bildirim tercihi) üzerine inşa edildi: avatar yükleme (AvatarUpload), Ad Soyad/
// Telefon düzenleme (ProfileInfoForm), şifre değiştirme (ChangePasswordForm) eklendi.
// Rol/bölge/e-posta bilinçli olarak salt-okunur kaldı (DERS 27/35: role/region/
// is_active/email artık trg_profiles_protect_admin_fields ile DB seviyesinde de
// kilitli — sadece founder/region_admin /users ekranından değiştirebilir).
// partner_tr/partner_global/freelancer rolleri için AYRI bir "detaylı ayar" seti
// İCAT EDİLMEDİ (DERS 26) — bu roller zaten kendi onboarding/panel verilerini
// partner_profiles + /partner ekranından yönetiyor, buraya sadece bir link eklendi.
const PARTNER_ROLES: UserRole[] = ["partner_tr", "partner_global", "freelancer"];

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, phone, avatar_url, role, region, email_notifications_enabled, notification_digest_frequency"
    )
    .eq("id", user.id)
    .single();

  const p = profile as {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: UserRole | null;
    region: Region | null;
    email_notifications_enabled: boolean;
    notification_digest_frequency: DigestFrequency;
  } | null;

  const displayName = p?.full_name || p?.email || "?";

  return (
    <>
      <Topbar title="Profilim" subtitle="Hesap bilgilerin, güvenlik ayarların ve bildirim tercihlerin." />

      <div className="grid max-w-2xl gap-4">
        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[14px] font-bold text-rg-ink">Hesap Bilgileri</div>

          <AvatarUpload userId={user.id} avatarUrl={p?.avatar_url ?? null} displayName={displayName} />

          <div className="my-4 h-px bg-rg-line" />

          <ProfileInfoForm initialFullName={p?.full_name ?? ""} initialPhone={p?.phone ?? ""} />

          <div className="mt-4 grid grid-cols-2 gap-4 text-[12.8px]">
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

          {p?.role && PARTNER_ROLES.includes(p.role) && (
            <Link
              href="/partner"
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
            >
              İş ortaklığı bilgilerin ve komisyon durumun için Panelim <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[14px] font-bold text-rg-ink">Şifre</div>
          <ChangePasswordForm />
        </div>

        <NotificationPrefsForm
          initialEnabled={p?.email_notifications_enabled ?? true}
          initialFrequency={p?.notification_digest_frequency ?? "daily"}
        />
      </div>
    </>
  );
}

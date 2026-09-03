import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// V2 Revizeler bölüm I: "detaylı profil ayarları (tüm kullanıcı tipleri)" —
// müşteri portalı için sadeleştirilmiş karşılığı. İç CRM'deki (/profile) rol/bölge/
// bildirim tercihi bölümleri burada YOK (customer rolü için anlamsız — DERS 26:
// generate_due_notifications() müşteri verisini taramıyor, dijest e-postası zaten
// hiçbir şey içermez). Avatar/isim/telefon/şifre değiştirme AYNI paylaşılan
// bileşenler ve action'lar (lib/profile/actions.ts) üzerinden çalışıyor.
export default async function PortalAccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url")
    .eq("id", user.id)
    .single();

  const p = profile as {
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;

  const displayName = p?.full_name || p?.email || "?";

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-display text-[19px] font-bold text-rg-ink">Hesabım</h1>
        <p className="mt-0.5 text-[12.8px] text-rg-ink-soft">Fotoğrafın, iletişim bilgilerin ve şifren.</p>
      </div>

      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-4 text-[14px] font-bold text-rg-ink">Hesap Bilgileri</div>

        <AvatarUpload userId={user.id} avatarUrl={p?.avatar_url ?? null} displayName={displayName} />

        <div className="my-4 h-px bg-rg-line" />

        <ProfileInfoForm initialFullName={p?.full_name ?? ""} initialPhone={p?.phone ?? ""} />

        <div className="mt-4 text-[12.8px]">
          <div className="text-[11px] font-semibold uppercase tracking-[.4px] text-rg-ink-faint">E-posta</div>
          <div className="mt-0.5 text-rg-ink">{p?.email}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-4 text-[14px] font-bold text-rg-ink">Şifre</div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

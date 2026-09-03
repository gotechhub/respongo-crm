import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, Region } from "@/lib/roles";
import { SystemSettingsForm } from "./settings-form";
import { ViewAsPanel } from "./view-as-panel";
import type { SystemSettingsInput } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuditLogRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  founder: { full_name: string | null; email: string } | null;
  target: { full_name: string | null; email: string } | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

function fmtDuration(startIso: string, endIso: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (minutes < 60) return minutes + " dk";
  return Math.floor(minutes / 60) + " sa " + (minutes % 60) + " dk";
}

// V2 Revizeler bölüm J: Sistem Ayarları genişletmesi + Master Admin View-As.
// FOUNDER-ONLY (aynı /users, /finance/settings, /marketing/settings gating
// deseni). View-As GERÇEK bir oturum devralma işlemidir (bkz.
// lib/view-as/actions.ts) — RLS'i yeniden simüle eden ayrı bir kod yazılmadı
// (DERS 26), founder'ın mevcut ALL erişimi zaten her tabloda var; view-as
// sırasında hedefin GERÇEK auth.uid()'i ile geziniyor.
export default async function SystemSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isFounder = callerProfile?.role === "founder";

  if (!isFounder) {
    return (
      <>
        <Topbar title="Sistem Ayarları" subtitle="Genel ayarlar ve Master Admin View-As" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfayı görüntüleme yetkin yok — sadece Süper Admin sistem ayarlarını yönetebilir.
        </div>
      </>
    );
  }

  const [{ data: settingsRow }, { data: candidateRows }, { data: logRows }] = await Promise.all([
    supabase.from("system_settings").select("*").eq("id", true).single(),
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, phone, role, region, is_active, created_at")
      .neq("role", "founder")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("view_as_audit_log")
      .select(
        "id, started_at, ended_at, founder:profiles!view_as_audit_log_founder_id_fkey(full_name,email), target:profiles!view_as_audit_log_target_profile_id_fkey(full_name,email)"
      )
      .order("started_at", { ascending: false })
      .limit(30),
  ]);

  const settings = settingsRow as {
    company_legal_name: string | null;
    default_currency: string;
    default_region: Region;
    fiscal_year_start_month: number;
    timezone: string;
    date_format: string;
    session_timeout_minutes: number;
    maintenance_mode: boolean;
    maintenance_message: string | null;
  } | null;

  const initialSettings: SystemSettingsInput = {
    companyLegalName: settings?.company_legal_name ?? "",
    defaultCurrency: settings?.default_currency ?? "USD",
    defaultRegion: settings?.default_region ?? "global",
    fiscalYearStartMonth: settings?.fiscal_year_start_month ?? 1,
    timezone: settings?.timezone ?? "Europe/Istanbul",
    dateFormat: settings?.date_format ?? "DD.MM.YYYY",
    sessionTimeoutMinutes: settings?.session_timeout_minutes ?? 480,
    maintenanceMode: settings?.maintenance_mode ?? false,
    maintenanceMessage: settings?.maintenance_message ?? "",
  };

  const candidates = (candidateRows ?? []) as ProfileRow[];
  const logs = (logRows ?? []) as unknown as AuditLogRow[];

  return (
    <>
      <Topbar title="Sistem Ayarları" subtitle="Genel ayarlar ve Master Admin View-As" />

      <div className="grid max-w-3xl gap-4">
        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-1 text-[14px] font-bold text-rg-ink">Genel Ayarlar</div>
          <p className="mb-4 text-[12.2px] text-rg-ink-soft">
            Şirket genelinde geçerli varsayılanlar — tüm kullanıcılar bu ayarları okuyabilir, sadece Süper Admin değiştirebilir.
          </p>
          <SystemSettingsForm initial={initialSettings} />
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-1 text-[14px] font-bold text-rg-ink">Master Admin View-As</div>
          <p className="mb-4 text-[12.2px] text-rg-ink-soft">
            Bir kullanıcı olarak görüntülemeye başladığında GERÇEK bir oturum devralırsın — o kullanıcının
            gördüğü/yapabildiği her şeyi birebir görürsün. Her görüntüleme denetim kaydına düşer.
          </p>
          <ViewAsPanel candidates={candidates} />
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[14px] font-bold text-rg-ink">View-As Geçmişi</div>
          <div className="overflow-x-auto rounded-[10px] border border-rg-line">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="bg-rg-surface-alt text-left">
                  <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Görüntülenen</th>
                  <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Başlangıç</th>
                  <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Süre</th>
                  <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-rg-line/60">
                    <td className="px-4 py-2.5 text-[12.5px] text-rg-ink">
                      {log.target?.full_name || log.target?.email || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[12.2px] text-rg-ink-soft">{fmtDateTime(log.started_at)}</td>
                    <td className="px-4 py-2.5 text-[12.2px] text-rg-ink-soft">{fmtDuration(log.started_at, log.ended_at)}</td>
                    <td className="px-4 py-2.5 text-[11.8px]">
                      {log.ended_at ? (
                        <span className="rounded-full bg-slate-soft px-2 py-0.5 font-semibold text-rg-ink-soft">Tamamlandı</span>
                      ) : (
                        <span className="rounded-full bg-golxp/15 px-2 py-0.5 font-semibold text-golxp">Devam ediyor</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                      Henüz bir view-as kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";
import { PartnerAdminTable, type PartnerAdminRow } from "./partner-admin-table";
import { CommissionPanel, type CommissionEntryRow } from "./commission-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PartnerProfileStub = {
  id: string;
  profile_id: string;
  company_name: string | null;
  country: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  commission_rate: number | null;
  status: "pending_review" | "active" | "suspended";
  admin_note: string | null;
};

export default async function PartnerAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isFounder = (callerProfile as { role: UserRole | null } | null)?.role === "founder";

  if (!isFounder) {
    return (
      <>
        <Topbar title="İş Ortakları" subtitle="Satış iş ortakları — onay, komisyon ve durum yönetimi" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfayı görüntüleme yetkin yok — sadece Süper Admin iş ortaklarını yönetebilir.
        </div>
      </>
    );
  }

  const { data: partnerAccounts } = await supabase
    .from("profiles")
    .select("id, full_name, email, region, role")
    .in("role", ["partner_tr", "partner_global"])
    .order("full_name", { ascending: true });

  const accounts = (partnerAccounts ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
    region: Region | null;
    role: UserRole | null;
  }[];
  const accountIds = accounts.map((a) => a.id);

  let partnerProfiles: PartnerProfileStub[] = [];
  if (accountIds.length > 0) {
    const { data } = await supabase
      .from("partner_profiles")
      .select("id, profile_id, company_name, country, onboarding_step, onboarding_completed_at, commission_rate, status, admin_note")
      .in("profile_id", accountIds);
    partnerProfiles = (data ?? []) as PartnerProfileStub[];
  }
  const profileByAccountId = new Map(partnerProfiles.map((p) => [p.profile_id, p]));

  const rows: PartnerAdminRow[] = accounts.map((a) => {
    const pp = profileByAccountId.get(a.id);
    return {
      partnerProfileId: pp?.id ?? "",
      profileId: a.id,
      fullName: a.full_name,
      email: a.email,
      region: a.region,
      companyName: pp?.company_name ?? null,
      country: pp?.country ?? null,
      onboardingStep: pp?.onboarding_step ?? 0,
      onboardingCompleted: !!pp?.onboarding_completed_at,
      commissionRate: pp?.commission_rate ?? null,
      status: pp?.status ?? "pending_review",
      adminNote: pp?.admin_note ?? null,
    };
  });

  // Henüz hiç giriş yapıp onboarding'e başlamamış (partner_profiles satırı
  // olmayan) hesaplar için satır gösterilir ama kaydet butonu, partnerProfileId
  // boş olduğundan (henüz oluşmadığından) devre dışı kalır — bu normaldir,
  // partner ilk kez /partner'ı açtığında satır otomatik oluşur.
  const activatableRows = rows.filter((r) => r.partnerProfileId);
  const pendingSetupRows = rows.filter((r) => !r.partnerProfileId);

  const { data: commissionRows } = await supabase
    .from("commission_entries")
    .select(
      "id, partner_id, proposal_id, commission_rate, amount, currency, status, paid_at, admin_note, created_at, proposals(title)"
    )
    .order("created_at", { ascending: false });

  const nameByAccountId = new Map(accounts.map((a) => [a.id, a.full_name || a.email]));
  const commissionEntries: CommissionEntryRow[] = ((commissionRows ?? []) as unknown as {
    id: string;
    partner_id: string;
    proposal_id: string;
    commission_rate: number;
    amount: number;
    currency: string;
    status: "unpaid" | "paid";
    paid_at: string | null;
    admin_note: string | null;
    created_at: string;
    proposals: { title: string } | null;
  }[]).map((c) => ({
    id: c.id,
    partnerId: c.partner_id,
    partnerName: nameByAccountId.get(c.partner_id) ?? "(bilinmeyen ortak)",
    proposalId: c.proposal_id,
    proposalTitle: c.proposals?.title ?? "(silinmiş teklif)",
    commissionRate: c.commission_rate,
    amount: c.amount,
    currency: c.currency,
    status: c.status,
    paidAt: c.paid_at,
    adminNote: c.admin_note,
    createdAt: c.created_at,
  }));

  return (
    <>
      <Topbar
        title="İş Ortakları"
        subtitle="Satış iş ortakları — onboarding durumu, komisyon oranı ve hesap durumu buradan yönetilir."
      />
      <PartnerAdminTable rows={activatableRows} />
      {pendingSetupRows.length > 0 && (
        <p className="mt-3 text-[11.5px] text-rg-ink-faint">
          {pendingSetupRows.map((r) => r.fullName || r.email).join(", ")} henüz ilk kez giriş yapıp kayıt
          sürecini başlatmadı — giriş yaptıklarında burada aktif hale gelecek.
        </p>
      )}

      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-[15px] font-bold text-rg-ink">Komisyon Takibi</h2>
          <p className="mt-1 text-[12px] text-rg-ink-faint">
            Bir teklif kabul edildiğinde, sahibi aktif bir iş ortağıysa komisyon tutarı otomatik hesaplanır.
            Ödeme yapıldığında durumu buradan &quot;Ödendi&quot; olarak işaretle.
          </p>
        </div>
        <CommissionPanel entries={commissionEntries} />
      </div>
    </>
  );
}

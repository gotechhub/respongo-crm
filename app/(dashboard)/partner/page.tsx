import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import { ensurePartnerProfile } from "./actions";
import { PartnerOnboardingWizard, type PartnerProfileRow } from "./onboarding-wizard";
import { PartnerPanel } from "./partner-panel";
import type { PartnerTaskRow } from "./tasks-widget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeadStub = { status: string; value_estimate: number | null; currency: string };
type ProposalStub = { status: string; total_amount: number | null; currency: string };

export default async function PartnerHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (callerProfile as { role: UserRole | null } | null)?.role;

  if (role !== "partner_tr" && role !== "partner_global") {
    return (
      <>
        <Topbar title="İş Ortağı Paneli" subtitle="Satış iş ortağı özel alanı" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfa sadece satış iş ortakları içindir.
        </div>
      </>
    );
  }

  const ensured = await ensurePartnerProfile();
  if (!ensured.ok) {
    return (
      <>
        <Topbar title="İş Ortağı Paneli" subtitle="Satış iş ortağı özel alanı" />
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-[12.5px] text-destructive">
          Profilin yüklenemedi: {ensured.error}
        </div>
      </>
    );
  }

  const { data: partnerProfileRow } = await supabase
    .from("partner_profiles")
    .select(
      "id, onboarding_step, onboarding_completed_at, company_name, tax_no, website, country, address, bank_name, bank_account_name, iban, swift, product_interests, agreement_accepted_at, commission_rate, status, admin_note"
    )
    .eq("profile_id", user.id)
    .single();

  const partnerProfile = partnerProfileRow as PartnerProfileRow;

  if (!partnerProfile.onboarding_completed_at) {
    return (
      <>
        <Topbar title="İş Ortağı Kaydı" subtitle="Platforma erişim için 5 adımlık kısa bir kayıt süreci" />
        <PartnerOnboardingWizard partnerProfile={partnerProfile} />
      </>
    );
  }

  const [poolRes, leadsRes, customersRes, proposalsRes, tasksRes, resourcesCountRes] = await Promise.all([
    supabase.from("customer_pool").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("leads").select("status, value_estimate, currency").eq("owner_id", user.id),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_active", true),
    supabase.from("proposals").select("status, total_amount, currency").eq("owner_id", user.id),
    supabase
      .from("partner_tasks")
      .select("id, title, description, due_date, status")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("resources").select("id", { count: "exact", head: true }),
  ]);

  const leads = (leadsRes.data ?? []) as LeadStub[];
  const openLeads = leads.filter((l) => l.status !== "musteri" && l.status !== "kaybedildi");
  const pipelineByCurrency: Record<string, number> = {};
  openLeads.forEach((l) => {
    const cur = l.currency || "USD";
    pipelineByCurrency[cur] = (pipelineByCurrency[cur] ?? 0) + Number(l.value_estimate || 0);
  });
  const pipelineText = Object.entries(pipelineByCurrency).length
    ? Object.entries(pipelineByCurrency)
        .map(([c, v]) => `${c} ${Math.round(v).toLocaleString("tr-TR")}`)
        .join(" · ")
    : "—";

  const proposals = (proposalsRes.data ?? []) as ProposalStub[];
  const wonByCurrency: Record<string, number> = {};
  proposals
    .filter((p) => p.status === "accepted")
    .forEach((p) => {
      const cur = p.currency || "USD";
      wonByCurrency[cur] = (wonByCurrency[cur] ?? 0) + Number(p.total_amount || 0);
    });
  const proposalsWonText = Object.entries(wonByCurrency).length
    ? Object.entries(wonByCurrency)
        .map(([c, v]) => `${c} ${Math.round(v).toLocaleString("tr-TR")}`)
        .join(" · ")
    : "—";

  return (
    <>
      <Topbar title="İş Ortağı Panelim" subtitle="Kendi lead/müşteri/teklif durumun ve görevlerin" />
      <PartnerPanel
        partnerProfile={partnerProfile}
        stats={{
          poolCount: poolRes.count ?? 0,
          openLeadCount: openLeads.length,
          pipelineText,
          activeCustomerCount: customersRes.count ?? 0,
          proposalsWonText,
        }}
        tasks={(tasksRes.data ?? []) as PartnerTaskRow[]}
        resourceCount={resourcesCountRes.count ?? 0}
      />
    </>
  );
}

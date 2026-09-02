import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, Region, UserRole } from "@/lib/roles";
import { TeamTable, type TeamMemberStats } from "./team-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeadStub = { owner_id: string | null; status: string; value_estimate: number | null; currency: string };
type PoolStub = { owner_id: string | null };
type CustomerStub = { owner_id: string | null; is_active: boolean };
type ProposalStub = { owner_id: string | null; status: string; total_amount: number | null; currency: string };

export default async function SalesTeamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";
  const isRegionAdmin = caller?.role === "region_admin";

  if (!isFounder && !isRegionAdmin) {
    return (
      <>
        <Topbar title="Satış Ekibi" subtitle="Ekip üyeleri, atanan lead'ler ve devir işlemleri" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfayı görüntüleme yetkin yok — sadece Süper Admin ve Bölge Yöneticileri satış ekibini yönetebilir.
        </div>
      </>
    );
  }

  let memberQuery = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, role, region, is_active, created_at")
    .eq("role", "sales_inhouse")
    .order("full_name", { ascending: true });
  if (isRegionAdmin && caller?.region) {
    memberQuery = memberQuery.eq("region", caller.region);
  }
  const { data: memberRows } = await memberQuery;
  const members = (memberRows ?? []) as ProfileRow[];
  const memberIds = members.map((m) => m.id);

  const statsByOwner: Record<string, TeamMemberStats> = {};
  members.forEach((m) => {
    statsByOwner[m.id] = {
      poolCount: 0,
      openLeadCount: 0,
      pipelineText: "—",
      activeCustomerCount: 0,
      proposalsSentCount: 0,
      proposalsWonText: "—",
    };
  });

  if (memberIds.length > 0) {
    const [poolRes, leadsRes, customersRes, proposalsRes] = await Promise.all([
      supabase.from("customer_pool").select("owner_id").in("owner_id", memberIds),
      supabase.from("leads").select("owner_id, status, value_estimate, currency").in("owner_id", memberIds),
      supabase.from("customers").select("owner_id, is_active").in("owner_id", memberIds),
      supabase.from("proposals").select("owner_id, status, total_amount, currency").in("owner_id", memberIds),
    ]);

    const pipelineByOwner: Record<string, Record<string, number>> = {};
    const wonByOwner: Record<string, Record<string, number>> = {};

    (poolRes.data as PoolStub[] | null ?? []).forEach((p) => {
      if (p.owner_id && statsByOwner[p.owner_id]) statsByOwner[p.owner_id].poolCount += 1;
    });

    (leadsRes.data as LeadStub[] | null ?? []).forEach((l) => {
      if (!l.owner_id || !statsByOwner[l.owner_id]) return;
      if (l.status !== "musteri" && l.status !== "kaybedildi") {
        statsByOwner[l.owner_id].openLeadCount += 1;
        const cur = l.currency || "USD";
        pipelineByOwner[l.owner_id] = pipelineByOwner[l.owner_id] ?? {};
        pipelineByOwner[l.owner_id][cur] = (pipelineByOwner[l.owner_id][cur] ?? 0) + Number(l.value_estimate || 0);
      }
    });

    (customersRes.data as CustomerStub[] | null ?? []).forEach((c) => {
      if (c.owner_id && c.is_active && statsByOwner[c.owner_id]) statsByOwner[c.owner_id].activeCustomerCount += 1;
    });

    (proposalsRes.data as ProposalStub[] | null ?? []).forEach((p) => {
      if (!p.owner_id || !statsByOwner[p.owner_id]) return;
      if (p.status !== "draft") statsByOwner[p.owner_id].proposalsSentCount += 1;
      if (p.status === "accepted") {
        const cur = p.currency || "USD";
        wonByOwner[p.owner_id] = wonByOwner[p.owner_id] ?? {};
        wonByOwner[p.owner_id][cur] = (wonByOwner[p.owner_id][cur] ?? 0) + Number(p.total_amount || 0);
      }
    });

    Object.entries(pipelineByOwner).forEach(([ownerId, byCurrency]) => {
      statsByOwner[ownerId].pipelineText = Object.entries(byCurrency)
        .map(([c, v]) => `${c} ${Math.round(v).toLocaleString("tr-TR")}`)
        .join(" · ");
    });
    Object.entries(wonByOwner).forEach(([ownerId, byCurrency]) => {
      statsByOwner[ownerId].proposalsWonText = Object.entries(byCurrency)
        .map(([c, v]) => `${c} ${Math.round(v).toLocaleString("tr-TR")}`)
        .join(" · ");
    });
  }

  return (
    <>
      <Topbar
        title="Satış Ekibi"
        subtitle={
          isFounder
            ? "Tüm bölgelerdeki satış ekibi — atanan lead'leri gör, gerekirse başka bir üyeye devret."
            : "Bölgendeki satış ekibi — atanan lead'leri gör, gerekirse başka bir üyeye devret."
        }
      />
      <TeamTable members={members} stats={statsByOwner} />
    </>
  );
}

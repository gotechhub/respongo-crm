import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/shared/kpi-card";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtNumber(n: number) {
  return n.toLocaleString("tr-TR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

type LeadStatus = "yeni" | "gorusme" | "teklif" | "musteri" | "kaybedildi";
type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

type LeadRow = {
  id: string;
  company_name: string;
  status: LeadStatus;
  value_estimate: number | null;
  currency: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
};

type ProposalRow = {
  id: string;
  title: string;
  status: ProposalStatus;
  total_amount: number;
  currency: string;
  created_at: string;
};

type Activity = {
  id: string;
  label: string;
  meta: string;
  href: string;
  created_at: string;
  dotClass: string;
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  yeni: "Yeni",
  gorusme: "Görüşme",
  teklif: "Teklif",
  musteri: "Müşteriye Döndü",
  kaybedildi: "Kaybedildi",
};

export default async function SalesPerformancePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region, full_name")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as
    | { role: UserRole | null; region: Region | null; full_name: string | null }
    | null;
  const firstName = caller?.full_name?.split(" ")[0] ?? "";

  const now = new Date();
  const last7Iso = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [poolRes, leadsRes, customersRes, proposalsRes] = await Promise.all([
    supabase.from("customer_pool").select("id, created_at").eq("owner_id", user.id),
    supabase
      .from("leads")
      .select("id, company_name, status, value_estimate, currency, created_at")
      .eq("owner_id", user.id),
    supabase.from("customers").select("id, company_name, is_active, created_at").eq("owner_id", user.id),
    supabase
      .from("proposals")
      .select("id, title, status, total_amount, currency, created_at")
      .eq("owner_id", user.id),
  ]);

  const pool = (poolRes.data ?? []) as { id: string; created_at: string }[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];
  const proposals = (proposalsRes.data ?? []) as ProposalRow[];

  const statusCounts: Record<LeadStatus, number> = { yeni: 0, gorusme: 0, teklif: 0, musteri: 0, kaybedildi: 0 };
  leads.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
  });
  const openLeadsCount = statusCounts.yeni + statusCounts.gorusme + statusCounts.teklif;
  const leadsNew7 = leads.filter((l) => l.created_at >= last7Iso).length;

  const pipelineByCurrency: Record<string, number> = {};
  leads
    .filter((l) => l.status !== "musteri" && l.status !== "kaybedildi")
    .forEach((l) => {
      const cur = l.currency || "USD";
      pipelineByCurrency[cur] = (pipelineByCurrency[cur] ?? 0) + Number(l.value_estimate || 0);
    });
  const pipelineText = Object.entries(pipelineByCurrency).length
    ? Object.entries(pipelineByCurrency)
        .map(([c, v]) => `${c} ${fmtNumber(Math.round(v))}`)
        .join(" · ")
    : "—";

  const activeCustomers = customers.filter((c) => c.is_active);
  const customersThisMonth = customers.filter((c) => c.created_at >= thisMonthStart).length;
  const customersNew7 = customers.filter((c) => c.created_at >= last7Iso).length;

  const conversionRate = leads.length > 0 ? Math.round((statusCounts.musteri / leads.length) * 100) : 0;

  const proposalStatusCounts: Record<ProposalStatus, number> = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
  };
  proposals.forEach((p) => {
    proposalStatusCounts[p.status] = (proposalStatusCounts[p.status] ?? 0) + 1;
  });
  const wonByCurrency: Record<string, number> = {};
  proposals
    .filter((p) => p.status === "accepted")
    .forEach((p) => {
      const cur = p.currency || "USD";
      wonByCurrency[cur] = (wonByCurrency[cur] ?? 0) + Number(p.total_amount || 0);
    });
  const wonText = Object.entries(wonByCurrency).length
    ? Object.entries(wonByCurrency)
        .map(([c, v]) => `${c} ${fmtNumber(Math.round(v))}`)
        .join(" · ")
    : "—";
  const decidedProposals = proposalStatusCounts.accepted + proposalStatusCounts.rejected;
  const winRate = decidedProposals > 0 ? Math.round((proposalStatusCounts.accepted / decidedProposals) * 100) : 0;

  const activity: Activity[] = [
    ...leads.slice(0, 8).map<Activity>((l) => ({
      id: `lead-${l.id}`,
      label: l.company_name,
      meta: `Lead — durum: ${STATUS_LABEL[l.status]}`,
      href: "/sales/leads",
      created_at: l.created_at,
      dotClass: "bg-golxp",
    })),
    ...customers.slice(0, 8).map<Activity>((c) => ({
      id: `customer-${c.id}`,
      label: c.company_name,
      meta: "Müşteri kazanıldı",
      href: `/sales/customers/${c.id}`,
      created_at: c.created_at,
      dotClass: "bg-gofactory",
    })),
    ...proposals.slice(0, 8).map<Activity>((p) => ({
      id: `proposal-${p.id}`,
      label: p.title,
      meta: `Teklif — ${p.status}`,
      href: `/sales/proposals/${p.id}`,
      created_at: p.created_at,
      dotClass: "bg-golms",
    })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  return (
    <>
      <Topbar
        title="Performansım"
        subtitle={
          firstName
            ? `${firstName}, kendi havuz/lead/müşteri/teklif kayıtların — sadece sana ait kayıtlar.`
            : "Kendi havuz/lead/müşteri/teklif kayıtların — sadece sana ait kayıtlar."
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Havuz Kaydı"
          value={fmtNumber(pool.length)}
          delta="toplam"
          trend="up"
          ringColor="#5E17EB"
          ringPercent={Math.min(100, pool.length)}
        />
        <KpiCard
          label="Açık Lead"
          value={fmtNumber(openLeadsCount)}
          delta={`${leadsNew7} yeni (7 gün)`}
          trend={leadsNew7 > 0 ? "up" : "down"}
          ringColor="#B9790E"
          ringPercent={Math.min(100, openLeadsCount)}
        />
        <KpiCard
          label="Aktif Müşteri"
          value={fmtNumber(activeCustomers.length)}
          delta={`${customersNew7} yeni (7 gün)`}
          trend={customersNew7 > 0 ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, activeCustomers.length)}
        />
        <KpiCard
          label="Dönüşüm Oranı"
          value={`%${conversionRate}`}
          delta={`${statusCounts.musteri} / ${leads.length} lead`}
          trend={conversionRate > 0 ? "up" : "down"}
          ringColor="hsl(var(--primary))"
          ringPercent={conversionRate}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <KpiCard
          label="Bu Ay Kazanılan Müşteri"
          value={fmtNumber(customersThisMonth)}
          delta="bu ay"
          trend={customersThisMonth > 0 ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, customersThisMonth * 10)}
        />
        <div className="col-span-3 grid grid-cols-2 gap-4">
          <div className="flex flex-col justify-center rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
            <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
              Pipeline Değeri (açık lead&apos;ler)
            </div>
            <div className="font-display text-[19px] font-bold text-rg-ink">{pipelineText}</div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
            <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
              Kazanılan Teklif Değeri
            </div>
            <div className="font-display text-[19px] font-bold text-rg-ink">{wonText}</div>
            <div className="mt-1 text-[11px] text-rg-ink-faint">
              Kazanma oranı: %{winRate} ({proposalStatusCounts.accepted}/{decidedProposals || 0} karara bağlanan)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Son Aktivitelerim</div>
          {activity.length === 0 ? (
            <p className="text-[12px] text-rg-ink-faint">Henüz aktivite yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-rg-surface-alt"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.dotClass}`} />
                    <div>
                      <div className="text-[12.5px] font-semibold text-rg-ink">{a.label}</div>
                      <div className="text-[11px] text-rg-ink-faint">{a.meta}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-rg-ink-faint">{fmtDate(a.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Lead Durum Dağılımım</div>
          <div className="flex flex-col gap-2.5">
            {(
              [
                ["yeni", "Yeni", "bg-golms"],
                ["gorusme", "Görüşme", "bg-gocatalog"],
                ["teklif", "Teklif", "bg-golxp"],
                ["musteri", "Müşteriye Döndü", "bg-gofactory"],
                ["kaybedildi", "Kaybedildi", "bg-rg-ink-faint"],
              ] as [LeadStatus, string, string][]
            ).map(([key, label, dot]) => {
              const total = leads.length || 1;
              const pct = Math.round((statusCounts[key] / total) * 100);
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="w-[110px] shrink-0 text-[11.5px] text-rg-ink-soft">{label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rg-surface-alt">
                    <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[11.5px] font-semibold text-rg-ink">
                    {statusCounts[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="mb-4 text-[13px] font-bold text-rg-ink">Tekliflerim</div>
        {proposals.length === 0 ? (
          <p className="text-[12px] text-rg-ink-faint">Henüz teklif oluşturmadın.</p>
        ) : (
          <div className="grid grid-cols-5 gap-3 text-center">
            {(
              [
                ["draft", "Taslak"],
                ["sent", "Gönderildi"],
                ["accepted", "Kabul Edildi"],
                ["rejected", "Reddedildi"],
                ["expired", "Süresi Doldu"],
              ] as [ProposalStatus, string][]
            ).map(([key, label]) => (
              <div key={key} className="rounded-[10px] bg-rg-surface-alt p-3">
                <div className="font-display text-[20px] font-bold text-rg-ink">{proposalStatusCounts[key]}</div>
                <div className="mt-1 text-[10.8px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

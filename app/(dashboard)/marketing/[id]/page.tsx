import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region, type UserRole } from "@/lib/roles";
import { CAMPAIGN_CHANNEL_LABEL } from "../campaign-form";
import { CampaignStatusPanel } from "./campaign-status-panel";
import { CampaignLeadsPanel, type AttachedLead } from "./campaign-leads-panel";
import type { CampaignChannel, CampaignInput, CampaignStatus } from "../actions";
import type { ProductKey } from "../../sales/proposals/actions";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="text-[12.8px] text-rg-ink">{value || "—"}</span>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="font-display text-[20px] font-bold text-rg-ink">{value}</span>
      {sub && <span className="text-[11px] text-rg-ink-faint">{sub}</span>}
    </div>
  );
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: campaign } = await supabase.from("marketing_campaigns").select("*").eq("id", params.id).single();
  if (!campaign) {
    notFound();
  }

  const [{ data: callerProfile }, { data: attachedLeadsRaw }] = await Promise.all([
    supabase.from("profiles").select("role, region").eq("id", user.id).single(),
    supabase
      .from("leads")
      .select("id, company_name, contact_name, status, converted_customer_id")
      .eq("campaign_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";
  const attachedLeads = (attachedLeadsRaw ?? []) as AttachedLead[];

  const leadIds = attachedLeads.map((l) => l.id);
  const customerIds = Array.from(new Set(attachedLeads.map((l) => l.converted_customer_id).filter(Boolean))) as string[];

  const orParts: string[] = [];
  if (leadIds.length > 0) orParts.push(`lead_id.in.(${leadIds.join(",")})`);
  if (customerIds.length > 0) orParts.push(`customer_id.in.(${customerIds.join(",")})`);

  const revenueByCurrency: Record<string, number> = {};
  if (orParts.length > 0) {
    const { data: acceptedProposals } = await supabase
      .from("proposals")
      .select("total_amount, currency")
      .eq("status", "accepted")
      .or(orParts.join(","));
    (acceptedProposals ?? []).forEach((p) => {
      revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] ?? 0) + Number(p.total_amount);
    });
  }

  const ownerNames: Record<string, string> = {};
  const ownerIds = [campaign.owner_id, campaign.created_by].filter(Boolean) as string[];
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(new Set(ownerIds)));
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  const leadCount = attachedLeads.length;
  const convertedCount = attachedLeads.filter((l) => l.converted_customer_id).length;
  const conversionRate = leadCount > 0 ? Math.round((convertedCount / leadCount) * 100) : 0;
  const cpl = leadCount > 0 && campaign.budget > 0 ? campaign.budget / leadCount : null;
  const revenueSummary = Object.entries(revenueByCurrency)
    .map(([currency, amount]) => fmtMoney(amount, currency))
    .join(" + ");

  const initial: CampaignInput = {
    name: campaign.name,
    channel: campaign.channel as CampaignChannel,
    product: (campaign.product as ProductKey | null) ?? "",
    region: (campaign.region as Region | null) ?? "",
    budget: Number(campaign.budget) || 0,
    currency: campaign.currency,
    startDate: campaign.start_date ?? "",
    endDate: campaign.end_date ?? "",
    goalLeads: campaign.goal_leads,
    description: campaign.description ?? "",
    ownerId: campaign.owner_id,
  };

  return (
    <>
      <Link
        href="/marketing"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Pazarlamaya dön
      </Link>
      <Topbar title={campaign.name} subtitle={CAMPAIGN_CHANNEL_LABEL[campaign.channel as CampaignChannel]} />

      <CampaignStatusPanel
        campaignId={campaign.id}
        initialStatus={campaign.status as CampaignStatus}
        initial={initial}
        regionLocked={isFounder ? null : caller?.region ?? null}
      />

      <div className="mt-5 grid grid-cols-4 gap-4">
        <MetricCard label="Lead Sayısı" value={String(leadCount)} sub={campaign.goal_leads ? `Hedef: ${campaign.goal_leads}` : undefined} />
        <MetricCard label="Dönüşen Müşteri" value={String(convertedCount)} sub={`%${conversionRate} dönüşüm`} />
        <MetricCard label="Lead Başı Maliyet" value={cpl !== null ? fmtMoney(cpl, campaign.currency) : "—"} />
        <MetricCard label="Kazanılan Gelir" value={revenueSummary || "—"} sub="Kabul edilen tekliflerden" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Kampanya Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Kanal" value={CAMPAIGN_CHANNEL_LABEL[campaign.channel as CampaignChannel]} />
            <InfoField label="Ürün" value={campaign.product ? PRODUCT_LABEL[campaign.product as ProductKey] : "Genel ekosistem"} />
            <InfoField label="Bölge" value={campaign.region ? REGION_LABELS_TR[campaign.region as Region] : "Global"} />
            <InfoField label="Bütçe" value={fmtMoney(Number(campaign.budget) || 0, campaign.currency)} />
            <InfoField label="Başlangıç" value={fmtDate(campaign.start_date)} />
            <InfoField label="Bitiş" value={fmtDate(campaign.end_date)} />
            <InfoField label="Sahibi" value={campaign.owner_id ? ownerNames[campaign.owner_id] : "Atanmamış"} />
            <InfoField label="Oluşturan" value={campaign.created_by ? ownerNames[campaign.created_by] : "—"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(campaign.created_at)} />
          </div>
          {campaign.description && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <InfoField label="Açıklama" value={campaign.description} />
            </div>
          )}
        </div>

        <CampaignLeadsPanel campaignId={campaign.id} attached={attachedLeads} />
      </div>
    </>
  );
}

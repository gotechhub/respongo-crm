import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region, type UserRole } from "@/lib/roles";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { RegionFilter } from "@/components/ui/region-filter";
import { CampaignCreateForm, CAMPAIGN_CHANNEL_LABEL } from "./campaign-form";
import type { CampaignChannel, CampaignStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CampaignRow = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  region: Region | null;
  budget: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  planned: "Planlandı",
  active: "Aktif",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

const STATUS_CLASS: Record<CampaignStatus, string> = {
  planned: "bg-rg-surface-alt text-rg-ink-faint",
  active: "bg-gofactory-tint text-gofactory",
  paused: "bg-gocatalog-tint text-gocatalog",
  completed: "bg-golxp-tint text-golxp",
  cancelled: "bg-destructive/10 text-destructive",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role, region").eq("id", user.id).single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const regionFilter = typeof searchParams.region === "string" ? (searchParams.region as Region) : "";

  let query = supabase
    .from("marketing_campaigns")
    .select("id, name, channel, status, region, budget, currency, start_date, end_date, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (regionFilter) {
    query = query.eq("region", regionFilter);
  }

  const { data: campaigns, count } = await query.range(from, to);
  const rows = (campaigns ?? []) as CampaignRow[];

  const campaignIds = rows.map((r) => r.id);
  const leadCounts: Record<string, number> = {};
  if (campaignIds.length > 0) {
    const { data: leadRows } = await supabase.from("leads").select("campaign_id").in("campaign_id", campaignIds);
    (leadRows ?? []).forEach((l) => {
      if (l.campaign_id) leadCounts[l.campaign_id] = (leadCounts[l.campaign_id] ?? 0) + 1;
    });
  }

  return (
    <>
      <Topbar
        title="Pazarlama"
        subtitle="Kampanyaları planla, bütçeyi takip et, hangi kanalın ne kadar lead getirdiğini gör."
      />
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
            <SearchInput placeholder="Kampanya adı ara..." />
          </Suspense>
          {isFounder && (
            <Suspense fallback={<div className="h-[38px] w-[140px]" />}>
              <RegionFilter />
            </Suspense>
          )}
        </div>
      </div>

      <CampaignCreateForm defaultRegion={isFounder ? null : caller?.region ?? null} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Kampanya
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Kanal
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bölge
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bütçe
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Lead
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tarih Aralığı
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-rg-line">
                  <td className="px-4 py-3">
                    <Link
                      href={`/marketing/${row.id}`}
                      className="text-[12.8px] font-semibold text-rg-ink hover:text-primary"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{CAMPAIGN_CHANNEL_LABEL[row.channel]}</td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.region ? REGION_LABELS_TR[row.region] : "Global"}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {fmtMoney(row.budget, row.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {leadCounts[row.id] ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " +
                        STATUS_CLASS[row.status]
                      }
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">
                    {fmtDate(row.start_date)} – {fmtDate(row.end_date)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q || regionFilter
                      ? "Aramanla eşleşen kampanya yok."
                      : "Henüz kampanya yok — yukarıdan yeni bir kampanya ekleyebilirsin."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Suspense fallback={<div className="h-[52px]" />}>
          <Pagination totalCount={count ?? 0} page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </>
  );
}

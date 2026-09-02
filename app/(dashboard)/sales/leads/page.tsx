import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";
import { parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { RegionTabs } from "@/components/ui/region-tabs";
import { LeadsTable, type LeadRow } from "./leads-table";
import { LeadsImportPanel } from "./import-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user?.id ?? "")
    .single();
  const myRole = (callerProfile as { role: UserRole | null; region: Region | null } | null)?.role ?? null;
  const isFounder = myRole === "founder";
  const isManager = isFounder || myRole === "region_admin";
  const currentRegion = ((callerProfile as { region: Region | null } | null)?.region ?? "") as Region | "";

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const regionFilter = typeof searchParams.region === "string" ? (searchParams.region as Region) : "";

  let query = supabase
    .from("leads")
    .select(
      "id, company_name, contact_name, contact_email, status, value_estimate, currency, region, owner_id, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);
  }
  if (regionFilter) {
    query = query.eq("region", regionFilter);
  }

  const { data: leads, count } = await query.range(from, to);
  const rows = (leads ?? []) as LeadRow[];

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  return (
    <>
      <Topbar
        title="Müşteri Adayları"
        subtitle="Havuzdan gelen ya da doğrudan açılan lead'ler — pipeline durumunu buradan yönet."
      />
      <div className="mb-3 flex items-center gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Firma, kişi veya e-posta ara..." />
        </Suspense>
        {isFounder && (
          <Suspense fallback={<div className="h-[38px] w-[140px]" />}>
            <RegionTabs />
          </Suspense>
        )}
      </div>
      <LeadsImportPanel isFounder={isFounder} isManager={isManager} currentRegion={currentRegion} />
      <LeadsTable rows={rows} ownerNames={ownerNames} pagination={{ totalCount: count ?? 0, page, pageSize }} />
    </>
  );
}

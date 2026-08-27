import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";
import { parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { RegionFilter } from "@/components/ui/region-filter";
import { PoolTable, type PoolRow } from "./pool-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerPoolPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user?.id ?? "")
    .single();
  const isFounder = (me as { role: string | null } | null)?.role === "founder";

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const regionFilter = typeof searchParams.region === "string" ? (searchParams.region as Region) : "";

  let query = supabase
    .from("customer_pool")
    .select(
      "id, company_name, contact_name, contact_email, contact_phone, source, country, region, owner_id, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);
  }
  if (regionFilter) {
    query = query.eq("region", regionFilter);
  }

  const { data: pool, count } = await query.range(from, to);
  const rows = (pool ?? []) as PoolRow[];

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
        title="Müşteri Havuzu"
        subtitle="Ham/işlenmemiş kayıtlar burada toplanır, buradan Müşteri Adayı'na (lead) çevrilir."
      />
      <div className="mb-3 flex items-center gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Firma, kişi veya e-posta ara..." />
        </Suspense>
        {isFounder && (
          <Suspense fallback={<div className="h-[38px] w-[140px]" />}>
            <RegionFilter />
          </Suspense>
        )}
      </div>
      <PoolTable
        rows={rows}
        ownerNames={ownerNames}
        defaultRegion={(me?.region as PoolRow["region"]) ?? null}
        pagination={{ totalCount: count ?? 0, page, pageSize }}
      />
    </>
  );
}

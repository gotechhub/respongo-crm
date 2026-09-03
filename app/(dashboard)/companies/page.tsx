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
import { CompanyCreateForm } from "./company-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompanyRow = {
  id: string;
  name: string;
  legal_name: string | null;
  website: string | null;
  industry: string | null;
  region: Region | null;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CompaniesPage({
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

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const regionFilter = typeof searchParams.region === "string" ? (searchParams.region as Region) : "";

  let query = supabase
    .from("companies")
    .select("id, name, legal_name, website, industry, region, owner_id, is_active, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,legal_name.ilike.%${q}%,website.ilike.%${q}%,tax_no.ilike.%${q}%`);
  }
  if (regionFilter) {
    query = query.eq("region", regionFilter);
  }

  const { data: companies, count } = await query.range(from, to);
  const rows = (companies ?? []) as CompanyRow[];

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  return (
    <>
      <Topbar title="Şirketler" subtitle="Merkezi şirket dizini — satış hunisinden bağımsız, tüm ilişkilerin çatısı." />
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
            <SearchInput placeholder="Şirket adı, ünvan, web sitesi, vergi no ara..." />
          </Suspense>
          {isFounder && (
            <Suspense fallback={<div className="h-[38px] w-[140px]" />}>
              <RegionFilter />
            </Suspense>
          )}
        </div>
      </div>

      <CompanyCreateForm defaultRegion={caller?.region ?? null} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Şirket
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Sektör
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bölge
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Sahibi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-rg-line">
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${row.id}`}
                      className="text-[12.8px] font-semibold text-rg-ink hover:text-primary"
                    >
                      {row.name}
                    </Link>
                    <div className="text-[11.5px] text-rg-ink-faint">
                      {row.legal_name || row.website || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{row.industry || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.region ? REGION_LABELS_TR[row.region] : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " +
                        (row.is_active ? "bg-gofactory-tint text-gofactory" : "bg-rg-surface-alt text-rg-ink-faint")
                      }
                    >
                      {row.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q || regionFilter
                      ? "Aramanla eşleşen şirket yok."
                      : "Henüz şirket kaydı yok — yukarıdan yeni bir şirket ekleyebilirsin."}
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

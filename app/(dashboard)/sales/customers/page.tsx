import { Suspense } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { Pagination, parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CustomerRow = {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  region: Region | null;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  let query = supabase
    .from("customers")
    .select(
      "id, company_name, primary_contact_name, primary_contact_email, region, owner_id, is_active, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `company_name.ilike.%${q}%,primary_contact_name.ilike.%${q}%,primary_contact_email.ilike.%${q}%`
    );
  }

  const { data: customers, count } = await query.range(from, to);

  const rows = (customers ?? []) as CustomerRow[];

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
      <Topbar title="Müşteriler" subtitle="Kazanılmış müşteriler — lead'den dönüşenler burada listelenir." />
      <div className="mb-3 flex items-center justify-between">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Firma, kişi veya e-posta ara..." />
        </Suspense>
      </div>
      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Firma
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
                      href={`/sales/customers/${row.id}`}
                      className="text-[12.8px] font-semibold text-rg-ink hover:text-primary"
                    >
                      {row.company_name}
                    </Link>
                    <div className="text-[11.5px] text-rg-ink-faint">
                      {row.primary_contact_name || "—"}
                      {row.primary_contact_email ? ` · ${row.primary_contact_email}` : ""}
                    </div>
                  </td>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q
                      ? "Aramanla eşleşen müşteri yok."
                      : "Henüz müşteri yok — bir lead'i müşteriye dönüştürdüğünde burada görünecek."}
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

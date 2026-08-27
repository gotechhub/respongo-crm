import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { Pagination, parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import type { ProposalStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProposalRow = {
  id: string;
  title: string;
  status: ProposalStatus;
  total_amount: number;
  currency: string;
  lead_id: string | null;
  customer_id: string | null;
  owner_id: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Taslak",
  pending_approval: "Onay Bekliyor",
  revision_requested: "Revizyon İstendi",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const STATUS_CLASS: Record<ProposalStatus, string> = {
  draft: "bg-rg-surface-alt text-rg-ink-faint",
  pending_approval: "bg-gocatalog-tint text-gocatalog",
  revision_requested: "bg-gotools-tint text-gotools",
  sent: "bg-golxp-tint text-golxp",
  accepted: "bg-gofactory-tint text-gofactory",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-rg-surface-alt text-rg-ink-faint",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

export default async function ProposalsPage({
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

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  let query = supabase
    .from("proposals")
    .select("id, title, status, total_amount, currency, lead_id, customer_id, owner_id, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: proposals, count } = await query.range(from, to);
  const rows = (proposals ?? []) as ProposalRow[];

  const leadIds = Array.from(new Set(rows.map((r) => r.lead_id).filter(Boolean))) as string[];
  const customerIds = Array.from(new Set(rows.map((r) => r.customer_id).filter(Boolean))) as string[];
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];

  const [leadNamesRes, customerNamesRes, ownerNamesRes] = await Promise.all([
    leadIds.length > 0
      ? supabase.from("leads").select("id, company_name").in("id", leadIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    customerIds.length > 0
      ? supabase.from("customers").select("id, company_name").in("id", customerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
  ]);

  const leadNames: Record<string, string> = {};
  (leadNamesRes.data ?? []).forEach((l) => {
    leadNames[l.id] = l.company_name;
  });
  const customerNames: Record<string, string> = {};
  (customerNamesRes.data ?? []).forEach((c) => {
    customerNames[c.id] = c.company_name;
  });
  const ownerNames: Record<string, string> = {};
  (ownerNamesRes.data ?? []).forEach((o) => {
    ownerNames[o.id] = o.full_name || o.email;
  });

  function targetName(row: ProposalRow) {
    if (row.lead_id) return leadNames[row.lead_id] ?? "—";
    if (row.customer_id) return customerNames[row.customer_id] ?? "—";
    return "—";
  }

  return (
    <>
      <Topbar title="Teklifler" subtitle="Oluşturulan tüm teklifler — durumunu ve tutarını buradan takip et." />
      <div className="mb-3 flex items-center justify-between">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Teklif başlığı ara..." />
        </Suspense>
        <Link
          href="/sales/proposals/new"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          Teklif Oluştur
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Teklif
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Hedef
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tutar
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Sahibi
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
                      href={`/sales/proposals/${row.id}`}
                      className="text-[12.8px] font-semibold text-rg-ink hover:text-primary"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{targetName(row)}</td>
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
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                    {fmtMoney(row.total_amount, row.currency)}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q ? "Aramanla eşleşen teklif yok." : "Henüz teklif yok — Teklif Oluştur ile başla."}
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

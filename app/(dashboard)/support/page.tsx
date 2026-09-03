import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { TicketCreateForm, PRODUCT_LABEL, type CustomerOption } from "./ticket-form";
import { TicketFilters } from "./ticket-filters";
import { STATUS_LABEL, STATUS_CLASS, PRIORITY_LABEL, PRIORITY_CLASS } from "./status-labels";
import type { TicketPriority, TicketStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TicketRow = {
  id: string;
  customer_id: string;
  subject: string;
  product: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  last_message_at: string;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className={"font-display text-[18px] font-bold " + (cls ?? "text-rg-ink")}>{value || "—"}</span>
    </div>
  );
}

export default async function SupportPage({
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
  const statusFilter = typeof searchParams.status === "string" ? (searchParams.status as TicketStatus) : "";
  const priorityFilter = typeof searchParams.priority === "string" ? (searchParams.priority as TicketPriority) : "";

  let query = supabase
    .from("support_tickets")
    .select(
      "id, customer_id, subject, product, status, priority, assigned_to, last_message_at, created_at",
      { count: "exact" }
    )
    .order("last_message_at", { ascending: false });

  if (q) query = query.ilike("subject", `%${q}%`);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (priorityFilter) query = query.eq("priority", priorityFilter);

  const [{ data: tickets, count }, { data: allTickets }, { data: customerRows }, { data: agentRows }] =
    await Promise.all([
      query.range(from, to),
      supabase.from("support_tickets").select("status, priority, assigned_to"),
      supabase.from("customers").select("id, company_name").order("company_name", { ascending: true }).limit(500),
      supabase.from("profiles").select("id, full_name, email").in("role", ["support_agent", "founder", "region_admin"]),
    ]);

  const rows = (tickets ?? []) as TicketRow[];
  const stats = (allTickets ?? []) as { status: TicketStatus; priority: TicketPriority; assigned_to: string | null }[];

  const openCount = stats.filter((s) => s.status === "open").length;
  const waitingCount = stats.filter((s) => s.status === "waiting_customer").length;
  const urgentCount = stats.filter((s) => s.priority === "urgent" && s.status !== "closed" && s.status !== "resolved").length;
  const assignedToMeCount = stats.filter((s) => s.assigned_to === user.id && s.status !== "closed" && s.status !== "resolved").length;

  const customerNames: Record<string, string> = {};
  (customerRows ?? []).forEach((c) => {
    customerNames[c.id] = c.company_name;
  });
  const agentNames: Record<string, string> = {};
  (agentRows ?? []).forEach((a) => {
    agentNames[a.id] = (a.full_name as string | null) || (a.email as string);
  });

  return (
    <>
      <Topbar title="Destek Merkezi" subtitle="Müşteri destek taleplerini takip et ve yanıtla." />

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard label="Açık Talepler" value={String(openCount)} cls="text-destructive" />
        <StatCard label="Müşteri Yanıtı Bekleniyor" value={String(waitingCount)} cls="text-gotools" />
        <StatCard label="Acil (Açık)" value={String(urgentCount)} cls="text-destructive" />
        <StatCard label="Bana Atanan (Açık)" value={String(assignedToMeCount)} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
            <SearchInput placeholder="Konu ara..." />
          </Suspense>
          <Suspense fallback={<div className="h-[38px] w-[320px]" />}>
            <TicketFilters />
          </Suspense>
        </div>
      </div>

      <TicketCreateForm customers={(customerRows ?? []) as CustomerOption[]} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Müşteri</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Konu</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Atanan</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Öncelik</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Son Hareket</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-rg-line">
                  <td className="px-4 py-3 text-[12.5px] font-semibold text-rg-ink">
                    <Link href={`/support/${row.id}`} className="hover:text-primary">
                      {customerNames[row.customer_id] ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.subject}
                    {row.product && (
                      <span className="ml-1.5 text-[10.5px] text-rg-ink-faint">
                        — {PRODUCT_LABEL[row.product] ?? row.product}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {row.assigned_to ? agentNames[row.assigned_to] ?? "—" : "Atanmamış"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={"inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold " + PRIORITY_CLASS[row.priority]}
                    >
                      {PRIORITY_LABEL[row.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={"inline-flex items-center rounded-full px-[9px] py-1 text-[11px] font-bold " + STATUS_CLASS[row.status]}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.last_message_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q || statusFilter || priorityFilter
                      ? "Filtreyle eşleşen destek talebi yok."
                      : "Henüz destek talebi yok — yukarıdan yeni bir talep açabilirsin."}
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

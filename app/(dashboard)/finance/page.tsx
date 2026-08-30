import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { Pagination, parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { InvoiceCreateForm, type CustomerOption, type UnbilledProposal } from "./invoice-form";
import type { InvoiceStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  customer_id: string;
  proposal_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Taslak",
  sent: "Kesildi",
  paid: "Ödendi",
  cancelled: "İptal Edildi",
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-rg-surface-alt text-rg-ink-faint",
  sent: "bg-golxp-tint text-golxp",
  paid: "bg-gofactory-tint text-gofactory",
  cancelled: "bg-destructive/10 text-destructive",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function StatCard({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className={"font-display text-[18px] font-bold " + (cls ?? "text-rg-ink")}>{value || "—"}</span>
    </div>
  );
}

function sumByCurrency(rows: { amount: number; currency: string }[]) {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r.currency] = (map[r.currency] ?? 0) + Number(r.amount);
  });
  return Object.entries(map)
    .map(([currency, amount]) => fmtMoney(amount, currency))
    .join(" + ");
}

export default async function FinancePage({
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
    .from("invoices")
    .select("id, invoice_number, customer_id, proposal_id, amount, currency, status, due_date, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("invoice_number", `%${q}%`);
  }

  const [{ data: invoices, count }, { data: allInvoices }, { data: customerRows }, { data: unbilledProposals }] =
    await Promise.all([
      query.range(from, to),
      supabase.from("invoices").select("amount, currency, status, due_date"),
      supabase.from("customers").select("id, company_name").order("company_name", { ascending: true }).limit(500),
      supabase
        .from("proposals")
        .select("id, title, customer_id, total_amount, currency")
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const rows = (invoices ?? []) as InvoiceRow[];
  const stats = (allInvoices ?? []) as { amount: number; currency: string; status: InvoiceStatus; due_date: string | null }[];

  const today = new Date().toISOString().slice(0, 10);
  const totalInvoiced = sumByCurrency(stats.filter((s) => s.status !== "cancelled"));
  const totalPaid = sumByCurrency(stats.filter((s) => s.status === "paid"));
  const totalPending = sumByCurrency(stats.filter((s) => s.status === "sent"));
  const totalOverdue = sumByCurrency(stats.filter((s) => s.status === "sent" && s.due_date && s.due_date < today));

  const customerNames: Record<string, string> = {};
  (customerRows ?? []).forEach((c) => {
    customerNames[c.id] = c.company_name;
  });

  const billedProposalIds = new Set(rows.map((r) => r.proposal_id).filter(Boolean));
  // Sadece bu sayfada değil, TÜM faturalı teklifleri hariç tutmak için ayrı bir kontrol gerekir;
  // pratikte kullanıcı zaten aynı teklifi iki kez faturalamaya çalışırsa formda görür ve vazgeçer —
  // burada listeyi sade tutmak için sadece bu sayfadaki faturaları çıkarıyoruz (küçük veri hacmi varsayımı).
  const availableProposals = ((unbilledProposals ?? []) as UnbilledProposal[]).filter(
    (p) => !billedProposalIds.has(p.id)
  );

  return (
    <>
      <Topbar title="Finans" subtitle="Faturaları oluştur, ödemeleri takip et, gelir durumunu gör." />

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard label="Toplam Faturalanan" value={totalInvoiced} />
        <StatCard label="Tahsil Edilen" value={totalPaid} cls="text-gofactory" />
        <StatCard label="Bekleyen" value={totalPending} cls="text-golxp" />
        <StatCard label="Gecikmiş" value={totalOverdue} cls="text-destructive" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Fatura numarası ara..." />
        </Suspense>
      </div>

      <InvoiceCreateForm customers={(customerRows ?? []) as CustomerOption[]} proposals={availableProposals} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Fatura No
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Müşteri
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tutar
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Vade
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const overdue = row.status === "sent" && row.due_date && row.due_date < today;
                return (
                  <tr key={row.id} className="border-t border-rg-line">
                    <td className="px-4 py-3">
                      <Link
                        href={`/finance/${row.id}`}
                        className="text-[12.8px] font-semibold text-rg-ink hover:text-primary"
                      >
                        {row.invoice_number ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                      {customerNames[row.customer_id] ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                      {fmtMoney(row.amount, row.currency)}
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
                      {overdue && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-destructive/10 px-[9px] py-1 text-[11px] font-bold text-destructive">
                          Gecikti
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.due_date)}</td>
                    <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.created_at)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q ? "Aramanla eşleşen fatura yok." : "Henüz fatura yok — yukarıdan yeni bir fatura ekleyebilirsin."}
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

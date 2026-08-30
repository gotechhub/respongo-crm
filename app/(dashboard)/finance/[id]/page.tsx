import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { InvoiceStatusPanel } from "./invoice-status-panel";
import { PaymentsPanel, type PaymentRow } from "./payments-panel";
import type { CustomerOption, UnbilledProposal } from "../invoice-form";
import type { InvoiceInput, InvoiceStatus } from "../actions";

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

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", params.id).single();
  if (!invoice) {
    notFound();
  }

  const [{ data: customer }, { data: proposal }, { data: paymentsRaw }, { data: customerOptions }, { data: proposalOptions }, { data: ownerRows }] =
    await Promise.all([
      supabase.from("customers").select("id, company_name").eq("id", invoice.customer_id).single(),
      invoice.proposal_id
        ? supabase.from("proposals").select("id, title").eq("id", invoice.proposal_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("payments")
        .select("id, amount, currency, method, paid_at, reference_no, notes")
        .eq("invoice_id", params.id)
        .order("paid_at", { ascending: false }),
      supabase.from("customers").select("id, company_name").order("company_name", { ascending: true }).limit(500),
      supabase
        .from("proposals")
        .select("id, title, customer_id, total_amount, currency")
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(new Set([invoice.owner_id, invoice.created_by].filter(Boolean)))),
    ]);

  const payments = (paymentsRaw ?? []) as PaymentRow[];
  const paidTotal = payments.filter((p) => p.currency === invoice.currency).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(invoice.amount) - paidTotal);

  const ownerNames: Record<string, string> = {};
  (ownerRows ?? []).forEach((o) => {
    ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
  });

  const initial: InvoiceInput = {
    customerId: invoice.customer_id,
    proposalId: invoice.proposal_id,
    amount: Number(invoice.amount) || 0,
    currency: invoice.currency,
    issueDate: invoice.issue_date ?? "",
    dueDate: invoice.due_date ?? "",
    notes: invoice.notes ?? "",
  };

  return (
    <>
      <Link
        href="/finance"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Finansa dön
      </Link>
      <Topbar title={invoice.invoice_number ?? "Fatura"} subtitle={customer?.company_name ?? "Fatura detayı"} />

      <InvoiceStatusPanel
        invoiceId={invoice.id}
        initialStatus={invoice.status as InvoiceStatus}
        initial={initial}
        customers={(customerOptions ?? []) as CustomerOption[]}
        proposals={(proposalOptions ?? []) as UnbilledProposal[]}
      />

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Fatura Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Müşteri" value={customer?.company_name} />
            <InfoField label="Kaynak Teklif" value={proposal?.title ?? "Doğrudan fatura"} />
            <InfoField label="Tutar" value={fmtMoney(Number(invoice.amount) || 0, invoice.currency)} />
            <InfoField label="Fatura Tarihi" value={fmtDate(invoice.issue_date)} />
            <InfoField label="Vade Tarihi" value={fmtDate(invoice.due_date)} />
            <InfoField label="Ödeme Tarihi" value={fmtDate(invoice.paid_at)} />
            <InfoField label="Sahibi" value={invoice.owner_id ? ownerNames[invoice.owner_id] : "Atanmamış"} />
            <InfoField label="Oluşturan" value={invoice.created_by ? ownerNames[invoice.created_by] : "—"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(invoice.created_at)} />
          </div>
          {invoice.notes && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <InfoField label="Not" value={invoice.notes} />
            </div>
          )}
          {proposal && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <Link href={`/sales/proposals/${proposal.id}`} className="text-[12px] font-semibold text-primary hover:underline">
                Teklif kaydına git →
              </Link>
            </div>
          )}
        </div>

        <PaymentsPanel
          invoiceId={invoice.id}
          currency={invoice.currency}
          invoiceStatus={invoice.status}
          payments={payments}
          remaining={remaining}
        />
      </div>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CustomerDecisionPanel } from "./customer-decision-panel";
import {
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_CLASS,
} from "../../../../(dashboard)/sales/proposals/[id]/proposal-status-panel";
import type { ProposalStatus } from "../../../../(dashboard)/sales/proposals/actions";

const PRODUCT_LABEL: Record<string, string> = {
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

// RLS (proposals_customer_select / proposal_items_customer_select) zaten bu
// teklifin bu müşteriye ait olduğunu ve draft/pending_approval olmadığını
// garanti ediyor — burada ekstra yetki kontrolüne gerek yok, satır
// dönmüyorsa notFound() zaten devreye giriyor.
export default async function PortalProposalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", params.id).single();
  if (!proposal) {
    notFound();
  }

  const { data: items } = await supabase
    .from("proposal_items")
    .select("id, product, description, quantity, unit_price, discount_percent, line_total")
    .eq("proposal_id", params.id)
    .order("created_at", { ascending: true });

  const status = proposal.status as ProposalStatus;

  return (
    <>
      <Link
        href="/portal"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tekliflerime dön
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-rg-ink">{proposal.title}</h1>
          <span
            className={
              "mt-1.5 inline-flex items-center rounded-full px-[10px] py-1 text-[11px] font-bold " +
              PROPOSAL_STATUS_CLASS[status]
            }
          >
            {PROPOSAL_STATUS_LABEL[status]}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Genel Toplam</div>
          <div className="font-display text-[22px] font-bold text-rg-ink">
            {fmtMoney(proposal.total_amount, proposal.currency)}
          </div>
        </div>
      </div>

      {proposal.valid_until && (
        <p className="mb-4 text-[12.5px] text-rg-ink-soft">
          Bu teklif <b>{fmtDate(proposal.valid_until)}</b> tarihine kadar geçerlidir.
        </p>
      )}

      {status === "sent" && (
        <div className="mb-5">
          <CustomerDecisionPanel proposalId={proposal.id} />
        </div>
      )}

      {status === "revision_requested" && proposal.customer_note && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-golxp-tint px-5 py-3.5 text-[12.5px] text-golxp">
          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-bold">Revizyon talebin iletildi:</div>
            <div className="mt-0.5 text-rg-ink-soft">{proposal.customer_note}</div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="border-b border-rg-line px-5 py-3 text-[13px] font-bold text-rg-ink">Kalemler</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Kalem
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Adet
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Birim Fiyat
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Toplam
              </th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-t border-rg-line">
                <td className="px-4 py-3 text-[12.5px] font-semibold text-rg-ink">
                  {item.description || "—"}
                  <span className="ml-1.5 text-[10.5px] font-normal text-rg-ink-faint">
                    {PRODUCT_LABEL[item.product] ?? item.product}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-[12px] text-rg-ink-soft">
                  {fmtMoney(item.unit_price, proposal.currency)}
                </td>
                <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                  {fmtMoney(item.line_total, proposal.currency)}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Bu teklifte kalem yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

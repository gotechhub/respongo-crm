import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_CLASS } from "../../(dashboard)/sales/proposals/[id]/proposal-status-panel";
import type { ProposalStatus } from "../../(dashboard)/sales/proposals/actions";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

// RLS (proposals_customer_select) zaten sadece bu müşteriye ait ve
// draft/pending_approval DIŞINDAKİ teklifleri döndürüyor — burada ekstra
// filtreye gerek yok.
export default async function PortalHomePage() {
  const supabase = createClient();
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, title, status, total_amount, currency, valid_until, created_at")
    .order("created_at", { ascending: false });

  const rows = (proposals ?? []) as {
    id: string;
    title: string;
    status: ProposalStatus;
    total_amount: number;
    currency: string;
    valid_until: string | null;
    created_at: string;
  }[];

  const awaitingDecision = rows.filter((p) => p.status === "sent");
  const rest = rows.filter((p) => p.status !== "sent");

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-rg-ink">Tekliflerim</h1>
        <p className="text-[13px] text-rg-ink-soft">
          Sana gönderilen teklifleri buradan görüntüleyip karar verebilirsin.
        </p>
      </div>

      {awaitingDecision.length > 0 && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[.4px] text-golxp">
            <Clock className="h-3.5 w-3.5" />
            Kararını Bekleyen Teklifler
          </div>
          <div className="flex flex-col gap-2.5">
            {awaitingDecision.map((p) => (
              <Link
                key={p.id}
                href={`/portal/proposals/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-golxp-tint px-5 py-4 shadow-rg transition-colors hover:brightness-[0.99]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-rg-ink">{p.title}</div>
                  <div className="mt-0.5 text-[12px] text-rg-ink-soft">
                    {fmtMoney(p.total_amount, p.currency)}
                    {p.valid_until && ` · Geçerlilik: ${fmtDate(p.valid_until)}`}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-golxp" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
          Tüm Teklifler
        </div>
        {rows.length === 0 ? (
          <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
            Henüz sana gönderilmiş bir teklif yok.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
            {rest.length === 0 && awaitingDecision.length === rows.length ? null : (
              <div className="flex flex-col divide-y divide-rg-line">
                {rest.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portal/proposals/${p.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-rg-surface-alt"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-rg-ink">{p.title}</div>
                      <div className="mt-0.5 text-[11.5px] text-rg-ink-faint">
                        {fmtMoney(p.total_amount, p.currency)} · {fmtDate(p.created_at)}
                      </div>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + PROPOSAL_STATUS_CLASS[p.status]
                      }
                    >
                      {PROPOSAL_STATUS_LABEL[p.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

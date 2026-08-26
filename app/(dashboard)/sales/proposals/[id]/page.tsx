import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { ProposalStatusPanel } from "./proposal-status-panel";
import type { ProposalStatus } from "../actions";

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

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="text-[12.8px] text-rg-ink">{value || "—"}</span>
    </div>
  );
}

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", params.id).single();

  if (!proposal) {
    notFound();
  }

  const [{ data: items }, { data: target }, { data: template }] = await Promise.all([
    supabase
      .from("proposal_items")
      .select("id, product, description, quantity, unit_price, discount_percent, line_total")
      .eq("proposal_id", params.id)
      .order("created_at", { ascending: true }),
    proposal.lead_id
      ? supabase.from("leads").select("id, company_name, contact_name, contact_email").eq("id", proposal.lead_id).single()
      : proposal.customer_id
        ? supabase
            .from("customers")
            .select("id, company_name, primary_contact_name, primary_contact_email")
            .eq("id", proposal.customer_id)
            .single()
        : Promise.resolve({ data: null }),
    proposal.template_id
      ? supabase.from("proposal_templates").select("id, name, language").eq("id", proposal.template_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const ownerIds = [proposal.owner_id, proposal.created_by].filter(Boolean) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(new Set(ownerIds)));
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  const targetRow = target as
    | { id: string; company_name: string; contact_name?: string | null; contact_email?: string | null; primary_contact_name?: string | null; primary_contact_email?: string | null }
    | null;
  const targetHref = proposal.lead_id
    ? "/sales/leads"
    : proposal.customer_id
      ? `/sales/customers/${proposal.customer_id}`
      : null;
  const targetContactName = targetRow?.contact_name ?? targetRow?.primary_contact_name ?? null;
  const targetContactEmail = targetRow?.contact_email ?? targetRow?.primary_contact_email ?? null;

  return (
    <>
      <Link
        href="/sales/proposals"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tekliflere dön
      </Link>
      <Topbar title={proposal.title} subtitle={targetRow?.company_name ?? "Teklif detayı"} />

      <ProposalStatusPanel proposalId={proposal.id} initialStatus={proposal.status as ProposalStatus} />

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Teklif Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Hedef" value={targetRow?.company_name} />
            <InfoField label="İlgili Kişi" value={targetContactName} />
            <InfoField label="İlgili Kişi E-posta" value={targetContactEmail} />
            <InfoField label="Bölge" value={proposal.region ? REGION_LABELS_TR[proposal.region as Region] : "—"} />
            <InfoField label="Para Birimi" value={proposal.currency} />
            <InfoField label="Geçerlilik Tarihi" value={fmtDate(proposal.valid_until)} />
            <InfoField label="Şablon" value={template ? `${template.name} · ${template.language.toUpperCase()}` : "Şablonsuz"} />
            <InfoField label="Dil" value={proposal.language === "en" ? "English" : "Türkçe"} />
            <InfoField label="Sahibi" value={proposal.owner_id ? ownerNames[proposal.owner_id] : "Atanmamış"} />
            <InfoField label="Gönderim Tarihi" value={fmtDate(proposal.sent_at)} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(proposal.created_at)} />
          </div>
          {targetHref && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <Link href={targetHref} className="text-[12px] font-semibold text-primary hover:underline">
                {proposal.lead_id ? "Lead kaydına git →" : "Müşteri kaydına git →"}
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-rg-line bg-rg-surface-alt p-5 text-center shadow-rg">
          <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Genel Toplam</span>
          <span className="mt-2 font-display text-[26px] font-bold text-rg-ink">
            {fmtMoney(proposal.total_amount, proposal.currency)}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
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
                İskonto
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
                <td className="px-4 py-3 text-right text-[12px] text-rg-ink-soft">
                  {item.discount_percent > 0 ? `%${item.discount_percent}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                  {fmtMoney(item.line_total, proposal.currency)}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
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

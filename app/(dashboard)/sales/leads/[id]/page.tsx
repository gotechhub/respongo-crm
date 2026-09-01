import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { ProductTag, type ProductKey } from "@/components/shared/product-tag";
import { LeadStatusControl } from "./lead-status-control";
import { LEAD_SOURCE_LABEL, type LeadSource } from "../status-labels";
import type { LeadStatus } from "../actions";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number | null, currency: string) {
  if (n === null) return "—";
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

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  active: "Aktif",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: lead } = await supabase.from("leads").select("*").eq("id", params.id).single();
  if (!lead) {
    notFound();
  }

  const [{ data: owner }, { data: company }, { data: campaign }] = await Promise.all([
    lead.owner_id
      ? supabase.from("profiles").select("id, full_name, email").eq("id", lead.owner_id).single()
      : Promise.resolve({ data: null }),
    lead.company_id
      ? supabase.from("companies").select("id, name").eq("id", lead.company_id).single()
      : Promise.resolve({ data: null }),
    lead.campaign_id
      ? supabase.from("marketing_campaigns").select("id, name, status").eq("id", lead.campaign_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const status = lead.status as LeadStatus;
  const source = lead.source_type as LeadSource;
  const products = (lead.product_interest ?? []) as ProductKey[];
  const ownerName = owner ? (owner.full_name as string | null) || (owner.email as string) : null;

  return (
    <>
      <Link
        href="/sales/leads"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Müşteri Adaylarına dön
      </Link>
      <Topbar title={lead.company_name} subtitle="Müşteri Adayı Detayı" />

      <div className="mb-5">
        <LeadStatusControl leadId={lead.id} status={status} convertedCustomerId={lead.converted_customer_id} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Lead Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Yetkili Kişi" value={lead.contact_name} />
            <InfoField label="E-posta" value={lead.contact_email} />
            <InfoField label="Telefon" value={lead.contact_phone} />
            <InfoField label="Bölge" value={lead.region ? REGION_LABELS_TR[lead.region as Region] : "—"} />
            <InfoField label="Kaynak" value={LEAD_SOURCE_LABEL[source] ?? source} />
            <InfoField label="Tahmini Değer" value={fmtMoney(lead.value_estimate, lead.currency)} />
            <InfoField label="Sahibi" value={ownerName ?? "Atanmamış"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(lead.created_at)} />
            <InfoField label="Son Güncelleme" value={fmtDate(lead.updated_at)} />
          </div>

          {products.length > 0 && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                İlgilenilen Ürünler
              </div>
              <div className="flex flex-wrap gap-3">
                {products.map((p) => (
                  <ProductTag key={p} product={p} />
                ))}
              </div>
            </div>
          )}

          {company && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <Link href={`/companies/${company.id}`} className="text-[12px] font-semibold text-primary hover:underline">
                Şirket kaydına git: {company.name} →
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-3 text-[13px] font-bold text-rg-ink">Pipeline</div>
          <div className="flex flex-col gap-2 text-[12.5px] text-rg-ink-soft">
            <div>
              Durum: <span className="font-semibold text-rg-ink">
                {status === "musteri" ? "Müşteriye dönüştürüldü" : status === "kaybedildi" ? "Kaybedildi" : "Devam ediyor"}
              </span>
            </div>
            {lead.converted_customer_id && (
              <Link
                href={`/sales/customers/${lead.converted_customer_id}`}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                Müşteri profiline git →
              </Link>
            )}
          </div>

          {campaign && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <div className="mb-2 text-[13px] font-bold text-rg-ink">Kampanya</div>
              <Link href={`/marketing/${campaign.id}`} className="text-[12.5px] text-rg-ink-soft hover:text-primary">
                {campaign.name}
              </Link>
              <div className="mt-1 text-[11px] text-rg-ink-faint">
                {CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

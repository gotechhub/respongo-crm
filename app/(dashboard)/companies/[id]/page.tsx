import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { ContactsPanel, type ContactRow } from "../../contacts/contacts-panel";
import { CompanyDetailPanel } from "./company-detail-panel";
import type { CompanyInput } from "../actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function InfoField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="text-[12.8px] text-rg-ink">{value || "—"}</span>
    </div>
  );
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("region").eq("id", user.id).single();
  const caller = callerProfile as { region: Region | null } | null;

  const { data: company } = await supabase.from("companies").select("*").eq("id", params.id).single();

  if (!company) {
    notFound();
  }

  const [{ data: contacts }, { data: poolMatches }, { data: leadMatches }, { data: customerMatches }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select(
          "id, company_id, first_name, last_name, title, email, phone, mobile_phone, is_primary, region, owner_id, created_at"
        )
        .eq("company_id", params.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("customer_pool").select("id, company_name, created_at").eq("company_id", params.id),
      supabase.from("leads").select("id, company_name, status, created_at").eq("company_id", params.id),
      supabase.from("customers").select("id, company_name, is_active, created_at").eq("company_id", params.id),
    ]);

  const contactRows = (contacts ?? []) as ContactRow[];

  const ownerIds = Array.from(
    new Set([company.owner_id, ...contactRows.map((c) => c.owner_id)].filter(Boolean))
  ) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  const initial: CompanyInput = {
    name: company.name,
    legalName: company.legal_name ?? "",
    website: company.website ?? "",
    industry: company.industry ?? "",
    country: company.country ?? "",
    city: company.city ?? "",
    address: company.address ?? "",
    taxOffice: company.tax_office ?? "",
    taxNo: company.tax_no ?? "",
    employeeCount: company.employee_count ?? "",
    notes: company.notes ?? "",
    region: (company.region as Region) ?? "tr",
  };

  const relatedCount = (poolMatches?.length ?? 0) + (leadMatches?.length ?? 0) + (customerMatches?.length ?? 0);

  return (
    <>
      <Link
        href="/companies"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Şirketlere dön
      </Link>
      <Topbar title={company.name} subtitle={company.industry || "Şirket detayı"} />

      <CompanyDetailPanel companyId={company.id} initial={initial} isActive={company.is_active} />

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Şirket Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Resmi Ünvan" value={company.legal_name} />
            <InfoField
              label="Web Sitesi"
              value={
                company.website ? (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {company.website} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : undefined
              }
            />
            <InfoField label="Sektör" value={company.industry} />
            <InfoField label="Çalışan Sayısı" value={company.employee_count} />
            <InfoField label="Ülke / Şehir" value={[company.country, company.city].filter(Boolean).join(" / ")} />
            <InfoField label="Adres" value={company.address} />
            <InfoField label="Vergi Dairesi" value={company.tax_office} />
            <InfoField label="Vergi No" value={company.tax_no} />
            <InfoField label="Bölge" value={company.region ? REGION_LABELS_TR[company.region as Region] : "—"} />
            <InfoField label="Sahibi" value={company.owner_id ? ownerNames[company.owner_id] : "Atanmamış"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(company.created_at)} />
          </div>
          {company.notes && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <InfoField label="Not" value={company.notes} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">İlişkili Satış Kayıtları</div>
          {relatedCount === 0 ? (
            <p className="text-[12px] text-rg-ink-faint">
              Bu şirket henüz satış hunisinde bağlı bir kayıtla ilişkilendirilmemiş.
            </p>
          ) : (
            <div className="flex flex-col gap-3 text-[12.5px]">
              {(poolMatches ?? []).map((p) => (
                <div key={`pool-${p.id}`} className="flex items-center justify-between">
                  <span className="text-rg-ink-soft">Havuz: {p.company_name}</span>
                </div>
              ))}
              {(leadMatches ?? []).map((l) => (
                <Link
                  key={`lead-${l.id}`}
                  href="/sales/leads"
                  className="flex items-center justify-between text-rg-ink-soft hover:text-primary"
                >
                  <span>Lead: {l.company_name}</span>
                </Link>
              ))}
              {(customerMatches ?? []).map((c) => (
                <Link
                  key={`customer-${c.id}`}
                  href={`/sales/customers/${c.id}`}
                  className="flex items-center justify-between text-rg-ink-soft hover:text-primary"
                >
                  <span>Müşteri: {c.company_name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 text-[13px] font-bold text-rg-ink">Kişiler</div>
        <ContactsPanel
          rows={contactRows}
          ownerNames={ownerNames}
          fixedCompanyId={company.id}
          defaultRegion={(company.region as Region) ?? caller?.region ?? null}
        />
      </div>
    </>
  );
}

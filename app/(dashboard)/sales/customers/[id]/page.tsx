import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { ContactsPanel, type ContactRow } from "../../../contacts/contacts-panel";
import { CustomerDetailPanel } from "./customer-detail-panel";
import type { CustomerInput } from "../actions";

const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

const PROJECT_STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  on_hold: "Beklemede",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function fmtDate(iso: string) {
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

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: customer } = await supabase.from("customers").select("*").eq("id", params.id).single();

  if (!customer) {
    notFound();
  }

  const [{ data: lead }, { data: company }, { data: contacts }, { data: proposals }, { data: projects }] =
    await Promise.all([
      customer.lead_id
        ? supabase.from("leads").select("id, company_name, status").eq("id", customer.lead_id).single()
        : Promise.resolve({ data: null }),
      customer.company_id
        ? supabase.from("companies").select("id, name").eq("id", customer.company_id).single()
        : Promise.resolve({ data: null }),
      customer.company_id
        ? supabase
            .from("contacts")
            .select(
              "id, company_id, first_name, last_name, title, email, phone, mobile_phone, is_primary, region, owner_id, created_at"
            )
            .eq("company_id", customer.company_id)
            .order("is_primary", { ascending: false })
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as ContactRow[] }),
      supabase
        .from("proposals")
        .select("id, title, status, total_amount, currency, created_at")
        .eq("customer_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id, name, status, start_date, end_date, created_at")
        .eq("customer_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const contactRows = (contacts ?? []) as ContactRow[];

  const ownerIds = Array.from(new Set([customer.owner_id, ...contactRows.map((c) => c.owner_id)].filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  const initial: CustomerInput = {
    companyName: customer.company_name,
    primaryContactName: customer.primary_contact_name ?? "",
    primaryContactEmail: customer.primary_contact_email ?? "",
    primaryContactPhone: customer.primary_contact_phone ?? "",
    country: customer.country ?? "",
    region: (customer.region as Region) ?? "",
  };

  return (
    <>
      <Link
        href="/sales/customers"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Müşterilere dön
      </Link>
      <Topbar title={customer.company_name} subtitle="Müşteri detayı" />

      <CustomerDetailPanel customerId={customer.id} initial={initial} isActive={customer.is_active} />

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Müşteri Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Yetkili Kişi" value={customer.primary_contact_name} />
            <InfoField label="E-posta" value={customer.primary_contact_email} />
            <InfoField label="Telefon" value={customer.primary_contact_phone} />
            <InfoField label="Ülke" value={customer.country} />
            <InfoField label="Bölge" value={customer.region ? REGION_LABELS_TR[customer.region as Region] : "—"} />
            <InfoField label="Sahibi" value={customer.owner_id ? ownerNames[customer.owner_id] : "Atanmamış"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(customer.created_at)} />
            <InfoField label="Bağlı Şirket" value={company?.name ?? "Bağlı değil"} />
            <InfoField label="Kaynak Lead" value={lead?.company_name ?? "Doğrudan oluşturuldu"} />
          </div>
          {company && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <Link href={`/companies/${company.id}`} className="text-[12px] font-semibold text-primary hover:underline">
                Şirket kaydına git: {company.name} →
              </Link>
            </div>
          )}
          {lead && (
            <div className="mt-2">
              <Link href="/sales/leads" className="text-[12px] font-semibold text-primary hover:underline">
                Kaynak lead&apos;i gör: {lead.company_name} →
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Teklifler</div>
          {(proposals ?? []).length === 0 ? (
            <p className="text-[12px] text-rg-ink-faint">Bu müşteri için henüz teklif yok.</p>
          ) : (
            <div className="flex flex-col gap-2.5 text-[12.5px]">
              {(proposals ?? []).map((p) => (
                <Link
                  key={p.id}
                  href={`/sales/proposals/${p.id}`}
                  className="flex items-center justify-between gap-2 text-rg-ink-soft hover:text-primary"
                >
                  <span className="truncate">{p.title}</span>
                  <span className="shrink-0 text-[11px] text-rg-ink-faint">
                    {PROPOSAL_STATUS_LABEL[p.status] ?? p.status} · {fmtMoney(p.total_amount, p.currency)}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-rg-line pt-4">
            <div className="mb-2 text-[13px] font-bold text-rg-ink">Projeler</div>
            {(projects ?? []).length === 0 ? (
              <p className="text-[12px] text-rg-ink-faint">Bu müşteri için henüz proje yok.</p>
            ) : (
              <div className="flex flex-col gap-2.5 text-[12.5px]">
                {(projects ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-rg-ink-soft">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-[11px] text-rg-ink-faint">
                      {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {company && (
        <div className="mt-5">
          <div className="mb-3 text-[13px] font-bold text-rg-ink">Şirket Kişileri</div>
          <ContactsPanel
            rows={contactRows}
            ownerNames={ownerNames}
            fixedCompanyId={company.id}
            defaultRegion={(customer.region as Region) ?? null}
          />
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LABEL } from "../license-form";
import { RenewalPanel, type RenewalRow } from "./renewal-panel";
import type { LicenseStatus } from "../actions";

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

const STATUS_LABEL: Record<LicenseStatus, string> = {
  active: "Aktif",
  cancelled: "İptal Edildi",
};
const STATUS_CLASS: Record<LicenseStatus, string> = {
  active: "bg-gofactory-tint text-gofactory",
  cancelled: "bg-rg-surface-alt text-rg-ink-faint",
};

export default async function LicenseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: license } = await supabase.from("licenses").select("*").eq("id", params.id).single();
  if (!license) {
    notFound();
  }

  const [{ data: customer }, { data: proposal }, { data: renewalsRaw }, { data: ownerRows }] = await Promise.all([
    supabase.from("customers").select("id, company_name").eq("id", license.customer_id).single(),
    license.proposal_id
      ? supabase.from("proposals").select("id, title").eq("id", license.proposal_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("license_renewals")
      .select("id, previous_end_date, new_end_date, amount, currency, notes, created_at")
      .eq("license_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(new Set([license.owner_id, license.created_by].filter(Boolean)))),
  ]);

  const renewals = (renewalsRaw ?? []) as RenewalRow[];

  const ownerNames: Record<string, string> = {};
  (ownerRows ?? []).forEach((o) => {
    ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
  });

  const status = license.status as LicenseStatus;

  return (
    <>
      <Link
        href="/licenses"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Lisanslara dön
      </Link>
      <Topbar
        title={license.license_name ?? PRODUCT_LABEL[license.product] ?? license.product}
        subtitle={customer?.company_name ?? "Lisans detayı"}
      />

      <div className="mb-5 flex items-center gap-2">
        <span
          className={"inline-flex items-center rounded-full px-[10px] py-1 text-[11px] font-bold " + STATUS_CLASS[status]}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Lisans Bilgileri</div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField label="Müşteri" value={customer?.company_name} />
            <InfoField label="Ürün" value={PRODUCT_LABEL[license.product] ?? license.product} />
            <InfoField label="Kaynak Teklif" value={proposal?.title ?? "Doğrudan lisans"} />
            <InfoField label="Kullanıcı Sayısı" value={license.seat_count != null ? String(license.seat_count) : "—"} />
            <InfoField label="Tutar" value={fmtMoney(Number(license.amount) || 0, license.currency)} />
            <InfoField label="Başlangıç Tarihi" value={fmtDate(license.start_date)} />
            <InfoField label="Bitiş/Yenileme Tarihi" value={fmtDate(license.end_date)} />
            <InfoField label="Sahibi" value={license.owner_id ? ownerNames[license.owner_id] : "Atanmamış"} />
            <InfoField label="Oluşturma Tarihi" value={fmtDate(license.created_at)} />
          </div>
          {license.notes && (
            <div className="mt-4 border-t border-rg-line pt-4">
              <InfoField label="Not" value={license.notes} />
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

        <RenewalPanel
          licenseId={license.id}
          currentEndDate={license.end_date}
          currency={license.currency}
          status={status}
          renewals={renewals}
        />
      </div>
    </>
  );
}

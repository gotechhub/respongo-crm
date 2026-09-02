import { createClient } from "@/lib/supabase/server";
import { NewRequestForm, type LicenseOption } from "./new-request-form";
import {
  REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_CLASS,
  PRODUCT_LABEL,
  type CustomerRequestType,
  type CustomerRequestStatus,
} from "@/lib/customer-request-labels";

type RequestRow = {
  id: string;
  request_type: CustomerRequestType;
  product: string | null;
  title: string;
  description: string | null;
  status: CustomerRequestStatus;
  handled_note: string | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// RLS (customer_requests_customer_select / licenses_customer_select) zaten sadece bu
// müşteriye ait kayıtları döndürüyor.
export default async function PortalRequestsPage() {
  const supabase = createClient();
  const [{ data: requestRows }, { data: licenseRows }] = await Promise.all([
    supabase
      .from("customer_requests")
      .select("id, request_type, product, title, description, status, handled_note, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("licenses").select("id, product, license_name").eq("status", "active"),
  ]);

  const rows = (requestRows ?? []) as RequestRow[];
  const licenses = (licenseRows ?? []) as LicenseOption[];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-rg-ink">Taleplerim</h1>
        <p className="text-[13px] text-rg-ink-soft">
          Yeni satın alım, lisans yenileme ya da yeni proje/ürün/hizmet ihtiyacını buradan iletebilirsin.
        </p>
      </div>

      <NewRequestForm licenses={licenses} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Henüz açtığın bir talep yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                    {REQUEST_TYPE_LABEL[row.request_type]}
                    {row.product && ` · ${PRODUCT_LABEL[row.product] ?? row.product}`}
                  </div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-rg-ink">{row.title}</div>
                  {row.description && <p className="mt-1 text-[12px] text-rg-ink-soft">{row.description}</p>}
                </div>
                <span className={"shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + REQUEST_STATUS_CLASS[row.status]}>
                  {REQUEST_STATUS_LABEL[row.status]}
                </span>
              </div>
              {row.handled_note && (
                <div className="mt-2.5 rounded-[8px] bg-rg-surface-alt px-3 py-2 text-[12px] text-rg-ink-soft">
                  <span className="font-semibold text-rg-ink">Not: </span>
                  {row.handled_note}
                </div>
              )}
              <div className="mt-2 text-[11px] text-rg-ink-faint">{fmtDate(row.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

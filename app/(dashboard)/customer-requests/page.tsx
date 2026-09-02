import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { RequestStatusControl } from "./status-control";
import {
  REQUEST_TYPE_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_CLASS,
  PRODUCT_LABEL,
  type CustomerRequestType,
  type CustomerRequestStatus,
} from "@/lib/customer-request-labels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestRow = {
  id: string;
  customer_id: string;
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

// RLS (customer_requests_select / _founder_all) zaten sadece has_module_access('customer_requests')
// yetkisi olan ve doğru bölgedeki kayıtları döndürüyor — burada ekstra filtreye gerek yok.
export default async function CustomerRequestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: requestRows } = await supabase
    .from("customer_requests")
    .select("id, customer_id, request_type, product, title, description, status, handled_note, created_at")
    .order("created_at", { ascending: false });

  const rows = (requestRows ?? []) as RequestRow[];
  const customerIds = Array.from(new Set(rows.map((r) => r.customer_id)));
  const customerNames: Record<string, string> = {};
  if (customerIds.length > 0) {
    const { data: customerRows } = await supabase.from("customers").select("id, company_name").in("id", customerIds);
    (customerRows ?? []).forEach((c) => {
      customerNames[c.id as string] = c.company_name as string;
    });
  }

  const openCount = rows.filter((r) => r.status === "new" || r.status === "in_review").length;

  return (
    <>
      <Topbar
        title="Müşteri Talepleri"
        subtitle="Müşteri portalından gelen satın alım/yenileme ve yeni proje/ürün/hizmet talepleri."
      />

      <div className="mb-4 flex items-center gap-2.5">
        <span className="rounded-full bg-golxp-tint px-3 py-1.5 text-[12px] font-bold text-golxp">
          {openCount} açık talep
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Henüz müşteri portalından gelen bir talep yok.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                    {customerNames[row.customer_id] ?? "—"} · {REQUEST_TYPE_LABEL[row.request_type]}
                    {row.product && ` · ${PRODUCT_LABEL[row.product] ?? row.product}`}
                  </div>
                  <div className="mt-0.5 text-[14px] font-bold text-rg-ink">{row.title}</div>
                  {row.description && <p className="mt-1 text-[12.5px] text-rg-ink-soft">{row.description}</p>}
                  <div className="mt-1.5 text-[11px] text-rg-ink-faint">{fmtDate(row.created_at)}</div>
                </div>
                <span className={"shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + REQUEST_STATUS_CLASS[row.status]}>
                  {REQUEST_STATUS_LABEL[row.status]}
                </span>
              </div>
              <div className="mt-3">
                <RequestStatusControl requestId={row.id} currentStatus={row.status} currentNote={row.handled_note} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

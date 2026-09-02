import { createClient } from "@/lib/supabase/server";
import type { LicenseStatus } from "../../../(dashboard)/licenses/actions";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

type LicenseRow = {
  id: string;
  product: string;
  license_name: string | null;
  seat_count: number | null;
  amount: number;
  currency: string;
  end_date: string;
  status: LicenseStatus;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function daysUntil(endDate: string, today: string) {
  return Math.round((new Date(endDate).getTime() - new Date(today).getTime()) / 86400000);
}

function renewalBadge(row: LicenseRow, today: string): { label: string; cls: string } {
  if (row.status === "cancelled") {
    return { label: "İptal Edildi", cls: "bg-rg-surface-alt text-rg-ink-faint" };
  }
  const days = daysUntil(row.end_date, today);
  if (days < 0) return { label: "Gecikti", cls: "bg-destructive/10 text-destructive" };
  if (days <= 30) return { label: `${days} gün kaldı`, cls: "bg-golxp-tint text-golxp" };
  return { label: "Aktif", cls: "bg-gofactory-tint text-gofactory" };
}

// RLS (licenses_customer_select) zaten sadece bu müşteriye ait lisansları döndürüyor.
export default async function PortalLicensesPage() {
  const supabase = createClient();
  const { data: licenseRows } = await supabase
    .from("licenses")
    .select("id, product, license_name, seat_count, amount, currency, end_date, status")
    .order("end_date", { ascending: true });

  const rows = (licenseRows ?? []) as LicenseRow[];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-rg-ink">Lisanslarım</h1>
        <p className="text-[13px] text-rg-ink-soft">Aktif ürün lisanslarını ve yenileme tarihlerini buradan takip edebilirsin.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Henüz sana tanımlanmış bir lisans yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => {
            const badge = renewalBadge(row, today);
            return (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-rg-ink">
                    {PRODUCT_LABEL[row.product] ?? row.product}
                    {row.license_name && (
                      <span className="ml-1.5 text-[11.5px] font-normal text-rg-ink-faint">— {row.license_name}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-rg-ink-soft">
                    {row.seat_count ? `${row.seat_count} kullanıcı · ` : ""}
                    {fmtMoney(row.amount, row.currency)} · Bitiş: {fmtDate(row.end_date)}
                  </div>
                </div>
                <span className={"shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + badge.cls}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

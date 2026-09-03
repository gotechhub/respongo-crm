import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { LicenseCreateForm, PRODUCT_LABEL, type AcceptedProposal, type CustomerOption } from "./license-form";
import type { LicenseStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LicenseRow = {
  id: string;
  customer_id: string;
  product: string;
  license_name: string | null;
  seat_count: number | null;
  amount: number;
  currency: string;
  end_date: string;
  status: LicenseStatus;
  created_at: string;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

function daysUntil(endDate: string, today: string) {
  const ms = new Date(endDate).getTime() - new Date(today).getTime();
  return Math.round(ms / 86400000);
}

function StatCard({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className={"font-display text-[18px] font-bold " + (cls ?? "text-rg-ink")}>{value || "—"}</span>
    </div>
  );
}

function sumByCurrency(rows: { amount: number; currency: string }[]) {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r.currency] = (map[r.currency] ?? 0) + Number(r.amount);
  });
  return Object.entries(map)
    .map(([currency, amount]) => fmtMoney(amount, currency))
    .join(" + ");
}

// Bir lisansın "durum rozeti" — status='cancelled' ise doğrudan İptal, aktifse
// end_date'e göre Gecikti/Yaklaşıyor/Aktif hesaplanır (ayrı bir DB kolonu YOK,
// bilinçli tercih: her sorguda taze hesaplanır, "expiring_soon" gibi bir
// durumu manuel güncellemeyi unutma riski olmaz).
function renewalBadge(row: LicenseRow, today: string): { label: string; cls: string } {
  if (row.status === "cancelled") {
    return { label: "İptal Edildi", cls: "bg-rg-surface-alt text-rg-ink-faint" };
  }
  const days = daysUntil(row.end_date, today);
  if (days < 0) return { label: "Gecikti", cls: "bg-destructive/10 text-destructive" };
  if (days <= 30) return { label: `${days} gün kaldı`, cls: "bg-golxp-tint text-golxp" };
  return { label: "Aktif", cls: "bg-gofactory-tint text-gofactory" };
}

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  let query = supabase
    .from("licenses")
    .select("id, customer_id, product, license_name, seat_count, amount, currency, end_date, status, created_at", {
      count: "exact",
    })
    .order("end_date", { ascending: true });

  if (q) {
    query = query.ilike("license_name", `%${q}%`);
  }

  const [{ data: licenses, count }, { data: allLicenses }, { data: customerRows }, { data: acceptedProposals }] =
    await Promise.all([
      query.range(from, to),
      supabase.from("licenses").select("amount, currency, status, end_date"),
      supabase.from("customers").select("id, company_name").order("company_name", { ascending: true }).limit(500),
      supabase
        .from("proposals")
        .select("id, title, customer_id, total_amount, currency")
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const rows = (licenses ?? []) as LicenseRow[];
  const stats = (allLicenses ?? []) as { amount: number; currency: string; status: LicenseStatus; end_date: string }[];

  const today = new Date().toISOString().slice(0, 10);
  const activeStats = stats.filter((s) => s.status === "active");
  const expiringSoon = activeStats.filter((s) => {
    const d = daysUntil(s.end_date, today);
    return d >= 0 && d <= 30;
  });
  const overdue = activeStats.filter((s) => daysUntil(s.end_date, today) < 0);

  const customerNames: Record<string, string> = {};
  (customerRows ?? []).forEach((c) => {
    customerNames[c.id] = c.company_name;
  });

  return (
    <>
      <Topbar title="Lisanslar" subtitle="Müşteri lisanslarını ve yenileme tarihlerini takip et." />

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard label="Aktif Lisans" value={String(activeStats.length)} />
        <StatCard label="Toplam Yıllık Değer" value={sumByCurrency(activeStats)} />
        <StatCard label="Yaklaşan Yenileme (30 gün)" value={String(expiringSoon.length)} cls="text-golxp" />
        <StatCard label="Gecikmiş Yenileme" value={String(overdue.length)} cls="text-destructive" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Lisans adı ara..." />
        </Suspense>
      </div>

      <LicenseCreateForm customers={(customerRows ?? []) as CustomerOption[]} proposals={(acceptedProposals ?? []) as AcceptedProposal[]} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Müşteri
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Ürün / Lisans
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Kullanıcı
                </th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Tutar
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bitiş Tarihi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badge = renewalBadge(row, today);
                return (
                  <tr key={row.id} className="border-t border-rg-line">
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-rg-ink">
                      <Link href={`/licenses/${row.id}`} className="hover:text-primary">
                        {customerNames[row.customer_id] ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                      {PRODUCT_LABEL[row.product] ?? row.product}
                      {row.license_name && (
                        <span className="ml-1.5 text-[10.5px] text-rg-ink-faint">— {row.license_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{row.seat_count ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-rg-ink">
                      {fmtMoney(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.end_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " + badge.cls
                        }
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q ? "Aramanla eşleşen lisans yok." : "Henüz lisans yok — yukarıdan yeni bir lisans ekleyebilirsin."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Suspense fallback={<div className="h-[52px]" />}>
          <Pagination totalCount={count ?? 0} page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </>
  );
}

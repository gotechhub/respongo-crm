import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/shared/kpi-card";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, ROLE_LABELS_TR, type Region, type UserRole } from "@/lib/roles";
import { LEAD_STATUS_LABEL, LEAD_STATUS_CLASS } from "../../leads/status-labels";
import { ReassignSelect, type ReassignOption } from "./reassign-select";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtNumber(n: number) {
  return n.toLocaleString("tr-TR");
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

type LeadRow = {
  id: string;
  company_name: string;
  status: "yeni" | "gorusme" | "teklif" | "musteri" | "kaybedildi";
  value_estimate: number | null;
  currency: string;
  region: Region | null;
  created_at: string;
};
type PoolRow = { id: string; company_name: string; source: string | null; region: Region | null; created_at: string };
type CustomerRow = {
  id: string;
  company_name: string;
  is_active: boolean;
  region: Region | null;
  created_at: string;
};

export default async function TeamMemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";
  const isRegionAdmin = caller?.role === "region_admin";

  if (!isFounder && !isRegionAdmin) {
    return (
      <>
        <Topbar title="Satış Ekibi" subtitle="Üye detayı" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfayı görüntüleme yetkin yok.
        </div>
      </>
    );
  }

  const { data: memberRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, region, is_active, created_at")
    .eq("id", params.id)
    .single();

  if (!memberRow) {
    notFound();
  }
  const member = memberRow as {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole | null;
    region: Region | null;
    is_active: boolean;
    created_at: string;
  };

  if (isRegionAdmin && member.region !== caller?.region) {
    return (
      <>
        <Topbar title="Satış Ekibi" subtitle="Üye detayı" />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu üye senin bölgende değil — görüntüleme yetkin yok.
        </div>
      </>
    );
  }

  const [poolRes, leadsRes, customersRes, teamRes] = await Promise.all([
    supabase
      .from("customer_pool")
      .select("id, company_name, source, region, created_at")
      .eq("owner_id", member.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, company_name, status, value_estimate, currency, region, created_at")
      .eq("owner_id", member.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id, company_name, is_active, region, created_at")
      .eq("owner_id", member.id)
      .order("created_at", { ascending: false }),
    (() => {
      // Devir hedefi listesi: sadece kaydın kendi bölgesindeki satış ekibi üyeleri
      // (reassignOwner action'ı da kayıt bölgesi ile yeni sahibin bölgesini eşleştirmeyi
      // zorunlu kılıyor — burada aynı kısıtı seçenek listesine de uyguluyoruz).
      let q = supabase
        .from("profiles")
        .select("id, full_name, email, role, region, is_active")
        .in("role", ["sales_inhouse", "region_admin"])
        .eq("is_active", true)
        .neq("id", member.id);
      if (member.region) q = q.eq("region", member.region);
      return q;
    })(),
  ]);

  const pool = (poolRes.data ?? []) as PoolRow[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];
  const teamOptions: ReassignOption[] = ((teamRes.data ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
  }[]).map((t) => ({ id: t.id, label: t.full_name || t.email }));

  const openLeads = leads.filter((l) => l.status !== "musteri" && l.status !== "kaybedildi");
  const pipelineByCurrency: Record<string, number> = {};
  openLeads.forEach((l) => {
    const cur = l.currency || "USD";
    pipelineByCurrency[cur] = (pipelineByCurrency[cur] ?? 0) + Number(l.value_estimate || 0);
  });
  const pipelineText = Object.entries(pipelineByCurrency).length
    ? Object.entries(pipelineByCurrency)
        .map(([c, v]) => `${c} ${fmtNumber(Math.round(v))}`)
        .join(" · ")
    : "—";
  const activeCustomers = customers.filter((c) => c.is_active);
  const conversionRate =
    leads.length > 0 ? Math.round((leads.filter((l) => l.status === "musteri").length / leads.length) * 100) : 0;

  return (
    <>
      <Topbar
        title={member.full_name || member.email}
        subtitle={`${member.role ? ROLE_LABELS_TR[member.role] : "—"}${
          member.region ? " · " + REGION_LABELS_TR[member.region] : ""
        } · ${member.email}`}
      />

      <Link
        href="/sales/team"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-rg-ink-soft hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Satış Ekibine dön
      </Link>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Havuz Kaydı"
          value={fmtNumber(pool.length)}
          delta="toplam"
          trend="up"
          ringColor="#5E17EB"
          ringPercent={Math.min(100, pool.length)}
        />
        <KpiCard
          label="Açık Lead"
          value={fmtNumber(openLeads.length)}
          delta={`${leads.length} toplam`}
          trend={openLeads.length > 0 ? "up" : "down"}
          ringColor="#B9790E"
          ringPercent={Math.min(100, openLeads.length)}
        />
        <KpiCard
          label="Aktif Müşteri"
          value={fmtNumber(activeCustomers.length)}
          delta={`${customers.length} toplam`}
          trend={activeCustomers.length > 0 ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, activeCustomers.length)}
        />
        <KpiCard
          label="Dönüşüm Oranı"
          value={`%${conversionRate}`}
          delta="lead → müşteri"
          trend={conversionRate > 0 ? "up" : "down"}
          ringColor="hsl(var(--primary))"
          ringPercent={conversionRate}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
          Pipeline Değeri (açık lead&apos;ler)
        </div>
        <div className="font-display text-[19px] font-bold text-rg-ink">{pipelineText}</div>
      </div>

      <div className="mt-5 rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="border-b border-rg-line px-5 py-3.5 text-[13px] font-bold text-rg-ink">
          Atanan Lead&apos;ler
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Firma</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Değer</th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Tarih</th>
                <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-rg-line">
                  <td className="px-4 py-3">
                    <Link href={`/sales/leads/${l.id}`} className="text-[12.5px] font-semibold text-rg-ink hover:text-primary">
                      {l.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " + LEAD_STATUS_CLASS[l.status]}>
                      {LEAD_STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-rg-ink-soft">
                    {l.value_estimate ? `${l.currency} ${fmtNumber(l.value_estimate)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <ReassignSelect kind="lead" recordId={l.id} options={teamOptions} />
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    Bu üyeye atanmış lead yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <div className="rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
          <div className="border-b border-rg-line px-5 py-3.5 text-[13px] font-bold text-rg-ink">Havuz Kayıtları</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <tbody>
                {pool.map((p) => (
                  <tr key={p.id} className="border-t border-rg-line">
                    <td className="px-4 py-3">
                      <div className="text-[12.5px] font-semibold text-rg-ink">{p.company_name}</div>
                      <div className="text-[11px] text-rg-ink-faint">{p.source || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReassignSelect kind="pool" recordId={p.id} options={teamOptions} />
                    </td>
                  </tr>
                ))}
                {pool.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                      Havuzda kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
          <div className="border-b border-rg-line px-5 py-3.5 text-[13px] font-bold text-rg-ink">Müşteriler</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-rg-line">
                    <td className="px-4 py-3">
                      <Link
                        href={`/sales/customers/${c.id}`}
                        className="text-[12.5px] font-semibold text-rg-ink hover:text-primary"
                      >
                        {c.company_name}
                      </Link>
                      <div className="text-[11px] text-rg-ink-faint">{c.is_active ? "Aktif" : "Pasif"}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReassignSelect kind="customer" recordId={c.id} options={teamOptions} />
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                      Müşterisi yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

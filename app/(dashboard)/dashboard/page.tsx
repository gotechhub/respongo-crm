import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Contact,
  FileText,
  BookOpen,
  Wallet,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/shared/kpi-card";
import { createClient } from "@/lib/supabase/server";
import { REGION_LABELS_TR, type Region, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ----------------------------------------------------------------------------
// yardımcılar
// ----------------------------------------------------------------------------

const ADMIN_ROLES: UserRole[] = ["founder", "region_admin"];
const SALES_VISIBLE_ROLES: UserRole[] = [
  "sales_inhouse",
  "partner_tr",
  "partner_global",
  "marketing",
  "finance",
  "support_agent",
];

const MODULE_LINKS: {
  key: string;
  label: string;
  href: string;
  icon: typeof Building2;
}[] = [
  { key: "companies", label: "Şirketler", href: "/companies", icon: Building2 },
  { key: "contacts", label: "Kişiler", href: "/contacts", icon: Contact },
  { key: "customer_pool", label: "Müşteri Havuzu", href: "/sales", icon: Users },
  { key: "leads", label: "Müşteri Adayları", href: "/sales/leads", icon: FileText },
  { key: "customers", label: "Müşteriler", href: "/sales/customers", icon: Users },
  { key: "proposal_templates", label: "Teklif Şablonları", href: "/sales/proposal-templates", icon: BookOpen },
  { key: "price_lists", label: "Fiyat Listeleri", href: "/sales/price-lists", icon: Wallet },
  { key: "projects", label: "Proje & Görev", href: "/projects", icon: FolderKanban },
  { key: "users", label: "Kullanıcı & Yetki", href: "/users", icon: ShieldCheck },
];

function fmtNumber(n: number) {
  return n.toLocaleString("tr-TR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function countSince(rows: { created_at: string }[], iso: string) {
  return rows.filter((r) => r.created_at >= iso).length;
}

type LeadRow = {
  id: string;
  company_name: string;
  status: "yeni" | "gorusme" | "teklif" | "musteri" | "kaybedildi";
  value_estimate: number | null;
  currency: string;
  region: Region | null;
  owner_id: string | null;
  created_at: string;
};

type CustomerRow = {
  id: string;
  company_name: string;
  is_active: boolean;
  owner_id: string | null;
  region: Region | null;
  created_at: string;
};

type PoolRow = { id: string; company_name: string; region: Region | null; created_at: string };
type CompanyRow = { id: string; name: string; region: Region | null; created_at: string };
type ContactRow = { id: string; first_name: string; last_name: string | null; created_at: string };

type Activity = {
  id: string;
  label: string;
  meta: string;
  href: string;
  created_at: string;
  /** Tailwind sınıfları JIT taramasında bulunabilsin diye HER ZAMAN tam literal yazılır. */
  dotClass: string;
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region, full_name")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null; full_name: string | null } | null;
  const role = caller?.role ?? null;

  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const isFounder = role === "founder";
  const hasSalesVisibility = isAdmin || (role ? SALES_VISIBLE_ROLES.includes(role) : false);

  const firstName = caller?.full_name?.split(" ")[0] ?? "";
  const now = new Date();
  const last7Iso = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = prevMonthDate.toISOString();

  // Quick-access: founder her modülü görür; diğerleri role_permissions'a göre.
  let visibleModuleKeys = new Set(MODULE_LINKS.map((m) => m.key));
  if (!isFounder && role) {
    const { data: perms } = await supabase
      .from("role_permissions")
      .select("module_key")
      .eq("role", role)
      .eq("can_view", true);
    visibleModuleKeys = new Set((perms ?? []).map((p) => p.module_key as string));
  }
  const quickLinks = MODULE_LINKS.filter((m) => visibleModuleKeys.has(m.key));

  if (!hasSalesVisibility) {
    // freelancer / project_member / customer — satış verisine erişimi olmayan roller.
    return (
      <>
        <Topbar
          title="Panel"
          subtitle={firstName ? `Hoş geldin ${firstName} — erişimin olan bölümler aşağıda.` : "Erişimin olan bölümler aşağıda."}
        />
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="flex items-center gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg transition-colors hover:border-primary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="text-[13px] font-semibold text-rg-ink">{m.label}</div>
            </Link>
          ))}
          {quickLinks.length === 0 && (
            <div className="col-span-4 rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
              Henüz erişimin olan bir modül yok — Süper Admin ile iletişime geç.
            </div>
          )}
        </div>
      </>
    );
  }

  // region_admin sorguları kendi bölgesine sabitler; founder tümünü görür;
  // diğer satış-görünür roller için RLS zaten sadece görebildikleri satırları döner.
  const regionScope = role === "region_admin" ? caller?.region ?? null : null;

  function applyRegion<T>(q: T): T {
    // Supabase query builder — region_admin için ek .eq("region", ...) uygulanır.
    if (regionScope) {
      // @ts-expect-error — generic builder üzerinde .eq zincirlemesi
      return q.eq("region", regionScope);
    }
    return q;
  }

  const [companiesRes, contactsRes, poolRes, leadsRes, customersRes] = await Promise.all([
    applyRegion(supabase.from("companies").select("id, name, region, created_at")).limit(1000),
    supabase.from("contacts").select("id, first_name, last_name, created_at").limit(1000),
    applyRegion(supabase.from("customer_pool").select("id, company_name, region, created_at")).limit(1000),
    applyRegion(
      supabase.from("leads").select("id, company_name, status, value_estimate, currency, region, owner_id, created_at")
    ).limit(1000),
    applyRegion(
      supabase.from("customers").select("id, company_name, is_active, owner_id, region, created_at")
    ).limit(1000),
  ]);

  const companies = (companiesRes.data ?? []) as CompanyRow[];
  const contacts = (contactsRes.data ?? []) as ContactRow[];
  const pool = (poolRes.data ?? []) as PoolRow[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const customers = (customersRes.data ?? []) as CustomerRow[];

  const statusCounts = { yeni: 0, gorusme: 0, teklif: 0, musteri: 0, kaybedildi: 0 };
  leads.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
  });
  const openLeadsCount = statusCounts.yeni + statusCounts.gorusme + statusCounts.teklif;

  const pipelineByCurrency: Record<string, number> = {};
  leads
    .filter((l) => l.status !== "musteri" && l.status !== "kaybedildi")
    .forEach((l) => {
      const cur = l.currency || "USD";
      pipelineByCurrency[cur] = (pipelineByCurrency[cur] ?? 0) + Number(l.value_estimate || 0);
    });
  const pipelineText = Object.entries(pipelineByCurrency).length
    ? Object.entries(pipelineByCurrency)
        .map(([c, v]) => `${c} ${fmtNumber(Math.round(v))}`)
        .join(" · ")
    : "—";

  const activeCustomers = customers.filter((c) => c.is_active);
  const customersThisMonth = customers.filter((c) => c.created_at >= thisMonthStart).length;
  const customersPrevMonth = customers.filter(
    (c) => c.created_at >= prevMonthStart && c.created_at < thisMonthStart
  ).length;

  const companiesNew7 = countSince(companies, last7Iso);
  const contactsNew7 = countSince(contacts, last7Iso);
  const leadsNew7 = countSince(leads, last7Iso);
  const customersNew7 = countSince(customers, last7Iso);

  // Ekip performansı + bölge kırılımı — sadece founder/region_admin.
  let teamRows: { id: string; name: string; role: UserRole; leadCount: number; customerCount: number; conversion: number }[] = [];
  if (isAdmin) {
    let salesProfilesQuery = supabase
      .from("profiles")
      .select("id, full_name, email, role, region")
      .in("role", ["sales_inhouse", "partner_tr", "partner_global"]);
    if (regionScope) {
      salesProfilesQuery = salesProfilesQuery.eq("region", regionScope);
    }
    const { data: salesProfiles } = await salesProfilesQuery;
    teamRows = ((salesProfiles ?? []) as { id: string; full_name: string | null; email: string; role: UserRole }[])
      .map((p) => {
        const leadCount = leads.filter((l) => l.owner_id === p.id).length;
        const customerCount = customers.filter((c) => c.owner_id === p.id).length;
        const conversion = leadCount > 0 ? Math.round((customerCount / leadCount) * 100) : customerCount > 0 ? 100 : 0;
        return { id: p.id, name: p.full_name || p.email, role: p.role, leadCount, customerCount, conversion };
      })
      .sort((a, b) => b.customerCount - a.customerCount || b.leadCount - a.leadCount);
  }

  const regionRows = isFounder
    ? (["tr", "global"] as Region[]).map((r) => ({
        region: r,
        pool: pool.filter((p) => p.region === r).length,
        leads: leads.filter((l) => l.region === r).length,
        customers: customers.filter((c) => c.region === r && c.is_active).length,
      }))
    : [];

  // Son aktiviteler — lead/müşteri/şirket/kişi karışık akış, en yeni 8.
  const activity: Activity[] = [
    ...leads.slice(0, 8).map<Activity>((l) => ({
      id: `lead-${l.id}`,
      label: l.company_name,
      meta: `Yeni lead — ${l.status === "musteri" ? "müşteriye dönüştü" : "durum: " + l.status}`,
      href: "/sales/leads",
      created_at: l.created_at,
      dotClass: "bg-golxp",
    })),
    ...customers.slice(0, 8).map<Activity>((c) => ({
      id: `customer-${c.id}`,
      label: c.company_name,
      meta: "Yeni müşteri kazanıldı",
      href: `/sales/customers/${c.id}`,
      created_at: c.created_at,
      dotClass: "bg-gofactory",
    })),
    ...companies.slice(0, 8).map<Activity>((co) => ({
      id: `company-${co.id}`,
      label: co.name,
      meta: "Yeni şirket eklendi",
      href: `/companies/${co.id}`,
      created_at: co.created_at,
      dotClass: "bg-golms",
    })),
    ...contacts.slice(0, 8).map<Activity>((ct) => ({
      id: `contact-${ct.id}`,
      label: `${ct.first_name} ${ct.last_name ?? ""}`.trim(),
      meta: "Yeni kişi eklendi",
      href: "/contacts",
      created_at: ct.created_at,
      dotClass: "bg-gocatalog",
    })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  const scopeLabel = isFounder
    ? "Şirket geneli"
    : role === "region_admin"
      ? `Bölge geneli — ${regionScope ? REGION_LABELS_TR[regionScope] : ""}`
      : "Görebildiğin kayıtlar";

  return (
    <>
      <Topbar
        title="Master Dashboard"
        subtitle={
          firstName
            ? `Hoş geldin ${firstName} — ${scopeLabel.toLowerCase()}, tek ekranda.`
            : `${scopeLabel} — tek ekranda.`
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Şirketler"
          value={fmtNumber(companies.length)}
          delta={`${companiesNew7} yeni (7 gün)`}
          trend={companiesNew7 > 0 ? "up" : "down"}
          ringColor="hsl(var(--primary))"
          ringPercent={Math.min(100, companies.length)}
        />
        <KpiCard
          label="Kişiler"
          value={fmtNumber(contacts.length)}
          delta={`${contactsNew7} yeni (7 gün)`}
          trend={contactsNew7 > 0 ? "up" : "down"}
          ringColor="#5E17EB"
          ringPercent={Math.min(100, contacts.length)}
        />
        <KpiCard
          label="Açık Lead"
          value={fmtNumber(openLeadsCount)}
          delta={`${leadsNew7} yeni (7 gün)`}
          trend={leadsNew7 > 0 ? "up" : "down"}
          ringColor="#B9790E"
          ringPercent={Math.min(100, openLeadsCount)}
        />
        <KpiCard
          label="Aktif Müşteri"
          value={fmtNumber(activeCustomers.length)}
          delta={`${customersNew7} yeni (7 gün)`}
          trend={customersNew7 > 0 ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, activeCustomers.length)}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <KpiCard
          label="Bu Ay Kazanılan Müşteri"
          value={fmtNumber(customersThisMonth)}
          delta={`${prevMonthDate.toLocaleDateString("tr-TR", { month: "long" })}: ${fmtNumber(customersPrevMonth)}`}
          trend={customersThisMonth >= customersPrevMonth ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, customersThisMonth * 10)}
        />
        <div className="col-span-3 flex flex-col justify-center rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
            Pipeline Değeri (açık lead&apos;ler)
          </div>
          <div className="font-display text-[22px] font-bold text-rg-ink">{pipelineText}</div>
          <div className="mt-1 text-[11.5px] text-rg-ink-faint">
            {openLeadsCount} açık lead üzerinden — para birimine göre ayrı toplanır.
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[13px] font-bold text-rg-ink">Son Aktiviteler</div>
          </div>
          {activity.length === 0 ? (
            <p className="text-[12px] text-rg-ink-faint">Henüz aktivite yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-rg-surface-alt"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.dotClass}`} />
                    <div>
                      <div className="text-[12.5px] font-semibold text-rg-ink">{a.label}</div>
                      <div className="text-[11px] text-rg-ink-faint">{a.meta}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-rg-ink-faint">{fmtDate(a.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Lead Durum Dağılımı</div>
          <div className="flex flex-col gap-2.5">
            {(
              [
                ["yeni", "Yeni", "bg-golms"],
                ["gorusme", "Görüşme", "bg-gocatalog"],
                ["teklif", "Teklif", "bg-golxp"],
                ["musteri", "Müşteriye Döndü", "bg-gofactory"],
                ["kaybedildi", "Kaybedildi", "bg-rg-ink-faint"],
              ] as [keyof typeof statusCounts, string, string][]
            ).map(([key, label, dot]) => {
              const total = leads.length || 1;
              const pct = Math.round((statusCounts[key] / total) * 100);
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                  <span className="w-[110px] shrink-0 text-[11.5px] text-rg-ink-soft">{label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rg-surface-alt">
                    <div className={`h-full rounded-full ${dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[11.5px] font-semibold text-rg-ink">
                    {statusCounts[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isFounder && regionRows.length > 0 && (
        <div className="mt-5 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Bölge Kırılımı</div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                <th className="pb-2">Bölge</th>
                <th className="pb-2">Havuz</th>
                <th className="pb-2">Lead</th>
                <th className="pb-2">Aktif Müşteri</th>
              </tr>
            </thead>
            <tbody>
              {regionRows.map((r) => (
                <tr key={r.region} className="border-t border-rg-line">
                  <td className="py-2.5 font-semibold text-rg-ink">{REGION_LABELS_TR[r.region]}</td>
                  <td className="py-2.5 text-rg-ink-soft">{r.pool}</td>
                  <td className="py-2.5 text-rg-ink-soft">{r.leads}</td>
                  <td className="py-2.5 text-rg-ink-soft">{r.customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && teamRows.length > 0 && (
        <div className="mt-5 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Ekip Performansı</div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                <th className="pb-2">Temsilci</th>
                <th className="pb-2">Lead</th>
                <th className="pb-2">Müşteri</th>
                <th className="pb-2">Dönüşüm</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((t) => (
                <tr key={t.id} className="border-t border-rg-line">
                  <td className="py-2.5 font-semibold text-rg-ink">{t.name}</td>
                  <td className="py-2.5 text-rg-ink-soft">{t.leadCount}</td>
                  <td className="py-2.5 text-rg-ink-soft">{t.customerCount}</td>
                  <td className="py-2.5 text-rg-ink-soft">%{t.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-rg-ink">Hızlı Erişim</div>
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          {quickLinks.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group flex items-center justify-between gap-2 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-primary">
                  <m.icon className="h-4 w-4" />
                </div>
                <span className="text-[12.5px] font-semibold text-rg-ink">{m.label}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-rg-ink-faint transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { Pagination, parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ProjectCreateForm, type CustomerOption } from "./project-form";
import { ProjectFilters } from "./project-filters";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_CLASS } from "./status-labels";
import type { ProjectStatus, TaskStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectRow = {
  id: string;
  customer_id: string;
  name: string;
  status: ProjectStatus;
  end_date: string | null;
  created_at: string;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className={"font-display text-[18px] font-bold " + (cls ?? "text-rg-ink")}>{value || "—"}</span>
    </div>
  );
}

export default async function ProjectsPage({
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
  const statusFilter = typeof searchParams.status === "string" ? searchParams.status : "";

  let query = supabase
    .from("projects")
    .select("id, customer_id, name, status, end_date, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const [{ data: projects, count }, { data: allProjects }, { data: customerRows }, { data: allTasks }] =
    await Promise.all([
      query.range(from, to),
      supabase.from("projects").select("status"),
      supabase.from("customers").select("id, company_name").order("company_name", { ascending: true }).limit(500),
      supabase.from("tasks").select("id, project_id, status"),
    ]);

  const rows = (projects ?? []) as ProjectRow[];
  const statuses = (allProjects ?? []) as { status: ProjectStatus }[];
  const tasks = (allTasks ?? []) as { id: string; project_id: string; status: TaskStatus }[];

  const customerNames: Record<string, string> = {};
  (customerRows ?? []).forEach((c) => {
    customerNames[c.id] = c.company_name;
  });

  const activeCount = statuses.filter((s) => s.status === "active").length;
  const onHoldCount = statuses.filter((s) => s.status === "on_hold").length;
  const completedCount = statuses.filter((s) => s.status === "completed").length;
  const openTaskCount = tasks.filter((t) => t.status !== "done").length;

  // Proje bazlı görev ilerlemesi — kanban durumu tasks tablosunda, burada
  // sadece toplam/tamamlanan sayısını çıkarıp liste satırında bar olarak
  // gösteriyoruz (ayrı bir "progress" kolonu YOK, her sorguda taze hesaplanır).
  const taskStatsByProject: Record<string, { total: number; done: number }> = {};
  tasks.forEach((t) => {
    const bucket = (taskStatsByProject[t.project_id] ??= { total: 0, done: 0 });
    bucket.total += 1;
    if (t.status === "done") bucket.done += 1;
  });

  return (
    <>
      <Topbar title="Proje & Görev" subtitle="Proje, görev ve alt görevleri tek yerden yönet." />

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard label="Aktif Proje" value={String(activeCount)} />
        <StatCard label="Beklemede" value={String(onHoldCount)} cls="text-golxp" />
        <StatCard label="Tamamlanan" value={String(completedCount)} />
        <StatCard label="Açık Görev" value={String(openTaskCount)} cls="text-primary" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Proje adı ara..." />
        </Suspense>
        <ProjectFilters />
      </div>

      <ProjectCreateForm customers={(customerRows ?? []) as CustomerOption[]} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-rg-surface-alt text-left">
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Proje
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Müşteri
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Görev İlerlemesi
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Bitiş / Hedef
                </th>
                <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const stat = taskStatsByProject[row.id] ?? { total: 0, done: 0 };
                const pct = stat.total ? Math.round((stat.done / stat.total) * 100) : 0;
                return (
                  <tr key={row.id} className="border-t border-rg-line">
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-rg-ink">
                      <Link href={`/projects/${row.id}`} className="hover:text-primary">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-rg-ink-soft">{customerNames[row.customer_id] ?? "—"}</td>
                    <td className="px-4 py-3">
                      {stat.total === 0 ? (
                        <span className="text-[11.5px] text-rg-ink-faint">Görev yok</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-rg-surface-alt">
                            <div className="h-full rounded-full bg-gofactory" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="whitespace-nowrap text-[11px] font-semibold text-rg-ink-faint">
                            {stat.done}/{stat.total}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-rg-ink-faint">{fmtDate(row.end_date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " +
                          PROJECT_STATUS_CLASS[row.status]
                        }
                      >
                        {PROJECT_STATUS_LABEL[row.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                    {q ? "Aramanla eşleşen proje yok." : "Henüz proje yok — yukarıdan yeni bir proje ekleyebilirsin."}
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

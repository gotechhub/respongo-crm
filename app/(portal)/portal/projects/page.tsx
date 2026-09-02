import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_CLASS } from "../../../(dashboard)/projects/status-labels";
import type { ProjectStatus } from "../../../(dashboard)/projects/actions";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// RLS (projects_customer_select) zaten sadece bu müşteriye ait projeleri döndürüyor.
export default async function PortalProjectsPage() {
  const supabase = createClient();
  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, name, description, status, start_date, end_date")
    .order("start_date", { ascending: false });

  const rows = (projectRows ?? []) as ProjectRow[];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-rg-ink">Projelerim</h1>
        <p className="text-[13px] text-rg-ink-soft">Senin için yürütülen projelerin durumu ve zaman çizelgesi.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Şu an senin için yürütülen bir proje yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-rg-ink">{row.name}</div>
                  {row.description && <p className="mt-1 text-[12px] text-rg-ink-soft">{row.description}</p>}
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + PROJECT_STATUS_CLASS[row.status]
                  }
                >
                  {PROJECT_STATUS_LABEL[row.status]}
                </span>
              </div>
              <div className="mt-2.5 text-[11.5px] text-rg-ink-faint">
                {fmtDate(row.start_date)} — {fmtDate(row.end_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

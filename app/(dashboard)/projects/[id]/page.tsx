import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { ProjectStatusControl } from "./project-status-control";
import { TaskBoard, type AssigneeRow, type MemberOption, type SubtaskRow, type TaskRow } from "./task-board";
import type { ProjectStatus } from "../actions";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="text-[12.8px] text-rg-ink">{value || "—"}</span>
    </div>
  );
}

// Atama listesine dahil ettiğimiz roller — proje/görev yürüten iç ekip
// (destek/pazarlama/finans gibi rollerin görev ataması bu modülün kapsamı
// dışında, aynı Destek Merkezi'ndeki agent listesi mantığı).
const ASSIGNABLE_ROLES = ["founder", "region_admin", "sales_inhouse", "project_member", "freelancer"];

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) {
    notFound();
  }

  const [{ data: customer }, { data: owner }, { data: tasksRaw }, { data: memberRows }] = await Promise.all([
    supabase.from("customers").select("id, company_name, primary_contact_name").eq("id", project.customer_id).single(),
    project.owner_id
      ? supabase.from("profiles").select("id, full_name, email").eq("id", project.owner_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("tasks")
      .select("id, title, description, status, due_date, created_at")
      .eq("project_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email").in("role", ASSIGNABLE_ROLES),
  ]);

  const tasks = (tasksRaw ?? []) as TaskRow[];
  const taskIds = tasks.map((t) => t.id);

  const [{ data: assigneeRows }, { data: subtaskRows }] = await Promise.all([
    taskIds.length
      ? supabase.from("task_assignees").select("task_id, profile_id").in("task_id", taskIds)
      : Promise.resolve({ data: [] as AssigneeRow[] }),
    taskIds.length
      ? supabase
          .from("subtasks")
          .select("id, task_id, title, is_done, assignee_id, due_date")
          .in("task_id", taskIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as SubtaskRow[] }),
  ]);

  const members: MemberOption[] = (memberRows ?? []).map((m) => ({
    id: m.id,
    name: (m.full_name as string | null) || (m.email as string),
  }));
  const memberNames: Record<string, string> = {};
  members.forEach((m) => {
    memberNames[m.id] = m.name;
  });

  const status = project.status as ProjectStatus;
  const ownerName = owner ? (owner.full_name as string | null) || (owner.email as string) : null;

  return (
    <>
      <Link href="/projects" className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Proje & Görevlere dön
      </Link>
      <Topbar title={project.name} subtitle={customer?.company_name ?? "Proje"} />

      <div className="mb-5">
        <ProjectStatusControl projectId={project.id} status={status} />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-4 text-[13px] font-bold text-rg-ink">Proje Bilgileri</div>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Müşteri" value={customer?.company_name} />
            <InfoField label="Proje Sahibi" value={ownerName} />
            <InfoField label="Başlangıç" value={fmtDate(project.start_date)} />
            <InfoField label="Bitiş / Hedef" value={fmtDate(project.end_date)} />
          </div>
          {project.description && (
            <p className="mt-4 whitespace-pre-wrap text-[12.5px] text-rg-ink-soft">{project.description}</p>
          )}
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-3 text-[13px] font-bold text-rg-ink">Müşteri</div>
          <div className="flex flex-col gap-2 text-[12.5px] text-rg-ink-soft">
            <div>{customer?.company_name}</div>
            {customer?.primary_contact_name && <div>{customer.primary_contact_name}</div>}
          </div>
          <Link
            href={`/sales/customers/${project.customer_id}`}
            className="mt-4 inline-block text-[12px] font-semibold text-primary hover:underline"
          >
            Müşteri 360° profiline git →
          </Link>
        </div>
      </div>

      <TaskBoard
        projectId={project.id}
        tasks={tasks}
        assignees={(assigneeRows ?? []) as AssigneeRow[]}
        subtasks={(subtaskRows ?? []) as SubtaskRow[]}
        members={members}
        memberNames={memberNames}
      />
    </>
  );
}

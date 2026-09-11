import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { TasksView, type TaskWithProject, type SubtaskLite, type AssigneeLite } from "./tasks-view";

// V3 (2026-09-03): Kullanıcının açık isteği — "proje ve görevler aynı yerde
// ama projeler ve görevler ayrı olmalı". Görevler VERİ MODELİNDE her zaman
// bir projeye bağlıydı (bu doğru bir tasarım — bağlamsız bir görev anlamsız)
// ama ARAYÜZDE sadece bir projenin içine gömülü olarak görülebiliyordu; tüm
// projelerdeki görevlerimi tek bakışta görecek bağımsız bir üst menü öğesi
// hiç yoktu. Bu sayfa o boşluğu dolduruyor: /projects proje listesi+detayına
// odaklanmaya devam ediyor, /tasks ise tüm projelerdeki görevleri TEK
// LİSTEDE, projeye göre gruplanmış halde gösteriyor.
//
// RLS notu: ekstra bir "sadece bana ait olanlar" filtresi YAZMIYORUZ — mevcut
// RLS politikaları (tasks_assignee_select, tasks_founder_all,
// tasks_project_owner, projects_region_admin_manage) zaten her rol için
// doğru alt kümeyi döndürüyor: normal bir ekip üyesi sadece kendine atanmış
// görevleri görür, founder/region_admin/proje sahibi daha genişini görür.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isManager = profile?.role === "founder" || profile?.role === "region_admin";

  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select("id, title, description, status, due_date, project_id, created_at, projects(id, name, customer_id)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const tasks = (tasksRaw ?? []) as unknown as TaskWithProject[];
  const taskIds = tasks.map((t) => t.id);

  const [{ data: assigneeRows }, { data: subtaskRows }, { data: customerRows }, { data: projectRows }, { data: teamRows }] =
    await Promise.all([
      taskIds.length
        ? supabase.from("task_assignees").select("task_id, profile_id, profiles(id, full_name, email)").in("task_id", taskIds)
        : Promise.resolve({ data: [] }),
      taskIds.length
        ? supabase
            .from("subtasks")
            .select("id, task_id, title, is_done, assignee_id, due_date")
            .in("task_id", taskIds)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from("customers").select("id, company_name"),
      // "Yeni Görev" formundaki proje seçimi — RLS (tasks_project_owner /
      // tasks_founder_all) zaten sadece sahibi olunan (ya da founder/
      // region_admin için tüm) projeleri döndürür, bu yüzden burada ekstra
      // filtreye gerek yok: liste zaten "gerçekten görev açabileceğin
      // projeler" ile sınırlı geliyor.
      supabase.from("projects").select("id, name").order("name", { ascending: true }),
      // Atama seçici için ekip roster'ı — müşteri/partner rolleri hariç,
      // gerçekten göreve atanabilecek iç ekip + freelancer/proje üyesi rolleri.
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("role", ["founder", "region_admin", "sales_inhouse", "project_member", "freelancer", "support_agent", "marketing", "finance"])
        .order("full_name", { ascending: true }),
    ]);

  const customerNames: Record<string, string> = {};
  (customerRows ?? []).forEach((c) => {
    customerNames[c.id as string] = c.company_name as string;
  });

  const assignees = (assigneeRows ?? []).map((a) => {
    const p = a.profiles as unknown as { id: string; full_name: string | null; email: string } | null;
    return {
      task_id: a.task_id as string,
      profile_id: a.profile_id as string,
      name: p ? p.full_name || p.email : "—",
    };
  }) as AssigneeLite[];

  const subtasks = (subtaskRows ?? []) as SubtaskLite[];
  const projects = (projectRows ?? []) as { id: string; name: string }[];
  const teamMembers = ((teamRows ?? []) as { id: string; full_name: string | null; email: string }[]).map((p) => ({
    id: p.id,
    name: p.full_name || p.email,
  }));

  return (
    <>
      <Topbar
        title={isManager ? "Tüm Görevler" : "Görevlerim"}
        subtitle="Tüm projelerdeki görevler tek listede — proje bazlı ayrım için Proje & Görev › Projeler'e bak."
      />
      <TasksView
        tasks={tasks}
        assignees={assignees}
        subtasks={subtasks}
        customerNames={customerNames}
        projects={projects}
        teamMembers={teamMembers}
      />
    </>
  );
}

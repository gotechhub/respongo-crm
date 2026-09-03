"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "done";

export type ProjectInput = {
  customerId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
};

// RLS notu: projects_owner_write politikası owner_id = auth.uid() olan
// satırlara herkese ALL izni veriyor — bu yüzden owner_id'yi her zaman
// oluşturan kullanıcıya eşitliyoruz (licenses/proposals'daki owner_id
// deseniyle aynı). Founder ve region_admin zaten kendi ALL politikalarıyla
// her projeye erişebiliyor.
export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.customerId) {
    return { ok: false, error: "Müşteri seçimi zorunlu." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Proje adı zorunlu." };
  }

  const { data: callerProfile } = await supabase.from("profiles").select("region").eq("id", user.id).single();

  const { error } = await supabase.from("projects").insert({
    customer_id: input.customerId,
    name: input.name.trim(),
    description: input.description.trim() || null,
    status: "active",
    owner_id: user.id,
    created_by: user.id,
    start_date: input.startDate || new Date().toISOString().slice(0, 10),
    end_date: input.endDate || null,
    region: callerProfile?.region ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/projects");
  return { ok: true };
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("projects").update({ status }, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu projenin durumunu değiştirme yetkin yok." };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Görevler
// ----------------------------------------------------------------------------

export type TaskInput = {
  projectId: string;
  title: string;
  description: string;
  dueDate: string | null;
};

// RLS notu: insert sadece proje sahibi veya founder tarafından yapılabiliyor
// (tasks_project_owner / tasks_founder_all) — atanan kişi (assignee) yeni
// görev oluşturamaz, sadece var olanın durumunu güncelleyebilir.
export async function createTask(input: TaskInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.title.trim()) {
    return { ok: false, error: "Görev başlığı zorunlu." };
  }

  const { error } = await supabase.from("tasks").insert({
    project_id: input.projectId,
    title: input.title.trim(),
    description: input.description.trim() || null,
    status: "todo",
    due_date: input.dueDate,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/projects/${input.projectId}`);
  return { ok: true };
}

// RLS notu: hem proje sahibi hem de göreve atanmış kişi (task_assignees)
// durumu değiştirebilir (tasks_project_owner + tasks_assignee_update) —
// yetkisiz bir güncelleme count=0 döner, kullanıcıya net hata gösteriyoruz.
export async function updateTaskStatus(id: string, projectId: string, status: TaskStatus): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("tasks").update({ status }, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu görevin durumunu değiştirme yetkin yok." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

// RLS notu: task_assignees'e ekleme/çıkarma sadece proje sahibi veya founder
// tarafından yapılabiliyor (task_assignees_project_owner_manage).
export async function assignTaskMember(taskId: string, projectId: string, profileId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("task_assignees").insert({ task_id: taskId, profile_id: profileId });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Bu kişi zaten göreve atanmış." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function unassignTaskMember(taskId: string, projectId: string, profileId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("task_assignees")
    .delete({ count: "exact" })
    .eq("task_id", taskId)
    .eq("profile_id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu atamayı kaldırma yetkin yok." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Alt Görevler (checklist)
// ----------------------------------------------------------------------------

export type SubtaskInput = {
  taskId: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  assigneeId: string | null;
};

// RLS notu: insert sadece proje sahibi/founder yapabiliyor
// (subtasks_via_task_owner) — atanan kişi checklist'e madde ekleyemez,
// sadece kendine atanmış maddeyi işaretleyebilir (subtasks_assignee_update).
export async function createSubtask(input: SubtaskInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.title.trim()) {
    return { ok: false, error: "Alt görev başlığı zorunlu." };
  }

  const { error } = await supabase.from("subtasks").insert({
    task_id: input.taskId,
    title: input.title.trim(),
    due_date: input.dueDate,
    assignee_id: input.assigneeId,
    is_done: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/projects/${input.projectId}`);
  return { ok: true };
}

export async function toggleSubtask(id: string, projectId: string, isDone: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("subtasks").update({ is_done: isDone }, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu alt görevi güncelleme yetkin yok." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

// V3 (2026-09-03): `subtasks.assignee_id` kolonu baştan beri vardı ama
// arayüzde HİÇBİR YERDE kullanılmıyordu — createSubtask her zaman
// assigneeId: null gönderiyordu, atamayı sonradan değiştirecek bir action da
// hiç yoktu. Kullanıcının "her alt görev kendi içinde başkasına atanabilmeli"
// isteği tam olarak bu eksiği işaret ediyor. RLS notu: reassignSubtask,
// createSubtask ile AYNI yetki kuralına tabi — sadece proje sahibi/founder
// atamayı değiştirebilir (subtasks_via_task_owner policy'si UPDATE'i de
// kapsıyor); atanan kişinin kendisi sadece is_done'ı değiştirebiliyor.
export async function reassignSubtask(id: string, projectId: string, assigneeId: string | null): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("subtasks")
    .update({ assignee_id: assigneeId }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu alt görevin atamasını değiştirme yetkin yok." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

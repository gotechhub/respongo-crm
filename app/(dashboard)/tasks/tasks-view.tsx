"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckSquare, ChevronRight, Loader2, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateTaskStatus,
  toggleSubtask,
  createTask,
  createSubtask,
  type TaskStatus,
} from "../projects/actions";
import { TASK_STATUS_LABEL } from "../projects/status-labels";

export type TaskWithProject = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  project_id: string;
  created_at: string;
  projects: { id: string; name: string; customer_id: string } | null;
};
export type AssigneeLite = { task_id: string; profile_id: string; name: string };
export type SubtaskLite = {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  assignee_id: string | null;
  due_date: string | null;
};
export type ProjectOption = { id: string; name: string };
export type TeamMemberOption = { id: string; name: string };

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function isOverdue(iso: string | null, status: TaskStatus) {
  if (!iso || status === "done") return false;
  return new Date(iso).getTime() < new Date().setHours(0, 0, 0, 0);
}

// "+ Yeni Görev" — proje seçimi zorunlu (görevler veri modelinde her zaman
// bir projeye bağlı, bkz. createTask yorumu), tek adımda bir kişiye atama
// opsiyonel. Proje listesi zaten sadece kullanıcının görev açabileceği
// projelerle sınırlı geldiği için (RLS), burada ek bir kısıtlama yok.
function NewTaskForm({
  projects,
  teamMembers,
  onCreated,
}: {
  projects: ProjectOption[];
  teamMembers: TeamMemberOption[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? "",
    title: "",
    description: "",
    dueDate: "",
    assigneeId: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.projectId) {
      setError("Önce bir proje seçmelisin — hiç projen yoksa Proje & Görev › Projeler'den birini oluştur.");
      return;
    }
    startTransition(async () => {
      const result = await createTask({
        projectId: form.projectId,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      });
      if (result.ok) {
        setForm({ projectId: form.projectId, title: "", description: "", dueDate: "", assigneeId: "" });
        setOpen(false);
        onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Vazgeç" : "Yeni Görev"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Proje *</label>
            {projects.length === 0 ? (
              <p className="text-[11.5px] text-rg-ink-faint">
                Görev açabileceğin bir proje yok — önce Proje &amp; Görev › Projeler&apos;den bir proje oluştur.
              </p>
            ) : (
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className={inputClass}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ata (opsiyonel)</label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className={inputClass}
            >
              <option value="">Kimseye atama</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>Başlık *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ör. GOLMS demo ortamını hazırla"
              className={inputClass}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>Açıklama (opsiyonel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={cn(inputClass, "resize-y")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Son Tarih (opsiyonel)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending || projects.length === 0}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kaydet
            </button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

// "+ Alt görev" — kullanıcı isteği: "alt görevleri ayrı ayrı kişilere
// atayabilmeliyim" — createSubtask zaten bağımsız bir assignee_id kabul
// ediyor (üst görevin atananlarından tamamen farklı olabilir).
function SubtaskAdder({
  taskId,
  projectId,
  teamMembers,
  onCreated,
}: {
  taskId: string;
  projectId: string;
  teamMembers: TeamMemberOption[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createSubtask({
        taskId,
        projectId,
        title,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });
      if (result.ok) {
        setTitle("");
        setDueDate("");
        setAssigneeId("");
        setOpen(false);
        onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-0.5 inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Alt görev ekle
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ml-0.5 flex flex-wrap items-center gap-1.5 rounded-[8px] bg-rg-surface-alt p-2"
    >
      <input
        required
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Alt görev başlığı"
        className="min-w-[160px] flex-1 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[11.5px] text-rg-ink outline-none focus:border-primary"
      />
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[11px] text-rg-ink-soft outline-none focus:border-primary"
      >
        <option value="">Kimseye atama</option>
        {teamMembers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[11px] text-rg-ink-soft outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-[6px] bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        Ekle
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="inline-flex items-center rounded-[6px] px-2 py-1.5 text-[11px] font-semibold text-rg-ink-faint hover:text-rg-ink"
      >
        Vazgeç
      </button>
      {error && <span className="w-full text-[10.5px] text-destructive">{error}</span>}
    </form>
  );
}

export function TasksView({
  tasks,
  assignees,
  subtasks,
  customerNames,
  projects,
  teamMembers,
}: {
  tasks: TaskWithProject[];
  assignees: AssigneeLite[];
  subtasks: SubtaskLite[];
  customerNames: Record<string, string>;
  projects: ProjectOption[];
  teamMembers: TeamMemberOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [error, setError] = useState("");

  const teamNameById = useMemo(() => {
    const map: Record<string, string> = {};
    teamMembers.forEach((m) => (map[m.id] = m.name));
    return map;
  }, [teamMembers]);

  const grouped = useMemo(() => {
    const byProject = new Map<string, { project: TaskWithProject["projects"]; tasks: TaskWithProject[] }>();
    for (const t of tasks) {
      if (statusFilter !== "all" && t.status !== statusFilter) continue;
      const key = t.project_id;
      if (!byProject.has(key)) byProject.set(key, { project: t.projects, tasks: [] });
      byProject.get(key)!.tasks.push(t);
    }
    return Array.from(byProject.values());
  }, [tasks, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((t) => (c[t.status] = (c[t.status] ?? 0) + 1));
    return c;
  }, [tasks]);

  function handleStatusChange(taskId: string, projectId: string, status: TaskStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, projectId, status);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleToggleSubtask(subtaskId: string, projectId: string, isDone: boolean) {
    setError("");
    startTransition(async () => {
      const result = await toggleSubtask(subtaskId, projectId, isDone);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <NewTaskForm projects={projects} teamMembers={teamMembers} onCreated={() => router.refresh()} />
        <div className="rounded-2xl border border-dashed border-rg-line bg-rg-surface p-10 text-center">
          <p className="text-[13px] font-semibold text-rg-ink">Sana atanmış bir görev yok</p>
          <p className="mt-1 text-[12px] text-rg-ink-faint">
            Yukarıdaki &quot;Yeni Görev&quot; ile ilk görevini oluşturabilir, bir ekip üyesine atayabilirsin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <NewTaskForm projects={projects} teamMembers={teamMembers} onCreated={() => router.refresh()} />

      <div className="flex flex-wrap items-center gap-1.5">
        {(["all", ...COLUMNS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
              statusFilter === s
                ? "border-primary bg-primary text-white"
                : "border-rg-line bg-rg-surface text-rg-ink-soft hover:bg-rg-surface-alt"
            )}
          >
            {s === "all" ? "Tümü" : TASK_STATUS_LABEL[s]}
            <span className="ml-1.5 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <span className="text-[12px] text-destructive">{error}</span>}

      <div className="flex flex-col gap-4">
        {grouped.map(({ project, tasks: projectTasks }) => (
          <div key={project?.id ?? "unknown"} className="rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
            <div className="flex items-center justify-between border-b border-rg-line px-4 py-3">
              <div>
                <div className="text-[13px] font-bold text-rg-ink">{project?.name ?? "Proje"}</div>
                {project?.customer_id && customerNames[project.customer_id] && (
                  <div className="text-[11px] text-rg-ink-faint">{customerNames[project.customer_id]}</div>
                )}
              </div>
              {project?.id && (
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                >
                  Proje detayı <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="flex flex-col divide-y divide-rg-line">
              {projectTasks.map((task) => {
                const taskAssignees = assignees.filter((a) => a.task_id === task.id);
                const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
                const doneCount = taskSubtasks.filter((s) => s.is_done).length;
                const due = fmtDate(task.due_date);
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <div key={task.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.8px] font-semibold text-rg-ink">{task.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {due && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                                overdue ? "bg-destructive/10 text-destructive" : "bg-rg-surface-alt text-rg-ink-faint"
                              )}
                            >
                              {overdue ? "Gecikti · " : ""}
                              {due}
                            </span>
                          )}
                          {taskSubtasks.length > 0 && (
                            <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-rg-ink-faint">
                              {doneCount}/{taskSubtasks.length} alt görev
                            </span>
                          )}
                          {taskAssignees.map((a) => (
                            <span
                              key={a.profile_id}
                              className="rounded-full bg-golxp-tint px-2 py-0.5 text-[10.5px] font-semibold text-golxp"
                            >
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <select
                        value={task.status}
                        disabled={isPending}
                        onChange={(e) => handleStatusChange(task.id, task.project_id, e.target.value as TaskStatus)}
                        className="shrink-0 rounded-[8px] border border-rg-line bg-rg-surface px-2 py-1.5 text-[11.5px] font-semibold text-rg-ink-soft outline-none focus:border-primary"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c} value={c}>
                            {TASK_STATUS_LABEL[c]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {taskSubtasks.length > 0 && (
                      <div className="ml-0.5 flex flex-col gap-1 border-l-2 border-rg-line pl-3">
                        {taskSubtasks.map((s) => (
                          <div key={s.id} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtask(s.id, task.project_id, !s.is_done)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 text-left text-[11.5px] text-rg-ink-soft"
                            >
                              {s.is_done ? (
                                <CheckSquare className="h-3.5 w-3.5 shrink-0 text-gofactory" />
                              ) : (
                                <Square className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className={s.is_done ? "text-rg-ink-faint line-through" : ""}>{s.title}</span>
                            </button>
                            {s.assignee_id && teamNameById[s.assignee_id] && (
                              <span className="rounded-full bg-gotools-tint px-1.5 py-0.5 text-[10px] font-semibold text-gotools">
                                {teamNameById[s.assignee_id]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <SubtaskAdder
                      taskId={task.id}
                      projectId={task.project_id}
                      teamMembers={teamMembers}
                      onCreated={() => router.refresh()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

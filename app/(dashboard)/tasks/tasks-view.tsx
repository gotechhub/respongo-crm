"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckSquare, ChevronRight, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTaskStatus, toggleSubtask, type TaskStatus } from "../projects/actions";
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

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function isOverdue(iso: string | null, status: TaskStatus) {
  if (!iso || status === "done") return false;
  return new Date(iso).getTime() < new Date().setHours(0, 0, 0, 0);
}

export function TasksView({
  tasks,
  assignees,
  subtasks,
  customerNames,
}: {
  tasks: TaskWithProject[];
  assignees: AssigneeLite[];
  subtasks: SubtaskLite[];
  customerNames: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [error, setError] = useState("");

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
      <div className="rounded-2xl border border-dashed border-rg-line bg-rg-surface p-10 text-center">
        <p className="text-[13px] font-semibold text-rg-ink">Sana atanmış bir görev yok</p>
        <p className="mt-1 text-[12px] text-rg-ink-faint">
          Görevler bir proje içinden oluşturulur — bkz. Proje & Görev › Projeler.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
                          <button
                            key={s.id}
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
                        ))}
                      </div>
                    )}
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

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, ChevronDown, ChevronUp, Loader2, Plus, Square, X } from "lucide-react";
import {
  createTask,
  updateTaskStatus,
  assignTaskMember,
  unassignTaskMember,
  createSubtask,
  toggleSubtask,
  reassignSubtask,
  type TaskStatus,
} from "../actions";
import { TASK_STATUS_LABEL } from "../status-labels";
import { cn } from "@/lib/utils";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
};
export type AssigneeRow = { task_id: string; profile_id: string };
export type SubtaskRow = {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  assignee_id: string | null;
  due_date: string | null;
};
export type MemberOption = { id: string; name: string };

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export function TaskBoard({
  projectId,
  tasks,
  assignees,
  subtasks,
  members,
  memberNames,
}: {
  projectId: string;
  tasks: TaskRow[];
  assignees: AssigneeRow[];
  subtasks: SubtaskRow[];
  members: MemberOption[];
  memberNames: Record<string, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "" });
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createTask({
        projectId,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate || null,
      });
      if (result.ok) {
        setNewTask({ title: "", description: "", dueDate: "" });
        setShowTaskForm(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, projectId, status);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleAssign(taskId: string, profileId: string) {
    if (!profileId) return;
    setError("");
    startTransition(async () => {
      const result = await assignTaskMember(taskId, projectId, profileId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleUnassign(taskId: string, profileId: string) {
    setError("");
    startTransition(async () => {
      const result = await unassignTaskMember(taskId, projectId, profileId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleToggleSubtask(subtaskId: string, isDone: boolean) {
    setError("");
    startTransition(async () => {
      const result = await toggleSubtask(subtaskId, projectId, isDone);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold text-rg-ink">Görevler</h2>
        <button
          onClick={() => setShowTaskForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showTaskForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showTaskForm ? "Vazgeç" : "Yeni Görev"}
        </button>
      </div>

      {showTaskForm && (
        <form
          onSubmit={handleCreateTask}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>Görev Başlığı *</label>
            <input
              value={newTask.title}
              onChange={(e) => setNewTask((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              placeholder="ör. Ana sayfa tasarımı"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Termin</label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((f) => ({ ...f, dueDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-1.5">
            <label className={labelClass}>Açıklama</label>
            <textarea
              rows={2}
              value={newTask.description}
              onChange={(e) => setNewTask((f) => ({ ...f, description: e.target.value }))}
              className={inputClass + " resize-y"}
            />
          </div>
          <div className="col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || !newTask.title.trim()}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      )}

      {error && <span className="text-[12px] text-destructive">{error}</span>}

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col} className="flex flex-col gap-3 rounded-2xl border border-rg-line bg-rg-surface-alt/40 p-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11.5px] font-bold uppercase tracking-[.3px] text-rg-ink-soft">
                  {TASK_STATUS_LABEL[col]}
                </span>
                <span className="rounded-full bg-rg-surface px-2 py-0.5 text-[10.5px] font-bold text-rg-ink-faint">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {colTasks.length === 0 && (
                  <div className="rounded-[10px] border border-dashed border-rg-line p-4 text-center text-[11px] text-rg-ink-faint">
                    Görev yok
                  </div>
                )}
                {colTasks.map((task) => {
                  const taskAssignees = assignees.filter((a) => a.task_id === task.id);
                  const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
                  const doneSubtasks = taskSubtasks.filter((s) => s.is_done).length;
                  const isOpen = openTaskId === task.id;
                  const due = fmtDate(task.due_date);

                  return (
                    <div key={task.id} className="rounded-[12px] border border-rg-line bg-rg-surface p-3.5 shadow-rg">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[12.8px] font-semibold text-rg-ink">{task.title}</span>
                        <button
                          onClick={() => setOpenTaskId(isOpen ? null : task.id)}
                          className="shrink-0 text-rg-ink-faint hover:text-rg-ink"
                        >
                          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {due && (
                          <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-rg-ink-faint">
                            {due}
                          </span>
                        )}
                        {taskSubtasks.length > 0 && (
                          <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-rg-ink-faint">
                            {doneSubtasks}/{taskSubtasks.length} alt görev
                          </span>
                        )}
                        {taskAssignees.map((a) => (
                          <span
                            key={a.profile_id}
                            className="rounded-full bg-golxp-tint px-2 py-0.5 text-[10.5px] font-semibold text-golxp"
                          >
                            {memberNames[a.profile_id] ?? "—"}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {COLUMNS.filter((c) => c !== col).map((c) => (
                          <button
                            key={c}
                            disabled={isPending}
                            onClick={() => handleStatusChange(task.id, c)}
                            className="rounded-[6px] border border-rg-line px-2 py-1 text-[10.5px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
                          >
                            → {TASK_STATUS_LABEL[c]}
                          </button>
                        ))}
                      </div>

                      {isOpen && (
                        <div className="mt-3 flex flex-col gap-3 border-t border-rg-line pt-3">
                          {task.description && (
                            <p className="whitespace-pre-wrap text-[11.5px] text-rg-ink-soft">{task.description}</p>
                          )}

                          <div className="flex flex-col gap-1.5">
                            <span className={labelClass}>Atananlar</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {taskAssignees.length === 0 && (
                                <span className="text-[11px] text-rg-ink-faint">Kimse atanmamış</span>
                              )}
                              {taskAssignees.map((a) => (
                                <span
                                  key={a.profile_id}
                                  className="inline-flex items-center gap-1 rounded-full bg-golxp-tint px-2 py-0.5 text-[10.5px] font-semibold text-golxp"
                                >
                                  {memberNames[a.profile_id] ?? "—"}
                                  <button onClick={() => handleUnassign(task.id, a.profile_id)} disabled={isPending}>
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                              <select
                                value=""
                                onChange={(e) => handleAssign(task.id, e.target.value)}
                                disabled={isPending}
                                className="rounded-[6px] border border-rg-line bg-rg-surface px-1.5 py-1 text-[10.5px] text-rg-ink-soft outline-none"
                              >
                                <option value="">+ Ata</option>
                                {members
                                  .filter((m) => !taskAssignees.some((a) => a.profile_id === m.id))
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          <SubtaskList
                            taskId={task.id}
                            projectId={projectId}
                            subtasks={taskSubtasks}
                            onToggle={handleToggleSubtask}
                            isPending={isPending}
                            members={members}
                            memberNames={memberNames}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubtaskList({
  taskId,
  projectId,
  subtasks,
  onToggle,
  isPending,
  members,
  memberNames,
}: {
  taskId: string;
  projectId: string;
  subtasks: SubtaskRow[];
  onToggle: (id: string, isDone: boolean) => void;
  isPending: boolean;
  members: MemberOption[];
  memberNames: Record<string, string>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [isAdding, startAdding] = useTransition();
  const [isReassigning, startReassigning] = useTransition();
  const [localError, setLocalError] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setLocalError("");
    startAdding(async () => {
      const result = await createSubtask({
        taskId,
        projectId,
        title,
        dueDate: null,
        assigneeId: newAssigneeId || null,
      });
      if (result.ok) {
        setTitle("");
        setNewAssigneeId("");
        setShowForm(false);
        router.refresh();
      } else {
        setLocalError(result.error);
      }
    });
  }

  function handleReassign(subtaskId: string, assigneeId: string) {
    setLocalError("");
    startReassigning(async () => {
      const result = await reassignSubtask(subtaskId, projectId, assigneeId || null);
      if (result.ok) router.refresh();
      else setLocalError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={labelClass}>Alt Görevler</span>
        <button onClick={() => setShowForm((v) => !v)} className="text-[10.5px] font-semibold text-primary hover:underline">
          {showForm ? "Vazgeç" : "+ Ekle"}
        </button>
      </div>
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-[11.5px] text-rg-ink">
          <button
            type="button"
            onClick={() => onToggle(s.id, !s.is_done)}
            disabled={isPending}
            className="text-rg-ink-faint"
          >
            {s.is_done ? <CheckSquare className="h-3.5 w-3.5 text-gofactory" /> : <Square className="h-3.5 w-3.5" />}
          </button>
          <span className={cn("flex-1", s.is_done && "text-rg-ink-faint line-through")}>{s.title}</span>
          {/* Her alt görev BAĞIMSIZ olarak farklı bir kişiye atanabilir —
              task_assignees'teki görev-seviyesi (çoklu kişi) atamadan ayrı,
              tek kişilik bir sorumluluk alanı. */}
          <select
            value={s.assignee_id ?? ""}
            onChange={(e) => handleReassign(s.id, e.target.value)}
            disabled={isReassigning}
            title="Alt görevi ata"
            className="shrink-0 rounded-[6px] border border-rg-line bg-rg-surface px-1.5 py-0.5 text-[10px] text-rg-ink-soft outline-none"
          >
            <option value="">Atanmamış</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberNames[m.id] ?? m.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      {showForm && (
        <form onSubmit={handleAdd} className="mt-1 flex items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Alt görev başlığı"
            className="flex-1 rounded-[6px] border border-rg-line bg-rg-surface px-2 py-1 text-[11px] text-rg-ink outline-none focus:border-primary"
          />
          <select
            value={newAssigneeId}
            onChange={(e) => setNewAssigneeId(e.target.value)}
            className="rounded-[6px] border border-rg-line bg-rg-surface px-1.5 py-1 text-[10.5px] text-rg-ink-soft outline-none"
          >
            <option value="">Atanmamış</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isAdding || !title.trim()}
            className="rounded-[6px] bg-primary px-2 py-1 text-[10.5px] font-semibold text-white disabled:opacity-50"
          >
            Ekle
          </button>
        </form>
      )}
      {localError && <span className="text-[10.5px] text-destructive">{localError}</span>}
    </div>
  );
}

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { createPartnerTask, updatePartnerTaskStatus, deletePartnerTask } from "./actions";

export type PartnerTaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "open" | "done";
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export function PartnerTasksWidget({ tasks }: { tasks: PartnerTaskRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createPartnerTask({ title, description, dueDate });
      if (result.ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  function toggle(id: string, current: "open" | "done") {
    startTransition(async () => {
      await updatePartnerTaskStatus(id, current === "open" ? "done" : "open");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deletePartnerTask(id);
    });
  }

  const openTasks = tasks.filter((t) => t.status === "open");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Görevlerim</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          <Plus className="h-3.5 w-3.5" /> Yeni
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 rounded-[10px] bg-rg-surface-alt p-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Görev başlığı"
            className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Not (opsiyonel)"
            className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12px] text-rg-ink outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12px] text-rg-ink outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ekle
            </button>
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </form>
      )}

      {tasks.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">Henüz görev eklemedin.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...openTasks, ...doneTasks].map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 rounded-[8px] px-1.5 py-1.5 hover:bg-rg-surface-alt">
              <button
                onClick={() => toggle(t.id, t.status)}
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border " +
                  (t.status === "done" ? "border-gofactory bg-gofactory text-white" : "border-rg-line")
                }
              >
                {t.status === "done" && <Check className="h-3 w-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    "truncate text-[12.5px] font-medium " +
                    (t.status === "done" ? "text-rg-ink-faint line-through" : "text-rg-ink")
                  }
                >
                  {t.title}
                </div>
                {t.due_date && <div className="text-[10.5px] text-rg-ink-faint">{fmtDate(t.due_date)}</div>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 text-rg-ink-faint transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

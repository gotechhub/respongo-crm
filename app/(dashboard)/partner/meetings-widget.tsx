"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { createPartnerMeeting, updatePartnerMeetingStatus, deletePartnerMeeting } from "./actions";

export type PartnerMeetingRow = {
  id: string;
  title: string;
  notes: string | null;
  meeting_date: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
};

const STATUS_LABEL: Record<PartnerMeetingRow["status"], string> = {
  scheduled: "Planlandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
};
const STATUS_CLASS: Record<PartnerMeetingRow["status"], string> = {
  scheduled: "bg-golxp-tint text-golxp",
  completed: "bg-gofactory-tint text-gofactory",
  cancelled: "bg-slate-100 text-rg-ink-faint",
  no_show: "bg-destructive/10 text-destructive",
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function PartnerMeetingsWidget({ meetings }: { meetings: PartnerMeetingRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createPartnerMeeting({ title, meetingDate, notes });
      if (result.ok) {
        setTitle("");
        setMeetingDate("");
        setNotes("");
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  function setStatus(id: string, status: PartnerMeetingRow["status"]) {
    startTransition(async () => {
      await updatePartnerMeetingStatus(id, status);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deletePartnerMeeting(id);
    });
  }

  const sorted = [...meetings].sort((a, b) => (a.meeting_date < b.meeting_date ? 1 : -1));

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[13px] font-bold text-rg-ink">Toplantılarım</div>
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
            placeholder="Toplantı başlığı"
            className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink outline-none focus:border-primary"
          />
          <input
            required
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12px] text-rg-ink outline-none focus:border-primary"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Not (opsiyonel)"
            className="rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12px] text-rg-ink outline-none focus:border-primary"
          />
          <div>
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

      {sorted.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">Henüz toplantı eklemedin.</p>
      ) : (
        <div className="flex flex-col divide-y divide-rg-line">
          {sorted.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5 py-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-rg-ink-faint" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-rg-ink">{m.title}</div>
                <div className="text-[10.5px] text-rg-ink-faint">{fmtDateTime(m.meeting_date)}</div>
                {m.notes && <div className="mt-0.5 truncate text-[11px] text-rg-ink-soft">{m.notes}</div>}
              </div>
              <select
                value={m.status}
                onChange={(e) => setStatus(m.id, e.target.value as PartnerMeetingRow["status"])}
                className={
                  "shrink-0 rounded-full border px-2 py-1 text-[10.5px] font-bold outline-none " + STATUS_CLASS[m.status]
                }
                style={{ borderColor: "transparent" }}
              >
                <option value="scheduled">{STATUS_LABEL.scheduled}</option>
                <option value="completed">{STATUS_LABEL.completed}</option>
                <option value="cancelled">{STATUS_LABEL.cancelled}</option>
                <option value="no_show">{STATUS_LABEL.no_show}</option>
              </select>
              <button
                onClick={() => remove(m.id)}
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

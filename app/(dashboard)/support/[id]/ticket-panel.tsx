"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Send } from "lucide-react";
import { addTicketMessage, assignTicket, updateTicketPriority, updateTicketStatus } from "../actions";
import { STATUS_LABEL, PRIORITY_LABEL } from "../status-labels";
import type { TicketPriority, TicketStatus } from "../actions";

const selectClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-2.5 py-1.5 text-[12px] font-semibold text-rg-ink outline-none focus:border-primary";

export type MessageRow = {
  id: string;
  author_id: string | null;
  body: string;
  is_internal_note: boolean;
  created_at: string;
};

export type AgentOption = { id: string; name: string };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TicketPanel({
  ticketId,
  status,
  priority,
  assignedTo,
  agents,
  messages,
  authorNames,
  currentUserId,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string | null;
  agents: AgentOption[];
  messages: MessageRow[];
  authorNames: Record<string, { name: string; isCustomer: boolean }>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState("");

  function handleStatusChange(next: TicketStatus) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, next);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handlePriorityChange(next: TicketPriority) {
    startTransition(async () => {
      const result = await updateTicketPriority(ticketId, next);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleAssignChange(next: string) {
    startTransition(async () => {
      const result = await assignTicket(ticketId, next || null);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addTicketMessage(ticketId, body, isInternalNote);
      if (result.ok) {
        setBody("");
        setIsInternalNote(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Durum</span>
          <select value={status} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)} disabled={isPending} className={selectClass}>
            {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Öncelik</span>
          <select value={priority} onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)} disabled={isPending} className={selectClass}>
            {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">Atanan</span>
          <select value={assignedTo ?? ""} onChange={(e) => handleAssignChange(e.target.value)} disabled={isPending} className={selectClass}>
            <option value="">Atanmamış</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 border-t border-rg-line pt-4">
        {messages.length === 0 && <p className="text-[12px] text-rg-ink-faint">Henüz mesaj yok.</p>}
        {messages.map((m) => {
          const author = m.author_id ? authorNames[m.author_id] : undefined;
          const isMine = m.author_id === currentUserId;
          return (
            <div
              key={m.id}
              className={
                "rounded-[10px] px-3.5 py-2.5 text-[12.5px] " +
                (m.is_internal_note
                  ? "border border-dashed border-gotools/40 bg-gotools-tint text-rg-ink"
                  : author?.isCustomer
                    ? "bg-rg-surface-alt text-rg-ink"
                    : "bg-golxp-tint text-rg-ink")
              }
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                {m.is_internal_note && <Lock className="h-3 w-3" />}
                {author?.name ?? (isMine ? "Sen" : "—")}
                {m.is_internal_note && " · İç Not"}
                <span className="ml-auto font-normal normal-case tracking-normal">{fmtDateTime(m.created_at)}</span>
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-rg-line pt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={isInternalNote ? "İç not yaz (müşteri göremez)..." : "Müşteriye yanıt yaz..."}
          className={
            "resize-y rounded-[8px] border px-3 py-2 text-[12.8px] text-rg-ink outline-none " +
            (isInternalNote ? "border-gotools/40 bg-gotools-tint focus:border-gotools" : "border-rg-line bg-rg-surface focus:border-primary")
          }
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-rg-ink-soft">
            <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />
            İç not (müşteri göremez)
          </label>
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Gönder
          </button>
        </div>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </form>
    </div>
  );
}

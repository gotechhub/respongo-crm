"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { addTicketMessage, closeTicketFromPortal } from "../../../../(dashboard)/support/actions";
import type { TicketStatus } from "../../../../(dashboard)/support/actions";

export type CustomerMessageRow = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Bu panel SADECE müşteri portalında render edilir — support_ticket_messages
// buraya zaten hiçbir zaman is_internal_note=true satırı döndürmez (RLS), o
// yüzden burada ayrıca bir "iç not" ayrımı/filtresi YOK, tüm mesajlar
// karşılıklı yazışma olarak gösterilir.
export function CustomerMessagePanel({
  ticketId,
  status,
  messages,
  currentUserId,
}: {
  ticketId: string;
  status: TicketStatus;
  messages: CustomerMessageRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const isClosed = status === "closed";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addTicketMessage(ticketId, body, false);
      if (result.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleClose() {
    if (!confirm("Bu destek talebini kapatmak istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await closeTicketFromPortal(ticketId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 flex flex-col gap-3">
        {messages.length === 0 && <p className="text-[12px] text-rg-ink-faint">Henüz mesaj yok.</p>}
        {messages.map((m) => {
          const isMine = m.author_id === currentUserId;
          return (
            <div
              key={m.id}
              className={"max-w-[85%] rounded-[10px] px-3.5 py-2.5 text-[12.5px] " + (isMine ? "ml-auto bg-golxp-tint text-rg-ink" : "bg-rg-surface-alt text-rg-ink")}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.3px] text-rg-ink-faint">
                {isMine ? "Sen" : "Respongo Destek Ekibi"}
                <span className="ml-auto font-normal normal-case tracking-normal">{fmtDateTime(m.created_at)}</span>
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-rg-line pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Mesajını yaz..."
            className="resize-y rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sorun Çözüldü, Kapat
            </button>
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
      )}

      {isClosed && (
        <div className="border-t border-rg-line pt-4 text-[12px] text-rg-ink-faint">
          Bu talep kapatıldı. Yeni bir sorunun varsa lütfen yeni bir destek talebi aç.
        </div>
      )}
    </div>
  );
}

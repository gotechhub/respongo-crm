"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import { REGION_LABELS_TR } from "@/lib/roles";
import { convertLeadToCustomer, updateLeadStatus, type LeadStatus } from "./actions";
import { LEAD_STATUS_LABEL, LEAD_STATUS_CLASS } from "./status-labels";
import type { LeadRow } from "./leads-table";

// Kaybedildi/Müşteri sütunları kapanmış durumlar — panodan dışarı
// sürüklenemez (Liste görünümündeki "artık düzenlenemez" kuralıyla birebir
// aynı, bkz. leads-table.tsx: status === 'musteri' || 'kaybedildi' -> salt
// rozet, seçim kutusu değil).
const CLOSED_STATUSES: LeadStatus[] = ["musteri", "kaybedildi"];

// Global CRM'lerdeki (Pipedrive, HubSpot vb.) standart pipeline görünümü:
// her aşama bir sütun, kart sürükle-bırak ile aşama değiştirir, sütun
// başlığında adet + toplam potansiyel ciro görünür. Respongo CRM'e bu turda
// eklenen "global en iyi pratik" özelliği budur (kullanıcı isteği: "global
// crm incelemeleri ve en iyi özellikleri bizim crm'e ekle").
const COLUMNS: LeadStatus[] = ["yeni", "gorusme", "teklif", "musteri", "kaybedildi"];

function fmtMoney(sumsByCurrency: Record<string, number>) {
  const entries = Object.entries(sumsByCurrency).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  return entries.map(([c, v]) => `${c} ${Math.round(v).toLocaleString("tr-TR")}`).join(" · ");
}

function LeadCard({
  lead,
  ownerName,
  draggable,
  isPending,
  onDragStart,
}: {
  lead: LeadRow;
  ownerName: string;
  draggable: boolean;
  isPending: boolean;
  onDragStart: (e: DragEvent) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`rounded-[10px] border border-rg-line bg-rg-surface p-3 shadow-rg transition-opacity ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <a href={`/sales/leads/${lead.id}`} className="text-[12.5px] font-semibold text-rg-ink hover:text-primary">
        {lead.company_name}
      </a>
      <div className="mt-0.5 text-[11px] text-rg-ink-faint">{lead.contact_name || "—"}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.value_estimate ? (
          <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10.5px] font-bold text-rg-ink-soft">
            {lead.currency} {Math.round(lead.value_estimate).toLocaleString("tr-TR")}
          </span>
        ) : null}
        {lead.region && (
          <span className="rounded-full bg-rg-surface-alt px-2 py-0.5 text-[10px] font-semibold text-rg-ink-faint">
            {REGION_LABELS_TR[lead.region]}
          </span>
        )}
      </div>
      <div className="mt-2 text-[10.5px] text-rg-ink-faint">{ownerName}</div>
    </div>
  );
}

export function LeadsKanbanBoard({ rows, ownerNames }: { rows: LeadRow[]; ownerNames: Record<string, string> }) {
  const [leads, setLeads] = useState<LeadRow[]>(rows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  const grouped = useMemo(() => {
    const g: Record<LeadStatus, LeadRow[]> = { yeni: [], gorusme: [], teklif: [], musteri: [], kaybedildi: [] };
    leads.forEach((lead) => g[lead.status].push(lead));
    return g;
  }, [leads]);

  function handleDrop(e: DragEvent, target: LeadStatus) {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData("text/plain");
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === target || CLOSED_STATUSES.includes(lead.status)) return;

    const previousStatus = lead.status;
    setError("");
    setPendingId(leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: target } : l)));

    startTransition(async () => {
      const result =
        target === "musteri" ? await convertLeadToCustomer(leadId) : await updateLeadStatus(leadId, target);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l)));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((status) => {
          const columnLeads = grouped[status];
          const sumsByCurrency: Record<string, number> = {};
          columnLeads.forEach((l) => {
            if (l.value_estimate) {
              sumsByCurrency[l.currency] = (sumsByCurrency[l.currency] ?? 0) + Number(l.value_estimate);
            }
          });
          const totalText = fmtMoney(sumsByCurrency);
          const isClosed = CLOSED_STATUSES.includes(status);

          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(status);
              }}
              onDragLeave={() => setDragOverColumn((c) => (c === status ? null : c))}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex w-[260px] shrink-0 flex-col gap-2.5 rounded-2xl border p-2.5 transition-colors ${
                dragOverColumn === status
                  ? "border-primary bg-primary/5"
                  : isClosed
                    ? "border-rg-line bg-rg-surface-alt/50"
                    : "border-rg-line bg-rg-surface-alt"
              }`}
            >
              <div className="flex items-center justify-between px-1.5 pt-1">
                <span
                  className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold " + LEAD_STATUS_CLASS[status]}
                >
                  {LEAD_STATUS_LABEL[status]}
                </span>
                <span className="text-[11px] font-semibold text-rg-ink-faint">{columnLeads.length}</span>
              </div>
              {totalText && <div className="px-1.5 text-[10.5px] font-semibold text-rg-ink-soft">{totalText}</div>}
              <div className="flex flex-col gap-2">
                {columnLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    ownerName={lead.owner_id ? ownerNames[lead.owner_id] ?? "—" : "Atanmamış"}
                    draggable={!CLOSED_STATUSES.includes(lead.status)}
                    isPending={pendingId === lead.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  />
                ))}
                {columnLeads.length === 0 && (
                  <div className="rounded-[10px] border border-dashed border-rg-line px-2 py-4 text-center text-[11px] text-rg-ink-faint">
                    Boş
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

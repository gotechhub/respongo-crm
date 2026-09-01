import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LABEL } from "../ticket-form";
import { STATUS_LABEL, STATUS_CLASS } from "../status-labels";
import { TicketPanel, type MessageRow, type AgentOption } from "./ticket-panel";
import type { TicketPriority, TicketStatus } from "../actions";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">{label}</span>
      <span className="text-[12.8px] text-rg-ink">{value || "—"}</span>
    </div>
  );
}

export default async function SupportTicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", params.id).single();
  if (!ticket) {
    notFound();
  }

  const [{ data: customer }, { data: messagesRaw }, { data: agentRows }] = await Promise.all([
    supabase.from("customers").select("id, company_name, primary_contact_name, primary_contact_email").eq("id", ticket.customer_id).single(),
    supabase
      .from("support_ticket_messages")
      .select("id, author_id, body, is_internal_note, created_at")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email").in("role", ["support_agent", "founder", "region_admin"]),
  ]);

  const messages = (messagesRaw ?? []) as MessageRow[];
  const authorIds = Array.from(new Set(messages.map((m) => m.author_id).filter(Boolean)));
  const { data: authorRows } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, email, role").in("id", authorIds as string[])
    : { data: [] };

  const authorNames: Record<string, { name: string; isCustomer: boolean }> = {};
  (authorRows ?? []).forEach((a) => {
    authorNames[a.id] = { name: (a.full_name as string | null) || (a.email as string), isCustomer: a.role === "customer" };
  });

  const agents: AgentOption[] = (agentRows ?? []).map((a) => ({
    id: a.id,
    name: (a.full_name as string | null) || (a.email as string),
  }));

  const status = ticket.status as TicketStatus;
  const priority = ticket.priority as TicketPriority;

  return (
    <>
      <Link href="/support" className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Destek Merkezi&apos;ne dön
      </Link>
      <Topbar title={ticket.subject} subtitle={customer?.company_name ?? "Destek talebi"} />

      <div className="mb-5 flex items-center gap-2">
        <span className={"inline-flex items-center rounded-full px-[10px] py-1 text-[11px] font-bold " + STATUS_CLASS[status]}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 flex flex-col gap-5">
          <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
            <div className="mb-4 text-[13px] font-bold text-rg-ink">Talep Bilgileri</div>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Müşteri" value={customer?.company_name} />
              <InfoField label="İlgili Kişi" value={customer?.primary_contact_name ?? customer?.primary_contact_email} />
              <InfoField label="Ürün" value={ticket.product ? PRODUCT_LABEL[ticket.product] ?? ticket.product : "Genel destek"} />
              <InfoField label="Açılış Tarihi" value={fmtDateTime(ticket.created_at)} />
            </div>
          </div>

          <TicketPanel
            ticketId={ticket.id}
            status={status}
            priority={priority}
            assignedTo={ticket.assigned_to}
            agents={agents}
            messages={messages}
            authorNames={authorNames}
            currentUserId={user.id}
          />
        </div>

        <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
          <div className="mb-3 text-[13px] font-bold text-rg-ink">Müşteri</div>
          <div className="flex flex-col gap-2 text-[12.5px] text-rg-ink-soft">
            <div>{customer?.company_name}</div>
            {customer?.primary_contact_name && <div>{customer.primary_contact_name}</div>}
            {customer?.primary_contact_email && <div>{customer.primary_contact_email}</div>}
          </div>
          <Link href={`/sales/customers/${ticket.customer_id}`} className="mt-4 inline-block text-[12px] font-semibold text-primary hover:underline">
            Müşteri 360° profiline git →
          </Link>
        </div>
      </div>
    </>
  );
}

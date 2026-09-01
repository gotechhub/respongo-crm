import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LABEL } from "../../../../(dashboard)/support/ticket-form";
import { STATUS_LABEL, STATUS_CLASS } from "../../../../(dashboard)/support/status-labels";
import { CustomerMessagePanel, type CustomerMessageRow } from "./customer-message-panel";
import type { TicketStatus } from "../../../../(dashboard)/support/actions";

// support_tickets_customer_select / support_ticket_messages_customer_select
// RLS politikaları zaten bu ticket'ın bu müşteriye ait olduğunu VE iç
// notların (is_internal_note=true) hiç dönmediğini garanti ediyor — burada
// ekstra filtreye gerek yok, satır dönmüyorsa notFound() devreye giriyor.
export default async function PortalSupportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", params.id).single();
  if (!ticket) {
    notFound();
  }

  const { data: messagesRaw } = await supabase
    .from("support_ticket_messages")
    .select("id, author_id, body, created_at")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  const messages = (messagesRaw ?? []) as CustomerMessageRow[];
  const status = ticket.status as TicketStatus;

  return (
    <>
      <Link href="/portal/support" className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Destek Taleplerime dön
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-rg-ink">{ticket.subject}</h1>
          <div className="mt-1 text-[12px] text-rg-ink-faint">
            {ticket.product ? PRODUCT_LABEL[ticket.product] ?? ticket.product : "Genel destek"}
          </div>
        </div>
        <span className={"shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + STATUS_CLASS[status]}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <CustomerMessagePanel ticketId={ticket.id} status={status} messages={messages} currentUserId={user?.id ?? ""} />
    </>
  );
}

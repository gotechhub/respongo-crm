import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../../(dashboard)/support/status-labels";
import { NewTicketForm } from "./new-ticket-form";
import type { TicketPriority, TicketStatus } from "../../../(dashboard)/support/actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// support_tickets_customer_select RLS politikası zaten sadece bu müşterinin
// ticket'larını döndürüyor — ekstra filtreye gerek yok (proposals'daki
// portal deseninin aynısı).
export default async function PortalSupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: link } = await supabase.from("customer_users").select("customer_id").eq("profile_id", user.id).maybeSingle();

  const { data: ticketsRaw } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, last_message_at, created_at")
    .order("last_message_at", { ascending: false });

  const tickets = (ticketsRaw ?? []) as {
    id: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    last_message_at: string;
    created_at: string;
  }[];

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold text-rg-ink">Destek Taleplerim</h1>
          <p className="text-[13px] text-rg-ink-soft">Bir sorunun mu var? Yeni bir talep aç, ekibimiz sana dönsün.</p>
        </div>
      </div>

      {link?.customer_id && <NewTicketForm customerId={link.customer_id} />}

      <div className="mt-5">
        {tickets.length === 0 ? (
          <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
            <LifeBuoy className="mx-auto mb-2 h-6 w-6 text-rg-ink-faint" />
            Henüz bir destek talebin yok.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
            <div className="flex flex-col divide-y divide-rg-line">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/portal/support/${t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-rg-surface-alt"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-rg-ink">{t.subject}</div>
                    <div className="mt-0.5 text-[11.5px] text-rg-ink-faint">{fmtDate(t.created_at)}</div>
                  </div>
                  <span className={"shrink-0 rounded-full px-[10px] py-1 text-[11px] font-bold " + STATUS_CLASS[t.status]}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

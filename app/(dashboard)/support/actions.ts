"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketInput = {
  customerId: string;
  subject: string;
  product: string | null;
  priority: TicketPriority;
};

// ----------------------------------------------------------------------------
// İç ekip — yeni ticket açma. Müşteri tarafındaki createTicketFromPortal ile
// KARIŞTIRILMAMALI: ikisi ayrı RLS politikalarından geçer (support_tickets_insert
// vs support_tickets_customer_insert), region ataması burada caller'ın kendi
// bölgesinden gelir (licenses/createLicense ile aynı desen).
// ----------------------------------------------------------------------------
export async function createTicket(input: TicketInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.customerId) {
    return { ok: false, error: "Müşteri seçimi zorunlu." };
  }
  if (!input.subject.trim()) {
    return { ok: false, error: "Konu zorunlu." };
  }

  const { data: callerProfile } = await supabase.from("profiles").select("region").eq("id", user.id).single();

  const { error } = await supabase.from("support_tickets").insert({
    customer_id: input.customerId,
    subject: input.subject.trim(),
    product: input.product || null,
    priority: input.priority,
    region: (callerProfile as { region: string | null } | null)?.region ?? null,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/support");
  return { ok: true };
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<ActionResult> {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  if (status === "closed") patch.closed_at = new Date().toISOString();

  const { error, count } = await supabase.from("support_tickets").update(patch, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu talebin durumunu değiştirme yetkin yok." };
  }

  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  return { ok: true };
}

export async function updateTicketPriority(id: string, priority: TicketPriority): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("support_tickets")
    .update({ priority }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu talebin önceliğini değiştirme yetkin yok." };
  }

  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  return { ok: true };
}

export async function assignTicket(id: string, assignedTo: string | null): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("support_tickets")
    .update({ assigned_to: assignedTo }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu talebi atama yetkin yok." };
  }

  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Mesajlar — hem iç ekip hem müşteri portalı bu iki fonksiyonu kullanır.
// is_internal_note=true SADECE bu fonksiyon üzerinden ve SADECE iç ekip
// tarafından gönderilebilir; müşteri tarafındaki addCustomerMessage bu
// parametreyi hiç kabul etmiyor (bkz. aşağıda), RLS de zaten
// support_ticket_messages_customer_insert ile is_internal_note=false'u
// zorunlu kılıyor.
// ----------------------------------------------------------------------------
export async function addTicketMessage(
  ticketId: string,
  body: string,
  isInternalNote: boolean
): Promise<ActionResult> {
  const supabase = createClient();
  if (!body.trim()) {
    return { ok: false, error: "Mesaj boş olamaz." };
  }

  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    body: body.trim(),
    is_internal_note: isInternalNote,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/portal/support/${ticketId}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Müşteri portalı — yeni ticket açma + kendi ticket'ını kapatma. Ayrı
// fonksiyonlar tutuluyor ki iç ekip action'larıyla asla karışmasın (RLS zaten
// ayrı politikalardan geçiyor, ama server action seviyesinde de net ayrım
// okunabilirliği artırıyor).
// ----------------------------------------------------------------------------
export async function createTicketFromPortal(
  customerId: string,
  subject: string,
  product: string | null
): Promise<ActionResult> {
  const supabase = createClient();
  if (!subject.trim()) {
    return { ok: false, error: "Konu zorunlu." };
  }

  const { data: customer } = await supabase.from("customers").select("region").eq("id", customerId).single();

  const { error } = await supabase.from("support_tickets").insert({
    customer_id: customerId,
    subject: subject.trim(),
    product: product || null,
    region: (customer as { region: string | null } | null)?.region ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/portal/support");
  return { ok: true };
}

export async function closeTicketFromPortal(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("support_tickets")
    .update({ status: "closed", closed_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu talebi kapatma yetkin yok." };
  }

  revalidatePath("/portal/support");
  revalidatePath(`/portal/support/${id}`);
  return { ok: true };
}

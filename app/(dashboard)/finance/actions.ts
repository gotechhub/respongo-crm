"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type PaymentMethod = "bank_transfer" | "credit_card" | "cash" | "other";

export type InvoiceInput = {
  customerId: string;
  proposalId: string | null;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes: string;
};

export async function createInvoice(input: InvoiceInput): Promise<ActionResult> {
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
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "Tutar sıfırdan büyük olmalı." };
  }

  const { data: callerProfile } = await supabase.from("profiles").select("region").eq("id", user.id).single();

  const { error } = await supabase.from("invoices").insert({
    customer_id: input.customerId,
    proposal_id: input.proposalId,
    amount: input.amount,
    currency: input.currency || "USD",
    issue_date: input.issueDate || new Date().toISOString().slice(0, 10),
    due_date: input.dueDate || null,
    notes: input.notes.trim() || null,
    region: (callerProfile as { region: string | null } | null)?.region ?? null,
    owner_id: user.id,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/finance");
  return { ok: true };
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.customerId) {
    return { ok: false, error: "Müşteri seçimi zorunlu." };
  }
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "Tutar sıfırdan büyük olmalı." };
  }

  const { error, count } = await supabase
    .from("invoices")
    .update(
      {
        customer_id: input.customerId,
        proposal_id: input.proposalId,
        amount: input.amount,
        currency: input.currency || "USD",
        issue_date: input.issueDate || new Date().toISOString().slice(0, 10),
        due_date: input.dueDate || null,
        notes: input.notes.trim() || null,
      },
      { count: "exact" }
    )
    .eq("id", id)
    .neq("status", "paid");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu faturayı güncelleme yetkin yok (veya fatura zaten ödendi)." };
  }

  revalidatePath("/finance");
  revalidatePath(`/finance/${id}`);
  return { ok: true };
}

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["cancelled"],
  paid: [],
  cancelled: [],
};

export async function updateInvoiceStatus(id: string, next: InvoiceStatus): Promise<ActionResult> {
  const supabase = createClient();
  const { data: invoice } = await supabase.from("invoices").select("status").eq("id", id).single();
  if (!invoice) {
    return { ok: false, error: "Fatura bulunamadı." };
  }
  const current = invoice.status as InvoiceStatus;
  if (!STATUS_TRANSITIONS[current].includes(next)) {
    return { ok: false, error: "Bu durum geçişi yapılamaz." };
  }

  const { error, count } = await supabase
    .from("invoices")
    .update({ status: next }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu faturayı güncelleme yetkin yok." };
  }

  revalidatePath("/finance");
  revalidatePath(`/finance/${id}`);
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("invoices")
    .delete({ count: "exact" })
    .eq("id", id)
    .neq("status", "paid");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu faturayı silme yetkin yok (veya fatura zaten ödendi)." };
  }

  revalidatePath("/finance");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Ödemeler — bir faturaya kısmi/tam ödeme kaydı. Ödemeler DÜZENLENEMEZ, yanlış
// girildiyse silinip yeniden eklenir (muhasebe kaydı mantığı). Her kayıt/silme
// sonrası faturanın durumu (sent/paid) otomatik yeniden hesaplanır.
// ----------------------------------------------------------------------------

async function recomputeInvoiceStatus(supabase: ReturnType<typeof createClient>, invoiceId: string) {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("amount, currency, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice || invoice.status === "cancelled") return;

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId)
    .eq("currency", invoice.currency);
  const paidTotal = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  let nextStatus: InvoiceStatus = invoice.status as InvoiceStatus;
  if (paidTotal >= Number(invoice.amount) && Number(invoice.amount) > 0) {
    nextStatus = "paid";
  } else if (invoice.status === "paid" && paidTotal < Number(invoice.amount)) {
    // ödeme silindi, tam ödenmiş durumdan geri düş
    nextStatus = "sent";
  } else if (invoice.status === "draft" && paidTotal > 0) {
    nextStatus = "sent";
  }

  if (nextStatus !== invoice.status) {
    await supabase
      .from("invoices")
      .update({ status: nextStatus, paid_at: nextStatus === "paid" ? new Date().toISOString() : null })
      .eq("id", invoiceId);
  }
}

export type PaymentInput = {
  amount: number;
  currency: string;
  method: PaymentMethod;
  paidAt: string;
  referenceNo: string;
  notes: string;
};

export async function recordPayment(invoiceId: string, input: PaymentInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "Ödeme tutarı sıfırdan büyük olmalı." };
  }

  const { data: invoice } = await supabase.from("invoices").select("status, currency").eq("id", invoiceId).single();
  if (!invoice) {
    return { ok: false, error: "Fatura bulunamadı." };
  }
  if (invoice.status === "cancelled") {
    return { ok: false, error: "İptal edilmiş faturaya ödeme kaydedilemez." };
  }
  if (input.currency !== invoice.currency) {
    return { ok: false, error: `Ödeme para birimi faturayla aynı olmalı (${invoice.currency}).` };
  }

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    paid_at: input.paidAt || new Date().toISOString().slice(0, 10),
    reference_no: input.referenceNo.trim() || null,
    notes: input.notes.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await recomputeInvoiceStatus(supabase, invoiceId);

  revalidatePath("/finance");
  revalidatePath(`/finance/${invoiceId}`);
  return { ok: true };
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("payments").delete({ count: "exact" }).eq("id", paymentId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu ödemeyi silme yetkin yok." };
  }

  await recomputeInvoiceStatus(supabase, invoiceId);

  revalidatePath("/finance");
  revalidatePath(`/finance/${invoiceId}`);
  return { ok: true };
}

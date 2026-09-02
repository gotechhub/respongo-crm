"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncInvoiceToParasut, type SyncableInvoiceItem } from "@/lib/parasut/client";

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
  const region = (callerProfile as { region: string | null } | null)?.region ?? null;

  const { data: inserted, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: input.customerId,
      proposal_id: input.proposalId,
      amount: input.amount,
      currency: input.currency || "USD",
      issue_date: input.issueDate || new Date().toISOString().slice(0, 10),
      due_date: input.dueDate || null,
      notes: input.notes.trim() || null,
      region,
      owner_id: user.id,
      created_by: user.id,
      parasut_sync_status: region === "tr" ? "pending" : "not_applicable",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  // Kaynak teklif seçildiyse kalemleri (proposal_items) faturaya kopyala —
  // Paraşüt itemization/KDV için şart. Teklif yoksa ya da kalemi yoksa, tek
  // satırlık bir kalem oluştur ki Paraşüt'e göndermek her zaman mümkün olsun.
  let itemsCopied = 0;
  if (input.proposalId) {
    const { data: proposalItems } = await supabase
      .from("proposal_items")
      .select("description, quantity, unit_price")
      .eq("proposal_id", input.proposalId)
      .order("created_at", { ascending: true });
    if (proposalItems && proposalItems.length > 0) {
      const rows = proposalItems.map((p, i) => ({
        invoice_id: inserted.id,
        description: p.description,
        quantity: p.quantity,
        unit_price: p.unit_price,
        vat_rate: 20,
        sort_order: i,
      }));
      const { error: itemsError, count } = await supabase.from("invoice_items").insert(rows, { count: "exact" });
      if (!itemsError) itemsCopied = count ?? rows.length;
    }
  }
  if (itemsCopied === 0) {
    await supabase.from("invoice_items").insert({
      invoice_id: inserted.id,
      description: input.notes.trim() || "Fatura kalemi",
      quantity: 1,
      unit_price: input.amount,
      vat_rate: 20,
      sort_order: 0,
    });
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

// ----------------------------------------------------------------------------
// Paraşüt senkronu — SADECE TR bölgesi. `db` parametresi RLS'li (createClient())
// ya da admin (createAdminClient()) client olabilir: manuel "Paraşüt'e Gönder"
// butonu (finance/[id]) RLS'li client ile çağırır (kullanıcının finance
// yetkisi RLS tarafından zaten doğrulanır); otomatik gönderim ise proposal
// kabul akışından (müşteri portalı dahil) admin client ile çağrılır, çünkü
// müşteri oturumunun finance modülüne erişimi yoktur ama sistemin kendi
// oluşturduğu faturayı sistemin kendisi göndermesi gerekir.
// ----------------------------------------------------------------------------
type MinimalSupabase = ReturnType<typeof createClient>;

async function performParasutSync(db: MinimalSupabase, invoiceId: string): Promise<ActionResult> {
  const { data: invoice } = await db
    .from("invoices")
    .select("id, customer_id, invoice_number, issue_date, due_date, currency, region, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice) {
    return { ok: false, error: "Fatura bulunamadı ya da görüntüleme yetkin yok." };
  }
  if (invoice.region !== "tr") {
    return { ok: false, error: "Paraşüt entegrasyonu sadece Türkiye (TR) bölgesindeki faturalar için geçerli." };
  }

  const [{ data: customer }, { data: items }] = await Promise.all([
    db
      .from("customers")
      .select(
        "company_name, primary_contact_name, primary_contact_email, primary_contact_phone, country, company_id, companies(legal_name, tax_office, tax_no, city, address)"
      )
      .eq("id", invoice.customer_id)
      .single(),
    db
      .from("invoice_items")
      .select("description, quantity, unit_price, vat_rate")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!customer) {
    return { ok: false, error: "Müşteri bulunamadı." };
  }

  const syncItems: SyncableInvoiceItem[] = (items ?? []).map((i) => ({
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
    vat_rate: Number(i.vat_rate),
  }));

  const company = Array.isArray(customer.companies) ? customer.companies[0] : customer.companies;

  const result = await syncInvoiceToParasut({
    customer: {
      company_name: customer.company_name,
      primary_contact_name: customer.primary_contact_name,
      primary_contact_email: customer.primary_contact_email,
      primary_contact_phone: customer.primary_contact_phone,
      country: customer.country,
      company: company
        ? {
            legal_name: company.legal_name,
            tax_office: company.tax_office,
            tax_no: company.tax_no,
            city: company.city,
            address: company.address,
          }
        : null,
    },
    invoiceNumber: invoice.invoice_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    currency: invoice.currency,
    items: syncItems,
  });

  if (result.ok) {
    await db
      .from("invoices")
      .update({
        parasut_id: result.parasutId,
        parasut_invoice_no: result.parasutInvoiceNo,
        parasut_sync_status: "synced",
        parasut_synced_at: new Date().toISOString(),
        sent_to_customer_at: new Date().toISOString(),
        parasut_error: null,
        status: invoice.status === "draft" ? "sent" : invoice.status,
      })
      .eq("id", invoiceId);
  } else {
    await db.from("invoices").update({ parasut_sync_status: "failed", parasut_error: result.error }).eq("id", invoiceId);
  }

  revalidatePath(`/finance/${invoiceId}`);
  revalidatePath("/finance");

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

// Manuel "Paraşüt'e Gönder" butonu — /finance/[id] sayfası.
export async function syncInvoiceToParasutAction(invoiceId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  return performParasutSync(supabase, invoiceId);
}

// Teklif kabul edildiğinde (bkz. DB trigger auto_create_invoice_from_proposal)
// otomatik oluşan taslak faturayı, ayarlarda auto_send_to_customer açıksa,
// aynı akışın içinde Paraşüt'e göndermeyi dener. Müşteri portalından
// (müşteri teklifi kabul ettiğinde) da çağrılabildiği için admin client
// kullanır — ama SADECE proposalId üzerinden zaten var olan (trigger'ın
// oluşturduğu) faturayı işler, keyfi bir DB erişimi sağlamaz. Best-effort:
// başarısızlığı teklif kabul akışını ASLA bozmamalı.
export async function maybeAutoSyncAcceptedProposalInvoice(proposalId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const encKey = process.env.PARASUT_SETTINGS_ENC_KEY;
    if (!encKey) return;

    const { data: settingsRows } = await admin.rpc("parasut_get_decrypted_credentials", { p_enc_key: encKey });
    const settings = settingsRows?.[0];
    if (!settings || !settings.is_active || !settings.auto_send_to_customer) {
      return;
    }

    const { data: invoice } = await admin
      .from("invoices")
      .select("id, region, parasut_sync_status")
      .eq("proposal_id", proposalId)
      .maybeSingle();
    if (!invoice || invoice.region !== "tr" || invoice.parasut_sync_status !== "pending") {
      return;
    }

    await performParasutSync(admin as unknown as MinimalSupabase, invoice.id);
  } catch {
    // Otomatik senkron best-effort'tur — bu fonksiyonun başarısız olması
    // teklif kabul akışını ASLA bozmamalı, bu yüzden hata yutulur.
  }
}

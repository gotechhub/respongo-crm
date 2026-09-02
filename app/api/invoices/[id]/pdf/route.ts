import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { InvoicePdfDocument, type InvoicePdfPayment, type InvoicePdfItem } from "@/lib/pdf/invoice-document";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", params.id).single();
  if (!invoice) {
    return NextResponse.json({ error: "Fatura bulunamadı ya da görüntüleme yetkin yok." }, { status: 404 });
  }

  const [{ data: customer }, { data: proposal }, { data: paymentsRaw }, { data: itemsRaw }] = await Promise.all([
    supabase.from("customers").select("company_name").eq("id", invoice.customer_id).single(),
    invoice.proposal_id
      ? supabase.from("proposals").select("title").eq("id", invoice.proposal_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("payments")
      .select("id, amount, currency, method, paid_at, reference_no")
      .eq("invoice_id", params.id)
      .order("paid_at", { ascending: false }),
    supabase
      .from("invoice_items")
      .select("id, description, quantity, unit_price, vat_rate, line_total")
      .eq("invoice_id", params.id)
      .order("sort_order", { ascending: true }),
  ]);

  const payments = (paymentsRaw ?? []) as InvoicePdfPayment[];
  const items = (itemsRaw ?? []) as InvoicePdfItem[];
  const paidTotal = payments.filter((p) => p.currency === invoice.currency).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(invoice.amount) - paidTotal);

  registerPdfFonts();

  const document = InvoicePdfDocument({
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      parasut_invoice_no: invoice.parasut_invoice_no ?? null,
      amount: Number(invoice.amount) || 0,
      currency: invoice.currency,
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      notes: invoice.notes,
    },
    customerName: customer?.company_name ?? null,
    proposalTitle: proposal?.title ?? null,
    items,
    payments,
    paidTotal,
    remaining,
  }) as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(document);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fatura-${invoice.invoice_number ?? invoice.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

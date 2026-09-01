import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { ProposalPdfDocument, type ProposalPdfItem, type ProposalPdfTarget } from "@/lib/pdf/proposal-document";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", params.id).single();
  if (!proposal) {
    return NextResponse.json({ error: "Teklif bulunamadı ya da görüntüleme yetkin yok." }, { status: 404 });
  }

  const [{ data: itemsRaw }, { data: target }] = await Promise.all([
    supabase
      .from("proposal_items")
      .select("id, product, description, quantity, unit_price, discount_percent, line_total")
      .eq("proposal_id", params.id)
      .order("created_at", { ascending: true }),
    proposal.lead_id
      ? supabase.from("leads").select("company_name, contact_name, contact_email").eq("id", proposal.lead_id).single()
      : proposal.customer_id
        ? supabase
            .from("customers")
            .select("company_name, primary_contact_name, primary_contact_email")
            .eq("id", proposal.customer_id)
            .single()
        : Promise.resolve({ data: null }),
  ]);

  let ownerName: string | null = null;
  if (proposal.owner_id) {
    const { data: owner } = await supabase.from("profiles").select("full_name, email").eq("id", proposal.owner_id).single();
    ownerName = owner ? (owner.full_name as string | null) || (owner.email as string) : null;
  }

  registerPdfFonts();

  const document = ProposalPdfDocument({
    proposal: {
      id: proposal.id,
      title: proposal.title,
      currency: proposal.currency,
      total_amount: proposal.total_amount,
      valid_until: proposal.valid_until,
      region: proposal.region,
      created_at: proposal.created_at,
      sent_at: proposal.sent_at,
    },
    items: (itemsRaw ?? []) as ProposalPdfItem[],
    target: target as ProposalPdfTarget,
    ownerName,
  }) as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(document);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="teklif-${proposal.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

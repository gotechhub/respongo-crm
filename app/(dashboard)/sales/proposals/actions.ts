"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ProductKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools";

export type ProposalWizardItem = {
  priceListItemId: string | null;
  product: ProductKey;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

export type ProposalWizardInput = {
  targetType: "lead" | "customer";
  targetId: string;
  title: string;
  items: ProposalWizardItem[];
  currency: string;
  validUntil: string;
  templateId: string;
  language: "tr" | "en";
  asDraft: boolean;
};

function lineTotal(item: ProposalWizardItem) {
  return item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
}

export async function createProposal(
  input: ProposalWizardInput
): Promise<ActionResult & { id?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.targetId) {
    return { ok: false, error: "Müşteri veya lead seçmen gerekiyor." };
  }
  if (input.items.length === 0) {
    return { ok: false, error: "En az bir kalem eklemen gerekiyor." };
  }
  if (!input.title.trim()) {
    return { ok: false, error: "Teklif başlığı zorunlu." };
  }

  // Hedefin bölgesini güvenilir kaynaktan (DB) doğrula — istemciden gelen
  // bölge bilgisine güvenmek yerine burada tekrar okuyoruz.
  const targetTable = input.targetType === "lead" ? "leads" : "customers";
  const { data: target, error: targetError } = await supabase
    .from(targetTable)
    .select("id, company_name, region")
    .eq("id", input.targetId)
    .single();

  if (targetError || !target) {
    return { ok: false, error: "Seçilen kayda erişilemedi — yetkin olmayabilir." };
  }

  const totalAmount = input.items.reduce((sum, item) => sum + lineTotal(item), 0);

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      lead_id: input.targetType === "lead" ? target.id : null,
      customer_id: input.targetType === "customer" ? target.id : null,
      title: input.title.trim(),
      status: input.asDraft ? "draft" : "sent",
      total_amount: Math.round(totalAmount * 100) / 100,
      currency: input.currency,
      valid_until: input.validUntil || null,
      owner_id: user.id,
      template_id: input.templateId || null,
      language: input.language,
      region: target.region,
      sent_at: input.asDraft ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (proposalError || !proposal) {
    return { ok: false, error: proposalError?.message ?? "Teklif oluşturulamadı." };
  }

  const { error: itemsError } = await supabase.from("proposal_items").insert(
    input.items.map((item) => ({
      proposal_id: proposal.id,
      price_list_item_id: item.priceListItemId,
      product: item.product,
      description: item.description || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
    }))
  );

  if (itemsError) {
    // Kalemler eklenemediyse yarım kalan teklif başlığını temizle.
    await supabase.from("proposals").delete().eq("id", proposal.id);
    return { ok: false, error: itemsError.message };
  }

  revalidatePath("/sales/proposals");
  redirect(`/sales/proposals/${proposal.id}`);
}

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<ActionResult> {
  const supabase = createClient();

  const patch: Record<string, unknown> = { status };
  if (status === "sent") {
    patch.sent_at = new Date().toISOString();
  }

  const { error, count } = await supabase.from("proposals").update(patch, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklifi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/proposals");
  revalidatePath(`/sales/proposals/${id}`);
  return { ok: true };
}

export async function deleteProposal(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("proposals").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklifi silme yetkin yok." };
  }

  revalidatePath("/sales/proposals");
  return { ok: true };
}

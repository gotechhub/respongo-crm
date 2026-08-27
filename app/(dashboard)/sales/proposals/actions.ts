"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type ProductKey = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools";

export type ProposalStatus =
  | "draft"
  | "pending_approval"
  | "revision_requested"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

// Onay eşiği — bu tutarın üzerindeki VEYA bu iskonto oranını aşan teklifler,
// gönderilirken doğrudan "sent" olmaz, "pending_approval"a düşer ve kurucu
// onayı bekler. Para birimine göre ayrım yapılmıyor (basitlik için bilinçli
// tercih) — iş kuralı olarak buraya sabitlendi, ileride ayarlar ekranına
// taşınabilir.
const APPROVAL_AMOUNT_THRESHOLD = 25000;
const APPROVAL_DISCOUNT_THRESHOLD = 15;

function needsApproval(totalAmount: number, discountPercents: number[]) {
  if (totalAmount > APPROVAL_AMOUNT_THRESHOLD) return true;
  return discountPercents.some((d) => d > APPROVAL_DISCOUNT_THRESHOLD);
}

async function isCallerFounder(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return (data as { role: string | null } | null)?.role === "founder";
}

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

  // Taslak olarak kaydedilmiyorsa (doğrudan gönderiliyorsa) eşik kontrolü yapılır:
  // tutar veya iskonto eşiği aşılıyorsa "sent" yerine "pending_approval" olur.
  const targetStatus: ProposalStatus = input.asDraft
    ? "draft"
    : needsApproval(
          totalAmount,
          input.items.map((i) => i.discountPercent)
        )
      ? "pending_approval"
      : "sent";

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      lead_id: input.targetType === "lead" ? target.id : null,
      customer_id: input.targetType === "customer" ? target.id : null,
      title: input.title.trim(),
      status: targetStatus,
      total_amount: Math.round(totalAmount * 100) / 100,
      currency: input.currency,
      valid_until: input.validUntil || null,
      owner_id: user.id,
      template_id: input.templateId || null,
      language: input.language,
      region: target.region,
      sent_at: targetStatus === "sent" ? new Date().toISOString() : null,
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

// Taslağı (ya da revizyonu tamamlanmış teklifi) gönderime hazırlar: eşik
// kontrolüne göre ya doğrudan "sent" yapar ya da "pending_approval"a
// düşürüp kurucu onayına yollar. draft veya revision_requested durumundan
// çağrılabilir; sahibi veya kurucu tetikleyebilir (RLS: owner_write / founder_all).
export async function submitProposal(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }

  const { data: proposal, error: propErr } = await supabase
    .from("proposals")
    .select("id, status, total_amount")
    .eq("id", id)
    .single();

  if (propErr || !proposal) {
    return { ok: false, error: "Teklif bulunamadı ya da erişim yetkin yok." };
  }
  if (proposal.status !== "draft" && proposal.status !== "revision_requested") {
    return { ok: false, error: "Bu teklif şu anda gönderime uygun durumda değil." };
  }

  const { data: items } = await supabase
    .from("proposal_items")
    .select("discount_percent")
    .eq("proposal_id", id);

  if (!items || items.length === 0) {
    return { ok: false, error: "Göndermeden önce en az bir kalem eklemen gerekiyor." };
  }

  const targetStatus: ProposalStatus = needsApproval(
    proposal.total_amount,
    items.map((i) => i.discount_percent)
  )
    ? "pending_approval"
    : "sent";

  const patch: Record<string, unknown> = {
    status: targetStatus,
    approval_note: null,
  };
  if (targetStatus === "sent") {
    patch.sent_at = new Date().toISOString();
  }

  const { error, count } = await supabase.from("proposals").update(patch, { count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklifi gönderme yetkin yok." };
  }

  revalidatePath("/sales/proposals");
  revalidatePath(`/sales/proposals/${id}`);
  return { ok: true };
}

// Kurucu, onay bekleyen teklifi onaylar — teklif "sent" olur ve müşteriye
// gönderilmiş sayılır. Sadece founder rolü çağırabilir.
export async function approveProposal(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!(await isCallerFounder(supabase, user.id))) {
    return { ok: false, error: "Bu işlemi sadece kurucu yapabilir." };
  }

  const { error, count } = await supabase
    .from("proposals")
    .update(
      {
        status: "sent",
        sent_at: new Date().toISOString(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_note: null,
      },
      { count: "exact" }
    )
    .eq("id", id)
    .eq("status", "pending_approval");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklif onay bekleyen durumda değil." };
  }

  revalidatePath("/sales/proposals");
  revalidatePath(`/sales/proposals/${id}`);
  return { ok: true };
}

// Kurucu, onay bekleyen teklifi bir notla birlikte satışçıya geri gönderir.
// Sadece founder rolü çağırabilir.
export async function requestProposalRevision(id: string, note: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!note.trim()) {
    return { ok: false, error: "Revizyon notu zorunlu." };
  }
  if (!(await isCallerFounder(supabase, user.id))) {
    return { ok: false, error: "Bu işlemi sadece kurucu yapabilir." };
  }

  const { error, count } = await supabase
    .from("proposals")
    .update({ status: "revision_requested", approval_note: note.trim() }, { count: "exact" })
    .eq("id", id)
    .eq("status", "pending_approval");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklif onay bekleyen durumda değil." };
  }

  revalidatePath("/sales/proposals");
  revalidatePath(`/sales/proposals/${id}`);
  return { ok: true };
}

// "sent" durumundaki bir teklifin müşteri kararını (kabul/red) ya da süre
// dolumunu manuel işaretlemek için — henüz gerçek müşteri portalı yok,
// bu yüzden satışçı/kurucu gerçek sonucu burada elle giriyor.
export async function updateProposalStatus(
  id: string,
  status: Extract<ProposalStatus, "accepted" | "rejected" | "expired">
): Promise<ActionResult> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from("proposals")
    .update({ status }, { count: "exact" })
    .eq("id", id)
    .eq("status", "sent");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu teklif gönderilmiş durumda değil ya da güncelleme yetkin yok." };
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

// ---------------------------------------------------------------------------
// Teklif kalemi düzenleme (sadece draft / revision_requested durumunda) —
// revizyon isteyen kuruculardan sonra satışçının teklifi düzeltip yeniden
// göndermesini sağlar.
// ---------------------------------------------------------------------------

// NOT: proposal_items tablosundaki "for all" RLS politikası, sales_inhouse
// rolünü SADECE using() (görünürlük) tarafında listeliyor, with check()
// (yazma doğrulaması) tarafında değil — bu da UPDATE/INSERT'te hataya düşer
// AMA DELETE'te (with check kavramı olmadığı için) başka bir sales_inhouse
// üyesinin taslak/revizyon kalemini silebilmesine izin verir. Bu, tek başına
// RLS'e güvenmek yerine burada sahiplik kontrolünü de EXPLICIT yapmamızın
// sebebi (DERS: RLS'e körü körüne güvenme).
async function assertProposalEditable(
  supabase: ReturnType<typeof createClient>,
  proposalId: string,
  userId: string
): Promise<ActionResult> {
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("status, owner_id")
    .eq("id", proposalId)
    .single();
  if (error || !proposal) {
    return { ok: false, error: "Teklif bulunamadı ya da erişim yetkin yok." };
  }
  if (proposal.status !== "draft" && proposal.status !== "revision_requested") {
    return { ok: false, error: "Bu teklif şu anda düzenlenemez." };
  }
  if (proposal.owner_id !== userId && !(await isCallerFounder(supabase, userId))) {
    return { ok: false, error: "Bu teklifi düzenleme yetkin yok." };
  }
  return { ok: true };
}

async function recomputeProposalTotal(supabase: ReturnType<typeof createClient>, proposalId: string) {
  const { data: items } = await supabase
    .from("proposal_items")
    .select("line_total")
    .eq("proposal_id", proposalId);
  const total = (items ?? []).reduce((sum, i) => sum + Number(i.line_total ?? 0), 0);
  await supabase
    .from("proposals")
    .update({ total_amount: Math.round(total * 100) / 100 })
    .eq("id", proposalId);
}

export type ProposalItemInput = {
  priceListItemId: string | null;
  product: ProductKey;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

export async function addProposalItem(proposalId: string, input: ProposalItemInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  const editable = await assertProposalEditable(supabase, proposalId, user.id);
  if (!editable.ok) return editable;

  const { error } = await supabase.from("proposal_items").insert({
    proposal_id: proposalId,
    price_list_item_id: input.priceListItemId,
    product: input.product,
    description: input.description || null,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    discount_percent: input.discountPercent,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await recomputeProposalTotal(supabase, proposalId);
  revalidatePath(`/sales/proposals/${proposalId}`);
  return { ok: true };
}

export async function updateProposalItem(
  itemId: string,
  proposalId: string,
  patch: Partial<Pick<ProposalItemInput, "quantity" | "unitPrice" | "discountPercent">>
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  const editable = await assertProposalEditable(supabase, proposalId, user.id);
  if (!editable.ok) return editable;

  const dbPatch: Record<string, unknown> = {};
  if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
  if (patch.unitPrice !== undefined) dbPatch.unit_price = patch.unitPrice;
  if (patch.discountPercent !== undefined) dbPatch.discount_percent = patch.discountPercent;

  const { error, count } = await supabase
    .from("proposal_items")
    .update(dbPatch, { count: "exact" })
    .eq("id", itemId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kalemi güncelleme yetkin yok." };
  }

  await recomputeProposalTotal(supabase, proposalId);
  revalidatePath(`/sales/proposals/${proposalId}`);
  return { ok: true };
}

export async function deleteProposalItem(itemId: string, proposalId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  const editable = await assertProposalEditable(supabase, proposalId, user.id);
  if (!editable.ok) return editable;

  const { error, count } = await supabase
    .from("proposal_items")
    .delete({ count: "exact" })
    .eq("id", itemId);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kalemi silme yetkin yok." };
  }

  await recomputeProposalTotal(supabase, proposalId);
  revalidatePath(`/sales/proposals/${proposalId}`);
  return { ok: true };
}

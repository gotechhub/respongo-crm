"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type TemplateProduct = "golms" | "golxp" | "gocatalog" | "gofactory" | "gotools" | null;

export type TemplateInput = {
  name: string;
  product: TemplateProduct;
  language: "tr" | "en";
  description: string;
  validDays: number;
  introText: string;
  termsText: string;
};

export type TemplateItemInput = {
  priceListItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

export async function createProposalTemplate(input: TemplateInput): Promise<ActionResult & { id?: string }> {
  const supabase = createClient();
  if (!input.name.trim()) {
    return { ok: false, error: "Şablon adı zorunlu." };
  }

  const { data, error } = await supabase
    .from("proposal_templates")
    .insert({
      name: input.name.trim(),
      product: input.product,
      language: input.language,
      description: input.description || null,
      valid_days: input.validDays,
      intro_text: input.introText || null,
      terms_text: input.termsText || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Şablon oluşturulamadı." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true, id: data.id };
}

export async function updateProposalTemplate(id: string, input: TemplateInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.name.trim()) {
    return { ok: false, error: "Şablon adı zorunlu." };
  }

  const { error, count } = await supabase
    .from("proposal_templates")
    .update(
      {
        name: input.name.trim(),
        product: input.product,
        language: input.language,
        description: input.description || null,
        valid_days: input.validDays,
        intro_text: input.introText || null,
        terms_text: input.termsText || null,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu şablonu güncelleme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function toggleTemplateActive(id: string, isActive: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("proposal_templates")
    .update({ is_active: isActive }, { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu şablonu güncelleme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function deleteProposalTemplate(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("proposal_templates").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu şablonu silme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function createTemplateItem(templateId: string, input: TemplateItemInput): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("proposal_template_items").insert({
    template_id: templateId,
    price_list_item_id: input.priceListItemId,
    description: input.description || null,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    discount_percent: input.discountPercent,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function updateTemplateItem(id: string, input: TemplateItemInput): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("proposal_template_items")
    .update(
      {
        description: input.description || null,
        quantity: input.quantity,
        unit_price: input.unitPrice,
        discount_percent: input.discountPercent,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kalemi güncelleme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function deleteTemplateItem(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("proposal_template_items").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu kalemi silme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

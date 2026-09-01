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

export type SectionInput = {
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  content: Record<string, unknown>;
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

// ---------------------------------------------------------------------------
// Teklif Şablonları 2.0 — bölüm bazlı (proposal_template_sections) düzenleme.
// ---------------------------------------------------------------------------

export async function updateTemplateSection(id: string, input: SectionInput): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase
    .from("proposal_template_sections")
    .update(
      {
        title_tr: input.titleTr || null,
        title_en: input.titleEn || null,
        body_tr: input.bodyTr || null,
        body_en: input.bodyEn || null,
        content: input.content,
      },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu bölümü güncelleme yetkin yok." };
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true };
}

export async function cloneProposalTemplate(templateId: string): Promise<ActionResult & { id?: string }> {
  const supabase = createClient();

  const { data: source, error: sourceError } = await supabase
    .from("proposal_templates")
    .select("name, product, description, is_active, language, intro_text, terms_text, valid_days")
    .eq("id", templateId)
    .single();
  if (sourceError || !source) {
    return { ok: false, error: sourceError?.message ?? "Kaynak şablon bulunamadı." };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("proposal_templates")
    .insert({
      name: `${source.name} (Kopya)`,
      product: source.product,
      description: source.description,
      is_active: true,
      language: source.language,
      intro_text: source.intro_text,
      terms_text: source.terms_text,
      valid_days: source.valid_days,
      is_default_for_product: false,
      cloned_from_id: templateId,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Şablon kopyalanamadı." };
  }

  const [{ data: sections }, { data: items }] = await Promise.all([
    supabase
      .from("proposal_template_sections")
      .select("section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content")
      .eq("template_id", templateId),
    supabase
      .from("proposal_template_items")
      .select("price_list_item_id, description, quantity, unit_price, discount_percent")
      .eq("template_id", templateId),
  ]);

  if (sections && sections.length > 0) {
    const { error: sectionsError } = await supabase.from("proposal_template_sections").insert(
      sections.map((s) => ({ ...s, template_id: inserted.id }))
    );
    if (sectionsError) {
      return { ok: false, error: `Şablon oluştu ama bölümler kopyalanamadı: ${sectionsError.message}` };
    }
  }

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from("proposal_template_items").insert(
      items.map((i) => ({ ...i, template_id: inserted.id }))
    );
    if (itemsError) {
      return { ok: false, error: `Şablon oluştu ama kalemler kopyalanamadı: ${itemsError.message}` };
    }
  }

  revalidatePath("/sales/proposal-templates");
  return { ok: true, id: inserted.id };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createStudioSections, starterTemplateName, STUDIO_PRODUCTS, type StudioLanguage, type StudioProduct } from "@/lib/proposals/template-studio";

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

export type StudioTemplateInput = {
  name: string;
  product: StudioProduct;
  description: string;
  validDays: number;
  /** Şablon satırının varsayılan/etiket dili — bölüm içerikleri her zaman TR + EN'i birlikte taşır. */
  language?: StudioLanguage;
  isDefaultForProduct?: boolean;
};

export async function createStudioTemplate(input: StudioTemplateInput): Promise<ActionResult & { id?: string }> {
  const supabase = createClient();
  if (!input.name.trim()) return { ok: false, error: "Şablon adı zorunlu." };
  if (!Number.isInteger(input.validDays) || input.validDays < 1 || input.validDays > 365) {
    return { ok: false, error: "Geçerlilik süresi 1 ile 365 gün arasında olmalı." };
  }
  const { data: template, error: templateError } = await supabase
    .from("proposal_templates")
    .insert({
      name: input.name.trim(),
      product: input.product,
      language: input.language ?? "tr",
      description: input.description.trim() || null,
      valid_days: input.validDays,
      is_active: true,
      is_default_for_product: input.isDefaultForProduct ?? false,
    })
    .select("id")
    .single();
  if (templateError || !template) return { ok: false, error: templateError?.message ?? "Şablon oluşturulamadı." };
  const { error: sectionError } = await supabase.from("proposal_template_sections").insert(
    createStudioSections(input.product).map((section) => ({ ...section, template_id: template.id }))
  );
  if (sectionError) {
    return { ok: false, error: "Şablon oluşturuldu ancak belge bölümleri eklenemedi. Şablonu silmeden önce destek ekibiyle iletişime geç." };
  }
  revalidatePath("/sales/proposal-templates");
  return { ok: true, id: template.id };
}

/** Her ürün (+ genel ekosistem) için TEK bir ana/varsayılan şablon garantiler — içerik TR + EN'i
 * birlikte taşıdığından artık dil başına ayrı satıra gerek yok. Bir ürün için zaten varsayılan bir
 * şablon varsa (isim ne olursa olsun) dokunulmaz; sadece eksik olanlar oluşturulur. */
export async function createStarterTemplateLibrary(): Promise<ActionResult & { created?: number; skipped?: number }> {
  const supabase = createClient();
  const { data: current, error: currentError } = await supabase
    .from("proposal_templates")
    .select("product")
    .eq("is_default_for_product", true);
  if (currentError) return { ok: false, error: "Mevcut şablonlar okunamadı." };
  const existingProducts = new Set((current ?? []).map((template) => (template.product as StudioProduct | null) ?? null));
  let created = 0;
  let skipped = 0;
  for (const product of STUDIO_PRODUCTS) {
    if (existingProducts.has(product.key)) { skipped += 1; continue; }
    const name = starterTemplateName(product.key);
    const description = `${product.label} için Türkçe ve İngilizce içeriğin birlikte yönetildiği kurumsal teklif şablonu.`;
    const result = await createStudioTemplate({ name, product: product.key, description, validDays: 30, isDefaultForProduct: true });
    if (!result.ok) return { ok: false, error: `${name} oluşturulamadı: ${result.error}` };
    created += 1;
  }
  revalidatePath("/sales/proposal-templates");
  return { ok: true, created, skipped };
}

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
  revalidatePath("/sales/proposal-templates/[id]", "page");
  return { ok: true };
}

export async function createCustomTemplateSection(templateId: string, titleTr: string, titleEn: string): Promise<ActionResult> {
  const supabase = createClient();
  const cleanTr = titleTr.trim();
  const cleanEn = titleEn.trim();
  if (!cleanTr && !cleanEn) return { ok: false, error: "Bölüm başlığı zorunlu (en az bir dilde)." };

  const { data: current, error: readError } = await supabase
    .from("proposal_template_sections")
    .select("sort_order")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (readError) return { ok: false, error: readError.message };

  const { error } = await supabase.from("proposal_template_sections").insert({
    template_id: templateId,
    section_type: "custom",
    sort_order: (current?.[0]?.sort_order ?? 0) + 1,
    title_tr: cleanTr || null,
    title_en: cleanEn || null,
    content: {},
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sales/proposal-templates");
  revalidatePath("/sales/proposal-templates/[id]", "page");
  return { ok: true };
}

export async function deleteCustomTemplateSection(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: section, error: readError } = await supabase
    .from("proposal_template_sections")
    .select("section_type")
    .eq("id", id)
    .single();
  if (readError || !section) return { ok: false, error: "Bölüm bulunamadı." };
  if (section.section_type !== "custom") return { ok: false, error: "Zorunlu belge bölümleri silinemez." };

  const { error, count } = await supabase
    .from("proposal_template_sections")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("section_type", "custom");
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Bu bölümü silme yetkin yok." };

  revalidatePath("/sales/proposal-templates");
  revalidatePath("/sales/proposal-templates/[id]", "page");
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

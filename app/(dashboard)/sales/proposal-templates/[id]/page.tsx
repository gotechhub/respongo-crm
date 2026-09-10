import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import { studioProduct } from "@/lib/proposals/template-studio";
import { TemplateDocumentEditor } from "../template-editor";
import type { V2Template } from "../v2-templates-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalTemplateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: callerProfile }, { data: row, error: rowError }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("proposal_templates")
      .select(
        "id, name, product, language, is_active, is_default_for_product, cloned_from_id, proposal_template_sections(id, section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)"
      )
      .eq("id", params.id)
      .single(),
  ]);

  if (rowError || !row) {
    notFound();
  }

  const isFounder = (callerProfile as { role: UserRole | null } | null)?.role === "founder";
  const template: V2Template = {
    id: row.id as string,
    name: row.name as string,
    product: row.product as V2Template["product"],
    language: row.language as "tr" | "en",
    isActive: Boolean(row.is_active),
    isDefaultForProduct: Boolean(row.is_default_for_product),
    clonedFromId: row.cloned_from_id as string | null,
    sections: [...(row.proposal_template_sections as V2Template["sections"])].sort((a, b) => a.sort_order - b.sort_order),
  };

  // Aynı ürün için kayıtlı diğer şablonlar (ör. kopyalanmış sürümler, eski dil-başına-satır
  // yedekleri) — düzenleyicide aralarında hızlı geçiş sağlayan küçük bir bağlantı şeridi için.
  // Artık dile göre filtrelenmiyor: içerik zaten TR + EN'i aynı satırda taşıyor.
  const siblingsBase = supabase.from("proposal_templates").select("id, name").neq("id", template.id);
  const { data: siblingRows } = template.product
    ? await siblingsBase.eq("product", template.product)
    : await siblingsBase.is("product", null);

  const productMeta = studioProduct(template.product);

  return (
    <>
      <Topbar title={template.name} subtitle={`${productMeta.trName} · Türkçe + İngilizce`} />
      <div className="mb-4">
        <Link
          href="/sales/proposal-templates"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-rg-ink-soft hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Şablon kütüphanesine dön
        </Link>
      </div>
      <TemplateDocumentEditor
        template={template}
        isFounder={isFounder}
        siblings={(siblingRows ?? []).map((s) => ({ id: s.id as string, name: s.name as string }))}
      />
    </>
  );
}

import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import { TemplatesPanel, type PriceListForPicker, type ProposalTemplate } from "./templates-panel";
import { V2TemplatesPanel, type V2Template } from "./v2-templates-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalTemplatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isFounder = (callerProfile as { role: UserRole | null } | null)?.role === "founder";

  const [{ data: templateRows }, { data: priceListRows }] = await Promise.all([
    supabase
      .from("proposal_templates")
      .select(
        "id, name, product, language, description, valid_days, intro_text, terms_text, is_active, is_default_for_product, cloned_from_id, proposal_template_items(id, description, quantity, unit_price, discount_percent, price_list_item_id, price_list_items(name, unit, unit_price)), proposal_template_sections(id, section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)"
      ),
    supabase
      .from("price_lists")
      .select("id, name, product, currency, price_list_items(id, name, description, unit, unit_price)")
      .eq("is_active", true),
  ]);

  const allTemplates = (templateRows ?? []) as unknown as (ProposalTemplate & {
    is_default_for_product: boolean;
    cloned_from_id: string | null;
    proposal_template_sections: V2Template["sections"];
  })[];

  // Bölüm bazlı (v2) şablonlar: en az bir proposal_template_sections satırı olanlar.
  // Eski (Faz 2) tek-dilli şablonlar bölüm içermez, aşağıdaki basit panelde kalmaya devam eder.
  const v2Templates: V2Template[] = allTemplates
    .filter((t) => t.proposal_template_sections && t.proposal_template_sections.length > 0)
    .map((t) => ({
      id: t.id,
      name: t.name,
      product: t.product,
      isActive: t.is_active,
      isDefaultForProduct: t.is_default_for_product,
      clonedFromId: t.cloned_from_id,
      sections: [...t.proposal_template_sections].sort((a, b) => a.sort_order - b.sort_order),
    }));

  const templates = allTemplates.filter(
    (t) => !t.proposal_template_sections || t.proposal_template_sections.length === 0
  ) as ProposalTemplate[];
  const priceLists: PriceListForPicker[] = (priceListRows ?? []).map((pl) => ({
    id: pl.id as string,
    name: pl.name as string,
    product: pl.product as string,
    currency: (pl.currency as string) || "USD",
    items: (pl.price_list_items ?? []) as PriceListForPicker["items"],
  }));

  return (
    <>
      <Topbar
        title="Teklif Şablonları"
        subtitle={
          isFounder
            ? "Teklif Şablonları 2.0: her ürün için kapak, müşteri bilgisi, kapsam, ürün bilgisi, hukuki metin (TR/US), banka ve imza bölümlerinden oluşan çok sayfalı, çift dilli şablonlar. Aşağıda eski (tek dilli, kalem bazlı) şablonlar da yönetilebilir."
            : "Teklif Şablonları 2.0: her ürün için kapak, müşteri bilgisi, kapsam, ürün bilgisi, hukuki metin (TR/US), banka ve imza bölümlerinden oluşan çok sayfalı, çift dilli şablonlar."
        }
      />
      <div className="flex flex-col gap-10">
        <V2TemplatesPanel templates={v2Templates} isFounder={isFounder} />
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[13.5px] font-bold text-rg-ink">Eski Şablonlar (Faz 2, kalem bazlı)</h2>
          <TemplatesPanel templates={templates} priceLists={priceLists} isFounder={isFounder} />
        </div>
      </div>
    </>
  );
}

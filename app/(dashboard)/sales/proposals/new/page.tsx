import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import {
  ProposalWizard,
  type CustomerOption,
  type LeadOption,
  type PriceListOption,
  type TemplateOption,
} from "../proposal-wizard";
import type { ProductKey } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewProposalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: leadRows }, { data: customerRows }, { data: priceListRows }, { data: templateRows }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, company_name, region, currency")
        .in("status", ["yeni", "gorusme", "teklif"])
        .order("company_name", { ascending: true }),
      supabase
        .from("customers")
        .select("id, company_name, region")
        .eq("is_active", true)
        .order("company_name", { ascending: true }),
      supabase
        .from("price_lists")
        .select("id, name, product, currency, price_list_items(id, name, description, unit, unit_price)")
        .eq("is_active", true)
        .order("product", { ascending: true }),
      supabase
        .from("proposal_templates")
        .select("id, name, product, language, description, valid_days, proposal_template_sections(id)")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  const leads: LeadOption[] = (leadRows ?? []).map((l) => ({
    id: l.id as string,
    company_name: l.company_name as string,
    region: l.region as LeadOption["region"],
    currency: (l.currency as string) || "USD",
  }));

  const customers: CustomerOption[] = (customerRows ?? []).map((c) => ({
    id: c.id as string,
    company_name: c.company_name as string,
    region: c.region as CustomerOption["region"],
  }));

  const priceLists: PriceListOption[] = (priceListRows ?? []).map((pl) => ({
    id: pl.id as string,
    name: pl.name as string,
    product: pl.product as ProductKey,
    currency: (pl.currency as string) || "USD",
    items: ((pl.price_list_items ?? []) as PriceListOption["items"]).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unit: item.unit,
      unit_price: item.unit_price,
    })),
  }));

  const templates: TemplateOption[] = (templateRows ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    product: t.product as TemplateOption["product"],
    language: t.language as TemplateOption["language"],
    description: t.description as string | null,
    valid_days: t.valid_days as number,
    // Teklif Şablonları 2.0: bölüm bazlı (proposal_template_sections'ı olan) şablonlar TR+EN
    // içeriği tek satırda taşır — sihirbazın dil seçicisinden bağımsız olarak listelenmeli.
    isBilingual: ((t.proposal_template_sections ?? []) as { id: string }[]).length > 0,
  }));

  return (
    <>
      <Topbar
        title="Teklif Oluştur"
        subtitle="5 adımda hedef, ürün/kalem, fiyatlandırma, şablon ve önizleme — taslak olarak kaydet ya da doğrudan gönder."
      />
      <ProposalWizard
        leads={leads}
        customers={customers}
        priceLists={priceLists}
        templates={templates}
        defaultCurrency="USD"
      />
    </>
  );
}

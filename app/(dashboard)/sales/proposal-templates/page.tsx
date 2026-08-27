import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import { TemplatesPanel, type PriceListForPicker, type ProposalTemplate } from "./templates-panel";

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
        "id, name, product, language, description, valid_days, intro_text, terms_text, is_active, proposal_template_items(id, description, quantity, unit_price, discount_percent, price_list_item_id, price_list_items(name, unit, unit_price))"
      ),
    supabase
      .from("price_lists")
      .select("id, name, product, currency, price_list_items(id, name, description, unit, unit_price)")
      .eq("is_active", true),
  ]);

  const templates = (templateRows ?? []) as ProposalTemplate[];
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
            ? "Ürün başına hazırlanmış TR/EN şablonlar — Teklif Oluştur ekranı bunları temel alır. Buradan düzenleyebilirsin."
            : "Ürün başına hazırlanmış TR/EN şablonlar — Teklif Oluştur ekranı bunları temel alır."
        }
      />
      <TemplatesPanel templates={templates} priceLists={priceLists} isFounder={isFounder} />
    </>
  );
}

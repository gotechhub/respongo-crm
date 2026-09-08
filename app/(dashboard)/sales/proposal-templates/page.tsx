import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import type { V2Template } from "./v2-templates-panel";
import { ProposalStudio } from "./proposal-studio";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalTemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: callerProfile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("proposal_templates").select("id, name, product, language, is_active, is_default_for_product, cloned_from_id, proposal_template_sections(id, section_type, legal_region, sort_order, title_tr, title_en, body_tr, body_en, content)"),
  ]);
  const isFounder = (callerProfile as { role: UserRole | null } | null)?.role === "founder";
  const templates: V2Template[] = (rows ?? [])
    .filter((row) => Array.isArray(row.proposal_template_sections) && row.proposal_template_sections.length > 0)
    .map((row) => ({
      id: row.id as string, name: row.name as string, product: row.product as V2Template["product"], language: row.language as "tr" | "en", isActive: Boolean(row.is_active), isDefaultForProduct: Boolean(row.is_default_for_product), clonedFromId: row.cloned_from_id as string | null,
      sections: [...(row.proposal_template_sections as V2Template["sections"])].sort((a, b) => a.sort_order - b.sort_order),
    }));

  return <>
    <Topbar title="Teklif Şablonları" subtitle="Ürün, dil, kapsam ve ticari detayları müşterinin göreceği tam teklif içinde yönetin." />
    <ProposalStudio templates={templates} isFounder={isFounder} />
  </>;
}

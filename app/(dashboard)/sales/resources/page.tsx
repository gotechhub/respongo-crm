import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";
import { ResourcesPanel, type ResourceRow } from "./resources-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResourcesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isFounder = (callerProfile as { role: UserRole | null } | null)?.role === "founder";

  const { data } = await supabase
    .from("resources")
    .select("id, category, title_tr, title_en, body_tr, body_en, url, sort_order")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const resources = (data ?? []) as ResourceRow[];

  return (
    <>
      <Topbar
        title="Kaynaklar"
        subtitle="Satış konuşmaları, ürün tanıtımları, sektörel sözlük ve onboarding materyalleri — ekip ve iş ortakları için ortak bilgi merkezi."
      />
      <ResourcesPanel resources={resources} canManage={isFounder} />
    </>
  );
}

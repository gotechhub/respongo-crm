import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { PoolTable, type PoolRow } from "./pool-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerPoolPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("region")
    .eq("id", user?.id ?? "")
    .single();

  const { data: pool } = await supabase
    .from("customer_pool")
    .select(
      "id, company_name, contact_name, contact_email, contact_phone, source, country, region, owner_id, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (pool ?? []) as PoolRow[];

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  return (
    <>
      <Topbar
        title="Müşteri Havuzu"
        subtitle="Ham/işlenmemiş kayıtlar burada toplanır, buradan Müşteri Adayı'na (lead) çevrilir."
      />
      <PoolTable
        rows={rows}
        ownerNames={ownerNames}
        defaultRegion={(me?.region as PoolRow["region"]) ?? null}
      />
    </>
  );
}

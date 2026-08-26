import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { LeadsTable, type LeadRow } from "./leads-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, company_name, contact_name, contact_email, status, value_estimate, currency, region, owner_id, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (leads ?? []) as LeadRow[];

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
        title="Müşteri Adayları"
        subtitle="Havuzdan gelen ya da doğrudan açılan lead'ler — pipeline durumunu buradan yönet."
      />
      <LeadsTable rows={rows} ownerNames={ownerNames} />
    </>
  );
}

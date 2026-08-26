import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";
import { parsePagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { RegionFilter } from "@/components/ui/region-filter";
import { ContactsPanel, type ContactRow } from "./contacts-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";

  const { page, pageSize, from, to } = parsePagination(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const regionFilter = typeof searchParams.region === "string" ? (searchParams.region as Region) : "";

  let query = supabase
    .from("contacts")
    .select(
      "id, company_id, first_name, last_name, title, email, phone, mobile_phone, is_primary, region, owner_id, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,title.ilike.%${q}%`);
  }
  if (regionFilter) {
    query = query.eq("region", regionFilter);
  }

  const [{ data: contacts, count }, { data: companies }] = await Promise.all([
    query.range(from, to),
    supabase.from("companies").select("id, name").order("name", { ascending: true }).limit(500),
  ]);

  const rows = (contacts ?? []) as ContactRow[];
  const companyList = (companies ?? []) as { id: string; name: string }[];
  const companyNames: Record<string, string> = {};
  companyList.forEach((c) => {
    companyNames[c.id] = c.name;
  });

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  return (
    <>
      <Topbar title="Kişiler" subtitle="Şirketlere bağlı veya bağımsız kişi kayıtları." />
      <div className="mb-3 flex items-center gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Ad, soyad, e-posta, ünvan ara..." />
        </Suspense>
        {isFounder && (
          <Suspense fallback={<div className="h-[38px] w-[140px]" />}>
            <RegionFilter />
          </Suspense>
        )}
      </div>

      <ContactsPanel
        rows={rows}
        ownerNames={ownerNames}
        companyNames={companyNames}
        companies={companyList}
        defaultRegion={caller?.region ?? null}
        pagination={{ totalCount: count ?? 0, page, pageSize }}
      />
    </>
  );
}

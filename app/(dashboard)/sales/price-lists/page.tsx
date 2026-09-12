import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import { SearchInput } from "@/components/ui/search-input";
import { RegionTabs } from "@/components/ui/region-tabs";
import type { Region, UserRole } from "@/lib/roles";
import { PriceListsPanel, type PriceListRow } from "./price-lists-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PriceListsPage({
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

  const { data: callerProfile } = await supabase.from("profiles").select("role, region").eq("id", user.id).single();
  const myRole = (callerProfile as { role: UserRole | null; region: Region | null } | null)?.role ?? null;
  const myRegion = (callerProfile as { role: UserRole | null; region: Region | null } | null)?.region ?? null;
  const isFounder = myRole === "founder";
  const isRegionAdmin = myRole === "region_admin";
  // region_admin sadece KENDİ bölgesindeki listeleri yönetebilir (RLS —
  // 20260911000011 — zaten bunu zorluyor; burada aynısını uygulama
  // katmanında da tekrarlıyoruz ki region_admin'e "Ortak" veya diğer bölge
  // seçeneği hiç gösterilmesin, RLS reddiyle karşılaşmasın).
  const canManage = isFounder || isRegionAdmin;
  const restrictToRegion: Region | null = isRegionAdmin ? myRegion : null;

  const { data } = await supabase
    .from("price_lists")
    .select(
      "id, name, product, currency, region, is_active, valid_from, valid_until, price_list_items(id, name, description, unit, unit_price)"
    )
    .order("product", { ascending: true })
    .order("name", { ascending: true });

  const allPriceLists = (data ?? []) as PriceListRow[];

  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const qFiltered = q
    ? allPriceLists
        .map((list) => {
          const listMatches =
            list.name.toLowerCase().includes(q) || list.product.toLowerCase().includes(q);
          const items = listMatches
            ? list.price_list_items
            : list.price_list_items.filter(
                (item) => item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q)
              );
          return { ...list, price_list_items: items };
        })
        .filter((list) => list.price_list_items.length > 0)
    : allPriceLists;

  const regionParam = typeof searchParams.region === "string" ? searchParams.region : "";
  const region: "tr" | "global" | "" = regionParam === "tr" || regionParam === "global" ? regionParam : "";
  const priceLists = region ? qFiltered.filter((list) => list.region === region || list.region === null) : qFiltered;

  return (
    <>
      <Topbar
        title="Fiyat Listeleri"
        subtitle="Fiyatlar Respongo 2026 resmi fiyat listesine göre güncellendi. Her liste bir bölgeye (TR / Global) veya her iki bölgeye birden atanabilir — Türkiye ortakları yalnızca TR + ortak listeleri, global ortaklar yalnızca Global + ortak listeleri görür. 'Teklife özel' işaretli kalemler kurum ihtiyacına göre ayrı fiyatlandırılır."
      />
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <Suspense fallback={<div className="h-[38px] w-[240px]" />}>
          <SearchInput placeholder="Ürün veya kalem ara..." />
        </Suspense>
        <Suspense fallback={<div className="h-[38px] w-[220px]" />}>
          <RegionTabs />
        </Suspense>
      </div>
      <PriceListsPanel priceLists={priceLists} canManage={canManage} restrictToRegion={restrictToRegion} />
    </>
  );
}

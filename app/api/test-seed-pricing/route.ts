import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const rows = [["100 kullanıcı",2000],["250 kullanıcı",3000],["500 kullanıcı",5000],["1.000 kullanıcı",8500],["2.500 kullanıcı",13000],["5.000 kullanıcı",19000],["10.000 kullanıcı",25000]] as const;
export async function GET(request: Request) {
  if (process.env.TEST_LOGIN_ENABLED === "false") return new NextResponse("Not found", { status: 404 });
  const db = createAdminClient();
  const { data: list, error } = await db.from("price_lists").insert({ name: "GOLMS — Resmi Lisans 2026", product: "golms", currency: "USD", is_active: true, valid_from: "2026-01-01", valid_until: "2026-12-31" }).select("id").single();
  if (error || !list) return NextResponse.json({ error: error?.message ?? "Liste oluşturulamadı" }, { status: 500 });
  const { error: itemError } = await db.from("price_list_items").insert(rows.map(([name, unit_price]) => ({ price_list_id: list.id, name, description: "Bulut tabanlı yazılım lisansı", unit: "yıl", unit_price })));
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  return NextResponse.redirect(new URL("/sales/price-lists?seeded=1", request.url));
}

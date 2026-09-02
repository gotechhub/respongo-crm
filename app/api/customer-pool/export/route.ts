import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildXlsxBuffer, excelResponseHeaders } from "@/lib/excel/xlsx-helpers";
import type { Region } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const region = (searchParams.get("region") as Region | null) ?? "";

  let query = supabase
    .from("customer_pool")
    .select("company_name, contact_name, contact_email, contact_phone, country, notes, region, source, external_ref, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);
  }
  if (region) {
    query = query.eq("region", region);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ownerIds = Array.from(new Set((rows ?? []).map((r) => r.owner_id).filter(Boolean))) as string[];
  const ownerNames: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id as string] = (o.full_name as string | null) || (o.email as string);
    });
  }

  const headers = [
    "Firma Adı",
    "İletişim Adı",
    "E-posta",
    "Telefon",
    "Ülke",
    "Bölge (tr/global)",
    "Not",
    "Sahip E-postası (opsiyonel)",
    "Dış Referans (Apollo ID vb.)",
    "Kaynak",
    "Sahip",
    "Oluşturulma Tarihi",
  ] as const;

  const dataRows = (rows ?? []).map((r) => [
    r.company_name,
    r.contact_name,
    r.contact_email,
    r.contact_phone,
    r.country,
    r.region,
    r.notes,
    "",
    r.external_ref,
    r.source,
    r.owner_id ? ownerNames[r.owner_id] ?? "" : "",
    new Date(r.created_at as string).toLocaleDateString("tr-TR"),
  ]);

  const buffer = buildXlsxBuffer(headers, dataRows, "Satış Havuzu");
  return new NextResponse(new Uint8Array(buffer), { headers: excelResponseHeaders("satis-havuzu.xlsx") });
}

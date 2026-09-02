import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildXlsxBuffer, excelResponseHeaders } from "@/lib/excel/xlsx-helpers";
import { POOL_EXCEL_HEADERS, POOL_EXCEL_EXAMPLE_ROW } from "@/app/(dashboard)/sales/excel-columns";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const buffer = buildXlsxBuffer(POOL_EXCEL_HEADERS, [POOL_EXCEL_EXAMPLE_ROW], "Havuz Şablonu");
  return new NextResponse(new Uint8Array(buffer), { headers: excelResponseHeaders("havuz-import-sablonu.xlsx") });
}

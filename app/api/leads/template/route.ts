import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildXlsxBuffer, excelResponseHeaders } from "@/lib/excel/xlsx-helpers";
import { LEAD_EXCEL_HEADERS, LEAD_EXCEL_EXAMPLE_ROW } from "@/app/(dashboard)/sales/leads/excel-columns";

export const dynamic = "force-dynamic";

// Toplu lead içe aktarımı için örnek Excel şablonu — importLeadsExcel'in
// beklediği başlıklarla BİREBİR aynı (excel-columns.ts tek doğru kaynak).
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const buffer = buildXlsxBuffer(LEAD_EXCEL_HEADERS, [LEAD_EXCEL_EXAMPLE_ROW], "Lead Şablonu");
  return new NextResponse(new Uint8Array(buffer), { headers: excelResponseHeaders("lead-import-sablonu.xlsx") });
}

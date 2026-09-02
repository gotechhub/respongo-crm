"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseXlsxBuffer, cellStr } from "@/lib/excel/xlsx-helpers";
import type { Region } from "@/lib/roles";

export type PoolImportResult =
  | {
      ok: true;
      totalRows: number;
      insertedCount: number;
      duplicateCount: number;
      errorCount: number;
      errors: string[];
    }
  | { ok: false; error: string };

const REGION_VALUES: Region[] = ["tr", "global"];
const MAX_ROWS = 2000;

// Excel'den toplu Satış Havuzu (customer_pool) içe aktarımı — mantık
// `sales/leads/import-actions.ts`'teki ile aynı desende (dedup, bölge
// zorlaması, sahip e-postası çözümleme). Havuz kayıtları henüz aktif
// pipeline'a girmediği için otomatik ekip eşleştirmesi burada UYGULANMIYOR —
// bu bilinçli bir kapsam kararı (bkz. proje hafızası, bölüm E notu): pool bir
// ham bekleme alanı, sahiplenme convertPoolToLead ile lead'e çevrilince
// anlam kazanıyor.
export async function importPoolExcel(formData: FormData): Promise<PoolImportResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: me } = await supabase.from("profiles").select("role, region").eq("id", user.id).single();
  const myRole = (me as { role: string | null } | null)?.role ?? null;
  const myRegion = (me as { region: Region | null } | null)?.region ?? null;
  const isFounder = myRole === "founder";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Bir Excel (.xlsx) dosyası seç." };
  }
  const forcedRegion = cellStr(formData.get("region"));

  let rows: Record<string, unknown>[];
  try {
    rows = parseXlsxBuffer(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { ok: false, error: "Dosya okunamadı — geçerli bir .xlsx dosyası olduğundan emin ol." };
  }

  if (rows.length === 0) {
    return { ok: false, error: "Dosyada satır bulunamadı." };
  }
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `Tek seferde en fazla ${MAX_ROWS} satır içe aktarılabilir.` };
  }

  const errors: string[] = [];
  type Staged = { row: Record<string, unknown>; ownerEmail: string | null; rowNo: number };
  const staged: Staged[] = [];
  const ownerEmailsNeeded = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNo = idx + 2;
    const companyName = cellStr(row["Firma Adı"]);
    if (!companyName) {
      errors.push(`Satır ${rowNo}: Firma Adı zorunlu, atlandı.`);
      return;
    }

    let region: Region;
    if (isFounder) {
      const chosen = (forcedRegion || cellStr(row["Bölge (tr/global)"]).toLowerCase()) as Region;
      if (!REGION_VALUES.includes(chosen)) {
        errors.push(`Satır ${rowNo}: Bölge geçersiz/boş (tr veya global olmalı), atlandı.`);
        return;
      }
      region = chosen;
    } else {
      if (!myRegion) {
        errors.push(`Satır ${rowNo}: Hesabına bölge atanmamış, içe aktarım yapılamıyor.`);
        return;
      }
      region = myRegion;
    }

    const ownerEmail = cellStr(row["Sahip E-postası (opsiyonel)"]).toLowerCase() || null;
    if (ownerEmail) ownerEmailsNeeded.add(ownerEmail);

    staged.push({
      row: {
        company_name: companyName,
        contact_name: cellStr(row["İletişim Adı"]) || null,
        contact_email: cellStr(row["E-posta"]) || null,
        contact_phone: cellStr(row["Telefon"]) || null,
        country: cellStr(row["Ülke"]) || null,
        notes: cellStr(row["Not"]) || null,
        region,
        source_type: "manual",
        source: "Excel içe aktarım",
        external_ref: cellStr(row["Dış Referans (Apollo ID vb.)"]) || null,
        created_by: user.id,
        owner_id: null,
      },
      ownerEmail,
      rowNo,
    });
  });

  if (staged.length === 0) {
    return { ok: false, error: ["Hiçbir satır geçerli değildi.", ...errors].join("\n") };
  }

  let ownerByEmail: Record<string, string> = {};
  if (ownerEmailsNeeded.size > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", Array.from(ownerEmailsNeeded));
    ownerByEmail = Object.fromEntries(
      (owners ?? []).map((o) => [(o.email as string).toLowerCase(), o.id as string])
    );
  }

  const finalRows = staged.map((s) => {
    let ownerId: string | null = null;
    if (s.ownerEmail) {
      ownerId = ownerByEmail[s.ownerEmail] ?? null;
      if (!ownerId) {
        errors.push(`Satır ${s.rowNo}: Sahip e-postası "${s.ownerEmail}" bulunamadı, sahipsiz bırakıldı.`);
      }
    } else if (myRole === "sales_inhouse") {
      ownerId = user.id;
    }
    return { ...s.row, owner_id: ownerId };
  });

  const { data: insertedRows, error: insertError } = await supabase
    .from("customer_pool")
    .upsert(finalRows, { onConflict: "region,contact_email_norm", ignoreDuplicates: true })
    .select("id");

  if (insertError) {
    return { ok: false, error: `İçe aktarım başarısız: ${insertError.message}` };
  }

  const insertedCount = insertedRows?.length ?? 0;
  const duplicateCount = finalRows.length - insertedCount;

  revalidatePath("/sales");

  return {
    ok: true,
    totalRows: rows.length,
    insertedCount,
    duplicateCount,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  };
}

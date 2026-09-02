"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseXlsxBuffer, cellStr } from "@/lib/excel/xlsx-helpers";
import type { Region } from "@/lib/roles";
import type { LeadSource } from "./status-labels";

export type LeadImportResult =
  | {
      ok: true;
      totalRows: number;
      insertedCount: number;
      duplicateCount: number;
      errorCount: number;
      errors: string[];
    }
  | { ok: false; error: string };

const CURRENCY_OPTIONS = ["USD", "EUR", "TRY", "GBP"];
const REGION_VALUES: Region[] = ["tr", "global"];
const MAX_ROWS = 2000;

type StagedLead = {
  row: {
    company_name: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    region: Region;
    source_type: string;
    status: "yeni";
    currency: string;
    value_estimate: number | null;
    external_ref: string | null;
    created_by: string;
    owner_id: string | null;
  };
  ownerEmail: string | null;
  rowNo: number;
};

// Excel'den toplu lead içe aktarımı. E-posta bazlı dedup, DB'deki
// `leads_region_email_norm_key` unique constraint'i + `.upsert(...,
// {ignoreDuplicates:true})` ile yapılıyor — aynı bölgede aynı e-postalı bir
// kayıt zaten varsa sessizce atlanıyor (hata değil, "duplicateCount" olarak
// raporlanıyor). Founder olmayan roller için satırdaki bölge bilgisi ne
// olursa olsun YOK SAYILIR, kendi bölgesi zorlanır (cross-region veri
// sızıntısı riski engellenir — DERS 26 tarzı: RLS zaten region eşleşmesini
// şart koşuyor, burada ayrıca UI/iş kuralı seviyesinde de garanti ediliyor).
export async function importLeadsExcel(formData: FormData): Promise<LeadImportResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: me } = await supabase.from("profiles").select("role, region").eq("id", user.id).single();
  const myRole = (me as { role: string | null } | null)?.role ?? null;
  const myRegion = (me as { region: Region | null } | null)?.region ?? null;
  const isFounder = myRole === "founder";
  const isManager = isFounder || myRole === "region_admin";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Bir Excel (.xlsx) dosyası seç." };
  }

  const forcedRegion = cellStr(formData.get("region"));
  const sourceType = (cellStr(formData.get("sourceType")) || "manual") as LeadSource;
  const autoAssign = formData.get("autoAssign") === "on";

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
    return { ok: false, error: `Tek seferde en fazla ${MAX_ROWS} satır içe aktarılabilir — dosyayı bölüp tekrar dene.` };
  }

  const errors: string[] = [];
  const staged: StagedLead[] = [];
  const ownerEmailsNeeded = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNo = idx + 2; // 1. satır başlık
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

    let currency = cellStr(row["Para Birimi (USD/EUR/TRY/GBP)"]).toUpperCase();
    if (!CURRENCY_OPTIONS.includes(currency)) currency = "USD";

    const valueRaw = cellStr(row["Değer Tahmini"]);
    const valueEstimate = valueRaw ? Number(valueRaw.replace(",", ".")) : null;

    staged.push({
      row: {
        company_name: companyName,
        contact_name: cellStr(row["İletişim Adı"]) || null,
        contact_email: cellStr(row["E-posta"]) || null,
        contact_phone: cellStr(row["Telefon"]) || null,
        region,
        source_type: sourceType,
        status: "yeni",
        currency,
        value_estimate: valueEstimate !== null && Number.isFinite(valueEstimate) ? valueEstimate : null,
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
    .from("leads")
    .upsert(finalRows, { onConflict: "region,contact_email_norm", ignoreDuplicates: true })
    .select("id, owner_id");

  if (insertError) {
    return { ok: false, error: `İçe aktarım başarısız: ${insertError.message}` };
  }

  const insertedCount = insertedRows?.length ?? 0;
  const duplicateCount = finalRows.length - insertedCount;

  // "Her lead bir satış ekibiyle eşleşsin" hedefi: sahibi olmayan yeni
  // kayıtlar, yönetici (founder/region_admin) "Otomatik ata" kutusunu
  // işaretlediyse, en az iş yüküne sahip aktif sales_inhouse üyesine atanır.
  if (autoAssign && isManager) {
    const needsAssign = (insertedRows ?? []).filter((r) => !r.owner_id);
    for (const r of needsAssign) {
      const { error: assignError } = await supabase.rpc("auto_assign_lead", { p_lead_id: r.id });
      if (assignError) {
        errors.push(`Otomatik atama hatası (kayıt ${r.id}): ${assignError.message}`);
      }
    }
  }

  revalidatePath("/sales/leads");

  return {
    ok: true,
    totalRows: rows.length,
    insertedCount,
    duplicateCount,
    errorCount: errors.length,
    errors: errors.slice(0, 50),
  };
}

export type BulkAssignResult = { ok: true; assignedCount: number; skippedCount: number } | { ok: false; error: string };

// Halihazırda sahipsiz kalmış lead'leri (import dışında da oluşmuş olabilir —
// ör. eski veri, marketing kaynaklı) toplu olarak otomatik eşleştirir.
export async function bulkAutoAssignUnassignedLeads(region?: Region): Promise<BulkAssignResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const myRole = (me as { role: string | null } | null)?.role ?? null;
  if (myRole !== "founder" && myRole !== "region_admin") {
    return { ok: false, error: "Bu işlemi yapma yetkin yok — sadece Süper Admin veya Bölge Yöneticisi." };
  }

  let query = supabase.from("leads").select("id").is("owner_id", null);
  if (region) query = query.eq("region", region);
  const { data: unassigned, error } = await query;
  if (error) return { ok: false, error: error.message };

  let assignedCount = 0;
  let skippedCount = 0;
  for (const row of unassigned ?? []) {
    const { data: chosen, error: rpcError } = await supabase.rpc("auto_assign_lead", { p_lead_id: row.id });
    if (rpcError || !chosen) {
      skippedCount += 1;
    } else {
      assignedCount += 1;
    }
  }

  revalidatePath("/sales/leads");
  return { ok: true, assignedCount, skippedCount };
}

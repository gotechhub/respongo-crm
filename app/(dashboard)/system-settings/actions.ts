"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";

export type SystemSettingsInput = {
  companyLegalName: string;
  defaultCurrency: string;
  defaultRegion: Region;
  fiscalYearStartMonth: number;
  timezone: string;
  dateFormat: string;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateSystemSettings(input: SystemSettingsInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  if (input.fiscalYearStartMonth < 1 || input.fiscalYearStartMonth > 12) {
    return { ok: false, error: "Mali yıl başlangıç ayı 1-12 arasında olmalı." };
  }
  if (input.sessionTimeoutMinutes <= 0) {
    return { ok: false, error: "Oturum zaman aşımı pozitif bir değer olmalı." };
  }

  const { error, count } = await supabase
    .from("system_settings")
    .update({
      company_legal_name: input.companyLegalName || null,
      default_currency: input.defaultCurrency,
      default_region: input.defaultRegion,
      fiscal_year_start_month: input.fiscalYearStartMonth,
      timezone: input.timezone,
      date_format: input.dateFormat,
      session_timeout_minutes: input.sessionTimeoutMinutes,
      maintenance_mode: input.maintenanceMode,
      maintenance_message: input.maintenanceMessage || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { count: "exact" })
    .eq("id", true);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Güncelleme başarısız — bu işlemi yapma yetkin olmayabilir." };

  revalidatePath("/system-settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

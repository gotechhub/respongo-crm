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

// V3-B: "Demo Verilerini Temizle". Founder'ın istediği zaman tüm örnek/demo
// verileri (is_demo=true satırlar) tek tıkla, doğru FK sırasıyla silebilmesi
// için — kullanıcının kendi isteği: "sonra sileceğiz". Gerçek veriye (is_demo
// yok/false) KESİNLİKLE dokunulmaz, her DELETE .eq("is_demo", true) ile
// sınırlı. Sıra: önce yaprak (child) tablolar, sonra kök (parent) tablolar —
// aksi halde foreign key ihlali oluşur.
const DEMO_TABLES_IN_DELETE_ORDER = [
  "chat_sessions",
  "social_posts",
  "notifications",
  "commission_entries",
  "partner_meetings",
  "partner_monthly_targets",
  "partner_tasks",
  "resources",
  "partner_profiles",
  "support_ticket_messages",
  "support_tickets",
  "customer_requests",
  "invoice_items",
  "invoices",
  "license_renewals",
  "licenses",
  "proposal_items",
  "proposals",
  "subtasks",
  "task_assignees",
  "tasks",
  "projects",
  "customer_users",
  "customers",
  "leads",
  "customer_pool",
  "contacts",
  "companies",
  "marketing_campaigns",
] as const;

export type ClearDemoDataResult =
  | { ok: true; deletedCounts: Record<string, number> }
  | { ok: false; error: string; deletedCounts: Record<string, number> };

export async function clearDemoData(): Promise<ClearDemoDataResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı.", deletedCounts: {} };

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "founder") {
    return { ok: false, error: "Bu işlemi sadece Süper Admin yapabilir.", deletedCounts: {} };
  }

  const deletedCounts: Record<string, number> = {};
  for (const table of DEMO_TABLES_IN_DELETE_ORDER) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .eq("is_demo", true);
    if (error) {
      return {
        ok: false,
        error: `"${table}" tablosunda silme başarısız: ${error.message}`,
        deletedCounts,
      };
    }
    deletedCounts[table] = count ?? 0;
  }

  revalidatePath("/", "layout");
  return { ok: true, deletedCounts };
}

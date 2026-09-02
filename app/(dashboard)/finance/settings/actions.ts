"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { testParasutConnection } from "@/lib/parasut/client";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireFounder() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Oturum bulunamadı." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "founder") {
    return { ok: false as const, error: "Bu sayfayı sadece Süper Admin kullanabilir." };
  }
  return { ok: true as const, supabase };
}

function encKey(): string {
  const key = process.env.PARASUT_SETTINGS_ENC_KEY;
  if (!key) {
    throw new Error("PARASUT_SETTINGS_ENC_KEY ortam değişkeni tanımlı değil.");
  }
  return key;
}

export type SaveCredentialsInput = {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
};

export async function saveParasutCredentials(input: SaveCredentialsInput): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  const { error } = await guard.supabase.rpc("parasut_save_credentials", {
    p_client_id: input.clientId,
    p_client_secret: input.clientSecret,
    p_username: input.username,
    p_password: input.password,
    p_company_id: input.companyId,
    p_enc_key: encKey(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/finance/settings");
  return { ok: true };
}

export type PreferencesInput = {
  autoGenerateInvoice: boolean;
  autoSendToCustomer: boolean;
  defaultVatRate: number;
};

export async function updateParasutPreferences(input: PreferencesInput): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  const { error } = await guard.supabase.rpc("parasut_update_preferences", {
    p_auto_generate_invoice: input.autoGenerateInvoice,
    p_auto_send_to_customer: input.autoSendToCustomer,
    p_default_vat_rate: input.defaultVatRate,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/finance/settings");
  return { ok: true };
}

export type TestConnectionResult = { ok: boolean; message: string };

export async function testParasutConnectionAction(): Promise<TestConnectionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return { ok: false, message: guard.error };

  const result = await testParasutConnection();
  revalidatePath("/finance/settings");
  return result;
}

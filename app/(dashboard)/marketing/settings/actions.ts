"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { testBrevoConnection } from "@/lib/brevo/client";

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
  const key = process.env.MARKETING_SETTINGS_ENC_KEY;
  if (!key) {
    throw new Error("MARKETING_SETTINGS_ENC_KEY ortam değişkeni tanımlı değil.");
  }
  return key;
}

export type SaveBrevoInput = {
  apiKey: string;
  listIdTr: string;
  listIdGlobal: string;
};

export async function saveBrevoCredentials(input: SaveBrevoInput): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  const { error } = await guard.supabase.rpc("marketing_save_brevo_credentials", {
    p_api_key: input.apiKey,
    p_list_id_tr: input.listIdTr,
    p_list_id_global: input.listIdGlobal,
    p_enc_key: encKey(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/marketing/settings");
  return { ok: true };
}

export async function updateMarketingPreferences(autoSyncNewsletter: boolean): Promise<ActionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return guard;

  const { error } = await guard.supabase.rpc("marketing_update_preferences", {
    p_auto_sync_newsletter: autoSyncNewsletter,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/marketing/settings");
  return { ok: true };
}

export type TestConnectionResult = { ok: boolean; message: string };

export async function testBrevoConnectionAction(): Promise<TestConnectionResult> {
  const guard = await requireFounder();
  if (!guard.ok) return { ok: false, message: guard.error };

  const result = await testBrevoConnection();
  revalidatePath("/marketing/settings");
  return result;
}

// marketing_settings singleton'ı için PAYLAŞILAN sunucu-taraflı okuma yardımcıları.
// Hem lib/brevo/client.ts hem app/api/webhooks/jivochat-chat/route.ts tarafından
// kullanılır — RPC'nin şekli değiştiğinde tek noktadan güncellensin diye burada
// toplandı (bölüm G.2, DERS 26: yeni bir tablo/mekanizma gerekmedi, mevcut
// marketing_settings singleton'ı + service_role-only RPC deseni genişletildi).
//
// ÖNEMLİ: Bu modül marketing_get_decrypted_credentials RPC'sini çağırır — bu RPC
// SADECE service_role'e GRANT edilmiştir, founder dahil hiçbir kullanıcı
// oturumundan (PostgREST/RPC üzerinden) çağrılamaz (bkz. DERS 28 eki). Bu yüzden
// bu modül SADECE admin client kullanan sunucu tarafı kodlardan (webhook'lar,
// arka plan işleri) import edilmelidir, asla founder-gated bir sayfa/action'dan
// "ayarları göster" amacıyla DEĞİL — o iş için marketing_get_settings_display
// RPC'si (founder-gated) kullanılmalı.

import { createAdminClient } from "@/lib/supabase/admin";

function encKey(): string {
  const key = process.env.MARKETING_SETTINGS_ENC_KEY;
  if (!key) {
    throw new Error(
      "MARKETING_SETTINGS_ENC_KEY ortam değişkeni tanımlı değil — Vercel proje ayarlarına eklenmesi gerekiyor."
    );
  }
  return key;
}

export type DecryptedMarketingSettings = {
  api_key: string | null;
  brevo_list_id_tr: string | null;
  brevo_list_id_global: string | null;
  is_active: boolean;
  auto_sync_newsletter: boolean;
  jivochat_auto_lead: boolean;
};

export async function getMarketingSettings(): Promise<DecryptedMarketingSettings | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("marketing_get_decrypted_credentials", { p_enc_key: encKey() });
  if (error) throw new Error(`Pazarlama ayarları okunamadı: ${error.message}`);
  const row = (data as DecryptedMarketingSettings[] | null)?.[0];
  return row ?? null;
}

// JivoChat webhook'unun "sohbetten otomatik lead oluştur mu?" tercihini kontrol
// etmesi için — varsayılan (ayar hiç kaydedilmemişse veya okunamıyorsa) true,
// yani bilinçli olarak kapatılmadıkça otomatik lead oluşturma AÇIK kabul edilir.
export async function isJivochatAutoLeadEnabled(): Promise<boolean> {
  try {
    const settings = await getMarketingSettings();
    return settings?.jivochat_auto_lead !== false;
  } catch {
    return true;
  }
}

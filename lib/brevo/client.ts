// Brevo (eski adıyla Sendinblue) e-posta bülteni entegrasyonu — SADECE sunucu
// tarafında kullanılır, asla client'a import edilmez. SUPABASE_SERVICE_ROLE_KEY
// ile çalışan admin client + marketing_get_decrypted_credentials RPC'si (bkz.
// migration v2_revizeler_bolum_g_web_webhook_brevo) üzerinden API anahtarına
// erişir — bu RPC SADECE service_role'e GRANT edilmiş, herhangi bir kullanıcı
// oturumundan (founder dahil, PostgREST/RPC üzerinden) asla çağrılamaz.
//
// ÖNEMLİ DÜRÜSTLÜK NOTU: Aşağıdaki endpoint/alan adları resmi Brevo API v3
// dokümantasyonuna (developers.brevo.com) göre yazılmıştır — ANCAK canlı bir
// Brevo hesabına karşı UÇTAN UCA TEST EDİLMEMİŞTİR (kullanıcının henüz API
// anahtarı yok). Kullanıcı kendi Brevo hesabından bir API anahtarı aldıktan
// sonra /marketing/settings sayfasındaki "Bağlantıyı Test Et" butonuyla İLK
// gerçek doğrulama yapılmalı; olası küçük alan adı farkları (varsa) o noktada
// düzeltilir (Paraşüt entegrasyonunda bölüm F'de izlenen yöntemin aynısı).

import { createAdminClient } from "@/lib/supabase/admin";
import type { Region } from "@/lib/roles";
import { getMarketingSettings, type DecryptedMarketingSettings } from "@/lib/marketing/settings";

const BREVO_BASE = "https://api.brevo.com/v3";

// NOT (bölüm G.2 refactor): getSettings/encKey burada tekrar tanımlanmıyor — hem
// bu client hem JivoChat webhook'u AYNI marketing_settings singleton'ını okuyacağı
// için ortak yardımcı lib/marketing/settings.ts'e taşındı (DERS 26 tarzı: tekrar
// eden kodu paylaşılan tek noktaya çek).
const getSettings = getMarketingSettings;

class BrevoError extends Error {}

async function brevoRequest(apiKey: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BREVO_BASE}/${path}`, {
    ...init,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  // Brevo bazı başarılı isteklerde (ör. PUT contacts/{email}) gövde döndürmez.
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = (json as { message?: string })?.message || `HTTP ${res.status}`;
    throw new BrevoError(`Brevo API hatası (${path}): ${message}`);
  }
  return json;
}

function listIdForRegion(settings: DecryptedMarketingSettings, region: Region | null): number | null {
  const raw = region === "tr" ? settings.brevo_list_id_tr : settings.brevo_list_id_global;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export type BrevoTestResult = { ok: boolean; message: string };

// Bağlantıyı test eder: /account çağırır (API anahtarının geçerliliğini ve
// hesap bilgisini doğrular), sonucu marketing_record_test_result ile kaydeder.
// /marketing/settings sayfasındaki "Bağlantıyı Test Et" butonu bunu çağırır.
export async function testBrevoConnection(): Promise<BrevoTestResult> {
  const admin = createAdminClient();
  try {
    const settings = await getSettings();
    if (!settings || !settings.api_key) {
      throw new BrevoError("Henüz bir Brevo API anahtarı kaydedilmedi.");
    }
    const account = (await brevoRequest(settings.api_key, "account")) as { email?: string };
    const message = account?.email
      ? `Bağlantı başarılı — Brevo hesabı: ${account.email}`
      : "Bağlantı başarılı — API anahtarı doğrulandı.";
    await admin.rpc("marketing_record_test_result", { p_ok: true, p_message: message, p_activate: true });
    return { ok: true, message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata.";
    await admin.rpc("marketing_record_test_result", { p_ok: false, p_message: message, p_activate: false });
    return { ok: false, message };
  }
}

// Diğer modüllerin (ör. müşteri bülten toggle'ı) "otomatik senkronize et mi?"
// tercihini kontrol edebilmesi için — marketing_get_decrypted_credentials
// service_role-only olduğu için founder-gate sorunu yaşamadan (admin client'ın
// hiçbir auth.uid() oturumu yoktur) her yerden güvenle çağrılabilir.
export async function isNewsletterAutoSyncEnabled(): Promise<boolean> {
  try {
    const settings = await getSettings();
    return Boolean(settings?.is_active && settings?.auto_sync_newsletter);
  } catch {
    return false;
  }
}

export type NewsletterSyncResult = { ok: true } | { ok: false; error: string };

// Bir e-posta adresini, bölgesine karşılık gelen Brevo listesine ekler/çıkarır.
// subscribe=false ise contact'ı SİLMEZ, sadece ilgili listeden çıkarır (Brevo
// contact'ı başka listelerde/otomasyonlarda kalmaya devam edebilir — bu bilinçli
// bir tercih, GDPR/KVKK "unutulma hakkı" farklı bir süreçtir, kapsam dışı).
export async function syncNewsletterSubscription(params: {
  email: string;
  name: string | null;
  region: Region | null;
  subscribe: boolean;
}): Promise<NewsletterSyncResult> {
  try {
    const settings = await getSettings();
    if (!settings || !settings.api_key || !settings.is_active) {
      return { ok: false, error: "Brevo bağlantısı aktif değil — önce /marketing/settings sayfasından bağlantıyı test edip aktifleştir." };
    }
    const listId = listIdForRegion(settings, params.region);
    if (!listId) {
      return {
        ok: false,
        error: `${params.region === "tr" ? "TR" : "Global"} bölgesi için Brevo liste ID'si tanımlanmamış — /marketing/settings sayfasından girilmeli.`,
      };
    }

    if (params.subscribe) {
      await brevoRequest(settings.api_key, `contacts/${encodeURIComponent(params.email)}`, {
        method: "PUT",
        body: JSON.stringify({ listIds: [listId] }),
      }).catch(async (err) => {
        // Contact Brevo'da hiç yoksa PUT 404 döner — bu durumda oluştur.
        if (err instanceof BrevoError && err.message.includes("404")) {
          await brevoRequest(settings.api_key!, "contacts", {
            method: "POST",
            body: JSON.stringify({
              email: params.email,
              attributes: params.name ? { FIRSTNAME: params.name } : undefined,
              listIds: [listId],
              updateEnabled: true,
            }),
          });
          return;
        }
        throw err;
      });
    } else {
      await brevoRequest(settings.api_key, `contacts/${encodeURIComponent(params.email)}`, {
        method: "PUT",
        body: JSON.stringify({ unlinkListIds: [listId] }),
      });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata." };
  }
}

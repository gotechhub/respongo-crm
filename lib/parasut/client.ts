// Paraşüt (api.parasut.com, v4, JSON:API) entegrasyonu — SADECE sunucu tarafında
// kullanılır, asla client'a import edilmez. SUPABASE_SERVICE_ROLE_KEY ile
// çalışan admin client + parasut_get_decrypted_credentials/parasut_update_tokens
// RPC'leri (bkz. migration v2_revizeler_bolum_f_parasut_fatura) üzerinden
// sırlara erişir — bu iki RPC SADECE service_role'e GRANT edilmiş, herhangi
// bir kullanıcı oturumundan (founder dahil, PostgREST/RPC üzerinden) asla
// çağrılamaz.
//
// ÖNEMLİ DÜRÜSTLÜK NOTU: Aşağıdaki endpoint/alan adları resmi Paraşüt v4 API
// dokümantasyonu (apidocs.parasut.com) ve birden fazla açık kaynak üçüncü
// parti client kütüphanesinden (adilumer/parasut-api-client, mkiyak/parasut-api-v4,
// netinternet/parasut-v4 vb.) doğrulanmıştır — ANCAK canlı bir Paraşüt hesabına
// karşı UÇTAN UCA TEST EDİLMEMİŞTİR (kullanıcının henüz client_id/secret'ı yok).
// Kullanıcı kendi Paraşüt hesabından API erişimi aldıktan sonra /finance/settings
// sayfasındaki "Bağlantıyı Test Et" butonuyla İLK gerçek doğrulama yapılmalı;
// olası küçük alan adı farkları (varsa) o noktada düzeltilir.

import { createAdminClient } from "@/lib/supabase/admin";

const PARASUT_BASE = "https://api.parasut.com";

function encKey(): string {
  const key = process.env.PARASUT_SETTINGS_ENC_KEY;
  if (!key) {
    throw new Error(
      "PARASUT_SETTINGS_ENC_KEY ortam değişkeni tanımlı değil — Vercel proje ayarlarına eklenmesi gerekiyor."
    );
  }
  return key;
}

type DecryptedCredentials = {
  client_id: string | null;
  client_secret: string | null;
  username: string | null;
  password: string | null;
  company_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  auto_generate_invoice: boolean;
  auto_send_to_customer: boolean;
  default_vat_rate: number;
};

async function getSettings(): Promise<DecryptedCredentials | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("parasut_get_decrypted_credentials", { p_enc_key: encKey() });
  if (error) throw new Error(`Paraşüt ayarları okunamadı: ${error.message}`);
  const row = (data as DecryptedCredentials[] | null)?.[0];
  return row ?? null;
}

class ParasutError extends Error {}

async function fetchToken(settings: DecryptedCredentials): Promise<string> {
  const admin = createAdminClient();
  const now = Date.now();
  const expires = settings.token_expires_at ? new Date(settings.token_expires_at).getTime() : 0;

  // Geçerli token varsa (60sn tampon payı ile) doğrudan kullan.
  if (settings.access_token && expires - now > 60_000) {
    return settings.access_token;
  }

  if (!settings.client_id || !settings.client_secret) {
    throw new ParasutError(
      "Paraşüt bağlantısı henüz yapılandırılmadı — /finance/settings sayfasından client_id/client_secret girilmeli."
    );
  }

  let body: URLSearchParams;
  if (settings.refresh_token) {
    body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      refresh_token: settings.refresh_token,
    });
  } else {
    if (!settings.username || !settings.password) {
      throw new ParasutError(
        "Paraşüt kullanıcı adı/şifresi eksik — /finance/settings sayfasından girilmeli."
      );
    }
    body = new URLSearchParams({
      grant_type: "password",
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      username: settings.username,
      password: settings.password,
    });
  }

  const res = await fetch(`${PARASUT_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const message = json.error_description || json.error || `HTTP ${res.status}`;
    throw new ParasutError(`Paraşüt OAuth token alınamadı: ${message}`);
  }

  const expiresAt = new Date(Date.now() + (Number(json.expires_in) || 7200) * 1000).toISOString();
  const { error: rpcError } = await admin.rpc("parasut_update_tokens", {
    p_access_token: json.access_token,
    p_refresh_token: json.refresh_token ?? settings.refresh_token,
    p_expires_at: expiresAt,
    p_enc_key: encKey(),
  });
  if (rpcError) throw new Error(`Paraşüt token kaydedilemedi: ${rpcError.message}`);

  return json.access_token as string;
}

type ParasutJsonApiResource = {
  id?: string | number;
  type?: string;
  attributes?: Record<string, unknown>;
};

type ParasutJsonApiResponse = {
  data?: ParasutJsonApiResource | ParasutJsonApiResource[];
  errors?: Array<{ detail?: string; title?: string }>;
};

function asResourceArray(
  data: ParasutJsonApiResource | ParasutJsonApiResource[] | undefined
): ParasutJsonApiResource[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

async function parasutRequest(
  settings: DecryptedCredentials,
  path: string,
  init: RequestInit = {}
): Promise<ParasutJsonApiResponse> {
  if (!settings.company_id) {
    throw new ParasutError("Paraşüt firma numarası (company_id) girilmemiş — /finance/settings sayfasından girilmeli.");
  }
  const token = await fetchToken(settings);
  const res = await fetch(`${PARASUT_BASE}/v4/${settings.company_id}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as ParasutJsonApiResponse;
  if (!res.ok) {
    const message =
      json?.errors?.map((e) => e.detail || e.title).filter(Boolean).join("; ") || `HTTP ${res.status}`;
    throw new ParasutError(`Paraşüt API hatası (${path}): ${message}`);
  }
  return json;
}

export type ParasutTestResult = { ok: boolean; message: string };

// Bağlantıyı test eder: token alır + /me çağırır, sonucu parasut_record_test_result
// ile kaydeder. /finance/settings sayfasındaki "Bağlantıyı Test Et" butonu bunu çağırır.
export async function testParasutConnection(): Promise<ParasutTestResult> {
  const admin = createAdminClient();
  try {
    const settings = await getSettings();
    if (!settings) {
      throw new ParasutError("Henüz hiçbir Paraşüt ayarı kaydedilmedi.");
    }
    const token = await fetchToken(settings);
    const meRes = await fetch(`${PARASUT_BASE}/v4/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.api+json" },
      cache: "no-store",
    });
    if (!meRes.ok) {
      throw new ParasutError(`/v4/me isteği başarısız (HTTP ${meRes.status}) — company_id doğru mu kontrol et.`);
    }
    const message = "Bağlantı başarılı — kimlik doğrulama ve firma erişimi onaylandı.";
    await admin.rpc("parasut_record_test_result", { p_ok: true, p_message: message, p_activate: true });
    return { ok: true, message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata.";
    await admin.rpc("parasut_record_test_result", { p_ok: false, p_message: message, p_activate: false });
    return { ok: false, message };
  }
}

export type SyncableCustomer = {
  company_name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  country: string | null;
  company?: {
    legal_name: string | null;
    tax_office: string | null;
    tax_no: string | null;
    city: string | null;
    address: string | null;
  } | null;
};

export type SyncableInvoiceItem = { description: string; quantity: number; unit_price: number; vat_rate: number };

export type SyncResult =
  | { ok: true; parasutId: string; parasutInvoiceNo: string | null }
  | { ok: false; error: string };

// Bir müşteri için Paraşüt'te contact bulur/oluşturur. Vergi no varsa 'company'
// (kurumsal, e-fatura/e-arşiv mükellefi olabilir), yoksa 'person' (bireysel,
// e-arşiv) olarak işaretlenir — her iki durumda da Paraşüt e-arşiv faturayı
// contact'ın e-postasına kendi hesap ayarlarına göre otomatik iletebilir.
async function findOrCreateContact(settings: DecryptedCredentials, customer: SyncableCustomer): Promise<string> {
  const taxNo = customer.company?.tax_no?.trim() || null;
  const name = customer.company?.legal_name?.trim() || customer.company_name;

  if (taxNo) {
    const found = await parasutRequest(
      settings,
      `contacts?filter[tax_number]=${encodeURIComponent(taxNo)}`,
      { method: "GET" }
    );
    const existingId = asResourceArray(found.data)[0]?.id;
    if (existingId) return String(existingId);
  }

  const created = await parasutRequest(settings, "contacts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "contacts",
        attributes: {
          name,
          email: customer.primary_contact_email || undefined,
          phone: customer.primary_contact_phone || undefined,
          contact_type: taxNo ? "company" : "person",
          account_type: "customer",
          tax_office: customer.company?.tax_office || undefined,
          tax_number: taxNo || undefined,
          city: customer.company?.city || undefined,
          address: customer.company?.address || undefined,
        },
      },
    }),
  });
  const id = asResourceArray(created.data)[0]?.id;
  if (!id) throw new ParasutError("Paraşüt contact oluşturuldu ama id dönmedi.");
  return String(id);
}

// Bir faturayı Paraşüt'e sales_invoice olarak oluşturur, e-arşiv belgesini
// tetikler ve sonucu döner. Çağıran taraf (finance/actions.ts) başarı/hata
// durumuna göre invoices.parasut_* alanlarını günceller.
export async function syncInvoiceToParasut(params: {
  customer: SyncableCustomer;
  invoiceNumber: string | null;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  items: SyncableInvoiceItem[];
}): Promise<SyncResult> {
  try {
    const settings = await getSettings();
    if (!settings || !settings.is_active) {
      return {
        ok: false,
        error: "Paraşüt bağlantısı aktif değil — önce /finance/settings sayfasından bağlantıyı test edip aktifleştir.",
      };
    }
    if (params.items.length === 0) {
      return { ok: false, error: "Faturada en az bir kalem olmalı." };
    }

    const contactId = await findOrCreateContact(settings, params.customer);

    const invoiceRes = await parasutRequest(settings, "sales_invoices", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "sales_invoices",
          attributes: {
            item_type: "invoice",
            description: params.invoiceNumber ? `Respongo CRM — ${params.invoiceNumber}` : "Respongo CRM faturası",
            issue_date: params.issueDate,
            due_date: params.dueDate || params.issueDate,
            currency: parasutCurrencyCode(params.currency),
          },
          relationships: {
            contact: { data: { type: "contacts", id: contactId } },
            details: {
              data: params.items.map((item) => ({
                type: "sales_invoice_details",
                attributes: {
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  vat_rate: item.vat_rate,
                  description: item.description,
                },
              })),
            },
          },
        },
      }),
    });

    const parasutId = asResourceArray(invoiceRes.data)[0]?.id;
    if (!parasutId) throw new ParasutError("Paraşüt fatura oluşturuldu ama id dönmedi.");

    // e-Arşiv belgesi oluştur — Paraşüt hesabında "e-Arşiv otomatik e-posta
    // gönderimi" ayarı açıksa müşteriye otomatik mail gider (bu, Paraşüt'ün
    // KENDİ hesap ayarıdır, bizim API çağrımız sadece belgeyi oluşturur).
    let parasutInvoiceNo: string | null = null;
    try {
      const archiveRes = await parasutRequest(settings, `sales_invoices/${parasutId}/e_archives`, {
        method: "POST",
        body: JSON.stringify({ data: { type: "e_archives" } }),
      });
      const archiveInvoiceId = asResourceArray(archiveRes.data)[0]?.attributes?.invoice_id;
      parasutInvoiceNo = typeof archiveInvoiceId === "string" || typeof archiveInvoiceId === "number" ? String(archiveInvoiceId) : null;
    } catch (archiveErr) {
      // Fatura Paraşüt'te oluştu ama e-arşiv adımı başarısız oldu — bunu
      // sessizce yutmuyoruz, kısmi başarı olarak işaretliyoruz.
      return {
        ok: false,
        error: `Fatura Paraşüt'te oluşturuldu (id: ${parasutId}) ama e-Arşiv adımı başarısız: ${
          archiveErr instanceof Error ? archiveErr.message : "bilinmeyen hata"
        }. Paraşüt panelinden manuel tamamlanabilir.`,
      };
    }

    return { ok: true, parasutId: String(parasutId), parasutInvoiceNo };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata." };
  }
}

function parasutCurrencyCode(currency: string): string {
  // Paraşüt TRY için tarihsel olarak "TRL" kodunu kullanır.
  if (currency === "TRY") return "TRL";
  return currency;
}

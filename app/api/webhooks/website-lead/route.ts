// Respongo web sitesi (respongo.com) form gönderimlerini CRM'e lead olarak
// düşüren PUBLİK webhook. Kimlik doğrulaması Supabase oturumu ile DEĞİL, paylaşılan
// bir sır (WEBSITE_LEAD_WEBHOOK_SECRET) ile yapılır — bu yüzden middleware.ts'de
// bu yol "/api/webhooks" PUBLIC_PATHS'e eklenmiştir (aksi halde Supabase
// middleware'i oturumsuz isteği /login'e yönlendirirdi).
//
// Kullanım: respongo.com'daki form, kullanıcı gönder'e bastığında bu endpoint'e
//   POST { secret, companyName, contactName, contactEmail, contactPhone, region,
//          productInterest?: string[], message?, subscribeNewsletter? }
// gönderir. `secret` header (X-Webhook-Secret) OLARAK DA kabul edilir — hangisi
// kolaysa site tarafı onu kullanabilir.
//
// ÖNEMLİ DÜRÜSTLÜK NOTU: respongo.com'un GERÇEK form alanlarını/entegrasyon
// şeklini inceleme imkanım yok (ayrı bir sistem, bu oturumdan yönetilmiyor) —
// bu yüzden alan adları makul/genel tutuldu ve eksik/farklı isimli alanlar
// nazikçe yok sayılıyor (hata vermiyor). Web sitesi tarafı entegre edilirken
// gerçek form yapısına göre küçük ayarlamalar gerekebilir.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncNewsletterSubscription } from "@/lib/brevo/client";

const REGION_VALUES = ["tr", "global"] as const;
type RegionValue = (typeof REGION_VALUES)[number];

const PRODUCT_KEYS = ["golms", "golxp", "gocatalog", "gofactory", "gotools"] as const;
type ProductKeyValue = (typeof PRODUCT_KEYS)[number];

function normalizeRegion(value: unknown): RegionValue {
  const v = typeof value === "string" ? value.toLowerCase().trim() : "";
  return (REGION_VALUES as readonly string[]).includes(v) ? (v as RegionValue) : "global";
}

function normalizeProductInterest(value: unknown): ProductKeyValue[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.toLowerCase().trim() : ""))
    .filter((v): v is ProductKeyValue => (PRODUCT_KEYS as readonly string[]).includes(v));
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.WEBSITE_LEAD_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook henüz yapılandırılmadı (WEBSITE_LEAD_WEBHOOK_SECRET eksik)." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const providedSecret = request.headers.get("x-webhook-secret") || (body.secret as string | undefined) || "";
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Geçersiz veya eksik webhook sırrı." }, { status: 401 });
  }

  const companyName =
    (typeof body.companyName === "string" && body.companyName.trim()) ||
    (typeof body.contactName === "string" && body.contactName.trim()) ||
    "";
  if (!companyName) {
    return NextResponse.json(
      { ok: false, error: "companyName veya en azından contactName zorunlu." },
      { status: 400 }
    );
  }

  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() || null : null;
  const region = normalizeRegion(body.region);
  const admin = createAdminClient();

  const { data: inserted, error: insertError } = await admin
    .from("leads")
    .upsert(
      {
        company_name: companyName,
        contact_name: typeof body.contactName === "string" ? body.contactName.trim() || null : null,
        contact_email: contactEmail,
        contact_phone: typeof body.contactPhone === "string" ? body.contactPhone.trim() || null : null,
        product_interest: normalizeProductInterest(body.productInterest),
        status: "yeni",
        currency: region === "tr" ? "TRY" : "USD",
        region,
        source_type: "website_form",
        external_ref: typeof body.externalRef === "string" ? body.externalRef.trim() || null : null,
      },
      { onConflict: "region,contact_email_norm", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ ok: false, error: `Lead kaydedilemedi: ${insertError.message}` }, { status: 500 });
  }

  // Aynı bölgede aynı e-postayla zaten bir lead varsa upsert sessizce atlar
  // (ignoreDuplicates) — bu durumda `inserted` null döner, hata DEĞİL.
  const leadId = inserted?.id ?? null;

  const newsletter: { attempted: boolean; ok: boolean; error?: string } = { attempted: false, ok: false };
  if (body.subscribeNewsletter === true && contactEmail) {
    newsletter.attempted = true;
    const result = await syncNewsletterSubscription({
      email: contactEmail,
      name: typeof body.contactName === "string" ? body.contactName.trim() || null : null,
      region,
      subscribe: true,
    });
    newsletter.ok = result.ok;
    if (!result.ok) newsletter.error = result.error;
  }

  return NextResponse.json({ ok: true, leadId, duplicate: leadId === null, newsletter });
}

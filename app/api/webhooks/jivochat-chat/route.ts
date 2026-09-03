// JivoChat canlı sohbet webhook'u (bölüm G.2) — respongo.com'un JivoChat
// panelinde yapılandırılacak bir "Webhook" bildirimi, tamamlanan/kaçırılan her
// sohbeti bu adrese POST ederek CRM'e düşürür. Kimlik doğrulaması Supabase
// oturumu YERİNE paylaşılan bir sırla yapılır — website-lead webhook'uyla AYNI
// desen (middleware.ts'deki /api/webhooks public-path kuralı bunu da kapsıyor,
// ek bir değişiklik gerekmedi).
//
// Kabul edilen kimlik doğrulama yöntemleri (JivoChat'in webhook arayüzü özel
// header eklemeyi desteklemeyebileceği için üçü de kabul edilir): URL query'sinde
// ?secret=..., X-Webhook-Secret header'ı, veya JSON gövdesinde secret alanı.
//
// DÜRÜSTLÜK NOTU (Paraşüt/Brevo'da izlenen yöntemin aynısı): JivoChat'in gerçek
// webhook payload şeması resmi JivoChat API dokümantasyonuna göre makul/genel
// tutuldu — ANCAK respongo.com'un CANLI JivoChat hesabına karşı HİÇ TEST
// EDİLMEDİ (panele erişimim yok). Eksik/farklı isimli alanlar hataya
// düşürmeden nazikçe yok sayılıyor. Kullanıcı JivoChat panelinden gerçek
// webhook'u kurup ilk sohbeti gönderdiğinde, gelen gerçek payload'a göre küçük
// alan-adı ayarlamaları gerekebilir — bu route'un tamamı tek bir yerde,
// ayarlaması kolay tutuldu.
//
// Sohbetten otomatik lead oluşturma: ziyaretçi e-posta VEYA telefon bıraktıysa
// VE /marketing/settings'teki "JivoChat sohbetinden otomatik lead oluştur"
// tercihi açıksa (varsayılan açık), website-lead webhook'uyla AYNI dedup
// deseniyle (bölge+e-posta unique constraint, ignoreDuplicates upsert) `leads`
// havuzuna sahipsiz (owner_id null) bir lead düşer — bölüm E'nin "Toplu Otomatik
// Ata" akışı bunu da kapsar. Her koşulda (lead oluşsun ya da oluşmasın) ham
// sohbet kaydı `chat_sessions` tablosuna yazılır, böylece iletişim bilgisi
// bırakmayan ziyaretçilerin sohbetleri de kaybolmadan görünür kalır.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJivochatAutoLeadEnabled } from "@/lib/marketing/settings";

const REGION_VALUES = ["tr", "global"] as const;
type RegionValue = (typeof REGION_VALUES)[number];

function normalizeRegion(value: unknown): RegionValue {
  const v = typeof value === "string" ? value.toLowerCase().trim() : "";
  return (REGION_VALUES as readonly string[]).includes(v) ? (v as RegionValue) : "global";
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.JIVOCHAT_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook henüz yapılandırılmadı (JIVOCHAT_WEBHOOK_SECRET eksik)." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const providedSecret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-webhook-secret") ||
    (body.secret as string | undefined) ||
    "";
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Geçersiz veya eksik webhook sırrı." }, { status: 401 });
  }

  const visitor = asRecord(body.visitor);
  const agent = asRecord(body.agent);
  const region = normalizeRegion(body.region);

  const visitorName = str(visitor.name) ?? str(body.visitor_name) ?? str(body.name);
  const visitorEmail = str(visitor.email) ?? str(body.visitor_email) ?? str(body.email);
  const visitorPhone = str(visitor.phone) ?? str(body.visitor_phone) ?? str(body.phone);
  const agentName = str(agent.name) ?? str(body.agent_name);
  const transcriptSummary =
    str(body.transcript_summary) ?? str(body.message) ?? str(body.last_message) ?? str(body.subject);
  const externalChatId = str(body.chat_id) ?? str(body.id);

  const admin = createAdminClient();

  let leadId: string | null = null;
  let leadCreated = false;

  if (visitorEmail || visitorPhone) {
    const autoLeadEnabled = await isJivochatAutoLeadEnabled();
    if (autoLeadEnabled) {
      const companyName = visitorName || visitorEmail || visitorPhone || "JivoChat ziyaretçisi";
      const { data: inserted, error: leadError } = await admin
        .from("leads")
        .upsert(
          {
            company_name: companyName,
            contact_name: visitorName,
            contact_email: visitorEmail,
            contact_phone: visitorPhone,
            status: "yeni",
            currency: region === "tr" ? "TRY" : "USD",
            region,
            source_type: "live_chat",
            external_ref: externalChatId,
          },
          { onConflict: "region,contact_email_norm", ignoreDuplicates: true }
        )
        .select("id")
        .maybeSingle();

      if (leadError) {
        return NextResponse.json({ ok: false, error: `Lead kaydedilemedi: ${leadError.message}` }, { status: 500 });
      }
      // Aynı bölgede aynı e-postayla zaten bir lead varsa upsert sessizce atlar
      // (ignoreDuplicates) — sohbet yine de aşağıda chat_sessions'a loglanır.
      leadId = inserted?.id ?? null;
      leadCreated = leadId !== null;
    }
  }

  const { error: logError } = await admin.from("chat_sessions").insert({
    external_chat_id: externalChatId,
    visitor_name: visitorName,
    visitor_email: visitorEmail,
    visitor_phone: visitorPhone,
    agent_name: agentName,
    transcript_summary: transcriptSummary,
    region,
    lead_id: leadId,
    lead_created: leadCreated,
  });

  if (logError) {
    return NextResponse.json({ ok: false, error: `Sohbet kaydı yazılamadı: ${logError.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, leadId, leadCreated });
}

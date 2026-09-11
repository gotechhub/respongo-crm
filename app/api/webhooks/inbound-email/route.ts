// destek@respongo.com / support@respongo.com adreslerine gelen e-postaları CRM'e düşüren
// PUBLİK webhook. website-lead webhook'uyla AYNI kimlik doğrulama deseni: kimlik doğrulaması
// Supabase oturumu ile DEĞİL, paylaşılan bir sırla (INBOUND_EMAIL_WEBHOOK_SECRET) yapılır —
// bu yol zaten "/api/webhooks" altında olduğu için middleware'de PUBLIC_PATHS'e ek yapmaya
// gerek yok (lib/supabase/middleware.ts).
//
// Kullanıcının açık isteği: "destek@respongo.com müşteri mail atınca direkt buraya düşmesi
// lazım, support@respongo.com aynı şekilde İngilizce olarak — tr ve en olarak buna göre
// dizayn et". Sağlayıcı Respongo'nun zaten kullandığı Brevo (lib/brevo/client.ts) — Brevo'nun
// "Inbound Parsing" webhook'u bu şekle sahiptir (developers.brevo.com/docs/inbound-parse-webhooks,
// 2026-09 itibarıyla doğrulandı):
//   POST { items: [{ From: {Address,Name}, To: [{Address,Name}], Subject, RawTextBody,
//                     RawHtmlBody, MessageId, SentAtDate, ... }] }
//
// KURULUM (Selcuk'un kendisinin yapması gereken — bu oturumdan yapılamaz):
//   1) Brevo panelinde bu domain (respongo.com veya bir alt alan adı) inbound parsing için
//      doğrulanmalı ve Brevo'nun verdiği MX kayıtları DNS'e eklenmeli (alan adı sağlayıcısı
//      panelinden — Claude'un buraya erişimi yok).
//   2) Brevo'da inbound parsing webhook URL'i şu şekilde tanımlanmalı:
//        https://respongo-crm.vercel.app/api/webhooks/inbound-email?secret=<INBOUND_EMAIL_WEBHOOK_SECRET>
//      (Brevo inbound webhook'ları özel header eklemeye izin vermeyebilir — bu yüzden sır hem
//      query string'den hem header'dan hem gövdeden kabul edilir, hangisi kolaysa o kullanılır.)
//   3) Vercel proje ortam değişkenlerine INBOUND_EMAIL_WEBHOOK_SECRET eklenmeli (website-lead
//      webhook'undaki WEBSITE_LEAD_WEBHOOK_SECRET ile aynı mantık, ayrı bir sır).
//
// DÜRÜSTLÜK NOTU: Brevo'nun payload şekli resmi dokümantasyonlarından doğrulandı, ancak Selcuk'un
// Brevo hesabındaki gerçek DNS/domain doğrulama adımlarını bu oturumdan tamamlamak mümkün değil.

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BrevoMailbox = { Address?: string; Name?: string };
type BrevoInboundItem = {
  MessageId?: string;
  From?: BrevoMailbox;
  To?: BrevoMailbox[];
  Subject?: string;
  RawTextBody?: string;
  RawHtmlBody?: string;
  ExtractedMarkdownMessage?: string;
  SentAtDate?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Alıcı adresine göre bölge/hat belirle: destek@ -> tr, support@ -> global.
 * Kullanıcının isteği tam olarak bu: "destek@ ... support@ aynı şekilde İngilizce olarak
 * tr ve en olarak" — iki adres, iki dil/bölge hattı olarak ayrı yönetiliyor. */
function detectRegion(toAddresses: string[]): "tr" | "global" {
  const joined = toAddresses.join(" ").toLowerCase();
  if (joined.includes("destek@")) return "tr";
  return "global";
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook henüz yapılandırılmadı (INBOUND_EMAIL_WEBHOOK_SECRET eksik)." },
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

  // Brevo her zaman bir "items" dizisi gönderir (tek e-posta olsa bile) — ama olası format
  // farklılıklarına karşı gövdenin kendisini de tek elemanlı bir dizi gibi ele alabiliyoruz.
  const items: BrevoInboundItem[] = Array.isArray(body.items)
    ? (body.items as BrevoInboundItem[])
    : [body as BrevoInboundItem];

  const admin = createAdminClient();
  const results: { ok: boolean; id?: string; error?: string }[] = [];

  for (const item of items) {
    const fromAddress = (item.From?.Address || "").trim().toLowerCase();
    if (!fromAddress) {
      results.push({ ok: false, error: "Gönderen adresi (From.Address) eksik — bu öğe atlandı." });
      continue;
    }
    const toAddresses = (item.To ?? []).map((t) => (t.Address || "").trim().toLowerCase()).filter(Boolean);
    const region = detectRegion(toAddresses.length ? toAddresses : [fromAddress]);
    const bodyText =
      (item.RawTextBody && item.RawTextBody.trim()) ||
      (item.ExtractedMarkdownMessage && item.ExtractedMarkdownMessage.trim()) ||
      (item.RawHtmlBody && stripHtml(item.RawHtmlBody)) ||
      "";

    // Gönderenin e-postası sistemde kayıtlı bir müşterinin (customers.primary_contact_email)
    // adresiyle eşleşiyorsa otomatik ticket açılır — eşleşmezse (yeni kişi, farklı adres vb.)
    // support_tickets.customer_id NOT NULL olduğundan uydurma bir müşteri OLUŞTURMUYORUZ;
    // bunun yerine inbound_support_emails'te "unmatched" olarak bekletip Destek Merkezi
    // ekranındaki panelden destek ekibinin doğru müşteriyi seçmesini/oluşturmasını sağlıyoruz.
    const { data: matchedCustomer } = await admin
      .from("customers")
      .select("id, region")
      .ilike("primary_contact_email", fromAddress)
      .limit(1)
      .maybeSingle();

    if (matchedCustomer) {
      const { data: ticket, error: ticketError } = await admin
        .from("support_tickets")
        .insert({
          customer_id: matchedCustomer.id,
          subject: (item.Subject && item.Subject.trim()) || (region === "tr" ? "Gelen e-posta (konu yok)" : "Incoming email (no subject)"),
          region,
        })
        .select("id")
        .single();

      if (ticketError || !ticket) {
        results.push({ ok: false, error: `Ticket oluşturulamadı: ${ticketError?.message ?? "bilinmeyen hata"}` });
        continue;
      }

      if (bodyText) {
        await admin.from("support_ticket_messages").insert({ ticket_id: ticket.id, body: bodyText, is_internal_note: false });
      }

      await admin.from("inbound_support_emails").insert({
        to_address: toAddresses[0] ?? "",
        from_address: fromAddress,
        from_name: item.From?.Name ?? null,
        subject: item.Subject ?? null,
        body_text: bodyText || null,
        region,
        matched_customer_id: matchedCustomer.id,
        matched_ticket_id: ticket.id,
        status: "converted",
        raw: item as Record<string, unknown>,
        message_id: item.MessageId ?? null,
        converted_at: new Date().toISOString(),
      });

      results.push({ ok: true, id: ticket.id });
      continue;
    }

    const { data: inserted, error: insertError } = await admin
      .from("inbound_support_emails")
      .insert({
        to_address: toAddresses[0] ?? "",
        from_address: fromAddress,
        from_name: item.From?.Name ?? null,
        subject: item.Subject ?? null,
        body_text: bodyText || null,
        region,
        status: "unmatched",
        raw: item as Record<string, unknown>,
        message_id: item.MessageId ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      // message_id benzersizlik çakışması (Brevo'nun aynı e-postayı iki kez göndermesi) sessizce
      // yok sayılır — zaten kaydedilmiş demektir, hata değil.
      if (insertError.code === "23505") {
        results.push({ ok: true });
        continue;
      }
      results.push({ ok: false, error: insertError.message });
      continue;
    }

    results.push({ ok: true, id: inserted?.id });
  }

  const anyFailed = results.some((r) => !r.ok);
  return NextResponse.json({ ok: !anyFailed, results }, { status: anyFailed ? 207 : 200 });
}

// V2 Revizeler bölüm H: Bildirimler & Takvim/Zamanlama.
//
// Vercel Cron (bkz. vercel.json) bu uç noktayı günde bir kez GET ile çağırır ve
// Vercel'in kendi dokümantasyonuna göre "Authorization: Bearer $CRON_SECRET"
// header'ını otomatik ekler (CRON_SECRET ortam değişkeni Vercel proje ayarlarına
// eklenmelidir — bkz. aktivasyon adımları). Manuel/test amaçlı tetiklemeler için
// aynı sır ?secret= query param'ı OLARAK DA kabul edilir (website-lead/jivochat-chat
// webhook'larıyla aynı tri-modal kimlik doğrulama deseni — DERS 26: yeni bir
// auth mekanizması icat edilmedi, mevcut desen yeniden kullanıldı).
//
// Bu rota iki iş yapar:
//   1. generate_due_notifications() RPC'sini çağırır (gecikmiş/yaklaşan kayıtları
//      tarayıp notifications tablosuna satır ekler — dedupe_key sayesinde idempotent).
//   2. email_notifications_enabled=true olan ve en az bir okunmamış bildirimi olan
//      her kullanıcıya Brevo üzerinden bir özet (digest) e-postası gönderir.
//
// notification_digest_frequency='off' olan kullanıcılar hiç e-posta almaz.
// 'weekly' olanlar sadece haftanın 1. günü (Pazartesi) e-posta alır — cron günlük
// çalıştığı için frekans burada uygulama seviyesinde filtreleniyor.
//
// ÖNEMLİ DÜRÜSTLÜK NOTU: Brevo transactional gönderimi CANLI test edilmedi (bkz.
// lib/brevo/client.ts). Ayrıca bu digest, kullanıcı bildirimi OKUYANA kadar her
// gün tekrar gönderilir (hâlâ okunmamışsa hâlâ geçerli bir hatırlatmadır) — bu
// bilinçli bir tasarım kararı, "sadece yeni olanları gönder" gibi ekstra bir
// "son gönderim zamanı" takip mekanizması kasıtlı olarak eklenmedi (DERS 26:
// gereksiz karmaşıklık).

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/brevo/client";
import { NOTIFICATION_TYPE_LABEL, type NotificationType } from "@/app/(dashboard)/notifications/labels";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${expected}`) return true;
  const querySecret = request.nextUrl.searchParams.get("secret");
  return querySecret === expected;
}

function digestHtml(userName: string, items: { type: NotificationType; title: string; body: string | null }[]): string {
  const rows = items
    .map(
      (n) =>
        `<li style="margin-bottom:8px;"><strong>${NOTIFICATION_TYPE_LABEL[n.type]}</strong>: ${n.title}${
          n.body ? ` — <span style="color:#666;">${n.body}</span>` : ""
        }</li>`
    )
    .join("");
  return `
    <div style="font-family:sans-serif;font-size:14px;color:#171A23;">
      <p>Merhaba ${userName},</p>
      <p>GO CRM'de senin için ${items.length} adet okunmamış bildirim var:</p>
      <ul style="padding-left:18px;">${rows}</ul>
      <p style="margin-top:16px;color:#8A8FA0;font-size:12px;">
        Bu e-posta bildirim tercihlerine göre gönderildi — kapatmak için
        GO CRM'de sağ üstteki profil menüsünden "Bildirim Ayarları"na gidebilirsin.
      </p>
    </div>
  `;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: insertedCount, error: genError } = await admin.rpc("generate_due_notifications");
  if (genError) {
    return NextResponse.json({ ok: false, error: `generate_due_notifications hatası: ${genError.message}` }, { status: 500 });
  }

  const isMonday = new Date().getUTCDay() === 1;

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, email_notifications_enabled, notification_digest_frequency")
    .eq("email_notifications_enabled", true)
    .neq("notification_digest_frequency", "off");

  if (profilesError) {
    return NextResponse.json(
      { ok: false, error: `Profiller okunamadı: ${profilesError.message}`, notificationsGenerated: insertedCount },
      { status: 500 }
    );
  }

  let emailsSent = 0;
  let emailErrors = 0;

  for (const profile of profiles ?? []) {
    const p = profile as {
      id: string;
      email: string;
      full_name: string | null;
      notification_digest_frequency: string;
    };
    if (p.notification_digest_frequency === "weekly" && !isMonday) continue;

    const { data: unread } = await admin
      .from("notifications")
      .select("type, title, body")
      .eq("user_id", p.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);

    const items = (unread ?? []) as { type: NotificationType; title: string; body: string | null }[];
    if (items.length === 0) continue;

    const result = await sendTransactionalEmail({
      toEmail: p.email,
      toName: p.full_name,
      subject: `GO CRM — ${items.length} okunmamış bildirimin var`,
      htmlContent: digestHtml(p.full_name || p.email, items),
    });

    if (result.ok) emailsSent += 1;
    else emailErrors += 1;
  }

  return NextResponse.json({
    ok: true,
    notificationsGenerated: insertedCount,
    emailsSent,
    emailErrors,
  });
}

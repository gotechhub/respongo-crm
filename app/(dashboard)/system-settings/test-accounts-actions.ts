"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Region, UserRole } from "@/lib/roles";

// Kullanıcı isteği (birebir): "satış iş ortakları ve satış ekibi için test hesapları
// oluştur ve içleri dolu olsun onların panellerine de giriş yapabileyim ve onların
// gözünden görüp kontrol etmek istiyorum." Bu action GÜVENLİ bir şekilde (mevcut
// inviteUser() ile AYNI desen: founder-only + service-role admin.auth.admin API'si,
// auth şemasına elle SQL yazmak YOK) 4 test hesabı oluşturur ve her birine RLS'in
// gerçekten gösterdiği kadar (owner_id/partner_id bazlı) gerçekçi veri doldurur.
// Şifre bilinçli olarak SABİT ve tüm test hesaplarında ortak — gerçek bir kullanıcı
// değil, sadece Süper Admin'in "Sistem Ayarları > Master Admin View-As" ile (şifresiz,
// gerçek oturum devralma) veya dilerse doğrudan bu şifreyle giriş yapması için var.
const TEST_PASSWORD = "Respongo-Test-2026!";

type Persona = {
  email: string;
  fullName: string;
  role: UserRole;
  region: Region;
};

const PERSONAS: Persona[] = [
  { email: "mert.yildirim@test.respongo-crm.com", fullName: "Mert Yıldırım (TEST — Satış Ekibi / TR)", role: "sales_inhouse", region: "tr" },
  { email: "elif.sarikaya@test.respongo-crm.com", fullName: "Elif Sarıkaya (TEST — Satış Ekibi / Global)", role: "sales_inhouse", region: "global" },
  { email: "baris.koc@test.respongo-crm.com", fullName: "Barış Koç (TEST — İş Ortağı / TR)", role: "partner_tr", region: "tr" },
  { email: "sarah.mitchell@test.respongo-crm.com", fullName: "Sarah Mitchell (TEST — İş Ortağı / Global)", role: "partner_global", region: "global" },
];

export type CreatedTestAccount = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  alreadyExisted: boolean;
};

export type CreateTestAccountsResult =
  | { ok: true; accounts: CreatedTestAccount[] }
  | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

async function requireFounder(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "founder") {
    return { ok: false, error: "Bu işlemi sadece Süper Admin yapabilir." };
  }
  return { ok: true };
}

export async function createTestAccounts(): Promise<CreateTestAccountsResult> {
  const auth = await requireFounder();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const accounts: CreatedTestAccount[] = [];
  const idByEmail: Record<string, string> = {};

  for (const persona of PERSONAS) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", persona.email)
      .maybeSingle();

    let profileId: string;
    let alreadyExisted = false;

    if (existingProfile) {
      profileId = existingProfile.id as string;
      alreadyExisted = true;
    } else {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: persona.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: persona.fullName },
      });
      if (createError || !createdUser?.user) {
        return { ok: false, error: `${persona.email} oluşturulamadı: ${createError?.message ?? "bilinmeyen hata"}` };
      }
      profileId = createdUser.user.id;
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: persona.fullName, role: persona.role, region: persona.region, is_active: true })
      .eq("id", profileId);

    if (profileError) {
      return { ok: false, error: `${persona.email} profili güncellenemedi: ${profileError.message}` };
    }

    idByEmail[persona.email] = profileId;
    accounts.push({ email: persona.email, password: TEST_PASSWORD, fullName: persona.fullName, role: persona.role, alreadyExisted });
  }

  try {
    await seedSalesInhouseOwnedData(admin, idByEmail["mert.yildirim@test.respongo-crm.com"], "tr");
    await seedSalesInhouseOwnedData(admin, idByEmail["elif.sarikaya@test.respongo-crm.com"], "global");
    await seedPartnerData(admin, idByEmail["baris.koc@test.respongo-crm.com"], "partner_tr");
    await seedPartnerData(admin, idByEmail["sarah.mitchell@test.respongo-crm.com"], "partner_global");
  } catch (err) {
    return { ok: false, error: `Test hesapları oluşturuldu ama örnek veri doldurulurken hata oluştu: ${err instanceof Error ? err.message : String(err)}` };
  }

  revalidatePath("/system-settings");
  revalidatePath("/users");
  return { ok: true, accounts };
}

// ----------------------------------------------------------------------------
// Satış Ekibi (sales_inhouse) — RLS zaten bölge-geneli (region = current_region())
// gösterdiği için mevcut genel demo verisi (companies/leads/customers/proposals)
// otomatik görünür. Ayrıca "Performansım" gibi SADECE owner_id = auth.uid() olan
// ekranların da boş kalmaması için birkaç KENDİNE AİT kayıt ekliyoruz.
// ----------------------------------------------------------------------------
async function seedSalesInhouseOwnedData(admin: AdminClient, ownerId: string | undefined, region: Region) {
  if (!ownerId) return;

  const { count: existingLeadCount } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  if ((existingLeadCount ?? 0) > 0) return; // zaten seed edilmiş

  const isTr = region === "tr";
  const leadRows = isTr
    ? [
        { company_name: "Toros Gıda Sanayi ve Ticaret A.Ş.", contact_name: "Gökhan Polat", contact_email: "gokhan.polat@torosgida-demo.com", product_interest: ["golms"], status: "gorusme", value_estimate: 26000, currency: "USD", source_type: "sales_rep" },
        { company_name: "Sakarya Otomotiv Yedek Parça Ltd.", contact_name: "Buse Kaplan", contact_email: "buse.kaplan@sakaryaoto-demo.com", product_interest: ["gofactory", "gotools"], status: "teklif", value_estimate: 47000, currency: "USD", source_type: "referral" },
        { company_name: "Ankara Yazılım ve Danışmanlık A.Ş.", contact_name: "Emre Bulut", contact_email: "emre.bulut@ankarayazilim-demo.com", product_interest: ["golxp"], status: "musteri", value_estimate: 19500, currency: "USD", source_type: "website_form" },
      ]
    : [
        { company_name: "Baltic Shipping Partners OÜ", contact_name: "Kristjan Saar", contact_email: "kristjan.saar@balticshipping-demo.com", product_interest: ["golms"], status: "gorusme", value_estimate: 31000, currency: "USD", source_type: "ad_linkedin" },
        { company_name: "Iberia Retail Concepts SL", contact_name: "Lucía Fernández", contact_email: "lucia.fernandez@iberiaretail-demo.com", product_interest: ["gocatalog", "golxp"], status: "teklif", value_estimate: 58000, currency: "USD", source_type: "apollo" },
        { company_name: "Highland Manufacturing Ltd.", contact_name: "James Wallace", contact_email: "james.wallace@highlandmfg-demo.com", product_interest: ["gofactory"], status: "musteri", value_estimate: 22500, currency: "USD", source_type: "referral" },
      ];

  const { data: insertedLeads, error: leadsError } = await admin
    .from("leads")
    .insert(
      leadRows.map((row) => ({
        ...row,
        owner_id: ownerId,
        created_by: ownerId,
        region,
      }))
    )
    .select("id, status, company_name, value_estimate, currency");
  if (leadsError) throw new Error(`sales_inhouse leads: ${leadsError.message}`);

  const musteriLead = (insertedLeads ?? []).find((l) => l.status === "musteri");
  if (!musteriLead) return;

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .insert({
      lead_id: musteriLead.id,
      company_name: musteriLead.company_name,
      primary_contact_name: leadRows.find((r) => r.company_name === musteriLead.company_name)?.contact_name ?? null,
      primary_contact_email: leadRows.find((r) => r.company_name === musteriLead.company_name)?.contact_email ?? null,
      country: isTr ? "Türkiye" : "Hollanda",
      owner_id: ownerId,
      created_by: ownerId,
      region,
      is_active: true,
    })
    .select("id")
    .single();
  if (customerError) throw new Error(`sales_inhouse customer: ${customerError.message}`);

  await admin.from("leads").update({ converted_customer_id: customer.id }).eq("id", musteriLead.id);

  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .insert({
      customer_id: customer.id,
      title: `${musteriLead.company_name} — İlk Dönem Lisans Teklifi`,
      status: "accepted",
      total_amount: musteriLead.value_estimate ?? 0,
      currency: musteriLead.currency ?? "USD",
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      owner_id: ownerId,
      created_by: ownerId,
      region,
    })
    .select("id")
    .single();
  if (proposalError) throw new Error(`sales_inhouse proposal: ${proposalError.message}`);

  await admin.from("proposal_items").insert({
    proposal_id: proposal.id,
    product: "golms",
    description: "Yıllık kurumsal lisans paketi",
    quantity: 1,
    unit_price: musteriLead.value_estimate ?? 0,
    discount_percent: 0,
  });
}

// ----------------------------------------------------------------------------
// İş Ortağı (partner_tr / partner_global) — RLS sadece owner_id/partner_id =
// auth.uid() satırlarını gösteriyor, bölge-geneli DEĞİL. Bu yüzden partner
// panelinin okuduğu HER tabloya (partner_profiles, leads, customers, proposals,
// partner_tasks, partner_meetings, partner_monthly_targets) özel olarak
// sahiplenilen veri ekliyoruz — aksi halde "Görüntüle" ile girildiğinde ekran
// bomboş kalır. onboarding_completed_at + status='active' set ediliyor ki
// onboarding sihirbazına DEĞİL doğrudan dolu panele düşsün.
// ----------------------------------------------------------------------------
async function seedPartnerData(admin: AdminClient, partnerId: string | undefined, role: "partner_tr" | "partner_global") {
  if (!partnerId) return;

  const isTr = role === "partner_tr";
  const region: Region = isTr ? "tr" : "global";

  const profileSpec = isTr
    ? {
        company_name: "Koç Eğitim ve Danışmanlık Ltd. Şti.",
        tax_no: "1234567890",
        website: "https://kocdanismanlik-demo.com",
        country: "Türkiye",
        address: "Levent Mah. Büyükdere Cad. No:12, Şişli / İstanbul",
        bank_name: "Garanti BBVA",
        bank_account_name: "Koç Eğitim ve Danışmanlık Ltd. Şti.",
        iban: "TR11 0006 2000 0000 0012 3456 78",
        swift: "TGBATRISXXX",
        product_interests: ["golms", "golxp"],
        commission_rate: 15,
      }
    : {
        company_name: "Mitchell Learning Solutions LLC",
        tax_no: "US-98-7654321",
        website: "https://mitchelllearning-demo.com",
        country: "Amerika Birleşik Devletleri",
        address: "500 Market Street, Suite 210, San Francisco, CA",
        bank_name: "Chase Bank",
        bank_account_name: "Mitchell Learning Solutions LLC",
        iban: "US00 0000 0000 0000 0000 00",
        swift: "CHASUS33XXX",
        product_interests: ["gocatalog", "gofactory"],
        commission_rate: 12,
      };

  const { error: partnerProfileError } = await admin.from("partner_profiles").upsert(
    {
      profile_id: partnerId,
      onboarding_step: 5,
      onboarding_completed_at: new Date().toISOString(),
      agreement_accepted_at: new Date().toISOString(),
      status: "active",
      admin_note: "Test hesabı — Süper Admin'in kendi kontrolü için oluşturuldu (Sistem Ayarları > Test Hesapları).",
      ...profileSpec,
    },
    { onConflict: "profile_id" }
  );
  if (partnerProfileError) throw new Error(`partner_profiles (${role}): ${partnerProfileError.message}`);

  const { count: existingLeadCount } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", partnerId);
  if ((existingLeadCount ?? 0) > 0) return; // zaten seed edilmiş, tekrar ekleme

  const leadRows = isTr
    ? [
        { company_name: "Trabzon Liman İşletmeleri A.Ş.", contact_name: "Serkan Yavuz", contact_email: "serkan.yavuz@trabzonliman-demo.com", product_interest: ["golms"], status: "gorusme", value_estimate: 24000, currency: "USD" },
        { company_name: "Konya Şeker Sanayi ve Ticaret A.Ş.", contact_name: "Nurcan Aktaş", contact_email: "nurcan.aktas@konyaseker-demo.com", product_interest: ["golxp"], status: "teklif", value_estimate: 33000, currency: "USD" },
        { company_name: "Bursa Otomotiv Parçaları A.Ş.", contact_name: "Volkan Er", contact_email: "volkan.er@bursaotomotiv-demo.com", product_interest: ["golms", "gotools"], status: "musteri", value_estimate: 41000, currency: "USD" },
      ]
    : [
        { company_name: "Nordwind Consulting GmbH", contact_name: "Anna Fischer", contact_email: "anna.fischer@nordwindconsulting-demo.com", product_interest: ["gocatalog"], status: "gorusme", value_estimate: 28000, currency: "USD" },
        { company_name: "Pacific Retail Holdings Inc.", contact_name: "David Chen", contact_email: "david.chen@pacificretail-demo.com", product_interest: ["gofactory"], status: "teklif", value_estimate: 46000, currency: "USD" },
        { company_name: "Delta Manufacturing Co.", contact_name: "Rachel Adams", contact_email: "rachel.adams@deltamfg-demo.com", product_interest: ["gocatalog", "golxp"], status: "musteri", value_estimate: 39000, currency: "USD" },
      ];

  const { data: insertedLeads, error: leadsError } = await admin
    .from("leads")
    .insert(
      leadRows.map((row) => ({
        ...row,
        owner_id: partnerId,
        created_by: partnerId,
        region,
        source_type: "referral",
      }))
    )
    .select("id, status, company_name, value_estimate, currency, contact_name, contact_email");
  if (leadsError) throw new Error(`partner leads (${role}): ${leadsError.message}`);

  const musteriLead = (insertedLeads ?? []).find((l) => l.status === "musteri");
  let acceptedProposalId: string | null = null;

  if (musteriLead) {
    const { data: customer, error: customerError } = await admin
      .from("customers")
      .insert({
        lead_id: musteriLead.id,
        company_name: musteriLead.company_name,
        primary_contact_name: musteriLead.contact_name,
        primary_contact_email: musteriLead.contact_email,
        country: isTr ? "Türkiye" : "Amerika Birleşik Devletleri",
        owner_id: partnerId,
        created_by: partnerId,
        region,
        is_active: true,
      })
      .select("id")
      .single();
    if (customerError) throw new Error(`partner customer (${role}): ${customerError.message}`);

    await admin.from("leads").update({ converted_customer_id: customer.id }).eq("id", musteriLead.id);

    // Önce 'sent' ekleniyor, sonra 'accepted'e güncelleniyor — böylece
    // trg_calculate_partner_commission trigger'ı GERÇEKTEN çalışıp
    // commission_entries satırını kendi mantığıyla otomatik oluşturuyor
    // (elle komisyon hesaplamak yerine sistemin kendi iş kuralını test ediyoruz).
    const { data: proposal, error: proposalError } = await admin
      .from("proposals")
      .insert({
        customer_id: customer.id,
        title: `${musteriLead.company_name} — Lisans Teklifi`,
        status: "sent",
        total_amount: musteriLead.value_estimate ?? 0,
        currency: musteriLead.currency ?? "USD",
        valid_until: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
        owner_id: partnerId,
        created_by: partnerId,
        region,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (proposalError) throw new Error(`partner proposal (${role}): ${proposalError.message}`);

    await admin.from("proposal_items").insert({
      proposal_id: proposal.id,
      product: (musteriLead.company_name.includes("Otomotiv") || musteriLead.company_name.includes("Manufacturing")) ? "gofactory" : "golms",
      description: "Yıllık lisans paketi",
      quantity: 1,
      unit_price: musteriLead.value_estimate ?? 0,
      discount_percent: 0,
    });

    const { error: acceptError } = await admin.from("proposals").update({ status: "accepted" }).eq("id", proposal.id);
    if (acceptError) throw new Error(`partner proposal accept (${role}): ${acceptError.message}`);
    acceptedProposalId = proposal.id as string;
  }

  const openLead = (insertedLeads ?? []).find((l) => l.status === "teklif") ?? (insertedLeads ?? [])[0];
  if (openLead) {
    const { data: openProposal, error: openProposalError } = await admin
      .from("proposals")
      .insert({
        lead_id: openLead.id,
        title: `${openLead.company_name} — Ön Teklif`,
        status: "sent",
        total_amount: openLead.value_estimate ?? 0,
        currency: openLead.currency ?? "USD",
        valid_until: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
        owner_id: partnerId,
        created_by: partnerId,
        region,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!openProposalError && openProposal) {
      await admin.from("proposal_items").insert({
        proposal_id: openProposal.id,
        product: "golxp",
        description: "Ön teklif — kapsam netleşince güncellenecek",
        quantity: 1,
        unit_price: openLead.value_estimate ?? 0,
        discount_percent: 5,
      });
    }
  }

  await admin.from("partner_tasks").insert([
    { partner_id: partnerId, title: isTr ? "Yeni müşteriye demo sunumu hazırla" : "Prepare product demo for new customer", status: "open", due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
    { partner_id: partnerId, title: isTr ? "Sözleşme belgelerini gönder" : "Send contract documents", status: "done", due_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) },
  ]);

  await admin.from("partner_meetings").insert([
    { partner_id: partnerId, title: isTr ? "Tanıtım toplantısı" : "Intro call", meeting_date: new Date(Date.now() + 4 * 86400000).toISOString(), status: "scheduled", notes: isTr ? "Ürün demosu ve fiyatlandırma görüşülecek." : "Product demo and pricing discussion." },
    { partner_id: partnerId, title: isTr ? "İhtiyaç analizi görüşmesi" : "Needs assessment call", meeting_date: new Date(Date.now() - 6 * 86400000).toISOString(), status: "completed", notes: isTr ? "Kurumsal ihtiyaçlar netleşti, teklif hazırlanıyor." : "Requirements clarified, proposal in progress." },
  ]);

  const now = new Date();
  await admin.from("partner_monthly_targets").upsert(
    {
      partner_id: partnerId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      target_revenue: isTr ? 60000 : 75000,
      target_meetings: 8,
      currency: "USD",
    },
    { onConflict: "partner_id,year,month" }
  );

  void acceptedProposalId; // trigger zaten commission_entries'i kendi oluşturuyor, burada sadece akış takibi için tutuluyor
}
